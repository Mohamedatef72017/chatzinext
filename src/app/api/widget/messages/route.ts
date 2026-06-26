import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Conversation, Message } from "@/lib/models";
import { connectToDatabase } from "@/lib/mongodb";

const querySchema = z.object({
  botId: z.string().min(1),
  conversationId: z.string().min(1),
  visitorId: z.string().min(1),
  after: z.string().optional(),
  waitMs: z.coerce.number().min(0).max(15_000).optional(),
  intervalMs: z.coerce.number().min(100).max(1_000).optional(),
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findOutgoingMessages(input: {
  tenantId: unknown;
  conversationId: unknown;
  afterDate: Date;
}) {
  return Message.find({
    tenantId: input.tenantId,
    conversationId: input.conversationId,
    direction: "outgoing",
    senderType: { $in: ["assistant", "agent", "system"] },
    createdAt: { $gte: input.afterDate },
  })
    .sort({ createdAt: 1 })
    .limit(10)
    .lean();
}

function serializeMessages(messages: any[]) {
  return messages.map((message) => ({
    id: message._id.toString(),
    content: message.content,
    createdAt: message.createdAt?.toISOString?.() || new Date().toISOString(),
    deliveryStatus: message.deliveryStatus || "queued",
  }));
}

export async function GET(request: NextRequest) {
  try {
    const query = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));
    await connectToDatabase();
    const conversation = await Conversation.findOne({
      _id: query.conversationId,
      botId: query.botId,
      externalUserId: query.visitorId,
      status: { $in: ["open", "pending", "snoozed", "resolved"] },
    }).select("_id tenantId").lean();
    if (!conversation) return NextResponse.json({ messages: [] });

    const afterDate = query.after ? new Date(query.after) : new Date(Date.now() - 60_000);
    const safeAfterDate = Number.isNaN(afterDate.getTime()) ? new Date(Date.now() - 60_000) : afterDate;
    const waitMs = query.waitMs ?? 0;
    const intervalMs = query.intervalMs ?? 250;
    const deadline = Date.now() + waitMs;

    let messages = await findOutgoingMessages({
      tenantId: conversation.tenantId,
      conversationId: conversation._id,
      afterDate: safeAfterDate,
    });

    while (!messages.length && Date.now() < deadline) {
      await sleep(Math.min(intervalMs, Math.max(0, deadline - Date.now())));
      messages = await findOutgoingMessages({
        tenantId: conversation.tenantId,
        conversationId: conversation._id,
        afterDate: safeAfterDate,
      });
    }

    return NextResponse.json({
      messages: serializeMessages(messages),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load messages" }, { status: 400 });
  }
}
