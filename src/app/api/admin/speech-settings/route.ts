/**
 * /api/admin/speech-settings
 *
 * Super-admin endpoint for configuring audio transcription (Whisper) settings.
 * GET  — retrieve current settings (API key is masked, never returned in full).
 * POST — create or update settings.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/server/auth/guards";
import { SpeechSetting } from "@/lib/models";
import { connectToDatabase } from "@/lib/mongodb";
import { encryptSecret } from "@/lib/crypto";

const postSchema = z.object({
  enabled: z.boolean(),
  provider: z.literal("openai"),
  /** Send the new key to update; omit or send empty string to keep the existing key. */
  apiKey: z.string().optional(),
  transcriptionModel: z.string().default("whisper-1"),
  maxAudioSizeMB: z.number().int().min(1).max(100).default(25),
  allowedMimeTypes: z.array(z.string()).optional(),
  language: z.string().default("auto")
});

export async function GET() {
  try {
    await requireSuperAdmin();
    await connectToDatabase();

    const settings = await SpeechSetting.findOne({}).lean();

    return NextResponse.json({
      enabled: settings?.enabled ?? false,
      provider: settings?.provider ?? "openai",
      /** Return whether a key is configured — never the key itself */
      apiKeyConfigured: Boolean(settings?.apiKeyEncrypted),
      transcriptionModel: settings?.transcriptionModel ?? "whisper-1",
      maxAudioSizeMB: settings?.maxAudioSizeMB ?? 25,
      allowedMimeTypes: settings?.allowedMimeTypes ?? [],
      language: settings?.language ?? "auto"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load speech settings.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    await requireSuperAdmin();
    const body = postSchema.parse(await request.json());
    await connectToDatabase();

    const existing = await SpeechSetting.findOne({}).lean();

    const updateData: Record<string, unknown> = {
      enabled: body.enabled,
      provider: body.provider,
      transcriptionModel: body.transcriptionModel || "whisper-1",
      maxAudioSizeMB: body.maxAudioSizeMB,
      language: body.language || "auto"
    };

    if (Array.isArray(body.allowedMimeTypes) && body.allowedMimeTypes.length > 0) {
      updateData.allowedMimeTypes = body.allowedMimeTypes;
    }

    const newKey = (body.apiKey || "").trim();
    if (newKey) {
      updateData.apiKeyEncrypted = encryptSecret(newKey);
    } else if (!existing?.apiKeyEncrypted) {
      // No existing key and no new key — refuse if enabling
      if (body.enabled) {
        return NextResponse.json(
          { error: "يجب إدخال مفتاح OpenAI API لتفعيل تفريغ الصوت." },
          { status: 400 }
        );
      }
    }

    if (existing) {
      await SpeechSetting.updateOne({}, { $set: updateData });
    } else {
      await SpeechSetting.create(updateData);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر حفظ إعدادات الصوت.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE() {
  try {
    await requireSuperAdmin();
    await connectToDatabase();
    await SpeechSetting.deleteMany({});
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reset speech settings.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
