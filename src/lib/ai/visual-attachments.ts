import { Types } from "mongoose";
import { KnowledgeAsset } from "@/lib/models";
import { getObjectAccessUrl } from "@/lib/storage/r2";

export type AiImageAttachment = {
  id: string;
  type: "image";
  key?: string;
  url: string;
  name: string;
  mimeType: string;
  size: number;
};

type KnowledgeResultLike = {
  documentId?: string;
  sourceTitle?: string;
  sourceUrl?: string;
};

type VisualAssetKind = "menu" | "offer" | "product";

const VISUAL_REQUEST_TERMS = [
  "صورة",
  "صور",
  "ابعت",
  "ابعث",
  "ارسل",
  "أرسل",
  "وريني",
  "عرض",
  "اعرض",
  "photo",
  "image",
  "picture",
  "send",
  "show",
  "menu",
  "catalog"
];

const KIND_TERMS: Record<VisualAssetKind, string[]> = {
  menu: ["menu", "منيو", "مينيو", "قائمة", "مشروبات", "اكل", "أكل", "طعام", "drink", "drinks", "beverage", "food"],
  offer: ["offer", "offers", "عرض", "عروض", "خصم", "خصومات", "discount", "sale", "promo", "promotion"],
  product: ["product", "products", "منتج", "منتجات", "كاتالوج", "catalog", "item", "items"]
};

export function hasVisualAssetRequest(message: string) {
  const normalized = normalizeText(message);
  return VISUAL_REQUEST_TERMS.some((term) => normalized.includes(normalizeText(term)));
}

export async function buildKnowledgeResultImageAttachments(input: {
  tenantId: string;
  results: KnowledgeResultLike[];
  limit?: number;
}) {
  const limit = input.limit || getImageAttachmentLimit();
  const documentIds = [...new Set(
    (input.results || [])
      .map((result) => String(result?.documentId || ""))
      .filter((id) => Types.ObjectId.isValid(id))
  )];
  if (!documentIds.length || limit <= 0) return [];

  const assets = await KnowledgeAsset.find({
    tenantId: input.tenantId,
    knowledgeDocumentId: { $in: documentIds.map((id) => new Types.ObjectId(id)) },
    status: "ready"
  }).lean();

  const byDocumentId = new Map(assets.map((asset: any) => [asset.knowledgeDocumentId?.toString?.() || "", asset]));
  const attachments: AiImageAttachment[] = [];
  const seen = new Set<string>();

  for (const result of input.results || []) {
    const documentId = String(result?.documentId || "");
    const asset: any = byDocumentId.get(documentId);
    const url = asset
      ? await getObjectAccessUrl(asset.objectKey, asset.imageUrl)
      : imageUrlFromKnowledgeResult(result);

    if (!url || seen.has(url)) continue;
    seen.add(url);
    attachments.push({
      id: asset?._id?.toString?.() || `knowledge-${documentId}`,
      type: "image",
      key: asset?.objectKey || "",
      url,
      name: asset?.fileName || result?.sourceTitle || "knowledge-image",
      mimeType: asset?.mimeType || mimeTypeFromUrl(url),
      size: asset?.sizeBytes || 0
    });
    if (attachments.length >= limit) break;
  }

  return attachments;
}

export async function buildRequestedVisualAssetAttachments(input: {
  tenantId: string;
  botId: string;
  message: string;
  limit?: number;
}) {
  if (!hasVisualAssetRequest(input.message)) return [];

  const limit = input.limit || getImageAttachmentLimit();
  if (limit <= 0) return [];

  const kinds = inferRequestedKinds(input.message);
  const assets = await KnowledgeAsset.find({
    tenantId: input.tenantId,
    botId: input.botId,
    status: "ready",
    kind: { $in: kinds }
  })
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(40)
    .lean();

  if (!assets.length) return [];

  const queryTokens = tokenize(input.message);
  const ranked = assets
    .map((asset: any) => ({ asset, score: scoreAsset(asset, queryTokens, kinds) }))
    .sort((a, b) => b.score - a.score);

  const attachments: AiImageAttachment[] = [];
  const seen = new Set<string>();

  for (const { asset } of ranked) {
    const url = await getObjectAccessUrl(asset.objectKey, asset.imageUrl);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    attachments.push({
      id: asset._id?.toString?.() || `asset-${attachments.length + 1}`,
      type: "image",
      key: asset.objectKey || "",
      url,
      name: asset.fileName || asset.title || `${asset.kind}-image`,
      mimeType: asset.mimeType || mimeTypeFromUrl(url),
      size: asset.sizeBytes || 0
    });
    if (attachments.length >= limit) break;
  }

  return attachments;
}

export function mergeImageAttachments(...groups: AiImageAttachment[][]) {
  const merged: AiImageAttachment[] = [];
  const seen = new Set<string>();

  for (const group of groups) {
    for (const attachment of group || []) {
      const key = attachment.key || attachment.url || attachment.id;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(attachment);
      if (merged.length >= getImageAttachmentLimit()) return merged;
    }
  }

  return merged;
}

export function appendVisualAttachmentFallbackLinks(reply: string, attachments: AiImageAttachment[], channel: string) {
  if (!attachments.length || channelSupportsNativeImageAttachment(channel)) return reply;
  const urls = attachments.map((attachment) => attachment.url).filter(Boolean);
  if (!urls.length) return reply;
  const hasArabic = /[\u0600-\u06FF]/.test(reply);
  const label = hasArabic ? "الصورة المرجعية" : "Reference image";
  return `${reply.trim()}\n\n${urls.map((url, index) => `${label}${urls.length > 1 ? ` ${index + 1}` : ""}: ${url}`).join("\n")}`;
}

export function ensureVisualAttachmentMention(reply: string, attachments: AiImageAttachment[]) {
  if (!attachments.length) return reply;
  const text = String(reply || "").trim();
  const hasArabic = /[\u0600-\u06FF]/.test(text);
  const mentionsAttachment = hasArabic
    ? /(مرفق|ارفقت|أرفقت|الصوره|الصورة|الصور)/.test(text)
    : /\b(attached|image|photo|picture)\b/i.test(text);

  const refusalLike = hasArabic
    ? /(لا\s+استطيع|لا\s+أستطيع|لا\s+يمكنني|ابعت\s+الصوره|ابعت\s+الصورة|ارسل\s+الصوره|ارسل\s+الصورة)/.test(text)
    : /\b(can't|cannot|unable to send|send the image here)\b/i.test(text);

  if (refusalLike) {
    return hasArabic
      ? "أرفقت لك الصورة المطلوبة. لو تحب أطلع لك التفاصيل أو الأسعار منها اكتب لي المطلوب."
      : "I attached the requested image. Tell me if you want me to pull out the details or prices from it.";
  }

  if (mentionsAttachment) return text;

  return hasArabic
    ? `${text}\n\nأرفقت لك الصورة المطلوبة.`
    : `${text}\n\nI attached the requested image.`;
}

export function channelSupportsNativeImageAttachment(channel: string) {
  return ["website", "whatsapp", "telegram"].includes(String(channel || "").toLowerCase());
}

export function getImageAttachmentLimit() {
  const value = Number(process.env.AI_KB_IMAGE_ATTACHMENT_LIMIT || 2);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 2;
}

function inferRequestedKinds(message: string): VisualAssetKind[] {
  const normalized = normalizeText(message);
  const kinds = (Object.entries(KIND_TERMS) as Array<[VisualAssetKind, string[]]>)
    .filter(([, terms]) => terms.some((term) => normalized.includes(normalizeText(term))))
    .map(([kind]) => kind);

  return kinds.length ? kinds : ["menu", "offer", "product"];
}

function scoreAsset(asset: any, queryTokens: string[], requestedKinds: VisualAssetKind[]) {
  const haystack = normalizeText([
    asset.title,
    asset.description,
    asset.aiSummary,
    asset.extractedText,
    ...(Array.isArray(asset.tags) ? asset.tags : [])
  ].filter(Boolean).join(" "));
  let score = requestedKinds.includes(asset.kind) ? 8 : 0;

  for (const token of queryTokens) {
    if (token.length < 2) continue;
    if (haystack.includes(token)) score += token.length > 3 ? 4 : 2;
  }

  if (asset.kind === "menu" && queryTokens.some((token) => ["مشروبات", "drinks", "beverage"].includes(token))) {
    score += 6;
  }

  return score;
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .slice(0, 24);
}

function normalizeText(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/[ة]/g, "ه")
    .replace(/[ىي]/g, "ي")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function imageUrlFromKnowledgeResult(result: KnowledgeResultLike) {
  const url = String(result?.sourceUrl || "");
  if (!/^https?:\/\//i.test(url)) return "";
  return /\.(png|jpe?g|webp|gif)(\?|#|$)/i.test(url) ? url : "";
}

function mimeTypeFromUrl(url: string) {
  const clean = url.split("?")[0].toLowerCase();
  if (clean.endsWith(".png")) return "image/png";
  if (clean.endsWith(".webp")) return "image/webp";
  if (clean.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}
