import crypto from "crypto";
import { ChannelDocument } from "@/lib/models";
import { decryptSecret } from "@/lib/crypto";
import { logger } from "@/lib/logger";
import { getMaxAttachmentBytes } from "@/lib/attachments";
import { putTenantObject, sanitizeObjectSegment } from "@/lib/storage/r2";
import type { ChannelProvider, NormalizedAttachment } from "./types";

type StoredMessageAttachment = {
  id: string;
  type: "image" | "audio" | "file";
  key?: string;
  url?: string;
  name: string;
  mimeType: string;
  size: number;
};

type RemoteMedia = {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
};

const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
  /^localhost$/i
];

export async function normalizeAndStoreIncomingAttachments(input: {
  tenantId: string;
  conversationId: string;
  provider: ChannelProvider;
  channel: ChannelDocument;
  attachments: NormalizedAttachment[];
}) {
  if (!Array.isArray(input.attachments) || !input.attachments.length) return [];

  const normalized: StoredMessageAttachment[] = [];
  for (const attachment of input.attachments) {
    normalized.push(await normalizeOneAttachment(input, attachment));
  }
  return normalized;
}

async function normalizeOneAttachment(input: {
  tenantId: string;
  conversationId: string;
  provider: ChannelProvider;
  channel: ChannelDocument;
}, attachment: NormalizedAttachment): Promise<StoredMessageAttachment> {
  const fallback = fallbackAttachment(attachment);

  try {
    const media = await resolveRemoteMedia(input.channel, attachment);
    if (!media) return fallback;

    const stored = await putTenantObject({
      tenantId: input.tenantId,
      scope: ["conversations", input.conversationId, "incoming"].join("/"),
      fileName: media.fileName,
      body: media.buffer,
      contentType: media.mimeType,
      metadata: {
        conversationId: input.conversationId,
        provider: input.provider,
        originalUrl: attachment.url,
        originalName: attachment.name || ""
      }
    });

    return {
      id: crypto.randomUUID(),
      type: messageAttachmentType(attachment.type, media.mimeType),
      key: stored.objectKey,
      url: stored.url,
      name: attachment.name || media.fileName,
      mimeType: media.mimeType,
      size: stored.fileSizeBytes
    };
  } catch (error) {
    logger.warn("channel.attachment_normalize_failed", {
      tenantId: input.tenantId,
      conversationId: input.conversationId,
      provider: input.provider,
      url: attachment.url,
      error: error instanceof Error ? error.message : String(error)
    });
    return fallback;
  }
}

function fallbackAttachment(attachment: NormalizedAttachment): StoredMessageAttachment {
  const mimeType = attachment.mimeType || mimeFromType(attachment.type);
  return {
    id: crypto.randomUUID(),
    type: messageAttachmentType(attachment.type, mimeType),
    url: attachment.url,
    name: attachment.name || defaultName(attachment.type, mimeType),
    mimeType,
    size: attachment.size || 0
  };
}

async function resolveRemoteMedia(channel: ChannelDocument, attachment: NormalizedAttachment): Promise<RemoteMedia | null> {
  const url = String(attachment.url || "");
  const dataUrl = String((attachment as any).dataUrl || "");
  if (dataUrl.startsWith("data:")) {
    return mediaFromDataUrl(dataUrl, attachment);
  }

  if (!url) return null;

  if (url.startsWith("meta://media/")) {
    const mediaId = url.replace("meta://media/", "");
    return fetchWhatsAppMedia(channel, mediaId, attachment);
  }

  if (url.startsWith("telegram://file/")) {
    const fileId = url.replace("telegram://file/", "");
    return fetchTelegramMedia(channel, fileId, attachment);
  }

  if (/^https?:\/\//i.test(url)) {
    return fetchBinaryUrl(url, {
      mimeTypeHint: attachment.mimeType,
      fileNameHint: attachment.name || defaultName(attachment.type, attachment.mimeType || "")
    });
  }

  return null;
}

function mediaFromDataUrl(dataUrl: string, attachment: NormalizedAttachment): RemoteMedia {
  const match = dataUrl.match(/^data:([^;,]+)?(;base64)?,([\s\S]+)$/);
  if (!match) throw new Error("Invalid data URL attachment.");
  const mimeType = (attachment.mimeType || match[1] || "application/octet-stream").split(";")[0].trim();
  const isBase64 = Boolean(match[2]);
  const raw = match[3] || "";
  const buffer = isBase64 ? Buffer.from(raw, "base64") : Buffer.from(decodeURIComponent(raw), "utf8");
  const maxBytes = getMaxAttachmentBytes();
  if (buffer.length > maxBytes) throw new Error(`Attachment exceeds ${Math.round(maxBytes / 1024 / 1024)}MB.`);
  return {
    buffer,
    mimeType,
    fileName: attachment.name || defaultName(attachment.type, mimeType)
  };
}

async function fetchWhatsAppMedia(
  channel: ChannelDocument,
  mediaId: string,
  attachment: NormalizedAttachment
) {
  const encryptedToken = channel.config?.accessToken as string | undefined;
  const accessToken = decryptSecret(encryptedToken || "");
  if (!accessToken) throw new Error("WhatsApp access token is not configured.");

  const metaResponse = await fetch(`https://graph.facebook.com/v19.0/${encodeURIComponent(mediaId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!metaResponse.ok) throw new Error(`Unable to resolve WhatsApp media: HTTP ${metaResponse.status}`);

  const meta = await metaResponse.json() as { url?: string; mime_type?: string; file_size?: number };
  if (!meta.url) throw new Error("WhatsApp media URL is missing.");

  return fetchBinaryUrl(meta.url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    mimeTypeHint: attachment.mimeType || meta.mime_type,
    fileNameHint: attachment.name || defaultName(attachment.type, meta.mime_type || "")
  });
}

async function fetchTelegramMedia(
  channel: ChannelDocument,
  fileId: string,
  attachment: NormalizedAttachment
) {
  const encrypted = channel.config?.botTokenEncrypted;
  const token = decryptSecret(typeof encrypted === "string" ? encrypted : "") || process.env.TELEGRAM_BOT_TOKEN || "";
  if (!token) throw new Error("Telegram bot token is not configured.");

  const fileResponse = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`);
  const fileJson = await fileResponse.json().catch(() => ({})) as { ok?: boolean; result?: { file_path?: string } };
  if (!fileResponse.ok || !fileJson.ok || !fileJson.result?.file_path) {
    throw new Error("Unable to resolve Telegram file.");
  }

  return fetchBinaryUrl(`https://api.telegram.org/file/bot${token}/${fileJson.result.file_path}`, {
    mimeTypeHint: attachment.mimeType,
    fileNameHint: attachment.name || fileJson.result.file_path.split("/").pop() || defaultName(attachment.type, attachment.mimeType || "")
  });
}

async function fetchBinaryUrl(url: string, options: {
  headers?: HeadersInit;
  mimeTypeHint?: string;
  fileNameHint?: string;
}): Promise<RemoteMedia> {
  const safeUrl = assertSafeHttpUrl(url);
  const maxBytes = getMaxAttachmentBytes();
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    Number(process.env.ATTACHMENT_FETCH_TIMEOUT_MS || 15_000)
  );

  try {
    const response = await fetch(safeUrl.toString(), {
      headers: options.headers || {},
      redirect: "follow",
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Unable to fetch attachment: HTTP ${response.status}`);

    const length = Number(response.headers.get("content-length") || 0);
    if (length > maxBytes) {
      throw new Error(`Attachment exceeds ${Math.round(maxBytes / 1024 / 1024)}MB.`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("Attachment response body is empty.");

    const chunks: Uint8Array[] = [];
    let total = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value) continue;
        total += value.length;
        if (total > maxBytes) throw new Error(`Attachment exceeds ${Math.round(maxBytes / 1024 / 1024)}MB.`);
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    const mimeType = (options.mimeTypeHint || response.headers.get("content-type") || "application/octet-stream")
      .split(";")[0]
      .trim();
    const fileName = sanitizeObjectSegment(
      options.fileNameHint || filenameFromDisposition(response.headers.get("content-disposition")) || defaultName("other", mimeType),
      "attachment"
    );

    return {
      buffer: Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))),
      mimeType,
      fileName
    };
  } finally {
    clearTimeout(timeout);
  }
}

function assertSafeHttpUrl(rawUrl: string) {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Invalid attachment URL.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP/HTTPS attachment URLs are allowed.");
  }

  if (PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(url.hostname))) {
    throw new Error("Access to private or loopback attachment URLs is not allowed.");
  }

  return url;
}

function filenameFromDisposition(disposition: string | null) {
  if (!disposition) return "";
  const match = disposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
  return match ? decodeURIComponent(match[1].replace(/"$/, "")) : "";
}

function messageAttachmentType(type: NormalizedAttachment["type"], mimeType: string): StoredMessageAttachment["type"] {
  if (type === "image" || mimeType.startsWith("image/")) return "image";
  if (type === "audio" || mimeType.startsWith("audio/")) return "audio";
  return "file";
}

function mimeFromType(type: NormalizedAttachment["type"]) {
  if (type === "image") return "image/jpeg";
  if (type === "audio") return "audio/ogg";
  if (type === "video") return "video/mp4";
  return "application/octet-stream";
}

function defaultName(type: NormalizedAttachment["type"], mimeType: string) {
  const ext = mimeType.includes("/") ? mimeType.split("/")[1].replace("jpeg", "jpg").split(";")[0] : "bin";
  return `${type || "attachment"}.${ext || "bin"}`;
}
