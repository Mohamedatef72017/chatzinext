/**
 * tests/billing/wallet-service.test.ts
 *
 * Tests for wallet operations:
 * - Balance retrieval
 * - Credit / debit
 * - Idempotency
 * - Negative balance prevention
 * - Adjustment
 */

import { jest } from "@jest/globals";

let walletBalance = 0;
let walletReserved = 0;
const transactions: any[] = [];
const walletId = "wallet-001";

jest.mock("@/lib/mongodb", () => ({ connectToDatabase: jest.fn() }));

jest.mock("@/lib/models", () => ({
  Wallet: {
    findOneAndUpdate: jest.fn(async () => ({
      _id: walletId,
      balanceCredits: walletBalance,
      reservedCredits: walletReserved
    })),
    updateOne: jest.fn(async (_filter: any, update: any) => {
      const inc = update.$inc ?? {};
      walletBalance += inc.balanceCredits ?? 0;
      walletReserved += inc.reservedCredits ?? 0;
      return {};
    })
  },
  WalletTransaction: {
    findOne: jest.fn(async ({ idempotencyKey }: any) =>
      transactions.find(t => t.idempotencyKey === idempotencyKey) ?? null
    ),
    create: jest.fn(async (data: any) => { transactions.push(data); return data; })
  }
}));

describe("Wallet Service", () => {
  const tenantId = "tenant-wallet-test";

  beforeEach(() => {
    walletBalance = 100;
    walletReserved = 0;
    transactions.length = 0;
  });

  describe("applyWalletTransaction — credit", () => {
    test("adds balance on credit", async () => {
      const { applyWalletTransaction } = await import("@/lib/billing/wallet-service");
      await applyWalletTransaction({
        tenantId,
        idempotencyKey: "credit-001",
        type: "credit",
        amount: 50
      });
      expect(walletBalance).toBe(150);
    });

    test("is idempotent — same key does not double-credit", async () => {
      const { applyWalletTransaction } = await import("@/lib/billing/wallet-service");
      await applyWalletTransaction({ tenantId, idempotencyKey: "credit-idem-001", type: "credit", amount: 50 });
      await applyWalletTransaction({ tenantId, idempotencyKey: "credit-idem-001", type: "credit", amount: 50 });
      // Second call should be a no-op
      expect(walletBalance).toBe(150); // Only one credit applied
    });
  });

  describe("applyWalletTransaction — debit", () => {
    test("reduces balance on debit", async () => {
      const { applyWalletTransaction } = await import("@/lib/billing/wallet-service");
      await applyWalletTransaction({ tenantId, idempotencyKey: "debit-001", type: "debit", amount: 30 });
      expect(walletBalance).toBe(70);
    });

    test("throws if debit exceeds available balance", async () => {
      const { applyWalletTransaction } = await import("@/lib/billing/wallet-service");
      await expect(
        applyWalletTransaction({ tenantId, idempotencyKey: "debit-002", type: "debit", amount: 200 })
      ).rejects.toThrow(/Insufficient/);
    });
  });

  describe("applyWalletTransaction — reserve / release", () => {
    test("reserves and releases balance", async () => {
      const { applyWalletTransaction } = await import("@/lib/billing/wallet-service");
      await applyWalletTransaction({ tenantId, idempotencyKey: "reserve-001", type: "reserve", amount: 40 });
      expect(walletReserved).toBe(40);
      await applyWalletTransaction({ tenantId, idempotencyKey: "release-001", type: "release", amount: 40 });
      expect(walletReserved).toBe(0);
    });
  });

  describe("applyWalletTransaction — negative balance prevention", () => {
    test("rejects adjustment that would make balance negative", async () => {
      const { applyWalletTransaction } = await import("@/lib/billing/wallet-service");
      await expect(
        applyWalletTransaction({ tenantId, idempotencyKey: "adj-001", type: "adjustment", amount: -500 })
      ).rejects.toThrow(/cannot go negative/);
    });
  });

  describe("grantCredits", () => {
    test("credits wallet with correct amount", async () => {
      const { grantCredits } = await import("@/lib/billing/wallet-service");
      await grantCredits(tenantId, 200, "admin-user-001");
      expect(walletBalance).toBe(300);
    });
  });
});
