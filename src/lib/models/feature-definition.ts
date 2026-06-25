import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

/**
 * FeatureDefinition — the global registry of every billable feature.
 * Plans reference features by `key`.  Adding a new billable capability
 * (e.g. "voice_minutes") requires only inserting a new FeatureDefinition
 * record — no core billing code changes are needed.
 */
const featureDefinitionSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    /**
     * boolean  — feature flag (on/off)
     * quota    — monthly/yearly bucket (e.g. ai_messages, api_requests)
     * count    — hard cap on resource count (e.g. max_agents)
     * storage  — capacity limit in MB/GB
     * metered  — pay-per-use (future)
     */
    type: {
      type: String,
      enum: ["boolean", "quota", "count", "storage", "metered"],
      required: true,
      index: true
    },
    unit: { type: String, default: "" },
    resetPeriod: {
      type: String,
      enum: ["monthly", "yearly", "never"],
      default: "never"
    },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export type FeatureDefinitionDocument = InferSchemaType<typeof featureDefinitionSchema>;
export const FeatureDefinition =
  (models.FeatureDefinition as Model<FeatureDefinitionDocument>) ||
  model("FeatureDefinition", featureDefinitionSchema);
