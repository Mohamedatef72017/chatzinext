import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

/**
 * WalletTransaction — immutable ledger entry.  Never deleted; append-only.
 * idempotencyKey ensures the same logical event cannot be credited twice.
 */
const walletTransactionSchema = new Schema(
  {
    walletId: { type: Schema.Types.ObjectId, ref: "Wallet", required: true, index: true },
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    idempotencyKey: { type: String, required: true, unique: true },
    /**
     * credit  — money/credits added to wallet
     * debit   — money/credits consumed
     * reserve — credits set aside (pre-auth)
     * release — reserved credits returned
     * refund  — credits returned after a debit
     * adjustment — admin correction
     * expiration — credits expired
     */
    type: {
      type: String,
      enum: ["credit", "debit", "reserve", "release", "refund", "adjustment", "expiration"],
      required: true,
      index: true
    },
    amount: { type: Number, required: true },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    description: { type: String, default: "" },
    referenceType: { type: String, default: "" },
    referenceId: { type: String, default: "" },
    actorId: { type: String, default: "" },
    expiresAt: { type: Date, required: false },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

walletTransactionSchema.index({ tenantId: 1, createdAt: -1 });
walletTransactionSchema.index({ walletId: 1, type: 1 });

export type WalletTransactionDocument = InferSchemaType<typeof walletTransactionSchema>;
export const WalletTransaction =
  (models.WalletTransaction as Model<WalletTransactionDocument>) ||
  model("WalletTransaction", walletTransactionSchema);
