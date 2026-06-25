/**
 * quota.ts
 *
 * Backward-compatible quota API for AI messages.
 * Internally delegates to the generic usage-engine.
 *
 * Existing call-sites (assertAndReserveQuota, getQuotaStatus, flushQuotaToMongo)
 * continue to work unchanged.
 */

import { FEATURE_KEYS } from "@/lib/billing/feature-registry";
import {
  reserveUsage,
  getFeatureUsage,
  flushUsageToMongo as _flushUsageToMongo
} from "@/lib/billing/usage-engine";
import { connectToDatabase } from "@/lib/mongodb";
import { TenantSubscription } from "@/lib/models";
import { logger } from "@/lib/logger";

export function quotaRedisKey(tenantId: string): string {
  const now = new Date();
  const yyyyMM = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  return `usage:${FEATURE_KEYS.AI_MESSAGES}:${tenantId}:${yyyyMM}`;
}

/**
 * Atomically assert and reserve one AI message quota slot.
 * Delegates to the generic usage-engine with featureKey = "ai_messages".
 *
 * Backward compatibility preserved: throws the same Arabic error message.
 */
export async function assertAndReserveQuota(tenantId: string): Promise<void> {
  try {
    await reserveUsage(tenantId, FEATURE_KEYS.AI_MESSAGES, 1, {
      failOpenForPaidPlans: true
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Usage limit exceeded")) {
      throw new Error("تم استهلاك رصيد رسائل AI لهذه الخطة. اشتر باقة رسائل إضافية أو غيّر الخطة.");
    }
    throw err;
  }
}

/**
 * Get current quota status for AI messages.
 */
export async function getQuotaStatus(tenantId: string): Promise<{
  used: number;
  limit: number;
  redisCount: number;
  source: "redis" | "mongo";
}> {
  const { used, limit, source } = await getFeatureUsage(tenantId, FEATURE_KEYS.AI_MESSAGES);
  return { used, limit, redisCount: used, source };
}

/**
 * Flush Redis counter to MongoDB immediately.
 */
export async function flushQuotaToMongo(tenantId: string): Promise<void> {
  await _flushUsageToMongo(tenantId, FEATURE_KEYS.AI_MESSAGES);
}
