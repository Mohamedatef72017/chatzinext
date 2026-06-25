import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

/**
 * SubscriptionHistory — immutable log of every subscription state transition.
 * Never deleted; append-only.  Used for support, billing audits, and churn analysis.
 */
const subscriptionHistorySchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    subscriptionId: { type: Schema.Types.ObjectId, ref: "TenantSubscription", required: false },
    planId: { type: Schema.Types.ObjectId, ref: "BillingPlan", required: false },
    planName: { type: String, default: "" },
    fromStatus: { type: String, default: "" },
    toStatus: { type: String, required: true },
    /**
     * Transition types:
     * created | activated | upgraded | downgraded | renewed | canceled |
     * reactivated | past_due | grace_entered | grace_expired | trial_started |
     * trial_expired | plan_changed | credits_added | admin_override
     */
    transition: { type: String, required: true, index: true },
    actor: { type: String, enum: ["system", "tenant", "admin", "stripe"], default: "system" },
    actorId: { type: String, default: "" },
    note: { type: String, default: "" },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

subscriptionHistorySchema.index({ tenantId: 1, createdAt: -1 });

export type SubscriptionHistoryDocument = InferSchemaType<typeof subscriptionHistorySchema>;
export const SubscriptionHistory =
  (models.SubscriptionHistory as Model<SubscriptionHistoryDocument>) ||
  model("SubscriptionHistory", subscriptionHistorySchema);
