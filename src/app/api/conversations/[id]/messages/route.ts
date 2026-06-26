import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guards";
import { permissions } from "@/server/permissions/permissions";
import { shouldScopeToAssignedConversations } from "@/server/permissions/effective";
import { listMessagesForConversation } from "@/lib/conversations-data";
import { sendInboxReply } from "@/lib/inbox/service";
import { z } from "zod";

const messageSchema = z.object({
  content: z.string().optional().default(""),
  attachments: z.array(z.any()).optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(permissions.inboxRead);
    const { id } = await params;
    const assignedOnly = shouldScopeToAssignedConversations(session.user.permissions);
    const { searchParams } = new URL(request.url);
    const rawLimit = searchParams.get("limit") || "120";
    const limit = Number(rawLimit);
    if (!Number.isFinite(limit) || limit < 1) {
      return NextResponse.json({ error: "Invalid limit parameter" }, { status: 400 });
    }

    const since = searchParams.get("since") || undefined;
    if (since) {
      const sinceDate = new Date(since);
      if (Number.isNaN(sinceDate.getTime())) {
        return NextResponse.json({ error: "Invalid since parameter" }, { status: 400 });
      }
    }

    const messages = await listMessagesForConversation(session.user.tenantId, id, {
      limit,
      since,
      userId: session.user.id,
      assignedOnly,
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error loading messages:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(permissions.inboxReply);
    const { id } = await params;
    const assignedOnly = shouldScopeToAssignedConversations(session.user.permissions);
    const body = await request.json();
    
    const parsed = messageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const content = parsed.data.content.trim();
    const attachments = parsed.data.attachments || [];
    if (!content && !attachments.length) {
      return NextResponse.json({ error: "Message content or attachment is required" }, { status: 400 });
    }

    const message = await sendInboxReply({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      conversationId: id,
      content: content || "مرفق",
      attachments,
      assignedOnly
    });

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
