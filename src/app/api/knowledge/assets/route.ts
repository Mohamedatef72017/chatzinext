import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/server/auth/guards";
import { permissions } from "@/server/permissions/permissions";
import { createKnowledgeAsset, listKnowledgeAssets } from "@/lib/visual-knowledge";
import { KnowledgeDocument, KnowledgeAsset } from "@/lib/models";
import { connectToDatabase } from "@/lib/mongodb";
import { isFeatureEnabled, checkFeatureLimit } from "@/lib/billing/entitlement-engine";
import { FEATURE_KEYS } from "@/lib/billing/feature-registry";

const querySchema = z.object({
  botId: z.string().optional()
});

const postSchema = z.object({
  botId: z.string().min(1),
  kind: z.enum(["menu", "offer", "product"]),
  title: z.string().min(2).max(140),
  description: z.string().optional().default("")
});

export async function GET(request: Request) {
  try {
    const session = await requirePermission(permissions.knowledgeRead);
    const url = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(url.searchParams.entries()));
    const assets = await listKnowledgeAssets(session.user.tenantId, query.botId);
    return NextResponse.json({ assets });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load visual knowledge.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requirePermission(permissions.knowledgeManage);
    const tenantId = session.user.tenantId;
    await connectToDatabase();

    // ── Parse form data first — needed to compute projected storage ──────────
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "الصورة مطلوبة." }, { status: 400 });
    }

    const incomingBytes = file.size;

    // ── Plan limit checks ──────────────────────────────────────────────────────
    const knowledgeEnabled = await isFeatureEnabled(tenantId, FEATURE_KEYS.KNOWLEDGE_ENABLED);
    if (!knowledgeEnabled) {
      return NextResponse.json(
        { error: "قاعدة المعرفة غير مفعّلة في باقتك الحالية. يرجى الترقية للوصول إلى هذه الميزة." },
        { status: 403 }
      );
    }

    // Count total knowledge files and storage against unified plan quota
    const [currentDocCount, currentAssetCount, docStorageAgg, assetStorageAgg] = await Promise.all([
      KnowledgeDocument.countDocuments({ tenantId }),
      KnowledgeAsset.countDocuments({ tenantId }),
      KnowledgeDocument.aggregate([{ $match: { tenantId } }, { $group: { _id: null, totalBytes: { $sum: "$sizeBytes" } } }]),
      KnowledgeAsset.aggregate([{ $match: { tenantId } }, { $group: { _id: null, totalBytes: { $sum: "$sizeBytes" } } }])
    ]);

    const totalKnowledgeItems = currentDocCount + currentAssetCount;
    const fileCheck = await checkFeatureLimit(tenantId, FEATURE_KEYS.MAX_KNOWLEDGE_FILES, totalKnowledgeItems);
    if (!fileCheck.allowed) {
      return NextResponse.json(
        { error: `لقد وصلت إلى الحد الأقصى لملفات المعرفة في باقتك (${fileCheck.limit} ملف). احذف بعض الملفات أو قم بالترقية.` },
        { status: 403 }
      );
    }

    // Check projected storage including the incoming image file size
    const currentStorageBytes = (docStorageAgg[0]?.totalBytes || 0) + (assetStorageAgg[0]?.totalBytes || 0);
    const projectedStorageMB = Math.ceil((currentStorageBytes + incomingBytes) / (1024 * 1024));
    const storageCheck = await checkFeatureLimit(tenantId, FEATURE_KEYS.KNOWLEDGE_STORAGE_MB, projectedStorageMB);
    if (!storageCheck.allowed) {
      return NextResponse.json(
        { error: `هذه الصورة ستتجاوز الحد الأقصى لمساحة التخزين في باقتك (${storageCheck.limit} MB). احذف بعض الملفات أو قم بالترقية.` },
        { status: 403 }
      );
    }
    // ──────────────────────────────────────────────────────────────────────────

    const fields = postSchema.parse({
      botId: form.get("botId"),
      kind: form.get("kind"),
      title: form.get("title"),
      description: form.get("description") || ""
    });

    const result = await createKnowledgeAsset({
      tenantId,
      botId: fields.botId,
      kind: fields.kind,
      title: fields.title,
      description: fields.description,
      file
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر حفظ الصورة.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
