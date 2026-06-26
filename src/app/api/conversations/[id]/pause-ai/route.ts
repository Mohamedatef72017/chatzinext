import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Conversation } from "@/lib/models";
import { requirePermission } from "@/server/auth/guards";
import { permissions } from "@/server/permissions/permissions";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission(permissions.inboxManage);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    await connectToDatabase();

    const conversation = await Conversation.findOneAndUpdate(
      { _id: id, tenantId: session.user.tenantId },
      {
        $set: {
          aiPaused: true,
          aiPausedReason: body.reason || "manual_pause",
          aiPausedAt: new Date()
        }
      },
      { new: true }
    );

    if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    return NextResponse.json({ ok: true, aiPaused: conversation.aiPaused });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
