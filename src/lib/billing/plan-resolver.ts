/**
 * plan-resolver.ts
 *
 * Resolves a tenant's current plan and its features.
 * BillingPlan.features[] is the single source of truth.
 * PLAN_DEFAULTS is no longer consulted here.
 */

import { connectToDatabase } from "@/lib/mongodb";
import { TenantSubscription, BillingPlan, Entitlement } from "@/lib/models";
import type { PlanFeature } from "@/lib/models/billing-plan";

export interface ResolvedFeature {
  key: string;
  type: "boolean" | "quota" | "count" | "storage" | "metered";
  enabled: boolean;
  limit: number;
  resetPeriod: "monthly" | "yearly" | "never";
  overageAllowed: boolean;
  overagePriceCents: number;
  unit: string;
  source: "plan" | "override" | "default";
}

export interface ResolvedPlan {
  planId: string | null;
  planName: string;
  planSlug: string;
  features: Record<string, ResolvedFeature>;
  status: string;
}

/**
 * Resolves all features for a tenant.
 * Priority: tenant-level Entitlement override > plan features > safe defaults.
 */
export async function resolveTenantPlan(tenantId: string): Promise<ResolvedPlan> {
  await connectToDatabase();

  const subscription = await TenantSubscription.findOne({ tenantId })
    .populate("planId")
    .lean();

  const plan = subscription?.planId as any;
  const features: Record<string, ResolvedFeature> = {};

  // Build feature map from plan features[]
  if (plan?.features?.length) {
    for (const f of plan.features as PlanFeature[]) {
      features[f.key] = {
        key: f.key,
        type: f.type as ResolvedFeature["type"],
        enabled: f.type === "boolean" ? (f.enabled ?? false) : true,
        limit: f.limit ?? 0,
        resetPeriod: (f.resetPeriod as ResolvedFeature["resetPeriod"]) ?? "never",
        overageAllowed: f.overageAllowed ?? false,
        overagePriceCents: f.overagePriceCents ?? 0,
        unit: f.unit ?? "",
        source: "plan"
      };
    }
  }

  // Apply tenant-level Entitlement overrides
  const overrides = await Entitlement.find({ tenantId }).lean();
  for (const ov of overrides) {
    const expired = ov.expiresAt && new Date(ov.expiresAt) < new Date();
    if (expired) continue;

    const existing = features[ov.key] ?? {
      key: ov.key,
      type: "boolean" as const,
      enabled: false,
      limit: 0,
      resetPeriod: "never" as const,
      overageAllowed: false,
      overagePriceCents: 0,
      unit: "",
      source: "default" as const
    };

    features[ov.key] = {
      ...existing,
      source: "override",
      ...(ov.limitValue !== undefined && ov.limitValue !== null
        ? { limit: ov.limitValue as number, enabled: true }
        : {}),
      ...(ov.boolValue !== undefined && ov.boolValue !== null
        ? { enabled: ov.boolValue as boolean }
        : {})
    };
  }

  return {
    planId: plan?._id?.toString() ?? null,
    planName: plan?.name ?? "Free",
    planSlug: plan?.slug ?? "free",
    features,
    status: subscription?.status ?? "inactive"
  };
}

/**
 * Returns the resolved feature for a single key.
 */
export async function resolveFeature(
  tenantId: string,
  featureKey: string
): Promise<ResolvedFeature> {
  const plan = await resolveTenantPlan(tenantId);
  return (
    plan.features[featureKey] ?? {
      key: featureKey,
      type: "boolean",
      enabled: false,
      limit: 0,
      resetPeriod: "never",
      overageAllowed: false,
      overagePriceCents: 0,
      unit: "",
      source: "default"
    }
  );
}

/**
 * Set a tenant-level entitlement override via the Entitlement model.
 * This is the admin-facing function; it's also exposed from entitlements.ts.
 */
export async function setEntitlementOverride(
  tenantId: string,
  key: string,
  value: number | boolean,
  expiresAt?: Date
): Promise<void> {
  await connectToDatabase();
  const { Entitlement } = await import("@/lib/models");
  await Entitlement.findOneAndUpdate(
    { tenantId, key },
    {
      $set: {
        tenantId,
        key,
        ...(typeof value === "number" ? { limitValue: value } : { boolValue: value }),
        isOverride: true,
        ...(expiresAt ? { expiresAt } : {})
      }
    },
    { upsert: true }
  );
}
