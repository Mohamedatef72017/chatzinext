import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

/**
 * UsageRecord — persists the cumulative usage of one feature for one tenant
 * in one billing period.  Redis is the hot-path counter; this is the durable
 * source of truth and the fallback when Redis is unavailable.
 *
 * Compound unique index: (tenantId, featureKey, periodKey)
 * periodKey format: "2025-06" for monthly, "2025" for yearly, "all" for never-reset
 */
const usageRecordSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    featureKey: { type: String, required: true, trim: true, index: true },
    periodKey: { type: String, required: true, trim: true },
    usedAmount: { type: Number, default: 0, min: 0 },
    reservedAmount: { type: Number, default: 0, min: 0 },
    limit: { type: Number, default: 0 },
    resetAt: { type: Date, required: false },
    lastSyncedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

usageRecordSchema.index({ tenantId: 1, featureKey: 1, periodKey: 1 }, { unique: true });
usageRecordSchema.index({ tenantId: 1, periodKey: 1 });

export type UsageRecordDocument = InferSchemaType<typeof usageRecordSchema>;
export const UsageRecord =
  (models.UsageRecord as Model<UsageRecordDocument>) ||
  model("UsageRecord", usageRecordSchema);
