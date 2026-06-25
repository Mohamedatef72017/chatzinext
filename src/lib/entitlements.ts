/**
 * entitlements.ts
 *
 * Backward-compatible entitlements API.
 * Internally delegates to the new entitlement-engine which reads
 * BillingPlan.features[] — not PLAN_DEFAULTS.
 *
 * The old PLAN_DEFAULTS dictionary is preserved here ONLY as a migration
 * fallback for tenants whose plans have no features[] yet.
 * Once all plans are migrated via the seed script, this fallback can be removed.
 */

import { connectToDatabase } from "@/lib/mongodb";
import { Entitlement, TenantSubscription, BillingPlan } from "@/lib/models";
import { logger } from "@/lib/logger";

import {
  getFeatureValue,
  isFeatureEnabled,
  checkFeatureLimit,
  assertFeature
} from "@/lib/billing/entitlement-engine";

export type { FeatureKey as EntitlementKey } from "@/lib/billing/feature-registry";

// ─── Legacy PLAN_DEFAULTS — migration fallback only ───────────────────────────
// New code must NOT read from this. It remains only to bootstrap tenants
// that have not yet been migrated to feature-based plans.

const PLAN_DEFAULTS_FALLBACK: Record<string, Record<string, number | boolean>> = {
  free: {
    max_channels: 2, max_agents: 1, max_bots: 1, max_team_members: 3,
    monthly_message_limit: 100, knowledge_enabled: false, advanced_ai: false,
    instagram_enabled: false, whatsapp_enabled: false, facebook_enabled: false,
    telegram_enabled: true, qdrant_search: false, api_access: false, white_label: false
  },
  starter: {
    max_channels: 5, max_agents: 5, max_bots: 3, max_team_members: 10,
    monthly_message_limit: 1000, knowledge_enabled: true, advanced_ai: false,
    instagram_enabled: true, whatsapp_enabled: true, facebook_enabled: true,
    telegram_enabled: true, qdrant_search: false, api_access: true, white_label: false
  },
  pro: {
    max_channels: 20, max_agents: 25, max_bots: 10, max_team_members: 50,
    monthly_message_limit: 10000, knowledge_enabled: true, advanced_ai: true,
    instagram_enabled: true, whatsapp_enabled: true, facebook_enabled: true,
    telegram_enabled: true, qdrant_search: true, api_access: true, white_label: false
  },
  enterprise: {
    max_channels: 999, max_agents: 999, max_bots: 999, max_team_members: 999,
    monthly_message_limit: 999999, knowledge_enabled: true, advanced_ai: true,
    instagram_enabled: true, whatsapp_enabled: true, facebook_enabled: true,
    telegram_enabled: true, qdrant_search: true, api_access: true, white_label: true
  }
};

/** @internal Map old boolean key names to new feature keys */
const KEY_ALIAS: Record<string, string> = {
  advanced_ai_enabled: "advanced_ai",
  instagram_enabled: "max_instagram_accounts",
  whatsapp_enabled: "max_whatsapp_numbers",
  facebook_enabled: "max_facebook_pages",
  telegram_enabled: "max_telegram_channels",
  qdrant_enabled: "qdrant_search",
  api_access_enabled: "api_access",
  white_label_enabled: "white_label",
  knowledge_enabled: "knowledge_enabled",
  monthly_message_limit: "ai_messages"
};

function resolveKey(key: string): string {
  return KEY_ALIAS[key] ?? key;
}

// ─── Core helpers ──────────────────────────────────────────────────────────────

/**
 * Get the effective value for an entitlement key.
 * Delegates to the new entitlement-engine; falls back to PLAN_DEFAULTS_FALLBACK
 * if the plan has no features defined yet (migration period).
 */
export async function getEntitlement(
  tenantId: string,
  key: string
): Promise<number | boolean | null> {
  await connectToDatabase();

  // Check tenant-level Entitlement override first (legacy table)
  const override = await Entitlement.findOne({ tenantId, key }).lean();
  if (override) {
    const expired = override.expiresAt && new Date(override.expiresAt) < new Date();
    if (!expired) {
      return override.limitValue !== undefined ? (override.limitValue as number)
        : (override.boolValue as boolean) ?? null;
    }
  }

  // Try the new engine
  const normalizedKey = resolveKey(key);
  const val = await getFeatureValue(tenantId, normalizedKey);
  if (val !== null) return val;

  // Migration fallback: read from PLAN_DEFAULTS_FALLBACK
  const subscription = await TenantSubscription.findOne({ tenantId }).populate("planId").lean();
  const planName = ((subscription?.planId as any)?.name ?? "free").toLowerCase();
  const defaults = PLAN_DEFAULTS_FALLBACK[planName] ?? PLAN_DEFAULTS_FALLBACK.free;
  return defaults[key] ?? PLAN_DEFAULTS_FALLBACK.free[key] ?? null;
}

export async function checkNumericEntitlement(
  tenantId: string,
  key: string,
  currentCount: number
): Promise<{ allowed: boolean; current: number; limit: number }> {
  return checkFeatureLimit(tenantId, resolveKey(key), currentCount);
}

export async function checkBoolEntitlement(tenantId: string, key: string): Promise<boolean> {
  return isFeatureEnabled(tenantId, resolveKey(key));
}

export async function assertEntitlement(
  tenantId: string,
  key: string,
  currentCount?: number
): Promise<void> {
  return assertFeature(tenantId, resolveKey(key), currentCount);
}

// ─── Seed & override helpers ──────────────────────────────────────────────────

/**
 * Seed default entitlements for a tenant based on plan name.
 * @deprecated After full migration, plans should have features[] embedded.
 * This is only needed for the legacy Entitlement table path.
 */
export async function seedEntitlementsForPlan(
  tenantId: string,
  planName: string,
  planId?: string
): Promise<void> {
  await connectToDatabase();
  const defaults = PLAN_DEFAULTS_FALLBACK[planName.toLowerCase()] ?? PLAN_DEFAULTS_FALLBACK.free;

  const ops = Object.entries(defaults).map(([key, value]) => ({
    updateOne: {
      filter: { tenantId, key, isOverride: { $ne: true } },
      update: {
        $set: {
          tenantId,
          key,
          ...(typeof value === "number" ? { limitValue: value } : { boolValue: value }),
          ...(planId ? { planId } : {}),
          isOverride: false
        }
      },
      upsert: true
    }
  }));

  await Entitlement.bulkWrite(ops as any[]);
  logger.info("entitlements.seeded", { tenantId, planName });
}

/**
 * Set a tenant-level override (admin use).
 * Writes to both the legacy Entitlement table and is reflected in the new engine.
 */
export async function setEntitlementOverride(
  tenantId: string,
  key: string,
  value: number | boolean,
  expiresAt?: Date
): Promise<void> {
  await connectToDatabase();
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
