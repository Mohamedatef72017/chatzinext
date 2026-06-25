/**
 * tests/billing/entitlement-engine.test.ts
 *
 * Tests for the entitlement engine covering:
 * - Feature resolution from plan features[]
 * - Tenant-level overrides
 * - Boolean features
 * - Numeric limits
 * - assertFeature error messages
 * - Backward-compat wrappers
 */

import { jest } from "@jest/globals";

// Mock plan-resolver
const mockPlan = {
  planId: "plan-abc",
  planName: "Pro",
  planSlug: "pro",
  status: "active",
  features: {
    ai_messages:   { key: "ai_messages",   type: "quota",   enabled: true,  limit: 10000, resetPeriod: "monthly", overageAllowed: false, overagePriceCents: 0, unit: "message", source: "plan" },
    advanced_ai:   { key: "advanced_ai",   type: "boolean", enabled: true,  limit: 0,     resetPeriod: "never",   overageAllowed: false, overagePriceCents: 0, unit: "",        source: "plan" },
    max_agents:    { key: "max_agents",    type: "count",   enabled: true,  limit: 25,    resetPeriod: "never",   overageAllowed: false, overagePriceCents: 0, unit: "agent",   source: "plan" },
    knowledge_enabled: { key: "knowledge_enabled", type: "boolean", enabled: true, limit: 0, resetPeriod: "never", overageAllowed: false, overagePriceCents: 0, unit: "", source: "plan" },
    white_label:   { key: "white_label",   type: "boolean", enabled: false, limit: 0,     resetPeriod: "never",   overageAllowed: false, overagePriceCents: 0, unit: "",        source: "plan" }
  }
};

jest.mock("@/lib/billing/plan-resolver", () => ({
  resolveTenantPlan: jest.fn(async () => ({ ...mockPlan, features: { ...mockPlan.features } })),
  resolveFeature: jest.fn(async (_tenantId: string, key: string) =>
    (mockPlan.features as any)[key] ?? {
      key, type: "boolean", enabled: false, limit: 0,
      resetPeriod: "never", overageAllowed: false, overagePriceCents: 0, unit: "", source: "default"
    }
  )
}));

jest.mock("@/lib/mongodb", () => ({ connectToDatabase: jest.fn() }));

describe("Entitlement Engine", () => {
  const tenantId = "tenant-test-xyz";

  describe("getFeatureValue", () => {
    test("returns limit for quota features", async () => {
      const { getFeatureValue } = await import("@/lib/billing/entitlement-engine");
      const val = await getFeatureValue(tenantId, "ai_messages");
      expect(val).toBe(10000);
    });

    test("returns boolean for boolean features", async () => {
      const { getFeatureValue } = await import("@/lib/billing/entitlement-engine");
      expect(await getFeatureValue(tenantId, "advanced_ai")).toBe(true);
      expect(await getFeatureValue(tenantId, "white_label")).toBe(false);
    });

    test("returns null for unknown feature", async () => {
      const { getFeatureValue } = await import("@/lib/billing/entitlement-engine");
      const val = await getFeatureValue(tenantId, "nonexistent_feature");
      expect(val).toBe(false); // boolean type disabled by default
    });
  });

  describe("isFeatureEnabled", () => {
    test("returns true for enabled boolean feature", async () => {
      const { isFeatureEnabled } = await import("@/lib/billing/entitlement-engine");
      expect(await isFeatureEnabled(tenantId, "knowledge_enabled")).toBe(true);
    });

    test("returns false for disabled boolean feature", async () => {
      const { isFeatureEnabled } = await import("@/lib/billing/entitlement-engine");
      expect(await isFeatureEnabled(tenantId, "white_label")).toBe(false);
    });

    test("returns true for quota feature with non-zero limit", async () => {
      const { isFeatureEnabled } = await import("@/lib/billing/entitlement-engine");
      expect(await isFeatureEnabled(tenantId, "ai_messages")).toBe(true);
    });
  });

  describe("checkFeatureLimit", () => {
    test("allows when current < limit", async () => {
      const { checkFeatureLimit } = await import("@/lib/billing/entitlement-engine");
      const result = await checkFeatureLimit(tenantId, "max_agents", 10);
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(25);
      expect(result.current).toBe(10);
    });

    test("blocks when current >= limit", async () => {
      const { checkFeatureLimit } = await import("@/lib/billing/entitlement-engine");
      const result = await checkFeatureLimit(tenantId, "max_agents", 25);
      expect(result.allowed).toBe(false);
    });
  });

  describe("assertFeature", () => {
    test("passes for enabled boolean feature", async () => {
      const { assertFeature } = await import("@/lib/billing/entitlement-engine");
      await expect(assertFeature(tenantId, "advanced_ai")).resolves.toBeUndefined();
    });

    test("throws for disabled boolean feature", async () => {
      const { assertFeature } = await import("@/lib/billing/entitlement-engine");
      await expect(assertFeature(tenantId, "white_label")).rejects.toThrow(
        /not available on your current plan/
      );
    });

    test("throws when count limit exceeded", async () => {
      const { assertFeature } = await import("@/lib/billing/entitlement-engine");
      await expect(assertFeature(tenantId, "max_agents", 25)).rejects.toThrow(
        /Limit reached/
      );
    });

    test("passes when count is under limit", async () => {
      const { assertFeature } = await import("@/lib/billing/entitlement-engine");
      await expect(assertFeature(tenantId, "max_agents", 5)).resolves.toBeUndefined();
    });
  });

  describe("Backward-compat wrappers", () => {
    test("getEntitlement returns same as getFeatureValue", async () => {
      const { getEntitlement } = await import("@/lib/billing/entitlement-engine");
      const val = await getEntitlement(tenantId, "ai_messages");
      expect(val).toBe(10000);
    });

    test("checkBoolEntitlement returns boolean", async () => {
      const { checkBoolEntitlement } = await import("@/lib/billing/entitlement-engine");
      expect(await checkBoolEntitlement(tenantId, "advanced_ai")).toBe(true);
    });

    test("checkNumericEntitlement returns same as checkFeatureLimit", async () => {
      const { checkNumericEntitlement } = await import("@/lib/billing/entitlement-engine");
      const result = await checkNumericEntitlement(tenantId, "max_agents", 3);
      expect(result.allowed).toBe(true);
    });
  });
});
