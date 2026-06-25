/**
 * entitlement-engine.ts
 *
 * Replaces the hardcoded PLAN_DEFAULTS approach.
 * All entitlement checks flow through resolveTenantPlan() which reads
 * BillingPlan.features[] as the source of truth.
 *
 * Backward-compatible wrappers for the old entitlements.ts API are exported
 * so existing call-sites continue to work without modification.
 */

import { resolveFeature, resolveTenantPlan } from "./plan-resolver";

// ─── Core API ──────────────────────────────────────────────────────────────

/**
 * Get the effective value of a feature for a tenant.
 * Returns: number (for count/quota/storage), boolean (for boolean), or null.
 */
export async function getFeatureValue(
  tenantId: string,
  featureKey: string
): Promise<number | boolean | null> {
  const feature = await resolveFeature(tenantId, featureKey);
  if (feature.type === "boolean") return feature.enabled;
  return feature.limit;
}

/**
 * Check if a boolean feature is enabled.
 */
export async function isFeatureEnabled(tenantId: string, featureKey: string): Promise<boolean> {
  const feature = await resolveFeature(tenantId, featureKey);
  if (feature.type === "boolean") return feature.enabled;
  return feature.limit > 0;
}

/**
 * Check a numeric limit. Returns { allowed, current, limit }.
 */
export async function checkFeatureLimit(
  tenantId: string,
  featureKey: string,
  currentCount: number
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const feature = await resolveFeature(tenantId, featureKey);
  const limit = feature.limit;
  return { allowed: currentCount < limit, current: currentCount, limit };
}

/**
 * Assert a feature is available — throws if not.
 */
export async function assertFeature(
  tenantId: string,
  featureKey: string,
  currentCount?: number
): Promise<void> {
  const feature = await resolveFeature(tenantId, featureKey);

  if (feature.type === "boolean") {
    if (!feature.enabled) {
      throw new Error(`Feature "${featureKey}" is not available on your current plan.`);
    }
    return;
  }

  if (currentCount !== undefined && feature.limit > 0) {
    if (currentCount >= feature.limit) {
      throw new Error(
        `Limit reached for "${featureKey}": ${currentCount}/${feature.limit} on your current plan.`
      );
    }
  }
}

/**
 * Get a complete snapshot of all features for a tenant.
 */
export async function getUsageSnapshot(tenantId: string) {
  return resolveTenantPlan(tenantId);
}

// ─── Backward-compatible wrappers (legacy entitlements.ts API) ─────────────

/**
 * @deprecated Use isFeatureEnabled() or getFeatureValue() instead.
 */
export async function getEntitlement(
  tenantId: string,
  key: string
): Promise<number | boolean | null> {
  return getFeatureValue(tenantId, key);
}

/**
 * @deprecated Use checkFeatureLimit() instead.
 */
export async function checkNumericEntitlement(
  tenantId: string,
  key: string,
  currentCount: number
): Promise<{ allowed: boolean; current: number; limit: number }> {
  return checkFeatureLimit(tenantId, key, currentCount);
}

/**
 * @deprecated Use isFeatureEnabled() instead.
 */
export async function checkBoolEntitlement(tenantId: string, key: string): Promise<boolean> {
  return isFeatureEnabled(tenantId, key);
}

/**
 * @deprecated Use assertFeature() instead.
 */
export async function assertEntitlement(
  tenantId: string,
  key: string,
  currentCount?: number
): Promise<void> {
  return assertFeature(tenantId, key, currentCount);
}
