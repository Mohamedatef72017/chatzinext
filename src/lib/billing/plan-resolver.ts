/**
 * plan-resolver.ts
 *
 * Resolves a tenant's current plan and its features.
 *
 * SNAPSHOT STRATEGY (ADR-001):
 * When a subscription is active, features are resolved from TenantSubscription.planSnapshot
 * rather than the live BillingPlan. This ensures that mid-cycle edits to a plan do not
 * immediately affect current subscribers.
 *
 * The snapshot is refreshed only at:
 *   - Checkout (new subscription / upgrade / downgrade)
 *   - Renewal (invoice.payment_succeeded with billing_reason = subscription_cycle)
 *
 * BillingPlan.features[] remains the authoritative definition when no snapshot exists
 * (e.g. free-tier tenants without a TenantSubscription record).
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
  source: "snapshot" | "plan" | "override" | "default";
}

export interface ResolvedPlan {
  planId: string | null;
  planName: string;
  planSlug: string;
  features: Record<string, ResolvedFeature>;
  status: string;
  resolvedFrom: "snapshot" | "live_plan" | "default";
}

/**
 * Resolves all features for a tenant.
 * Priority: Entitlement override > planSnapshot.features > live BillingPlan.features[] > safe default.
 *
 * Snapshot is used for active/trialing/past_due subscriptions to guarantee
 * billing-cycle stability. Live plan is used only when no snapshot exists.
 */
export async function resolveTenantPlan(tenantId: string): Promise<ResolvedPlan> {
  await connectToDatabase();

  const subscription = await TenantSubscription.findOne({ tenantId }).lean();
  const features: Record<string, ResolvedFeature> = {};

  const snapshot = (subscription as any)?.planSnapshot;
  const hasSnapshot = Array.isArray(snapshot?.features) && snapshot.features.length > 0;
  const isActiveSubscription =
    subscription?.status &&
    ["active", "trialing", "past_due"].includes(subscription.status);

  let planName = "Free";
  let planSlug = "free";
  let planId: string | null = null;
  let resolvedFrom: ResolvedPlan["resolvedFrom"] = "default";

  if (hasSnapshot && isActiveSubscription) {
    // Use locked snapshot — stable for the current billing cycle
    planName = snapshot.name ?? "Free";
    planId = subscription?.planId?.toString() ?? null;
    resolvedFrom = "snapshot";

    for (const f of snapshot.features as PlanFeature[]) {
      features[f.key] = {
        key: f.key,
        type: f.type as ResolvedFeature["type"],
        enabled: f.type === "boolean" ? (f.enabled ?? false) : true,
        limit: f.limit ?? 0,
        resetPeriod: (f.resetPeriod as ResolvedFeature["resetPeriod"]) ?? "never",
        overageAllowed: f.overageAllowed ?? false,
        overagePriceCents: f.overagePriceCents ?? 0,
        unit: f.unit ?? "",
        source: "snapshot"
      };
    }
  } else if (subscription?.planId) {
    // Fall back to live plan (no snapshot, or subscription is canceled/inactive)
    const livePlan = await BillingPlan.findById(subscription.planId).lean();
    if (livePlan && (livePlan as any).features?.length) {
      planName = livePlan.name;
      planSlug = (livePlan as any).slug ?? livePlan.name.toLowerCase();
      planId = livePlan._id.toString();
      resolvedFrom = "live_plan";

      for (const f of (livePlan as any).features as PlanFeature[]) {
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
    planId,
    planName,
    planSlug,
    features,
    status: subscription?.status ?? "inactive",
    resolvedFrom
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
