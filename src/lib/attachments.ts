import crypto from "crypto";
import {
  getObjectAccessUrl,
  putTenantObject,
  sanitizeObjectSegment
} from "@/lib/storage/r2";

export type MessageAttachment = {
  id: string;
  type: "image" | "audio" | "file";
  key: string;
  url?: string;
  name: string;
  mimeType: string;
  size: number;
};

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
];
const FILE_TYPES = [
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
];

const allowedMimeTypes = new Set([...IMAGE_TYPES, ...AUDIO_TYPES, ...FILE_TYPES]);

export function getMaxAttachmentBytes() {
  const mb = Number(process.env.R2_MAX_UPLOAD_MB || 10);
  const safeMb = Number.isFinite(mb) && mb > 0 ? mb : 10;
  return safeMb * 1024 * 1024;
}

export function classifyAttachment(mimeType: string): MessageAttachment["type"] {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  return "file";
}

export function validateAttachmentFile(file: File) {
  const maxBytes = getMaxAttachmentBytes();

  if (file.size <= 0) {
    throw new Error("الملف فارغ.");
  }

  if (file.size > maxBytes) {
    throw new Error(`حجم الملف يتجاوز الحد الأقصى ${Math.round(maxBytes / 1024 / 1024)}MB.`);
  }

  if (!allowedMimeTypes.has(file.type)) {
    throw new Error("نوع الملف غير مدعوم.");
  }
}

function sanitizeFilename(name: string) {
  return sanitizeObjectSegment(name, "attachment");
}

export async function uploadConversationAttachment(input: {
  tenantId: string;
  conversationId: string;
  messageId?: string;
  file: File;
}) {
  validateAttachmentFile(input.file);

  const id = crypto.randomUUID();
  const safeName = sanitizeFilename(input.file.name);
  const bytes = Buffer.from(await input.file.arrayBuffer());
  const stored = await putTenantObject({
    tenantId: input.tenantId,
    scope: ["conversations", input.conversationId, input.messageId || "attachments"].join("/"),
    fileName: safeName,
    body: bytes,
    contentType: input.file.type,
    metadata: {
      conversationId: input.conversationId,
      messageId: input.messageId,
      attachmentId: id
    }
  });

  return {
    id,
    type: classifyAttachment(input.file.type),
    key: stored.objectKey,
    url: stored.url,
    name: input.file.name,
    mimeType: input.file.type,
    size: input.file.size,
  } satisfies MessageAttachment;
}

export async function getAttachmentAccessUrl(attachment: MessageAttachment) {
  if (attachment.url) return attachment.url;
  return getObjectAccessUrl(attachment.key);
}

export function describeAttachmentsForAi(attachments: MessageAttachment[] | undefined) {
  if (!attachments?.length) return "";

  return attachments
    .map((attachment) => {
      const typeLabel =
        attachment.type === "image"
          ? "image"
          : attachment.type === "audio"
            ? "audio"
            : "file";
      return `${typeLabel}: ${attachment.name} (${attachment.mimeType}, ${Math.round(attachment.size / 1024)}KB)`;
    })
    .join(", ");
}
