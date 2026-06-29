import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

const knowledgeAssetSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    botId: { type: Schema.Types.ObjectId, ref: "Bot", required: true, index: true },
    knowledgeDocumentId: { type: Schema.Types.ObjectId, ref: "KnowledgeDocument", required: false, index: true },
    kind: { type: String, enum: ["menu", "offer", "product"], required: true, index: true },
    title: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true },
    imagePath: { type: String, default: "" },
    fileName: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    sizeBytes: { type: Number, default: 0 },
    description: { type: String, default: "" },
    aiSummary: { type: String, default: "" },
    extractedText: { type: String, default: "" },
    tags: [{ type: String, trim: true, index: true }],
    status: {
      type: String,
      enum: ["processing", "ready", "error"],
      default: "processing",
      index: true
    },
    statusReason: { type: String, default: "" },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

knowledgeAssetSchema.index({ tenantId: 1, botId: 1, kind: 1, createdAt: -1 });

export type KnowledgeAssetDocument = InferSchemaType<typeof knowledgeAssetSchema>;
export const KnowledgeAsset =
  (models.KnowledgeAsset as Model<KnowledgeAssetDocument>) ||
  model("KnowledgeAsset", knowledgeAssetSchema);
