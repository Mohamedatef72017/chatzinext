import { unlink } from "fs/promises";
import { existsSync } from "fs";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Types } from "mongoose";
import { AiProvider, Bot, KnowledgeAsset } from "@/lib/models";
import { connectToDatabase } from "@/lib/mongodb";
import { decryptSecret } from "@/lib/crypto";
import { createKnowledgeDocument, deleteKnowledgeDocument, type KnowledgeSourceType } from "@/lib/knowledge";
import { routeAiRequest } from "@/lib/ai-router";
import { assertKnowledgeItemLimit, assertKnowledgeStorageLimit } from "@/lib/knowledge-limits";
import { deleteTenantObject, getObjectAccessUrl, putTenantObject } from "@/lib/storage/r2";

export type KnowledgeAssetKind = "menu" | "offer" | "product";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_ASSETS_PER_KIND = 5;
const MAX_IMAGE_BYTES = Number(process.env.KNOWLEDGE_ASSET_MAX_IMAGE_MB || 8) * 1024 * 1024;

type CreateKnowledgeAssetInput = {
  tenantId: string;
  botId: string;
  kind: KnowledgeAssetKind;
  title: string;
  description?: string;
  file: File;
};

export async function listKnowledgeAssets(tenantId: string, botId?: string) {
  await connectToDatabase();
  const query: Record<string, unknown> = { tenantId };
  if (botId && Types.ObjectId.isValid(botId)) query.botId = botId;

  const assets = await KnowledgeAsset.find(query).sort({ createdAt: -1 }).limit(80).lean();

  return Promise.all(assets.map(async (asset) => ({
    id: asset._id.toString(),
    botId: asset.botId?.toString?.() || "",
    knowledgeDocumentId: asset.knowledgeDocumentId?.toString?.() || "",
    kind: asset.kind,
    title: asset.title,
    imageUrl: await getObjectAccessUrl(asset.objectKey, asset.imageUrl),
    fileName: asset.fileName,
    description: asset.description || "",
    aiSummary: asset.aiSummary || "",
    extractedText: asset.extractedText || "",
    tags: Array.isArray(asset.tags) ? asset.tags : [],
    status: asset.status,
    statusReason: asset.statusReason || "",
    createdAt: asset.createdAt ? new Date(asset.createdAt).toISOString() : ""
  })));
}

export async function createKnowledgeAsset(input: CreateKnowledgeAssetInput) {
  await connectToDatabase();
  validateKnowledgeAssetInput(input);

  const bot = await Bot.findOne({ _id: input.botId, tenantId: input.tenantId }).select("_id").lean();
  if (!bot) throw new Error("البوت غير موجود داخل هذا الحساب.");

  const currentCount = await KnowledgeAsset.countDocuments({
    tenantId: input.tenantId,
    botId: input.botId,
    kind: input.kind
  });
  if (currentCount >= MAX_ASSETS_PER_KIND) {
    throw new Error("الحد الأقصى 5 صور لكل فئة.");
  }

  await assertKnowledgeItemLimit(input.tenantId, 1);
  await assertKnowledgeStorageLimit(input.tenantId, input.file.size);

  const stored = await saveKnowledgeImage(input.tenantId, input.file);
  const title = input.title.trim() || defaultTitle(input.kind);
  const description = String(input.description || "").trim();

  const asset = await KnowledgeAsset.create({
    tenantId: input.tenantId,
    botId: input.botId,
    kind: input.kind,
    title,
    imageUrl: stored.url || stored.publicUrl || "",
    imagePath: stored.objectKey,
    storageProvider: stored.storageProvider,
    bucket: stored.bucket,
    objectKey: stored.objectKey,
    publicUrl: stored.publicUrl || "",
    fileName: input.file.name,
    mimeType: input.file.type,
    sizeBytes: stored.fileSizeBytes,
    description,
    status: "processing"
  });

  try {
    const summary = await buildAssetKnowledgeText({
      kind: input.kind,
      title,
      description,
      file: input.file,
    });

    const knowledgeText = [
      `Visual knowledge type: ${assetKindLabel(input.kind, "en")}`,
      `النوع: ${assetKindLabel(input.kind, "ar")}`,
      `Title: ${title}`,
      `العنوان: ${title}`,
      description ? `User description:\n${description}` : "",
      `AI summary:\n${summary.aiSummary}`,
      summary.extractedText ? `Extracted text:\n${summary.extractedText}` : "",
      `Image URL: ${stored.url || stored.publicUrl || ""}`
    ].filter(Boolean).join("\n\n");

    const documentId = await createKnowledgeDocument({
      tenantId: input.tenantId,
      botId: input.botId,
      title: `${assetKindLabel(input.kind, "ar")} - ${title}`,
      sourceType: sourceTypeForKind(input.kind),
      categoryName: assetKindLabel(input.kind, "ar"),
      collectionName: "صور المعرفة",
      tags: ["visual", input.kind, ...summary.tags],
      text: knowledgeText,
      sourceUrl: stored.publicUrl || stored.url || "",
      skipLimitChecks: true
    });

    asset.knowledgeDocumentId = new Types.ObjectId(documentId);
    asset.aiSummary = summary.aiSummary;
    asset.extractedText = summary.extractedText;
    asset.tags = summary.tags;
    asset.status = "ready";
    asset.statusReason = "";
    asset.metadata = {
      knowledgeDocumentId: documentId,
      storage: {
        provider: stored.storageProvider,
        bucket: stored.bucket,
        objectKey: stored.objectKey,
        publicUrl: stored.publicUrl || "",
        fileSizeBytes: stored.fileSizeBytes
      },
      summarizedAt: new Date().toISOString()
    };
    await asset.save();

    return {
      id: asset._id.toString(),
      knowledgeDocumentId: documentId,
      status: asset.status,
      imageUrl: stored.url || stored.publicUrl || ""
    };
  } catch (error) {
    asset.status = "error";
    asset.statusReason = error instanceof Error ? error.message : "تعذر معالجة الصورة.";
    await asset.save();
    throw error;
  }
}

export async function deleteKnowledgeAsset(assetId: string, tenantId: string) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(assetId)) throw new Error("معرف الصورة غير صالح.");

  const asset = await KnowledgeAsset.findOne({ _id: assetId, tenantId });
  if (!asset) throw new Error("الصورة غير موجودة.");

  if (asset.objectKey) {
    await deleteTenantObject(asset.objectKey).catch(() => null);
  }

  if (asset.imagePath && existsSync(asset.imagePath)) {
    await unlink(asset.imagePath).catch(() => null);
  }

  const linkedDocumentId = asset.knowledgeDocumentId?.toString?.();
  if (linkedDocumentId) {
    await deleteKnowledgeDocument(linkedDocumentId, tenantId).catch(() => null);
  }

  await KnowledgeAsset.deleteOne({ _id: asset._id, tenantId });
  return { success: true };
}

function validateKnowledgeAssetInput(input: CreateKnowledgeAssetInput) {
  if (!Types.ObjectId.isValid(input.tenantId) || !Types.ObjectId.isValid(input.botId)) {
    throw new Error("معرف المستأجر أو البوت غير صالح.");
  }
  if (!["menu", "offer", "product"].includes(input.kind)) {
    throw new Error("نوع الصورة غير مدعوم.");
  }
  if (!input.file || input.file.size <= 0) throw new Error("الصورة مطلوبة.");
  if (!IMAGE_TYPES.has(input.file.type)) throw new Error("نوع الصورة غير مدعوم. استخدم JPG أو PNG أو WebP.");
  if (input.file.size > MAX_IMAGE_BYTES) throw new Error("حجم الصورة كبير جدًا.");
  if (input.kind !== "menu" && String(input.description || "").trim().length < 20) {
    throw new Error("الوصف التفصيلي مطلوب للعروض والمنتجات.");
  }
}

async function saveKnowledgeImage(tenantId: string, file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  return putTenantObject({
    tenantId,
    scope: "knowledge/assets",
    fileName: file.name || `knowledge-image.${extensionForMime(file.type)}`,
    body: bytes,
    contentType: file.type,
    metadata: {
      source: "knowledge_asset"
    }
  });
}

async function buildAssetKnowledgeText(input: {
  kind: KnowledgeAssetKind;
  title: string;
  description: string;
  file: File;
}) {
  if (input.kind === "menu") {
    return summarizeMenuImage(input.file, input.description);
  }

  return summarizeDescribedAsset(input.kind, input.title, input.description);
}

async function summarizeDescribedAsset(kind: KnowledgeAssetKind, title: string, description: string) {
  try {
    const result = await routeAiRequest({
      temperature: 0.1,
      systemPrompt: [
        "You are a knowledge-base editor for a customer service AI.",
        "Rewrite the user's product/offer description into factual, searchable business knowledge.",
        "Do not invent prices, availability, dates, discounts, policies, or promises.",
        "Return JSON only with keys: summary, tags."
      ].join("\n"),
      userInput: JSON.stringify({
        type: kind,
        title,
        description
      })
    });
    const parsed = parseJsonObject(result.reply);
    return {
      aiSummary: cleanText(parsed.summary || description),
      extractedText: "",
      tags: normalizeTags(Array.isArray(parsed.tags) ? parsed.tags : [kind, title])
    };
  } catch {
    return {
      aiSummary: cleanText(description),
      extractedText: "",
      tags: normalizeTags([kind, title])
    };
  }
}

async function summarizeMenuImage(file: File, hint: string) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const base64 = bytes.toString("base64");
  const prompt = [
    "Read this menu image and extract only visible facts.",
    "Return JSON only with keys: summary, extractedText, tags.",
    "summary: concise customer-service-ready Arabic/English summary of the menu.",
    "extractedText: visible menu items, categories, prices, options, and notes. Do not invent missing prices.",
    "tags: short searchable tags.",
    hint ? `Extra user context: ${hint}` : ""
  ].filter(Boolean).join("\n");

  const providers = await AiProvider.find({ isActive: true }).sort({ priority: 1 }).lean();
  let lastError = "";

  for (const provider of providers) {
    const providerId = String(provider.providerId || "");
    const apiKey = decryptSecret(provider.apiKeyEncrypted) || "";
    if (!apiKey && providerId !== "ollama") continue;

    try {
      if (providerId === "gemini") {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: provider.defaultModel || "gemini-1.5-pro" });
        const result = await model.generateContent([
          prompt,
          { inlineData: { mimeType: file.type, data: base64 } }
        ]);
        const parsed = parseJsonObject(result.response.text() || "");
        return normalizeMenuSummary(parsed);
      }

      if (["openai", "openrouter", "xai", "groq"].includes(providerId)) {
        const baseURL = providerId === "openrouter"
          ? "https://openrouter.ai/api/v1"
          : providerId === "xai"
            ? "https://api.x.ai/v1"
            : providerId === "groq"
              ? "https://api.groq.com/openai/v1"
              : provider.baseUrl || undefined;
        const client = new OpenAI({ apiKey: apiKey || "ollama", baseURL });
        const response = await client.chat.completions.create({
          model: provider.defaultModel || (providerId === "openai" ? "gpt-4o-mini" : "openai/gpt-4o-mini"),
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: `data:${file.type};base64,${base64}` } }
              ] as any
            }
          ],
          temperature: 0
        } as any);
        const parsed = parseJsonObject(response.choices[0]?.message?.content || "");
        return normalizeMenuSummary(parsed);
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  throw new Error(`تعذر تلخيص صورة المنيو بالذكاء الاصطناعي.${lastError ? ` ${lastError}` : ""}`);
}

function normalizeMenuSummary(parsed: Record<string, any>) {
  const aiSummary = cleanText(parsed.summary || "");
  const extractedText = cleanText(parsed.extractedText || parsed.extracted_text || "");
  if (aiSummary.length < 10 && extractedText.length < 10) {
    throw new Error("لم يتمكن الذكاء الاصطناعي من قراءة المنيو بوضوح.");
  }
  return {
    aiSummary: aiSummary || extractedText.slice(0, 1200),
    extractedText,
    tags: normalizeTags(Array.isArray(parsed.tags) ? parsed.tags : ["menu", "منيو"])
  };
}

function parseJsonObject(value: string) {
  const cleaned = value.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return {};
    try {
      return JSON.parse(match[0]);
    } catch {
      return {};
    }
  }
}

function cleanText(value: string) {
  return String(value || "")
    .replace(/\u0000/g, " ")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

function normalizeTags(tags: string[]) {
  return [...new Set(tags.map((tag) => String(tag || "").trim()).filter(Boolean))].slice(0, 12);
}

function sourceTypeForKind(kind: KnowledgeAssetKind): KnowledgeSourceType {
  if (kind === "offer") return "pricing";
  if (kind === "product") return "product_catalog";
  return "product_catalog";
}

function assetKindLabel(kind: KnowledgeAssetKind, locale: "ar" | "en") {
  const labels = {
    menu: { ar: "منيو", en: "Menu" },
    offer: { ar: "عروض", en: "Offers" },
    product: { ar: "منتجات", en: "Products" }
  };
  return labels[kind][locale];
}

function defaultTitle(kind: KnowledgeAssetKind) {
  return assetKindLabel(kind, "ar");
}

function extensionForMime(mimeType: string) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}
