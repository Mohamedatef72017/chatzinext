import { NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guards";
import { permissions } from "@/server/permissions/permissions";
import { deleteKnowledgeAsset } from "@/lib/visual-knowledge";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(permissions.knowledgeManage);
    const { id } = await params;
    const result = await deleteKnowledgeAsset(id, session.user.tenantId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر حذف الصورة.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
