import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

/**
 * Wallet — one per tenant.  Tracks credit balance.
 * All mutations must go through atomic operations or MongoDB transactions.
 * Never update balanceCredits directly — use WalletTransaction + $inc.
 */
const walletSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      unique: true,
      index: true
    },
    balanceCredits: { type: Number, default: 0, min: 0 },
    reservedCredits: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: () => process.env.STRIPE_CURRENCY || "usd" },
    isLocked: { type: Boolean, default: false },
    lockedReason: { type: String, default: "" },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export type WalletDocument = InferSchemaType<typeof walletSchema>;
export const Wallet =
  (models.Wallet as Model<WalletDocument>) || model("Wallet", walletSchema);
