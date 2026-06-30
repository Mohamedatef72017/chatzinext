/**
 * media-understanding.ts
 *
 * Unified layer for understanding media attachments (images and audio) sent by customers.
 * Handles image vision analysis and audio transcription (Whisper).
 *
 * Design principles:
 * - Failures are non-fatal: if media understanding fails, the conversation continues.
 * - Results are cached in message.metadata.mediaUnderstanding to avoid duplicate analysis.
 * - SSRF protection: URLs are validated before fetching.
 * - Security: API keys are never exposed; encrypted keys are decrypted inline only.
 * - All analysis is asynchronous and does not block the AI reply path.
 */

import crypto from "crypto";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { connectToDatabase } from "@/lib/mongodb";
import { AiProvider, Message, SpeechSetting } from "@/lib/models";
import { decryptSecret } from "@/lib/crypto";
import { logger } from "@/lib/logger";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MediaUnderstandingResult {
  type: "image" | "audio";
  url: string;
  /** SHA-256 of the media content for deduplication */
  contentHash?: string;
  /** Human-readable description / transcript */
  understanding: string;
  /** ISO timestamp of when the analysis was performed */
  analyzedAt: string;
  /** Provider used (e.g. "openai", "gemini") */
  provider: string;
  /** Transcription model used (for audio) */
  model?: string;
  error?: string;
}

export interface MessageMediaUnderstanding {
  images?: MediaUnderstandingResult[];
  audios?: MediaUnderstandingResult[];
  processedAt: string;
}

// ─── Configuration ────────────────────────────────────────────────────────────

const MAX_IMAGE_BYTES = Number(process.env.MEDIA_UNDERSTANDING_MAX_IMAGE_MB || 10) * 1024 * 1024;
const MAX_AUDIO_BYTES = Number(process.env.MEDIA_UNDERSTANDING_MAX_AUDIO_MB || 25) * 1024 * 1024;
const FETCH_TIMEOUT_MS = Number(process.env.MEDIA_UNDERSTANDING_FETCH_TIMEOUT_MS || 15_000);

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/bmp"
]);

const ALLOWED_AUDIO_TYPES = new Set([
  "audio/ogg", "audio/mpeg", "audio/mp3", "audio/mp4",
  "audio/m4a", "audio/wav", "audio/webm", "audio/flac",
  "audio/x-m4a", "audio/ogg; codecs=opus"
]);

// ─── SSRF Protection ──────────────────────────────────────────────────────────

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

function assertSafeUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Invalid media URL.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP/HTTPS URLs are allowed for media.");
  }

  const hostname = url.hostname;
  if (PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(hostname))) {
    throw new Error("Access to private or loopback addresses is not allowed.");
  }

  return url;
}

// ─── Utility ──────────────────────────────────────────────────────────────────

async function fetchMediaBytes(url: string, maxBytes: number): Promise<{ buffer: Buffer; mimeType: string }> {
  const safeUrl = assertSafeUrl(url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(safeUrl.toString(), {
      signal: controller.signal,
      headers: { "User-Agent": "ChatZi-MediaUnderstanding/1.0" }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch media: HTTP ${response.status}`);
    }

    // Early rejection using Content-Length header to avoid reading the body at all
    const contentLengthHeader = response.headers.get("content-length");
    if (contentLengthHeader) {
      const contentLength = parseInt(contentLengthHeader, 10);
      if (!isNaN(contentLength) && contentLength > maxBytes) {
        controller.abort();
        throw new Error(
          `Media file too large (${Math.round(contentLength / 1024 / 1024)} MB, max ${Math.round(maxBytes / 1024 / 1024)} MB).`
        );
      }
    }

    const contentType = response.headers.get("content-type") || "";
    const mimeType = contentType.split(";")[0].trim();

    // Stream the body and cut off early if the byte limit is exceeded,
    // rather than loading the full payload into memory first.
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Failed to read media response body.");
    }

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          totalBytes += value.length;
          if (totalBytes > maxBytes) {
            controller.abort();
            throw new Error(
              `Media file too large (>${Math.round(maxBytes / 1024 / 1024)} MB limit).`
            );
          }
          chunks.push(value);
        }
      }
    } finally {
      reader.releaseLock();
    }

    const buffer = Buffer.concat(chunks.map((c) => Buffer.from(c)));
    return { buffer, mimeType };
  } finally {
    clearTimeout(timeout);
  }
}

function contentHash(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 16);
}

// ─── Image Analysis ───────────────────────────────────────────────────────────

const IMAGE_ANALYSIS_PROMPT = [
  "Analyze this image sent by a customer in a support chat.",
  "Describe what you see concisely and helpfully for the support context:",
  "- What is shown in the image?",
  "- Are there any text, prices, product names, errors, receipts, or order details visible?",
  "- What is the customer likely trying to communicate or ask about?",
  "Be factual and brief. Do not invent details not visible in the image.",
  "Respond in the same language the image text uses (Arabic or English)."
].join("\n");

/**
 * Analyze an image from a URL using the configured AI vision provider.
 * Returns a description suitable for inclusion in AI context.
 */
export async function analyzeImageFromUrl(
  url: string,
  mimeTypeHint?: string
): Promise<Pick<MediaUnderstandingResult, "understanding" | "provider" | "contentHash">> {
  const { buffer, mimeType: fetchedMime } = await fetchMediaBytes(url, MAX_IMAGE_BYTES);
  const resolvedMime = mimeTypeHint || fetchedMime;

  if (!ALLOWED_IMAGE_TYPES.has(resolvedMime.split(";")[0].trim())) {
    throw new Error(`Unsupported image type: ${resolvedMime}`);
  }

  const hash = contentHash(buffer);
  const base64 = buffer.toString("base64");

  await connectToDatabase();
  const providers = await AiProvider.find({ isActive: true }).sort({ priority: 1 }).lean();

  for (const provider of providers) {
    const providerId = String(provider.providerId || "");
    const apiKey = decryptSecret(provider.apiKeyEncrypted) || "";
    if (!apiKey && providerId !== "ollama") continue;

    try {
      if (providerId === "gemini") {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: provider.defaultModel || "gemini-1.5-flash" });
        const result = await model.generateContent([
          IMAGE_ANALYSIS_PROMPT,
          { inlineData: { mimeType: resolvedMime, data: base64 } }
        ]);
        const text = result.response.text().trim();
        if (text.length > 10) {
          return { understanding: text, provider: "gemini", contentHash: hash };
        }
      }

      if (["openai", "openrouter", "xai", "groq"].includes(providerId)) {
        const baseURL =
          providerId === "openrouter" ? "https://openrouter.ai/api/v1" :
          providerId === "xai" ? "https://api.x.ai/v1" :
          providerId === "groq" ? "https://api.groq.com/openai/v1" :
          provider.baseUrl || undefined;

        const client = new OpenAI({ apiKey: apiKey || "ollama", baseURL });
        const response = await client.chat.completions.create({
          model: provider.defaultModel || (providerId === "openai" ? "gpt-4o-mini" : "openai/gpt-4o-mini"),
          max_tokens: 800,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: IMAGE_ANALYSIS_PROMPT },
                { type: "image_url", image_url: { url: `data:${resolvedMime};base64,${base64}` } }
              ] as any
            }
          ]
        } as any);

        const text = (response.choices[0]?.message?.content || "").trim();
        if (text.length > 10) {
          return { understanding: text, provider: providerId, contentHash: hash };
        }
      }
    } catch (err) {
      logger.warn("media-understanding.image_provider_failed", {
        provider: providerId,
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }

  throw new Error("No AI vision provider available to analyze the image.");
}

// ─── Audio Transcription ──────────────────────────────────────────────────────

/**
 * Transcribe an audio file from a URL using OpenAI Whisper.
 * Speech settings must be enabled and configured via super-admin panel.
 */
export async function transcribeAudioFromUrl(
  url: string,
  mimeTypeHint?: string
): Promise<Pick<MediaUnderstandingResult, "understanding" | "provider" | "model" | "contentHash">> {
  await connectToDatabase();

  const settings = await SpeechSetting.findOne({}).lean();
  if (!settings?.enabled) {
    throw new Error("Audio transcription is not enabled. Enable it in the admin settings.");
  }

  const apiKey = decryptSecret(settings.apiKeyEncrypted || "") || "";
  if (!apiKey) {
    throw new Error("OpenAI API key for audio transcription is not configured.");
  }

  const maxBytes = (settings.maxAudioSizeMB || 25) * 1024 * 1024;
  const { buffer, mimeType: fetchedMime } = await fetchMediaBytes(url, Math.min(maxBytes, MAX_AUDIO_BYTES));
  const resolvedMime = mimeTypeHint || fetchedMime;

  const normalizedMime = resolvedMime.split(";")[0].trim();
  // Admin-configured allowedMimeTypes is authoritative when set.
  // If the admin has not configured any types (empty list or absent), fall back to the global defaults.
  const adminConfiguredTypes = settings.allowedMimeTypes?.length
    ? settings.allowedMimeTypes
    : [...ALLOWED_AUDIO_TYPES];
  const allowedTypes = new Set(adminConfiguredTypes.map((m) => m.split(";")[0].trim()));
  if (!allowedTypes.has(normalizedMime)) {
    throw new Error(`Audio type '${normalizedMime}' is not allowed. Allowed: ${[...allowedTypes].join(", ")}`);
  }

  const hash = contentHash(buffer);
  const model = settings.transcriptionModel || "whisper-1";
  const language = settings.language === "auto" ? undefined : settings.language;

  // Determine file extension for OpenAI (required by its API)
  const ext = mimeToAudioExt(normalizedMime);
  const file = new File([buffer], `audio.${ext}`, { type: normalizedMime });

  const client = new OpenAI({ apiKey });
  const transcript = await client.audio.transcriptions.create({
    file,
    model,
    ...(language ? { language } : {})
  });

  const text = (transcript.text || "").trim();
  if (!text) {
    throw new Error("Whisper returned an empty transcription.");
  }

  return {
    understanding: text,
    provider: "openai",
    model,
    contentHash: hash
  };
}

function mimeToAudioExt(mimeType: string): string {
  const map: Record<string, string> = {
    "audio/ogg": "ogg",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/mp4": "mp4",
    "audio/m4a": "m4a",
    "audio/x-m4a": "m4a",
    "audio/wav": "wav",
    "audio/webm": "webm",
    "audio/flac": "flac"
  };
  return map[mimeType] || "ogg";
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

/**
 * Process all media attachments for a given incoming message.
 * Updates `message.metadata.mediaUnderstanding` and saves the message.
 *
 * This is called by the media-understanding background worker.
 * Failures are logged but do not throw — the conversation must continue.
 */
export async function understandMessageMedia(
  messageId: string,
  tenantId: string
): Promise<MessageMediaUnderstanding | null> {
  await connectToDatabase();

  const message = await Message.findOne({ _id: messageId, tenantId }).lean();
  if (!message) {
    logger.warn("media-understanding.message_not_found", { messageId, tenantId });
    return null;
  }

  // Skip if already analyzed
  if ((message.metadata as any)?.mediaUnderstanding?.processedAt) {
    return (message.metadata as any).mediaUnderstanding as MessageMediaUnderstanding;
  }

  const attachments = Array.isArray(message.attachments) ? message.attachments : [];
  if (!attachments.length) return null;

  const images: MediaUnderstandingResult[] = [];
  const audios: MediaUnderstandingResult[] = [];

  for (const attachment of attachments) {
    const url = attachment?.url;
    const rawType = String(attachment?.mimeType || attachment?.type || "");
    const attachmentType = String(attachment?.type || "");

    if (!url) continue;

    // Determine whether this is an image or audio attachment.
    // Many channel adapters set `type` to "image" or "audio" (not a real MIME type),
    // so we check both the generic category and the MIME string.
    const isImageCategory =
      attachmentType === "image" ||
      rawType.startsWith("image/") ||
      ALLOWED_IMAGE_TYPES.has(rawType.split(";")[0].trim());

    const isAudioCategory =
      attachmentType === "audio" ||
      rawType.startsWith("audio/") ||
      ALLOWED_AUDIO_TYPES.has(rawType.split(";")[0].trim());

    const isImage = isImageCategory;
    const isAudio = isAudioCategory;

    // Resolve the MIME type hint to pass to the analyzer.
    // If rawType is a non-MIME generic (e.g. "image" or "audio"), do not pass it
    // as a hint — let the fetch Content-Type take precedence instead.
    const mimeType = rawType.includes("/") ? rawType : undefined;

    if (isImage) {
      try {
        const result = await analyzeImageFromUrl(url, mimeType || undefined);
        images.push({
          type: "image",
          url,
          understanding: result.understanding,
          provider: result.provider,
          contentHash: result.contentHash,
          analyzedAt: new Date().toISOString()
        });
        logger.info("media-understanding.image_analyzed", { messageId, tenantId, provider: result.provider });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.warn("media-understanding.image_failed", { messageId, tenantId, url, error: errorMessage });
        images.push({
          type: "image",
          url,
          understanding: "",
          provider: "none",
          analyzedAt: new Date().toISOString(),
          error: errorMessage
        });
      }
    } else if (isAudio) {
      try {
        const result = await transcribeAudioFromUrl(url, mimeType || undefined);
        audios.push({
          type: "audio",
          url,
          understanding: result.understanding,
          provider: result.provider,
          model: result.model,
          contentHash: result.contentHash,
          analyzedAt: new Date().toISOString()
        });
        logger.info("media-understanding.audio_transcribed", { messageId, tenantId, model: result.model });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.warn("media-understanding.audio_failed", { messageId, tenantId, url, error: errorMessage });
        audios.push({
          type: "audio",
          url,
          understanding: "",
          provider: "none",
          analyzedAt: new Date().toISOString(),
          error: errorMessage
        });
      }
    }
  }

  if (!images.length && !audios.length) return null;

  const mediaUnderstanding: MessageMediaUnderstanding = {
    images: images.length ? images : undefined,
    audios: audios.length ? audios : undefined,
    processedAt: new Date().toISOString()
  };

  // Store on the message — safe to fail, non-critical
  await Message.updateOne(
    { _id: messageId, tenantId },
    { $set: { "metadata.mediaUnderstanding": mediaUnderstanding } }
  ).catch((err) => {
    logger.warn("media-understanding.save_failed", {
      messageId,
      tenantId,
      error: err instanceof Error ? err.message : String(err)
    });
  });

  return mediaUnderstanding;
}

// ─── AI Context Builder ───────────────────────────────────────────────────────

/**
 * Build a human-readable text block from media understanding results.
 * This is injected into the AI prompt so the bot knows what the customer shared.
 */
export function buildMediaContextForAi(understanding: MessageMediaUnderstanding | null | undefined): string {
  if (!understanding) return "";

  const lines: string[] = [];

  if (understanding.images?.length) {
    const analyzed = understanding.images.filter((img) => img.understanding && !img.error);
    if (analyzed.length) {
      lines.push("[Media: Customer sent image(s)]");
      for (const img of analyzed) {
        lines.push(`Image analysis: ${img.understanding}`);
      }
    }
  }

  if (understanding.audios?.length) {
    const transcribed = understanding.audios.filter((audio) => audio.understanding && !audio.error);
    if (transcribed.length) {
      lines.push("[Media: Customer sent voice message(s)]");
      for (const audio of transcribed) {
        lines.push(`Voice transcription: "${audio.understanding}"`);
      }
    }
  }

  return lines.join("\n");
}
