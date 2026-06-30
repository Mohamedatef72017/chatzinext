import { Types } from "mongoose";
import { KnowledgeAsset, KnowledgeDocument } from "@/lib/models";
import { isFeatureEnabled } from "@/lib/billing/entitlement-engine";
import { FEATURE_KEYS } from "@/lib/billing/feature-registry";
import { resolveFeature } from "@/lib/billing/plan-resolver";

export class KnowledgeLimitError extends Error {
  statusCode = 403;
}

function tenantObjectId(tenantId: string) {
  return Types.ObjectId.isValid(tenantId) ? new Types.ObjectId(tenantId) : tenantId;
}

export async function getKnowledgeStorageUsageBytes(tenantId: string) {
  const tenant = tenantObjectId(tenantId);
  const [docStorageAgg, assetStorageAgg] = await Promise.all([
    KnowledgeDocument.aggregate([
      { $match: { tenantId: tenant } },
      { $group: { _id: null, totalBytes: { $sum: "$sizeBytes" } } }
    ]),
    KnowledgeAsset.aggregate([
      { $match: { tenantId: tenant } },
      { $group: { _id: null, totalBytes: { $sum: "$sizeBytes" } } }
    ])
  ]);

  return Number(docStorageAgg[0]?.totalBytes || 0) + Number(assetStorageAgg[0]?.totalBytes || 0);
}

export async function getKnowledgeItemCount(tenantId: string) {
  const tenant = tenantObjectId(tenantId);
  const [docCount, assetCount] = await Promise.all([
    KnowledgeDocument.countDocuments({ tenantId: tenant }),
    KnowledgeAsset.countDocuments({ tenantId: tenant })
  ]);
  return docCount + assetCount;
}

export async function assertKnowledgeEnabled(tenantId: string) {
  const enabled = await isFeatureEnabled(tenantId, FEATURE_KEYS.KNOWLEDGE_ENABLED);
  if (!enabled) {
    throw new KnowledgeLimitError("قاعدة المعرفة غير مفعّلة في باقتك الحالية. يرجى الترقية للوصول إلى هذه الميزة.");
  }
}

export async function assertKnowledgeItemLimit(tenantId: string, additionalItems = 1) {
  const currentCount = await getKnowledgeItemCount(tenantId);
  const feature = await resolveFeature(tenantId, FEATURE_KEYS.MAX_KNOWLEDGE_FILES);
  const projectedCount = currentCount + Math.max(0, additionalItems);
  if (feature.limit > 0 && projectedCount > feature.limit) {
    throw new KnowledgeLimitError(`لقد وصلت إلى الحد الأقصى لملفات المعرفة في باقتك (${feature.limit} ملف). احذف بعض الملفات أو قم بالترقية.`);
  }
  return { allowed: true, current: currentCount, projected: projectedCount, limit: feature.limit };
}

export async function assertKnowledgeStorageLimit(tenantId: string, incomingBytes: number) {
  const currentBytes = await getKnowledgeStorageUsageBytes(tenantId);
  const projectedStorageMB = Math.ceil((currentBytes + Math.max(0, incomingBytes)) / (1024 * 1024));
  const feature = await resolveFeature(tenantId, FEATURE_KEYS.KNOWLEDGE_STORAGE_MB);
  if (feature.limit > 0 && projectedStorageMB > feature.limit) {
    throw new KnowledgeLimitError(`هذا المصدر سيتجاوز الحد الأقصى لمساحة التخزين في باقتك (${feature.limit} MB). احذف بعض الملفات أو قم بالترقية.`);
  }
  return { allowed: true, currentBytes, projectedStorageMB, limit: feature.limit };
}
