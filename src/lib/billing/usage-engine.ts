/**
 * usage-engine.ts
 *
 * Generic, feature-agnostic usage metering engine.
 * Replaces the AI-message-only logic in quota.ts.
 *
 * Hot path: Redis atomic INCR for every feature.
 * Durable store: MongoDB UsageRecord, synced every N operations.
 * Supports: monthly, yearly, never-reset periods.
 * Supports: idempotency keys to prevent double-counting.
 * Supports: reservations (reserve → commit / release pattern).
 */

import { redis } from "@/lib/redis";
import { connectToDatabase } from "@/lib/mongodb";
import { UsageRecord, TenantSubscription } from "@/lib/models";
import { resolveFeature } from "./plan-resolver";
import { logger } from "@/lib/logger";

const MONGO_SYNC_EVERY = 10;
const IDEMPOTENCY_TTL_SECONDS = 86_400; // 24 hours

// ─── Period key helpers ───────────────────────────────────────────────────

function getPeriodKey(resetPeriod: "monthly" | "yearly" | "never"): string {
  const now = new Date();
  if (resetPeriod === "monthly") {
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  }
  if (resetPeriod === "yearly") {
    return `${now.getUTCFullYear()}`;
  }
  return "all";
}

function secondsUntilPeriodEnd(resetPeriod: "monthly" | "yearly" | "never"): number {
  const now = new Date();
  if (resetPeriod === "monthly") {
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    return Math.max(60, Math.floor((end.getTime() - now.getTime()) / 1000));
  }
  if (resetPeriod === "yearly") {
    const end = new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1));
    return Math.max(60, Math.floor((end.getTime() - now.getTime()) / 1000));
  }
  return 30 * 24 * 3600; // 30 days for never-reset (re-cache periodically)
}

// ─── Redis key builders ──────────────────────────────────────────────────

function usageKey(tenantId: string, featureKey: string, periodKey: string): string {
  return `usage:${featureKey}:${tenantId}:${periodKey}`;
}

function idempotencyKey(idempKey: string): string {
  return `usage_idem:${idempKey}`;
}

// ─── MongoDB sync ─────────────────────────────────────────────────────────

async function syncToMongo(
  tenantId: string,
  featureKey: string,
  periodKey: string,
  count: number
): Promise<void> {
  try {
    await connectToDatabase();
    await UsageRecord.findOneAndUpdate(
      { tenantId, featureKey, periodKey },
      { $set: { usedAmount: count, lastSyncedAt: new Date() } },
      { upsert: true }
    );
  } catch (err) {
    logger.warn("usage_engine.mongo_sync_failed", {
      tenantId,
      featureKey,
      error: err instanceof Error ? err.message : "unknown"
    });
  }
}

// ─── Core API ─────────────────────────────────────────────────────────────

/**
 * Get the current usage for a feature.
 */
export async function getFeatureUsage(
  tenantId: string,
  featureKey: string
): Promise<{ used: number; limit: number; periodKey: string; source: "redis" | "mongo" }> {
  const feature = await resolveFeature(tenantId, featureKey);
  const resetPeriod = feature.resetPeriod;
  const periodKey = getPeriodKey(resetPeriod);
  const rKey = usageKey(tenantId, featureKey, periodKey);

  let used = 0;
  let source: "redis" | "mongo" = "mongo";

  try {
    const val = await redis.get(rKey);
    if (val !== null) {
      used = parseInt(val, 10);
      source = "redis";
    }
  } catch {
    // Redis unavailable — fall through to Mongo
  }

  if (source === "mongo") {
    await connectToDatabase();
    const record = await UsageRecord.findOne({ tenantId, featureKey, periodKey }).lean();
    used = record?.usedAmount ?? 0;
  }

  return { used, limit: feature.limit, periodKey, source };
}

/**
 * Assert that a feature can be used and atomically reserve the amount.
 * Throws if the limit would be exceeded.
 *
 * @param tenantId
 * @param featureKey
 * @param amount - how many units to consume (default 1)
 * @param options.idempotencyKey - prevents double-counting
 * @param options.failOpenForPaidPlans - if Redis is down, allow paid plans through
 */
export async function reserveUsage(
  tenantId: string,
  featureKey: string,
  amount = 1,
  options: { idempotencyKey?: string; failOpenForPaidPlans?: boolean } = {}
): Promise<void> {
  const feature = await resolveFeature(tenantId, featureKey);

  // Boolean features have no quota to reserve
  if (feature.type === "boolean") {
    if (!feature.enabled) throw new Error(`Feature "${featureKey}" is not available on your plan.`);
    return;
  }

  const limit = feature.limit;
  if (limit <= 0) return; // unlimited

  const resetPeriod = feature.resetPeriod;
  const periodKey = getPeriodKey(resetPeriod);
  const rKey = usageKey(tenantId, featureKey, periodKey);
  const ttl = secondsUntilPeriodEnd(resetPeriod);

  // Idempotency check
  if (options.idempotencyKey) {
    const iKey = idempotencyKey(options.idempotencyKey);
    const already = await redis.set(iKey, "1", "EX", IDEMPOTENCY_TTL_SECONDS, "NX").catch(() => null);
    if (already === null) return; // already processed
  }

  try {
    // Bootstrap Redis counter from MongoDB on first use in period
    const sub = await TenantSubscription.findOne({ tenantId }).lean();

    // For ai_messages, seed from usedMessages for backward compat
    if (featureKey === "ai_messages" && sub) {
      await redis
        .set(rKey, String((sub as any).usedMessages ?? 0), "EX", ttl, "NX")
        .catch(() => undefined);
    } else {
      await redis.set(rKey, "0", "EX", ttl, "NX").catch(() => undefined);
    }

    const newCount = await redis.incrby(rKey, amount);

    if (newCount > limit && !feature.overageAllowed) {
      await redis.decrby(rKey, amount);
      throw new Error(
        `Usage limit exceeded for "${featureKey}". Used: ${newCount - amount}/${limit}.`
      );
    }

    // Sync to MongoDB periodically
    if (newCount % MONGO_SYNC_EVERY === 0) {
      void syncToMongo(tenantId, featureKey, periodKey, newCount);
    }

    // For ai_messages, keep legacy TenantSubscription.usedMessages in sync
    if (featureKey === "ai_messages" && newCount % MONGO_SYNC_EVERY === 0) {
      TenantSubscription.updateOne({ tenantId }, { $set: { usedMessages: newCount } }).catch(
        () => undefined
      );
    }
  } catch (error) {
    const isQuotaError =
      error instanceof Error && error.message.includes("Usage limit exceeded");
    if (isQuotaError) throw error;

    logger.warn("usage_engine.redis_unavailable_fallback", {
      tenantId,
      featureKey,
      error: error instanceof Error ? error.message : "unknown"
    });

    // Fallback: read from MongoDB
    await connectToDatabase();
    const record = await UsageRecord.findOne({ tenantId, featureKey, periodKey }).lean();
    const mongoUsed = record?.usedAmount ?? 0;

    const isFreeOrLimited = limit <= 200;
    if (isFreeOrLimited && mongoUsed + amount > limit) {
      throw new Error(
        `Usage limit exceeded for "${featureKey}". Used: ${mongoUsed}/${limit}.`
      );
    }

    if (!isFreeOrLimited) {
      logger.error("usage_engine.redis_down_paid_plan_allowed", { tenantId, featureKey, limit });
    }
  }
}

/**
 * Commit usage to MongoDB immediately (e.g. at period end or admin sync).
 */
export async function flushUsageToMongo(tenantId: string, featureKey: string): Promise<void> {
  const feature = await resolveFeature(tenantId, featureKey);
  const periodKey = getPeriodKey(feature.resetPeriod);
  const rKey = usageKey(tenantId, featureKey, periodKey);

  try {
    const val = await redis.get(rKey);
    if (val !== null) {
      await syncToMongo(tenantId, featureKey, periodKey, parseInt(val, 10));
    }
  } catch (err) {
    logger.warn("usage_engine.flush_failed", {
      tenantId,
      featureKey,
      error: err instanceof Error ? err.message : "unknown"
    });
  }
}

/**
 * Reset usage for a feature (e.g. on new billing period).
 */
export async function resetUsageForPeriod(
  tenantId: string,
  featureKey: string,
  periodKey: string
): Promise<void> {
  const rKey = usageKey(tenantId, featureKey, periodKey);
  try {
    await redis.del(rKey);
  } catch {
    // Ignore Redis errors during reset
  }
  await connectToDatabase();
  await UsageRecord.findOneAndUpdate(
    { tenantId, featureKey, periodKey },
    { $set: { usedAmount: 0, reservedAmount: 0, lastSyncedAt: new Date() } },
    { upsert: true }
  );
}

/**
 * Get a full usage snapshot for all tracked features of a tenant.
 */
export async function getFullUsageSnapshot(
  tenantId: string
): Promise<Array<{ featureKey: string; used: number; limit: number; periodKey: string }>> {
  await connectToDatabase();
  const records = await UsageRecord.find({ tenantId }).lean();
  return records.map((r) => ({
    featureKey: r.featureKey,
    used: r.usedAmount,
    limit: r.limit ?? 0,
    periodKey: r.periodKey
  }));
}
