import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/server/auth/guards";
import { permissions } from "@/server/permissions/permissions";
import { createKnowledgeDocument } from "@/lib/knowledge";
import { KnowledgeDocument, KnowledgeAsset } from "@/lib/models";
import { connectToDatabase } from "@/lib/mongodb";
import { isFeatureEnabled, checkFeatureLimit } from "@/lib/billing/entitlement-engine";
import { FEATURE_KEYS } from "@/lib/billing/feature-registry";

const sourceTypesArray = [
  "pdf", "docx", "txt", "csv", "excel", "faq", "website", "html",
  "product_catalog", "services_catalog", "policies", "terms",
  "pricing", "manual", "support_article", "json", "custom_text", "image"
] as const;

const schema = z.object({
  botId: z.string().min(1),
  title: z.string().min(2),
  sourceType: z.enum(sourceTypesArray),
  categoryName: z.string().optional().default("تلقائي"),
  collectionName: z.string().optional().default("عام"),
  tags: z.string().optional(),
  text: z.string().optional(),
  sourceUrl: z.string().optional(),
  isTemporary: z.string().optional(),
  expiresDays: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const session = await requirePermission(permissions.knowledgeManage);
    const tenantId = session.user.tenantId;
    await connectToDatabase();

    // ── Parse form data first — needed to compute projected storage ──────────
    const form = await request.formData();
    const fileValue = form.get("file");
    const textValue = String(form.get("text") || "");

    // Estimate incoming payload size in bytes:
    // - File upload: use the file's reported size
    // - Direct text / URL content: use byte length of the text string
    const incomingBytes: number =
      fileValue instanceof File && fileValue.size > 0
        ? fileValue.size
        : Buffer.byteLength(textValue, "utf8");

    // ── Plan limit checks ──────────────────────────────────────────────────────
    const knowledgeEnabled = await isFeatureEnabled(tenantId, FEATURE_KEYS.KNOWLEDGE_ENABLED);
    if (!knowledgeEnabled) {
      return NextResponse.json(
        { error: "قاعدة المعرفة غير مفعّلة في باقتك الحالية. يرجى الترقية للوصول إلى هذه الميزة." },
        { status: 403 }
      );
    }

    // Count both KnowledgeDocument and KnowledgeAsset against the unified quota
    const [docCount, assetCount, docStorageAgg, assetStorageAgg] = await Promise.all([
      KnowledgeDocument.countDocuments({ tenantId }),
      KnowledgeAsset.countDocuments({ tenantId }),
      KnowledgeDocument.aggregate([{ $match: { tenantId } }, { $group: { _id: null, totalBytes: { $sum: "$sizeBytes" } } }]),
      KnowledgeAsset.aggregate([{ $match: { tenantId } }, { $group: { _id: null, totalBytes: { $sum: "$sizeBytes" } } }])
    ]);

    const currentFileCount = docCount + assetCount;
    const fileCheck = await checkFeatureLimit(tenantId, FEATURE_KEYS.MAX_KNOWLEDGE_FILES, currentFileCount);
    if (!fileCheck.allowed) {
      return NextResponse.json(
        { error: `لقد وصلت إلى الحد الأقصى لملفات المعرفة في باقتك (${fileCheck.limit} ملف). احذف بعض الملفات أو قم بالترقية.` },
        { status: 403 }
      );
    }

    // Check projected storage including the incoming file/text size
    const currentStorageBytes = (docStorageAgg[0]?.totalBytes || 0) + (assetStorageAgg[0]?.totalBytes || 0);
    const projectedStorageMB = Math.ceil((currentStorageBytes + incomingBytes) / (1024 * 1024));
    const storageCheck = await checkFeatureLimit(tenantId, FEATURE_KEYS.KNOWLEDGE_STORAGE_MB, projectedStorageMB);
    if (!storageCheck.allowed) {
      return NextResponse.json(
        { error: `هذا الملف سيتجاوز الحد الأقصى لمساحة التخزين في باقتك (${storageCheck.limit} MB). احذف بعض الملفات أو قم بالترقية.` },
        { status: 403 }
      );
    }
    // ──────────────────────────────────────────────────────────────────────────

    const body = schema.parse({
      botId: form.get("botId"),
      title: form.get("title"),
      sourceType: normalizeSourceType(String(form.get("sourceType") || "custom_text"), fileValue),
      categoryName: form.get("categoryName") || "تلقائي",
      collectionName: form.get("collectionName") || "عام",
      tags: form.get("tags") || "",
      text: textValue,
      sourceUrl: form.get("sourceUrl") || "",
      isTemporary: form.get("isTemporary") || "",
      expiresDays: form.get("expiresDays") || ""
    });
    const isTemporary = body.isTemporary === "true" || body.isTemporary === "on";
    const expiresDays = Math.max(1, Math.min(365, Number(body.expiresDays || 7)));

    const file =
      fileValue instanceof File && fileValue.size > 0
        ? {
            name: fileValue.name,
            type: fileValue.type,
            size: fileValue.size,
            buffer: Buffer.from(await fileValue.arrayBuffer())
          }
        : undefined;

    const id = await createKnowledgeDocument({
      tenantId,
      botId: body.botId,
      title: body.title,
      sourceType: body.sourceType,
      categoryName: body.categoryName,
      collectionName: body.collectionName,
      tags: body.tags?.split(",") || [],
      text: body.text,
      sourceUrl: body.sourceUrl,
      isTemporary,
      expiresAt: isTemporary ? new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000) : undefined,
      file
    });

    return NextResponse.json({ id });
  } catch (error) {
    console.error("KNOWLEDGE API ERROR:", error);
    const message = error instanceof Error ? error.message : "تعذر حفظ مصدر المعرفة.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function normalizeSourceType(value: string, fileValue: FormDataEntryValue | null) {
  const raw = value.trim().toLowerCase();
  const fileName = fileValue instanceof File ? fileValue.name.toLowerCase() : "";
  const byExtension = fileName.endsWith(".pdf")
    ? "pdf"
    : fileName.endsWith(".docx")
      ? "docx"
      : fileName.endsWith(".xlsx") || fileName.endsWith(".xls")
        ? "excel"
        : fileName.endsWith(".csv")
          ? "csv"
          : fileName.endsWith(".json")
            ? "json"
            : fileName.endsWith(".txt")
              ? "txt"
              : "";
  return byExtension || (raw === "auto" ? "custom_text" : raw);
}
