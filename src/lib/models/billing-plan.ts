import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

/**
 * PlanFeature — embedded in BillingPlan.features[].
 * BillingPlan is now the single source of truth for what a plan offers.
 * No external PLAN_DEFAULTS dictionary needed.
 */
const planFeatureSchema = new Schema(
  {
    key: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["boolean", "quota", "count", "storage", "metered"],
      required: true
    },
    enabled: { type: Boolean, default: false },
    limit: { type: Number, default: 0 },
    resetPeriod: {
      type: String,
      enum: ["monthly", "yearly", "never"],
      default: "never"
    },
    overageAllowed: { type: Boolean, default: false },
    overagePriceCents: { type: Number, default: 0 },
    unit: { type: String, default: "" },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { _id: false }
);

const billingPlanSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: false, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, lowercase: true, index: true },
    description: { type: String, default: "" },
    interval: { type: String, enum: ["month", "year"], required: true, index: true },
    priceCents: { type: Number, required: true, min: 0 },
    currency: { type: String, default: () => process.env.STRIPE_CURRENCY || "usd" },

    /**
     * Legacy field — kept for backward compat with existing Stripe sessions.
     * New code should read feature limit from features[key=ai_messages].limit instead.
     */
    aiMessageLimit: { type: Number, required: false, min: 0, default: 0 },

    /** Stripe / payment-provider references */
    stripePriceId: { type: String, default: "" },
    providerPriceId: { type: String, default: "" },
    providerProductId: { type: String, default: "" },

    /** Feature array — the canonical source of plan capabilities */
    features: { type: [planFeatureSchema], default: [] },

    /** Plan versioning */
    version: { type: Number, default: 1, min: 1 },

    /** Admin flags */
    createdByAdmin: { type: Boolean, default: false, index: true },
    isPopular: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false, index: true },
    isHidden: { type: Boolean, default: false },
    isCustom: { type: Boolean, default: false }
  },
  { timestamps: true }
);

billingPlanSchema.index({ tenantId: 1, name: 1, interval: 1 }, { unique: true });
billingPlanSchema.index({ slug: 1, tenantId: 1 });
billingPlanSchema.index({ isActive: 1, isArchived: 1 });

/** Derive slug from name before save if not provided */
billingPlanSchema.pre("save", function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }
  next();
});

export type PlanFeature = InferSchemaType<typeof planFeatureSchema>;
export type BillingPlanDocument = InferSchemaType<typeof billingPlanSchema>;
export const BillingPlan =
  (models.BillingPlan as Model<BillingPlanDocument>) || model("BillingPlan", billingPlanSchema);
