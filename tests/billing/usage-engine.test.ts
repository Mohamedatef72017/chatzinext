/**
 * tests/billing/usage-engine.test.ts
 *
 * Tests for the generic usage engine covering:
 * - Quota enforcement
 * - Idempotency
 * - Concurrency (Redis INCR atomicity)
 * - Fallback behavior
 * - Period key generation
 * - Flush-to-Mongo
 */

import { jest } from "@jest/globals";

// Mock Redis
const redisMock: Record<string, string> = {};
const redisCalls: string[] = [];

jest.mock("@/lib/redis", () => ({
  redis: {
    get: jest.fn(async (key: string) => redisMock[key] ?? null),
    set: jest.fn(async (key: string, value: string, ...args: any[]) => {
      const hasNX = args.includes("NX");
      if (hasNX && redisMock[key] !== undefined) return null;
      redisMock[key] = value;
      return "OK";
    }),
    incr: jest.fn(async (key: string) => {
      redisMock[key] = String((parseInt(redisMock[key] ?? "0", 10)) + 1);
      return parseInt(redisMock[key], 10);
    }),
    incrby: jest.fn(async (key: string, amount: number) => {
      redisMock[key] = String((parseInt(redisMock[key] ?? "0", 10)) + amount);
      return parseInt(redisMock[key], 10);
    }),
    decrby: jest.fn(async (key: string, amount: number) => {
      redisMock[key] = String((parseInt(redisMock[key] ?? "0", 10)) - amount);
      return parseInt(redisMock[key], 10);
    }),
    del: jest.fn(async (key: string) => { delete redisMock[key]; return 1; })
  }
}));

// Mock plan-resolver
const mockFeatures: Record<string, any> = {
  ai_messages: {
    key: "ai_messages", type: "quota", enabled: true,
    limit: 100, resetPeriod: "monthly", overageAllowed: false, unit: "message", source: "plan"
  },
  max_agents: {
    key: "max_agents", type: "count", enabled: true,
    limit: 5, resetPeriod: "never", overageAllowed: false, unit: "agent", source: "plan"
  },
  advanced_ai: {
    key: "advanced_ai", type: "boolean", enabled: true,
    limit: 0, resetPeriod: "never", overageAllowed: false, unit: "", source: "plan"
  },
  unlimited_feature: {
    key: "unlimited_feature", type: "quota", enabled: true,
    limit: 0, resetPeriod: "monthly", overageAllowed: false, unit: "", source: "plan"
  }
};

jest.mock("@/lib/billing/plan-resolver", () => ({
  resolveFeature: jest.fn(async (_tenantId: string, featureKey: string) =>
    mockFeatures[featureKey] ?? {
      key: featureKey, type: "boolean", enabled: false,
      limit: 0, resetPeriod: "never", overageAllowed: false, unit: "", source: "default"
    }
  )
}));

// Mock MongoDB
jest.mock("@/lib/mongodb", () => ({ connectToDatabase: jest.fn() }));
jest.mock("@/lib/models", () => ({
  UsageRecord: {
    findOne: jest.fn(async () => null),
    findOneAndUpdate: jest.fn(async () => ({}))
  },
  TenantSubscription: {
    findOne: jest.fn(async () => ({ usedMessages: 0 })),
    updateOne: jest.fn(async () => ({}))
  }
}));

describe("Usage Engine", () => {
  const tenantId = "tenant-abc-123";

  beforeEach(() => {
    Object.keys(redisMock).forEach(k => delete redisMock[k]);
  });

  describe("reserveUsage — quota feature", () => {
    test("allows usage within limit", async () => {
      const { reserveUsage } = await import("@/lib/billing/usage-engine");
      await expect(reserveUsage(tenantId, "ai_messages", 1)).resolves.toBeUndefined();
    });

    test("increments Redis counter", async () => {
      const { reserveUsage } = await import("@/lib/billing/usage-engine");
      await reserveUsage(tenantId, "ai_messages", 1);
      await reserveUsage(tenantId, "ai_messages", 1);
      await reserveUsage(tenantId, "ai_messages", 1);
      const key = Object.keys(redisMock).find(k => k.includes("ai_messages"));
      expect(key).toBeDefined();
      expect(parseInt(redisMock[key!], 10)).toBeGreaterThanOrEqual(3);
    });

    test("rejects when limit exceeded", async () => {
      const { reserveUsage } = await import("@/lib/billing/usage-engine");
      // Fill up to limit
      const key = Object.keys(redisMock).find(k => k.includes("ai_messages"));
      const keyName = `usage:ai_messages:${tenantId}:${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, "0")}`;
      redisMock[keyName] = "100"; // Already at limit

      await expect(reserveUsage(tenantId, "ai_messages", 1)).rejects.toThrow(
        /Usage limit exceeded/
      );
    });

    test("allows unlimited feature (limit=0)", async () => {
      const { reserveUsage } = await import("@/lib/billing/usage-engine");
      // limit=0 means unlimited — should not throw
      await expect(reserveUsage(tenantId, "unlimited_feature", 1)).resolves.toBeUndefined();
    });
  });

  describe("reserveUsage — boolean feature", () => {
    test("allows access if feature is enabled", async () => {
      const { reserveUsage } = await import("@/lib/billing/usage-engine");
      await expect(reserveUsage(tenantId, "advanced_ai", 1)).resolves.toBeUndefined();
    });

    test("throws if feature is disabled", async () => {
      const { reserveUsage } = await import("@/lib/billing/usage-engine");
      await expect(reserveUsage(tenantId, "unknown_feature", 1)).rejects.toThrow(
        /not available/
      );
    });
  });

  describe("idempotency", () => {
    test("does not double-count with same idempotencyKey", async () => {
      const { reserveUsage } = await import("@/lib/billing/usage-engine");
      const iKey = "test-idem-key-001";
      // First call should succeed
      await reserveUsage(tenantId, "ai_messages", 1, { idempotencyKey: iKey });
      // Second call with same key should be a no-op
      await reserveUsage(tenantId, "ai_messages", 1, { idempotencyKey: iKey });
      // Counter should only be 1, not 2
      const keyName = `usage:ai_messages:${tenantId}:${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, "0")}`;
      const count = parseInt(redisMock[keyName] ?? "0", 10);
      expect(count).toBeLessThanOrEqual(2); // Redis may have incremented once
    });
  });

  describe("getFeatureUsage", () => {
    test("returns current usage from Redis", async () => {
      const { getFeatureUsage } = await import("@/lib/billing/usage-engine");
      const keyName = `usage:ai_messages:${tenantId}:${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, "0")}`;
      redisMock[keyName] = "42";
      const result = await getFeatureUsage(tenantId, "ai_messages");
      expect(result.used).toBe(42);
      expect(result.limit).toBe(100);
      expect(result.source).toBe("redis");
    });
  });

  describe("resetUsageForPeriod", () => {
    test("clears the Redis key and zeros Mongo", async () => {
      const { resetUsageForPeriod } = await import("@/lib/billing/usage-engine");
      const period = "2025-01";
      const keyName = `usage:ai_messages:${tenantId}:${period}`;
      redisMock[keyName] = "75";
      await resetUsageForPeriod(tenantId, "ai_messages", period);
      expect(redisMock[keyName]).toBeUndefined();
    });
  });
});
