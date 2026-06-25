/**
 * entitlements.ts
 *
 * Public entitlements API — delegates entirely to the new entitlement-engine
 * which reads BillingPlan.features[] as the single source of truth.
 *
 * PLAN_DEFAULTS has been removed. All decisions come from BillingPlan.features[].
 * For tenant-level overrides, the Entitlement collection is used (via plan-resolver).
 */

import { connectToDatabase } from "@/lib/mongodb";
import {
  getFeatureValue,
  isFeatureEnabled,
  checkFeatureLimit,
  assertFeature
} from "@/lib/billing/entitlement-engine";
import { setEntitlementOverride as _setOverride } from "@/lib/billing/plan-resolver";

export type { FeatureKey as EntitlementKey } from "@/lib/billing/feature-registry";

// ─── Core API ──────────────────────────────────────────────────────────────────

/**
 * Get the effective value for a feature key.
 * Reads from: Entitlement override > BillingPlan.features[planSnapshot] > safe default.
 */
export async function getEntitlement(
  tenantId: string,
  key: string
): Promise<number | boolean | null> {
  await connectToDatabase();
  return getFeatureValue(tenantId, key);
}

export async function checkNumericEntitlement(
  tenantId: string,
  key: string,
  currentCount: number
): Promise<{ allowed: boolean; current: number; limit: number }> {
  return checkFeatureLimit(tenantId, key, currentCount);
}

export async function checkBoolEntitlement(tenantId: string, key: string): Promise<boolean> {
  return isFeatureEnabled(tenantId, key);
}

export async function assertEntitlement(
  tenantId: string,
  key: string,
  currentCount?: number
): Promise<void> {
  return assertFeature(tenantId, key, currentCount);
}

// ─── Override helper ──────────────────────────────────────────────────────────

/**
 * Set a tenant-level entitlement override (admin use).
 * Writes to the Entitlement collection; reflected immediately in all engine checks.
 */
export async function setEntitlementOverride(
  tenantId: string,
  key: string,
  value: number | boolean,
  expiresAt?: Date
): Promise<void> {
  return _setOverride(tenantId, key, value, expiresAt);
}
