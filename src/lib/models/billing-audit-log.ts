import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

/**
 * BillingAuditLog — immutable record of every admin action that touches billing.
 * Never deleted; append-only.  Required for SOC2 / PCI compliance.
 */
const billingAuditLogSchema = new Schema(
  {
    actorId: { type: String, required: true, index: true },
    actorEmail: { type: String, default: "" },
    /**
     * Actions:
     * plan.created | plan.updated | plan.archived | plan.cloned | plan.feature_added |
     * plan.feature_removed | plan.feature_updated | subscription.canceled |
     * subscription.plan_changed | entitlement.override_set | credits.granted |
     * wallet.credited | wallet.debited | wallet.adjusted
     */
    action: { type: String, required: true, index: true },
    targetType: { type: String, default: "" },
    targetId: { type: String, default: "" },
    before: { type: Schema.Types.Mixed, default: null },
    after: { type: Schema.Types.Mixed, default: null },
    ipAddress: { type: String, default: "" },
    note: { type: String, default: "" }
  },
  { timestamps: true }
);

billingAuditLogSchema.index({ action: 1, createdAt: -1 });
billingAuditLogSchema.index({ targetType: 1, targetId: 1 });

export type BillingAuditLogDocument = InferSchemaType<typeof billingAuditLogSchema>;
export const BillingAuditLog =
  (models.BillingAuditLog as Model<BillingAuditLogDocument>) ||
  model("BillingAuditLog", billingAuditLogSchema);
