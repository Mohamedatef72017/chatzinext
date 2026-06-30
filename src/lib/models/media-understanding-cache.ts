import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

const mediaUnderstandingCacheSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    type: { type: String, enum: ["image", "audio"], required: true, index: true },
    contentHash: { type: String, required: true, index: true },
    url: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    sizeBytes: { type: Number, default: 0 },
    understanding: { type: String, required: true },
    provider: { type: String, required: true },
    model: { type: String, default: "" },
    analyzedAt: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

mediaUnderstandingCacheSchema.index({ tenantId: 1, type: 1, contentHash: 1 }, { unique: true });

export type MediaUnderstandingCacheDocument = InferSchemaType<typeof mediaUnderstandingCacheSchema>;
export const MediaUnderstandingCache =
  (models.MediaUnderstandingCache as Model<MediaUnderstandingCacheDocument>) ||
  model("MediaUnderstandingCache", mediaUnderstandingCacheSchema);
