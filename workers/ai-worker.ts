import { Worker } from "bullmq";
import { connectToDatabase } from "../src/lib/mongodb";
import { Conversation, Message } from "../src/lib/models";
import { egressQueue, defaultJobOptions, makeQueueJobId } from "../src/lib/queues";
import { createRedisConnection } from "../src/lib/redis-connection";
import { recordFailedJob } from "../src/lib/job-monitoring";
import { startWorkerHeartbeat } from "../src/lib/worker-heartbeat";
import { logger } from "../src/lib/logger";
import { generateAiReply } from "../src/lib/ai";
import {
  buildMediaContextForAi,
  understandMessageMedia,
  type MessageMediaUnderstanding
} from "../src/lib/media-understanding";

const workerName = "worker-ai";
const connection = createRedisConnection(workerName);

startWorkerHeartbeat(workerName);

/** How long to wait for media understanding to complete inline (ms) */
const INLINE_MEDIA_TIMEOUT_MS = Number(process.env.AI_INLINE_MEDIA_TIMEOUT_MS || 10_000);

/**
 * Attempt inline media understanding when background worker hasn't finished yet.
 * Resolves with the understanding result on success, or null on timeout / error.
 * Never throws — media understanding is best-effort and must not break the reply path.
 */
async function attemptInlineMediaUnderstanding(
  messageId: string,
  tenantId: string
): Promise<MessageMediaUnderstanding | null> {
  return Promise.race([
    understandMessageMedia(messageId, tenantId).catch((err) => {
      logger.warn("ai.inline_media_understanding_failed", {
        messageId,
        tenantId,
        error: err instanceof Error ? err.message : String(err)
      });
      return null;
    }),
    new Promise<null>((resolve) =>
      setTimeout(() => {
        logger.warn("ai.inline_media_understanding_timeout", { messageId, tenantId, timeoutMs: INLINE_MEDIA_TIMEOUT_MS });
        resolve(null);
      }, INLINE_MEDIA_TIMEOUT_MS)
    )
  ]);
}

export const aiWorker = new Worker(
  "ai-processing-queue",
  async (job) => {
    await connectToDatabase();
    const { tenantId, conversationId, messageId, botId, provider, traceId } = job.data;
    logger.info("job.started", { queueName: "ai-processing-queue", jobId: job.id, tenantId, conversationId, messageId, traceId });

    const [conversation, message] = await Promise.all([
      Conversation.findOne({ _id: conversationId, tenantId, botId }),
      Message.findOne({ _id: messageId, tenantId, conversationId })
    ]);

    if (!conversation || !message) throw new Error("Conversation or message not found");

    // إعادة تنشيط AI تلقائياً إذا كانت المحادثة محوَّلة بسبب low_knowledge_confidence
    const autoReactivateReasons = ["low_knowledge_confidence", "repeated_question_loop", "max_ai_turns_reached"];
    if (
      (conversation.mode === "human" || conversation.aiPaused) &&
      conversation.status !== "closed" &&
      autoReactivateReasons.includes(conversation.handoffReason || "")
    ) {
      conversation.mode = "ai";
      conversation.aiPaused = false;
      conversation.aiPausedReason = null;
      conversation.aiStatus = "active";
      conversation.aiTurnCount = 0;
      conversation.metadata = {
        ...(conversation.metadata || {}),
        aiPolicy: {
          ...(conversation.metadata?.aiPolicy || {}),
          clarificationCount: 0,
          repeatedUserCount: 0,
          handoffRequested: false,
          reactivatedAt: new Date().toISOString()
        }
      };
      await conversation.save();
      logger.info("ai.auto_reactivated", { tenantId, conversationId, previousReason: conversation.handoffReason, traceId });
    }

    if (conversation.mode === "human" || conversation.aiPaused || conversation.status === "closed") {
      return { generated: false, reason: "ai_paused" };
    }

    const attachments = Array.isArray(message.attachments) ? message.attachments : [];

    // ── Media Understanding ───────────────────────────────────────────────────
    // Preferred path: background worker already processed the attachments.
    let mediaUnderstanding = (message.metadata as any)?.mediaUnderstanding as MessageMediaUnderstanding | undefined;

    // Fallback path: if the background worker has not yet finished (race condition),
    // attempt inline analysis with a bounded timeout so AI still gets media context
    // for the immediate reply rather than silently falling back to plain text.
    if (!mediaUnderstanding && attachments.length > 0) {
      const hasMediaAttachments = attachments.some((att: any) => {
        const type = String(att?.type || att?.mimeType || "");
        return (
          type === "image" || type === "audio" ||
          type.startsWith("image/") || type.startsWith("audio/")
        );
      });

      if (hasMediaAttachments) {
        logger.info("ai.attempting_inline_media_understanding", { messageId, tenantId, traceId });
        mediaUnderstanding = (await attemptInlineMediaUnderstanding(messageId, tenantId)) || undefined;
      }
    }

    const mediaContext = buildMediaContextForAi(mediaUnderstanding);

    // Build the effective message text for the AI:
    // 1. Use media understanding (image description / voice transcript) if available.
    // 2. Fall back to a basic attachment description if understanding not available.
    // 3. Fall back to the message text content.
    let effectiveMessage = message.content || "";
    if (mediaContext) {
      effectiveMessage = mediaContext + (effectiveMessage ? `\n\n${effectiveMessage}` : "");
    } else if (!effectiveMessage && attachments.length) {
      effectiveMessage = describeMessageAttachments(attachments);
    }

    if (!effectiveMessage) {
      effectiveMessage = "أرسل العميل مرفقًا.";
    }
    // ─────────────────────────────────────────────────────────────────────────

    const aiStartedAt = new Date();
    await Message.updateOne(
      { _id: messageId, tenantId, conversationId },
      { $set: { "metadata.trace.aiStartedAt": aiStartedAt.toISOString() } }
    );

    const result = await generateAiReply({
      tenantId,
      botId,
      conversationId,
      externalUserId: conversation.externalUserId,
      channel: provider || conversation.provider || conversation.channel,
      message: effectiveMessage,
      metadata: { traceId, sourceMessageId: messageId, attachments }
    });

    if (!result.reply || !result.messageId) {
      return { generated: false, reason: "empty_reply" };
    }

    await egressQueue.add(
      "prepare-outbound",
      {
        tenantId,
        conversationId,
        messageId: result.messageId,
        provider: provider || conversation.provider || conversation.channel,
        traceId
      },
      {
        ...defaultJobOptions,
        jobId: makeQueueJobId("egress", result.messageId),
        priority: 1
      }
    );

    logger.info("ai.reply_generated", {
      tenantId,
      conversationId,
      messageId: result.messageId,
      traceId,
      aiLatencyMs: Date.now() - aiStartedAt.getTime()
    });
    return { generated: true, messageId: result.messageId };
  },
  {
    connection: connection as any,
    concurrency: Number(process.env.AI_WORKER_CONCURRENCY || 3),
    lockDuration: Number(process.env.AI_JOB_LOCK_DURATION_MS || 90_000),
    stalledInterval: Number(process.env.AI_JOB_STALL_INTERVAL_MS || 45_000)
  }
);

aiWorker.on("failed", (job, error) => {
  void recordFailedJob("ai-processing-queue", job, error);
});

function describeMessageAttachments(attachments: any[]) {
  if (!attachments.length) return "";
  const summary = attachments
    .map((attachment) => {
      const type = attachment?.type || attachment?.mimeType || "ملف";
      const name = attachment?.name ? ` (${attachment.name})` : "";
      if (type === "image" || String(type).startsWith("image/")) return `أرسل العميل صورة${name}`;
      if (type === "audio" || String(type).startsWith("audio/")) return `أرسل العميل رسالة صوتية${name}`;
      if (type === "video" || String(type).startsWith("video/")) return `أرسل العميل فيديو${name}`;
      return `أرسل العميل مرفقًا${name}`;
    })
    .join("، ");
  return summary;
}
