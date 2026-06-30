"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Mic2, Save, Trash2 } from "lucide-react";

type SpeechSettings = {
  enabled: boolean;
  provider: "openai";
  apiKeyConfigured: boolean;
  transcriptionModel: string;
  maxAudioSizeMB: number;
  allowedMimeTypes: string[];
  language: string;
};

const DEFAULT_MIME_TYPES = [
  "audio/ogg",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/m4a",
  "audio/wav",
  "audio/webm",
  "audio/flac",
  "audio/x-m4a"
];

export function SpeechSettingsAdmin() {
  const [settings, setSettings] = useState<SpeechSettings>({
    enabled: false,
    provider: "openai",
    apiKeyConfigured: false,
    transcriptionModel: "whisper-1",
    maxAudioSizeMB: 25,
    allowedMimeTypes: DEFAULT_MIME_TYPES,
    language: "auto"
  });
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/speech-settings", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load settings.");
      setSettings({
        enabled: Boolean(data.enabled),
        provider: "openai",
        apiKeyConfigured: Boolean(data.apiKeyConfigured),
        transcriptionModel: data.transcriptionModel || "whisper-1",
        maxAudioSizeMB: Number(data.maxAudioSizeMB || 25),
        allowedMimeTypes: Array.isArray(data.allowedMimeTypes) && data.allowedMimeTypes.length
          ? data.allowedMimeTypes
          : DEFAULT_MIME_TYPES,
        language: data.language || "auto"
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load settings.");
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/speech-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: settings.enabled,
          provider: "openai",
          apiKey,
          transcriptionModel: settings.transcriptionModel,
          maxAudioSizeMB: settings.maxAudioSizeMB,
          allowedMimeTypes: settings.allowedMimeTypes,
          language: settings.language
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر حفظ إعدادات الصوت.");
      setApiKey("");
      setMessage("تم حفظ إعدادات تفريغ الصوت.");
      await loadSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر حفظ إعدادات الصوت.");
    } finally {
      setSaving(false);
    }
  }

  async function resetSettings() {
    if (!confirm("هل تريد حذف إعدادات تفريغ الصوت؟")) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/speech-settings", { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to reset settings.");
      setMessage("تم حذف إعدادات الصوت.");
      await loadSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset settings.");
    } finally {
      setSaving(false);
    }
  }

  function updateMimeTypes(value: string) {
    setSettings((current) => ({
      ...current,
      allowedMimeTypes: value
        .split(/\n|,/)
        .map((item) => item.trim())
        .filter(Boolean)
    }));
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="callout-error flex items-center gap-2">
          <AlertCircle size={18} /> {error}
        </div>
      ) : null}
      {message ? (
        <div className="callout-success flex items-center gap-2">
          <CheckCircle2 size={18} /> {message}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-200">
            <Mic2 size={22} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-ink">إعدادات تفريغ الصوت</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              يستخدم OpenAI Whisper لتحويل رسائل العملاء الصوتية إلى نص داخل سياق الذكاء الاصطناعي.
            </p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <label className="flex items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <span>
              <span className="block font-semibold text-ink">تفعيل التفريغ الصوتي</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">لن يتم تحليل الصوت إذا كان هذا الخيار متوقفًا.</span>
            </span>
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(event) => setSettings((current) => ({ ...current, enabled: event.target.checked }))}
              className="h-5 w-5 accent-violet-600"
            />
          </label>

          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <p className="font-semibold text-ink">حالة المفتاح</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {settings.apiKeyConfigured ? "مفتاح OpenAI محفوظ. اترك الحقل فارغًا للإبقاء عليه." : "لا يوجد مفتاح محفوظ."}
            </p>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">OpenAI API Key</span>
            <input
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder={settings.apiKeyConfigured ? "اتركه فارغًا للإبقاء على المفتاح الحالي" : "sk-..."}
              className="field"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">النموذج</span>
            <input
              value={settings.transcriptionModel}
              onChange={(event) => setSettings((current) => ({ ...current, transcriptionModel: event.target.value }))}
              className="field"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">أقصى حجم للصوت MB</span>
            <input
              type="number"
              min={1}
              max={100}
              value={settings.maxAudioSizeMB}
              onChange={(event) => setSettings((current) => ({ ...current, maxAudioSizeMB: Number(event.target.value || 25) }))}
              className="field"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">اللغة</span>
            <input
              value={settings.language}
              onChange={(event) => setSettings((current) => ({ ...current, language: event.target.value || "auto" }))}
              placeholder="auto, ar, en"
              className="field"
            />
          </label>

          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm font-semibold text-ink">MIME types المسموحة</span>
            <textarea
              value={settings.allowedMimeTypes.join("\n")}
              onChange={(event) => updateMimeTypes(event.target.value)}
              rows={6}
              className="field"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={saveSettings} disabled={saving} className="btn-primary inline-flex items-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={16} />}
            حفظ الإعدادات
          </button>
          <button onClick={resetSettings} disabled={saving} className="btn-secondary inline-flex items-center gap-2">
            <Trash2 size={16} />
            حذف الإعدادات
          </button>
        </div>
      </section>
    </div>
  );
}
