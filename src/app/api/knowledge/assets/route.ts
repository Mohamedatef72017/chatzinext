import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/server/auth/guards";
import { permissions } from "@/server/permissions/permissions";
import { createKnowledgeAsset, listKnowledgeAssets } from "@/lib/visual-knowledge";

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
    const form = await request.formData();
    const fields = postSchema.parse({
      botId: form.get("botId"),
      kind: form.get("kind"),
      title: form.get("title"),
      description: form.get("description") || ""
    });
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "الصورة مطلوبة." }, { status: 400 });
    }

    const result = await createKnowledgeAsset({
      tenantId: session.user.tenantId,
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
