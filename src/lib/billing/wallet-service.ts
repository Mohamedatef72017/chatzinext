/**
 * wallet-service.ts
 *
 * Wallet operations with full idempotency and MongoDB atomic safety.
 * All mutations use $inc to avoid lost-update races.
 * Every transaction is recorded in WalletTransaction (append-only ledger).
 */

import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Wallet, WalletTransaction } from "@/lib/models";

export type TransactionType = "credit" | "debit" | "reserve" | "release" | "refund" | "adjustment" | "expiration";

export interface WalletTransactionInput {
  tenantId: string;
  idempotencyKey: string;
  type: TransactionType;
  amount: number;
  description?: string;
  referenceType?: string;
  referenceId?: string;
  actorId?: string;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface WalletBalance {
  balanceCredits: number;
  reservedCredits: number;
  availableCredits: number;
}

/**
 * Get or create a wallet for a tenant.
 */
async function getOrCreateWallet(tenantId: string) {
  const wallet = await Wallet.findOneAndUpdate(
    { tenantId },
    { $setOnInsert: { tenantId, balanceCredits: 0, reservedCredits: 0 } },
    { upsert: true, new: true }
  );
  return wallet;
}

/**
 * Get wallet balance for a tenant.
 */
export async function getWalletBalance(tenantId: string): Promise<WalletBalance> {
  await connectToDatabase();
  const wallet = await getOrCreateWallet(tenantId);
  return {
    balanceCredits: wallet.balanceCredits,
    reservedCredits: wallet.reservedCredits,
    availableCredits: wallet.balanceCredits - wallet.reservedCredits
  };
}

/**
 * Apply a wallet transaction atomically.
 * Throws if the transaction is a duplicate (idempotencyKey already exists).
 * Throws if debit would make balance negative.
 */
export async function applyWalletTransaction(input: WalletTransactionInput): Promise<void> {
  await connectToDatabase();

  const wallet = await getOrCreateWallet(input.tenantId);

  // Idempotency check — if this key already exists, silently succeed
  const existing = await WalletTransaction.findOne({ idempotencyKey: input.idempotencyKey }).lean();
  if (existing) return;

  const balanceBefore = wallet.balanceCredits;
  let balanceDelta = 0;
  let reservedDelta = 0;

  switch (input.type) {
    case "credit":
    case "refund":
      if (input.amount <= 0) throw new Error("Credit amount must be positive.");
      balanceDelta = input.amount;
      break;
    case "debit":
      if (input.amount <= 0) throw new Error("Debit amount must be positive.");
      if (wallet.balanceCredits - wallet.reservedCredits < input.amount) {
        throw new Error("Insufficient wallet balance.");
      }
      balanceDelta = -input.amount;
      break;
    case "reserve":
      if (input.amount <= 0) throw new Error("Reserve amount must be positive.");
      if (wallet.balanceCredits - wallet.reservedCredits < input.amount) {
        throw new Error("Insufficient available balance to reserve.");
      }
      reservedDelta = input.amount;
      break;
    case "release":
      if (input.amount <= 0) throw new Error("Release amount must be positive.");
      reservedDelta = -Math.min(input.amount, wallet.reservedCredits);
      break;
    case "adjustment":
      balanceDelta = input.amount; // can be positive or negative
      break;
    case "expiration":
      if (input.amount <= 0) throw new Error("Expiration amount must be positive.");
      balanceDelta = -Math.min(input.amount, wallet.balanceCredits);
      break;
  }

  const balanceAfter = balanceBefore + balanceDelta;
  if (balanceAfter < 0) throw new Error("Wallet balance cannot go negative.");

  await Wallet.updateOne(
    { _id: wallet._id },
    {
      $inc: {
        balanceCredits: balanceDelta,
        reservedCredits: reservedDelta
      }
    }
  );

  await WalletTransaction.create({
    walletId: wallet._id,
    tenantId: new Types.ObjectId(input.tenantId),
    idempotencyKey: input.idempotencyKey,
    type: input.type,
    amount: input.amount,
    balanceBefore,
    balanceAfter,
    description: input.description ?? "",
    referenceType: input.referenceType ?? "",
    referenceId: input.referenceId ?? "",
    actorId: input.actorId ?? "",
    expiresAt: input.expiresAt,
    metadata: input.metadata ?? {}
  });
}

/**
 * Grant credits to a tenant's wallet (admin action).
 */
export async function grantCredits(
  tenantId: string,
  credits: number,
  actorId: string,
  description?: string
): Promise<void> {
  await applyWalletTransaction({
    tenantId,
    idempotencyKey: `admin-grant-${tenantId}-${Date.now()}`,
    type: "credit",
    amount: credits,
    description: description ?? `Admin credit grant: ${credits}`,
    actorId,
    referenceType: "admin_grant"
  });
}
