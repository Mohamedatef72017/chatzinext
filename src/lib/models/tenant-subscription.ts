import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

const tenantSubscriptionSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, unique: true, index: true },
    planId: { type: Schema.Types.ObjectId, ref: "BillingPlan", required: false },

    /** Payment provider references */
    provider: { type: String, enum: ["stripe", "paymob", "myfatoorah", "paddle", "manual"], default: "stripe" },
    stripeCustomerId: { type: String, default: "" },
    stripeSubscriptionId: { type: String, default: "" },
    providerCustomerId: { type: String, default: "" },
    providerSubscriptionId: { type: String, default: "", index: true },

    /** Subscription status */
    status: { type: String, default: "inactive", index: true },

    /** Billing period */
    currentPeriodStart: { type: Date, required: false },
    currentPeriodEnd: { type: Date, required: false },

    /** Trial */
    trialEndsAt: { type: Date, required: false, index: true },

    /** Grace period after payment failure */
    graceEndsAt: { type: Date, required: false, index: true },

    /** Scheduled cancellation */
    cancelAtPeriodEnd: { type: Boolean, default: false },
    canceledAt: { type: Date, required: false },

    /**
     * Legacy usage counters — kept for backward compatibility.
     * New code should read/write UsageRecord instead.
     */
    monthlyMessageLimit: { type: Number, default: 0 },
    usedMessages: { type: Number, default: 0 },
    extraMessageCredits: { type: Number, default: 0 },
    graceMessageLimit: { type: Number, default: 20, min: 0 },

    /**
     * planSnapshot — a frozen copy of the plan features at subscription time.
     * Ensures billing terms don't change mid-cycle if a plan is edited.
     */
    planSnapshot: { type: Schema.Types.Mixed, default: null },

    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

tenantSubscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });
tenantSubscriptionSchema.index({ stripeSubscriptionId: 1 }, { sparse: true });
tenantSubscriptionSchema.index({ providerSubscriptionId: 1 }, { sparse: true });

export type TenantSubscriptionDocument = InferSchemaType<typeof tenantSubscriptionSchema>;
export const TenantSubscription =
  (models.TenantSubscription as Model<TenantSubscriptionDocument>) ||
  model("TenantSubscription", tenantSubscriptionSchema);
