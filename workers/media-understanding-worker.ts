/**
 * media-understanding-worker.ts
 *
 * Background worker that processes image and audio attachments from incoming messages.
 * Runs analysis/transcription and stores results in message.metadata.mediaUnderstanding.
 *
 * This runs asynchronously after the message is stored, so it never blocks
 * the AI reply path. If analysis fails, the conversation continues normally.
 */

import { Worker } from "bullmq";
import { connectToDatabase } from "../src/lib/mongodb";
import { createRedisConnection } from "../src/lib/redis-connection";
import { recordFailedJob } from "../src/lib/job-monitoring";
import { startWorkerHeartbeat } from "../src/lib/worker-heartbeat";
import { logger } from "../src/lib/logger";
import { understandMessageMedia } from "../src/lib/media-understanding";

const workerName = "worker-media-understanding";
const connection = createRedisConnection(workerName);

startWorkerHeartbeat(workerName);

export const mediaUnderstandingWorker = new Worker(
  "media-understanding-queue",
  async (job) => {
    await connectToDatabase();

    const { tenantId, messageId, traceId } = job.data as {
      tenantId: string;
      messageId: string;
      traceId?: string;
    };

    logger.info("job.started", {
      queueName: "media-understanding-queue",
      jobId: job.id,
      tenantId,
      messageId,
      traceId
    });

    const result = await understandMessageMedia(messageId, tenantId);

    const imageCount = result?.images?.filter((img) => !img.error).length ?? 0;
    const audioCount = result?.audios?.filter((audio) => !audio.error).length ?? 0;

    logger.info("media-understanding.completed", {
      tenantId,
      messageId,
      traceId,
      imageCount,
      audioCount
    });

    return { processed: true, imageCount, audioCount };
  },
  {
    connection: connection as any,
    concurrency: Number(process.env.MEDIA_UNDERSTANDING_WORKER_CONCURRENCY || 5),
    lockDuration: Number(process.env.MEDIA_UNDERSTANDING_JOB_LOCK_MS || 60_000)
  }
);

mediaUnderstandingWorker.on("failed", (job, error) => {
  void recordFailedJob("media-understanding-queue", job, error);
});
