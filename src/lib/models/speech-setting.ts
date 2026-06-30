import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

/**
 * SpeechSetting — Global configuration for audio transcription (Whisper).
 * Stored as a singleton document (one record for the entire system).
 * Managed exclusively by super-admin via /api/admin/speech-settings.
 */
const speechSettingSchema = new Schema(
  {
    /** Whether audio transcription is globally enabled */
    enabled: { type: Boolean, default: false },

    /** AI provider for transcription (currently only OpenAI Whisper is supported) */
    provider: { type: String, enum: ["openai"], default: "openai" },

    /** Encrypted OpenAI API key used for Whisper — never exposed to the frontend */
    apiKeyEncrypted: { type: String, default: "" },

    /** Whisper model ID */
    transcriptionModel: { type: String, default: "whisper-1" },

    /** Maximum audio file size in MB that will be accepted */
    maxAudioSizeMB: { type: Number, default: 25, min: 1, max: 100 },

    /**
     * Allowed MIME types for audio files.
     * OpenAI Whisper supports: mp3, mp4, mpeg, mpga, m4a, wav, webm, ogg, flac
     */
    allowedMimeTypes: {
      type: [String],
      default: [
        "audio/ogg",
        "audio/mpeg",
        "audio/mp3",
        "audio/mp4",
        "audio/m4a",
        "audio/wav",
        "audio/webm",
        "audio/flac",
        "audio/x-m4a",
        "audio/ogg; codecs=opus"
      ]
    },

    /**
     * Language hint for Whisper.
     * "auto" = let Whisper detect automatically (recommended).
     * Use ISO-639-1 codes (e.g. "ar", "en") to force a language.
     */
    language: { type: String, default: "auto" }
  },
  { timestamps: true }
);

export type SpeechSettingDocument = InferSchemaType<typeof speechSettingSchema>;
export const SpeechSetting =
  (models.SpeechSetting as Model<SpeechSettingDocument>) ||
  model("SpeechSetting", speechSettingSchema);
