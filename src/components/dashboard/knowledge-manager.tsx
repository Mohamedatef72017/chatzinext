"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  DatabaseZap,
  FileSpreadsheet,
  FileText,
  FileUp,
  Gift,
  Image as ImageIcon,
  Loader2,
  Package,
  Save,
  Sparkles,
  Trash2,
  Eye,
  RefreshCcw,
  Beaker,
  Lightbulb,
} from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { KnowledgeDetailsModal } from "./knowledge-details-modal";
import { KnowledgeTestModal } from "./knowledge-test-modal";

type BotRow = {
  id: string;
  name: string;
  knowledgeEnabled: boolean;
  showKnowledgeSources: boolean;
  confidenceDirectThreshold: number;
  confidenceReviewThreshold: number;
  systemPrompt: string;
  autoFollowupEnabled: boolean;
  followupDelayMinutes: number;
  followupMaxAttempts: number;
  autoCloseEnabled: boolean;
  autoCloseAfterMinutes: number;
  autoCloseMessage: string;
};

type CategoryRow = { id: string; name: string };
type CollectionRow = { id: string; categoryId: string; name: string };
type DocumentRow = {
  id: string;
  categoryId?: string;
  title: string;
  sourceType: string;
  status: string;
  statusReason: string;
  tags: string[];
  isTemporary: boolean;
  expiresAt: string;
  chunkCount: number;
  embeddingCount: number;
  needsRetraining: boolean;
  updatedAt: string;
};

type VisualAssetKind = "menu" | "offer" | "product";

type VisualAssetRow = {
  id: string;
  botId: string;
  knowledgeDocumentId: string;
  kind: VisualAssetKind;
  title: string;
  imageUrl: string;
  fileName: string;
  description: string;
  aiSummary: string;
  extractedText: string;
  tags: string[];
  status: string;
  statusReason: string;
  createdAt: string;
};

type KnowledgeManagerProps = {
  bots: BotRow[];
  categories: CategoryRow[];
  collections: CollectionRow[];
  documents: DocumentRow[];
};

const acceptedFileTypes = ".pdf,.docx,.xlsx,.xls,.csv,.txt,.json,application/pdf,application/json,text/plain";
const acceptedImageTypes = "image/jpeg,image/png,image/webp";
const visualAssetKinds: Array<{ id: VisualAssetKind; icon: typeof ImageIcon }> = [
  { id: "menu", icon: FileText },
  { id: "offer", icon: Gift },
  { id: "product", icon: Package }
];

function detectSourceType(file: File | null) {
  if (!file) return "custom_text";
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".docx")) return "docx";
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) return "excel";
  if (name.endsWith(".csv")) return "csv";
  if (name.endsWith(".json")) return "json";
  if (name.endsWith(".txt")) return "txt";
  return "custom_text";
}

function getGlobalHealth(documents: DocumentRow[]) {
  if (!documents.length) return 0;
  const ready = documents.filter((doc) => doc.status === "ready" || doc.status === "duplicate").length;
  const broken = documents.filter((doc) => ["error", "pending", "processing"].includes(doc.status)).length;
  const chunks = documents.reduce((sum, doc) => sum + (doc.chunkCount || 0), 0);
  const embeddings = documents.reduce((sum, doc) => sum + (doc.embeddingCount || 0), 0);
  const readinessScore = (ready / documents.length) * 40;
  const embeddingScore = chunks ? Math.min(1, embeddings / chunks) * 40 : 0;
  const stabilityScore = Math.max(0, 20 - (broken / documents.length) * 20);
  return Math.round(Math.max(0, Math.min(100, readinessScore + embeddingScore + stabilityScore)));
}

function healthTone(score: number) {
  if (score >= 80) return "text-emerald-700 bg-emerald-50 ring-emerald-100";
  if (score >= 50) return "text-amber-700 bg-amber-50 ring-amber-100";
  return "text-red-700 bg-red-50 ring-red-100";
}

function sourceTypeLabel(type: string, isAr: boolean) {
  const labels: Record<string, string> = {
    custom_text: isAr ? "نص مباشر" : "Text",
    pdf: "PDF",
    docx: "Word",
    excel: "Excel",
    csv: "CSV",
    txt: "TXT",
    json: "JSON",
  };
  return labels[type] || type;
}

function statusLabel(status: string, isAr: boolean) {
  const labels: Record<string, string> = {
    pending: isAr ? "قيد الانتظار" : "Pending",
    processing: isAr ? "جاري التدريب" : "Processing",
    ready: isAr ? "جاهز" : "Ready",
    error: isAr ? "خطأ" : "Error",
    duplicate: isAr ? "مكرر" : "Duplicate",
    needs_retraining: isAr ? "يحتاج تدريب" : "Needs retraining",
  };
  return labels[status] || status;
}

function visualKindLabel(kind: VisualAssetKind, isAr: boolean) {
  const labels: Record<VisualAssetKind, { ar: string; en: string }> = {
    menu: { ar: "منيو", en: "Menu" },
    offer: { ar: "عروض", en: "Offers" },
    product: { ar: "منتجات", en: "Products" }
  };
  return isAr ? labels[kind].ar : labels[kind].en;
}

function visualKindHelper(kind: VisualAssetKind, isAr: boolean) {
  if (kind === "menu") {
    return isAr ? "ارفع صورة المنيو وسيحاول الذكاء الاصطناعي استخراج العناصر والأسعار." : "Upload a menu image and AI will extract items and prices.";
  }
  if (kind === "offer") {
    return isAr ? "اكتب تفاصيل العرض بوضوح: السعر، المدة، الشروط، وما يشمله." : "Describe price, duration, terms, and what the offer includes.";
  }
  return isAr ? "اكتب تفاصيل المنتج: الاسم، السعر، المواصفات، التوفر، وأي خيارات." : "Describe name, price, specs, availability, and variants.";
}

export function KnowledgeManager({ bots, categories, documents }: KnowledgeManagerProps) {
  const router = useRouter();
  const { locale } = useI18n();
  const isAr = locale === "ar";

  const [liveDocuments, setLiveDocuments] = useState(documents);
  const [selectedBot, setSelectedBot] = useState(bots[0]?.id || "");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [tags, setTags] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [detailsDocumentId, setDetailsDocumentId] = useState<string | null>(null);
  const [detailsDocumentTitle, setDetailsDocumentTitle] = useState("");
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [processingDocs, setProcessingDocs] = useState<Set<string>>(new Set());
  const [visualAssets, setVisualAssets] = useState<VisualAssetRow[]>([]);
  const [visualKind, setVisualKind] = useState<VisualAssetKind>("menu");
  const [visualTitle, setVisualTitle] = useState("");
  const [visualDescription, setVisualDescription] = useState("");
  const [visualFile, setVisualFile] = useState<File | null>(null);
  const [visualLoading, setVisualLoading] = useState(false);
  const [visualLoadingList, setVisualLoadingList] = useState(false);

  useEffect(() => {
    setLiveDocuments(documents);
  }, [documents]);

  const sourceType = detectSourceType(selectedFile);
  const activeTrainingDocuments = useMemo(
    () => liveDocuments.filter((doc) => ["pending", "processing", "needs_retraining"].includes(doc.status) || doc.needsRetraining),
    [liveDocuments]
  );
  const globalHealth = useMemo(() => getGlobalHealth(liveDocuments), [liveDocuments]);
  const readyCount = liveDocuments.filter((doc) => doc.status === "ready").length;
  const issueCount = liveDocuments.filter((doc) => doc.status === "error" || doc.needsRetraining).length;
  const visualCountByKind = useMemo(() => {
    return visualAssets.reduce<Record<VisualAssetKind, number>>((acc, asset) => {
      acc[asset.kind] += 1;
      return acc;
    }, { menu: 0, offer: 0, product: 0 });
  }, [visualAssets]);
  const selectedVisualKindCount = visualCountByKind[visualKind];
  const selectedVisualKindFull = selectedVisualKindCount >= 5;

  const categoryHealth = useMemo(() => {
    return categories
      .map((category) => {
        const docs = liveDocuments.filter((doc) => doc.categoryId === category.id);
        return { category, docs, score: getGlobalHealth(docs) };
      })
      .filter((item) => item.docs.length > 0)
      .sort((a, b) => b.score - a.score || b.docs.length - a.docs.length);
  }, [categories, liveDocuments]);

  useEffect(() => {
    if (!activeTrainingDocuments.length) return;

    let cancelled = false;

    async function refreshTrainingStatuses() {
      const updates = await Promise.allSettled(
        activeTrainingDocuments.map(async (doc) => {
          const res = await fetch(`/api/knowledge/documents/${doc.id}/status`, { cache: "no-store" });
          if (!res.ok) return null;
          const status = await res.json();
          return {
            id: doc.id,
            status: String(status.status || doc.status),
            statusReason: status.statusReason || "",
            chunkCount: Number(status.chunkCount || 0),
            embeddingCount: Number(status.embeddingCount || 0),
            needsRetraining: Boolean(status.needsRetraining),
          };
        })
      );

      if (cancelled) return;

      const nextById = new Map(
        updates
          .map((result) => (result.status === "fulfilled" ? result.value : null))
          .filter((value): value is Pick<DocumentRow, "id" | "status" | "statusReason" | "chunkCount" | "embeddingCount" | "needsRetraining"> => Boolean(value))
          .map((value) => [value.id, value])
      );

      if (!nextById.size) return;

      setLiveDocuments((current) =>
        current.map((doc) => {
          const update = nextById.get(doc.id);
          return update ? { ...doc, ...update } : doc;
        })
      );
    }

    void refreshTrainingStatuses();
    const interval = window.setInterval(() => void refreshTrainingStatuses(), 3000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [activeTrainingDocuments]);

  useEffect(() => {
    if (!selectedBot) return;
    void loadVisualAssets();
  }, [selectedBot]);

  async function loadVisualAssets() {
    if (!selectedBot) return;
    setVisualLoadingList(true);
    try {
      const res = await fetch(`/api/knowledge/assets?botId=${encodeURIComponent(selectedBot)}`, { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Unable to load assets");
      setVisualAssets(Array.isArray(body.assets) ? body.assets : []);
    } catch {
      setVisualAssets([]);
    } finally {
      setVisualLoadingList(false);
    }
  }

  async function submitVisualAsset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedBot) {
      setError(isAr ? "اختر البوت أولًا." : "Select a bot first.");
      return;
    }
    if (!visualFile) {
      setError(isAr ? "ارفع صورة أولًا." : "Upload an image first.");
      return;
    }
    if (selectedVisualKindFull) {
      setError(isAr ? "وصلت للحد الأقصى 5 صور لهذه الفئة." : "This category already has the maximum 5 images.");
      return;
    }
    if (visualKind !== "menu" && visualDescription.trim().length < 20) {
      setError(isAr ? "الوصف التفصيلي مطلوب للعروض والمنتجات." : "Detailed description is required for offers and products.");
      return;
    }

    setVisualLoading(true);
    try {
      const form = new FormData();
      form.set("botId", selectedBot);
      form.set("kind", visualKind);
      form.set("title", visualTitle.trim() || visualFile.name.replace(/\.[^.]+$/, ""));
      form.set("description", visualDescription);
      form.set("file", visualFile);

      const res = await fetch("/api/knowledge/assets", { method: "POST", body: form });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || (isAr ? "تعذر حفظ الصورة." : "Could not save image."));

      setVisualTitle("");
      setVisualDescription("");
      setVisualFile(null);
      setSuccess(isAr ? "تم حفظ الصورة وتحويلها إلى معرفة قابلة للتدريب." : "Image saved and converted into trainable knowledge.");
      await loadVisualAssets();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : isAr ? "تعذر حفظ الصورة." : "Could not save image.");
    } finally {
      setVisualLoading(false);
    }
  }

  async function deleteVisualAsset(assetId: string) {
    if (!confirm(isAr ? "هل تريد حذف هذه الصورة من المعرفة المرئية؟" : "Delete this visual knowledge image?")) return;
    try {
      const res = await fetch(`/api/knowledge/assets/${assetId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await loadVisualAssets();
    } catch {
      alert(isAr ? "تعذر حذف الصورة" : "Failed to delete image");
    }
  }

  async function handleDelete(docId: string) {
    if (!confirm(isAr ? "هل أنت متأكد من حذف هذا المصدر؟" : "Are you sure you want to delete this source?")) return;
    try {
      const res = await fetch(`/api/knowledge/${docId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert(isAr ? "تعذر الحذف" : "Failed to delete");
    }
  }

  async function handleRewrite(docId: string) {
    try {
      setLoading(true);
      setProcessingDocs(prev => new Set(prev).add(docId));
      const res = await fetch(`/api/knowledge/${docId}/rewrite`, { method: "POST" });
      if (!res.ok) throw new Error();
      setSuccess(isAr ? "بدأت إعادة الصياغة بالذكاء الاصطناعي." : "AI rewrite started.");
      router.refresh();
    } catch {
      setError(isAr ? "تعذر بدء إعادة الصياغة" : "Failed to start rewrite");
    } finally {
      setLoading(false);
      setProcessingDocs(prev => {
        const next = new Set(prev);
        next.delete(docId);
        return next;
      });
    }
  }

  async function handleRetrain(docId: string) {
    try {
      setLoading(true);
      setProcessingDocs(prev => new Set(prev).add(docId));
      const res = await fetch(`/api/knowledge/retrain`, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: docId }) 
      });
      if (!res.ok) throw new Error();
      setSuccess(isAr ? "تم إعادة التدريب بنجاح." : "Retraining completed.");
      router.refresh();
    } catch {
      setError(isAr ? "تعذر بدء التدريب" : "Failed to start training");
    } finally {
      setLoading(false);
      setProcessingDocs(prev => {
        const next = new Set(prev);
        next.delete(docId);
        return next;
      });
    }
  }

  async function handleRetrainAll() {
    try {
      setLoading(true);
      const res = await fetch(`/api/knowledge/retrain`, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId: selectedBot }) 
      });
      if (!res.ok) throw new Error();
      setSuccess(isAr ? "تم إرسال جميع المصادر المتأخرة للتدريب." : "All pending sources sent for retraining.");
      router.refresh();
    } catch {
      setError(isAr ? "تعذر بدء التدريب الشامل" : "Failed to start global training");
    } finally {
      setLoading(false);
    }
  }

  async function submitKnowledge(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedBot) {
      setError(isAr ? "اختر البوت أولًا." : "Select a bot first.");
      return;
    }

    if (!text.trim() && !selectedFile) {
      setError(isAr ? "اكتب محتوى أو ارفع ملف معرفة." : "Write content or upload a knowledge file.");
      return;
    }

    setLoading(true);
    const form = new FormData();
    form.set("botId", selectedBot);
    form.set("title", title.trim() || selectedFile?.name.replace(/\.[^.]+$/, "") || (isAr ? "معرفة جديدة" : "New knowledge"));
    form.set("sourceType", sourceType);
    form.set("categoryName", "تلقائي");
    form.set("collectionName", "عام");
    form.set("tags", tags);
    form.set("text", text);
    form.set("isTemporary", "false");
    if (selectedFile) form.set("file", selectedFile);

    try {
      const response = await fetch("/api/knowledge", { method: "POST", body: form });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || (isAr ? "تعذر حفظ المعرفة." : "Could not save knowledge."));
      setTitle("");
      setText("");
      setTags("");
      setSelectedFile(null);
      setSuccess(isAr ? "تم حفظ المعرفة وبدأ التدريب والتصنيف التلقائي." : "Knowledge saved. Training and auto-classification started.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : isAr ? "تعذر حفظ المعرفة." : "Could not save knowledge.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {success ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p> : null}

      <section className="grid gap-4 lg:grid-cols-4">
        <article className="panel p-4 lg:col-span-2">
          <label className="label flex items-center gap-2"><Bot size={16} /> {isAr ? "البوت" : "Bot"}</label>
          <select className="field" value={selectedBot} onChange={(event) => setSelectedBot(event.target.value)}>
            {bots.map((bot) => <option key={bot.id} value={bot.id}>{bot.name}</option>)}
          </select>
        </article>
        <article className="panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{isAr ? "الصحة العامة" : "Global health"}</p>
            <button type="button" onClick={() => setIsTestModalOpen(true)} className="btn-secondary py-1 text-xs px-2" disabled={!selectedBot}>
              <Beaker size={14} /> {isAr ? "اختبار" : "Test"}
            </button>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <span className={`inline-flex rounded-full px-3 py-1 text-2xl font-bold ring-1 ${healthTone(globalHealth)}`}>{globalHealth}%</span>
            {globalHealth < 60 && (
              <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-md">
                <Lightbulb size={12} /> {isAr ? "ننصح بإضافة ملفات أو إعادة صياغتها" : "Add/rewrite sources to improve"}
              </span>
            )}
          </div>
        </article>
        <article className="panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{isAr ? "المصادر الجاهزة / المشاكل" : "Ready / issues"}</p>
            {issueCount > 0 && (
              <button type="button" onClick={handleRetrainAll} className="btn-secondary py-1 text-xs px-2" disabled={!selectedBot || loading}>
                <DatabaseZap size={14} /> {isAr ? "تدريب الكل" : "Retrain All"}
              </button>
            )}
          </div>
          <p className="mt-2 text-2xl font-bold text-ink">{readyCount} / {issueCount}</p>
        </article>
      </section>

      <form onSubmit={submitKnowledge} className="panel overflow-hidden">
        <div className="border-b border-slate-100 p-5 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary-50 p-2 text-primary-700 dark:bg-primary-950/30 dark:text-primary-300">
                <DatabaseZap size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-ink">{isAr ? "إضافة معرفة دفعة واحدة" : "Add bulk knowledge"}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {isAr
                    ? "اكتب البيانات في المحرر أو ارفع PDF / Word / Excel / JSON وسيتم استخراج النص وتصنيفه تلقائيًا إلى فئات المعرفة."
                    : "Write in the editor or upload PDF / Word / Excel / JSON. The system extracts text and auto-classifies it."}
                </p>
              </div>
            </div>
            <a href="/templates/chatzi-knowledge-template-ar.txt" download className="btn-secondary whitespace-nowrap bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
              <FileText size={16} /> {isAr ? "تحميل نموذج بيانات جاهز 📄" : "Download Template 📄"}
            </a>
          </div>
        </div>

        <div className="grid gap-5 p-5 xl:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <div>
              <label className="label">{isAr ? "العنوان" : "Title"}</label>
              <input
                className="field"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={isAr ? "مثال: بيانات مركز الأسنان والخدمات والأسعار" : "Example: Company services and pricing"}
              />
            </div>
            <div>
              <label className="label flex items-center gap-2"><Sparkles size={16} /> {isAr ? "محرر المعرفة الكبير" : "Large knowledge editor"}</label>
              <textarea
                className="field min-h-[340px] text-sm leading-7"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder={isAr ? "اكتب هنا معلومات النشاط، النبذة، الخدمات، الأسعار، الحجز، السياسات، الأسئلة الشائعة..." : "Write company info, services, pricing, booking rules, policies, FAQ..."}
              />
            </div>
            <div>
              <label className="label">{isAr ? "وسوم اختيارية" : "Optional tags"}</label>
              <input className="field" value={tags} onChange={(event) => setTags(event.target.value)} placeholder={isAr ? "أسنان, حجز, أسعار" : "dental, booking, prices"} />
            </div>
          </div>

          <aside className="space-y-4">
            <label className="flex min-h-[210px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-primary-400 hover:bg-primary-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-primary-950/20">
              <FileUp size={34} className={selectedFile ? "text-primary-700" : "text-slate-400"} />
              {selectedFile ? (
                <span>
                  <span className="block text-sm font-bold text-primary-700">{selectedFile.name}</span>
                  <span className="mt-1 block text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB · {sourceTypeLabel(sourceType, isAr)}</span>
                </span>
              ) : (
                <span>
                  <span className="block text-sm font-bold text-slate-700 dark:text-slate-200">{isAr ? "ارفع ملف معرفة" : "Upload a knowledge file"}</span>
                  <span className="mt-1 block text-xs text-slate-500">PDF, Word, Excel, CSV, TXT, JSON</span>
                </span>
              )}
              <input
                type="file"
                className="hidden"
                accept={acceptedFileTypes}
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  setSelectedFile(file);
                  if (file && !title.trim()) setTitle(file.name.replace(/\.[^.]+$/, ""));
                }}
              />
            </label>

            {selectedFile ? (
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="btn-secondary w-full justify-center text-red-600 hover:bg-red-50"
              >
                <Trash2 size={16} /> {isAr ? "إزالة الملف" : "Remove file"}
              </button>
            ) : null}

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-200">
              {isAr
                ? "التصنيف تلقائي: معلومات النشاط، النبذة، المنتجات، الخدمات، الأسعار، العروض، الشحن، الدفع، السياسات، الدعم، المبيعات، التذاكر."
                : "Auto-classifies into company info, products, services, pricing, offers, shipping, payments, policies, support, sales, and tickets."}
            </div>

            <button type="submit" className="btn-primary w-full justify-center" disabled={loading || !selectedBot}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {isAr ? "حفظ وتدريب المعرفة" : "Save and train"}
            </button>
          </aside>
        </div>
      </form>

      <section className="panel overflow-hidden">
        <div className="border-b border-slate-100 p-5 dark:border-slate-800">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-[#6119E6]/10 p-2 text-[#6119E6] dark:bg-[#E13382]/15 dark:text-[#E13382]">
                <ImageIcon size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-ink">{isAr ? "المعرفة المرئية" : "Visual knowledge"}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {isAr
                    ? "أضف صور منيو، عروض، أو منتجات. المنيو يتم تلخيصه بالذكاء الاصطناعي، والعروض والمنتجات تحتاج وصفًا تفصيليًا."
                    : "Add menu, offer, or product images. Menus are summarized by AI, while offers and products require detailed descriptions."}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              {isAr ? "5 صور لكل فئة" : "5 images per category"}
            </span>
          </div>
        </div>

        <div className="grid gap-5 p-5 xl:grid-cols-[420px_1fr]">
          <form onSubmit={submitVisualAsset} className="space-y-4 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
            <div>
              <label className="label">{isAr ? "نوع الصورة" : "Image type"}</label>
              <div className="grid grid-cols-3 gap-2">
                {visualAssetKinds.map((kind) => {
                  const Icon = kind.icon;
                  const active = visualKind === kind.id;
                  const count = visualCountByKind[kind.id];
                  return (
                    <button
                      key={kind.id}
                      type="button"
                      onClick={() => setVisualKind(kind.id)}
                      className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-lg border p-2 text-center text-xs font-bold transition ${
                        active
                          ? "border-[#6119E6] bg-white text-[#6119E6] shadow-sm dark:border-[#E13382] dark:bg-white/5 dark:text-[#E13382]"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                      }`}
                    >
                      <Icon size={18} />
                      <span>{visualKindLabel(kind.id, isAr)}</span>
                      <span className="text-[11px] text-slate-400">{count}/5</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">{visualKindHelper(visualKind, isAr)}</p>
            </div>

            <div>
              <label className="label">{isAr ? "العنوان" : "Title"}</label>
              <input
                className="field"
                value={visualTitle}
                onChange={(event) => setVisualTitle(event.target.value)}
                placeholder={isAr ? "مثال: منيو الصيف / عرض رمضان / منتج جديد" : "Example: Summer menu / Ramadan offer / New product"}
              />
            </div>

            <label className={`flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-5 text-center transition ${
              visualFile
                ? "border-[#6119E6]/50 bg-white dark:border-[#E13382]/50 dark:bg-slate-950"
                : "border-slate-300 bg-white hover:border-[#6119E6]/50 hover:bg-primary-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-[#E13382]/50"
            }`}>
              <ImageIcon size={32} className={visualFile ? "text-[#6119E6] dark:text-[#E13382]" : "text-slate-400"} />
              {visualFile ? (
                <span>
                  <span className="block text-sm font-bold text-[#6119E6] dark:text-[#E13382]">{visualFile.name}</span>
                  <span className="mt-1 block text-xs text-slate-500">{(visualFile.size / 1024 / 1024).toFixed(2)} MB</span>
                </span>
              ) : (
                <span>
                  <span className="block text-sm font-bold text-slate-700 dark:text-slate-200">{isAr ? "ارفع صورة" : "Upload image"}</span>
                  <span className="mt-1 block text-xs text-slate-500">JPG, PNG, WebP</span>
                </span>
              )}
              <input
                type="file"
                className="hidden"
                accept={acceptedImageTypes}
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  setVisualFile(file);
                  if (file && !visualTitle.trim()) setVisualTitle(file.name.replace(/\.[^.]+$/, ""));
                }}
              />
            </label>

            <div>
              <label className="label">
                {visualKind === "menu"
                  ? isAr ? "ملاحظات اختيارية للمنيو" : "Optional menu hints"
                  : isAr ? "وصف تفصيلي إلزامي" : "Required detailed description"}
              </label>
              <textarea
                className="field min-h-28 text-sm leading-7"
                value={visualDescription}
                onChange={(event) => setVisualDescription(event.target.value)}
                placeholder={
                  visualKind === "menu"
                    ? isAr ? "مثال: الأسعار بالدرهم، هذا منيو الفرع الرئيسي..." : "Example: prices are in AED, this is the main branch menu..."
                    : isAr ? "اكتب السعر، المدة، الشروط، المواصفات، التوفر، وأي تفاصيل لا تظهر بوضوح في الصورة." : "Write price, duration, terms, specs, availability, and any details not visible in the image."
                }
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full justify-center"
              disabled={visualLoading || !selectedBot || !visualFile || selectedVisualKindFull}
            >
              {visualLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {selectedVisualKindFull
                ? isAr ? "وصلت للحد الأقصى" : "Limit reached"
                : isAr ? "حفظ الصورة وتدريبها" : "Save and train image"}
            </button>
          </form>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-ink">{isAr ? "الصور المحفوظة" : "Saved images"}</h3>
              <button type="button" onClick={loadVisualAssets} className="btn-secondary px-3 py-1 text-xs" disabled={visualLoadingList || !selectedBot}>
                {visualLoadingList ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
                {isAr ? "تحديث" : "Refresh"}
              </button>
            </div>

            {visualAssets.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {visualAssets.map((asset) => (
                  <article key={asset.id} className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <div className="grid grid-cols-[110px_1fr]">
                      <img src={asset.imageUrl} alt={asset.title} className="h-full min-h-[150px] w-full object-cover" />
                      <div className="flex min-w-0 flex-col gap-2 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="line-clamp-1 text-sm font-bold text-ink">{asset.title}</p>
                            <p className="text-xs text-slate-500">{visualKindLabel(asset.kind, isAr)}</p>
                          </div>
                          <button type="button" onClick={() => deleteVisualAsset(asset.id)} className="shrink-0 text-slate-400 hover:text-red-600" title={isAr ? "حذف" : "Delete"}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                        <span className={`w-fit rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          asset.status === "ready"
                            ? "bg-emerald-50 text-emerald-700"
                            : asset.status === "error"
                              ? "bg-red-50 text-red-700"
                              : "bg-amber-50 text-amber-700"
                        }`}>
                          {asset.status === "ready" ? (isAr ? "جاهز" : "Ready") : asset.status === "error" ? (isAr ? "خطأ" : "Error") : (isAr ? "جاري المعالجة" : "Processing")}
                        </span>
                        <p className="line-clamp-3 text-xs leading-5 text-slate-600 dark:text-slate-300">
                          {asset.aiSummary || asset.description || asset.statusReason || (isAr ? "لا يوجد ملخص بعد." : "No summary yet.")}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
                {visualLoadingList ? (isAr ? "جاري تحميل الصور..." : "Loading images...") : (isAr ? "لم تتم إضافة صور معرفة بعد." : "No visual knowledge images yet.")}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <article className="panel p-5">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-ink"><CheckCircle2 size={18} /> {isAr ? "صحة الفئات" : "Category health"}</h2>
          <div className="space-y-3">
            {categoryHealth.length ? categoryHealth.map((item) => (
              <div key={item.category.id} className="rounded-lg border border-slate-100 p-3 dark:border-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-ink">{item.category.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ring-1 ${healthTone(item.score)}`}>{item.score}%</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{item.docs.length} {isAr ? "مصدر" : "sources"}</p>
              </div>
            )) : (
              <p className="text-sm text-slate-500">{isAr ? "لا توجد فئات بها مصادر بعد." : "No category sources yet."}</p>
            )}
          </div>
        </article>

        <article className="panel overflow-hidden">
          <div className="border-b border-slate-100 p-4 dark:border-slate-800">
            <h2 className="flex items-center gap-2 font-bold text-ink"><FileText size={18} /> {isAr ? "آخر مصادر المعرفة" : "Latest knowledge sources"}</h2>
          </div>
          {liveDocuments.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  <tr>
                    <th className="p-3 text-right">{isAr ? "المصدر" : "Source"}</th>
                    <th className="p-3 text-right">{isAr ? "النوع" : "Type"}</th>
                    <th className="p-3 text-right">{isAr ? "الحالة" : "Status"}</th>
                    <th className="p-3 text-right">Chunks</th>
                    <th className="p-3 text-right">Embeddings</th>
                    <th className="p-3 text-right">{isAr ? "آخر تحديث" : "Updated"}</th>
                    <th className="p-3 text-right">{isAr ? "الإجراءات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody>
                  {liveDocuments.slice(0, 30).map((doc) => (
                    <tr key={doc.id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="max-w-sm p-3 font-semibold text-ink">
                        <span className="line-clamp-1">{doc.title}</span>
                        {doc.statusReason ? <span className="mt-1 flex items-center gap-1 text-xs text-red-600"><AlertCircle size={12} /> {doc.statusReason}</span> : null}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">
                        <span className="inline-flex items-center gap-1"><FileSpreadsheet size={13} /> {sourceTypeLabel(doc.sourceType, isAr)}</span>
                      </td>
                      <td className="p-3">
                        {processingDocs.has(doc.id) ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                            <Loader2 size={12} className="animate-spin" /> {isAr ? "جاري التدريب..." : "Processing..."}
                          </span>
                        ) : (
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${doc.status === "ready" ? "bg-emerald-50 text-emerald-700" : doc.status === "error" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                            {statusLabel(doc.status, isAr)}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-600">{doc.chunkCount}</td>
                      <td className="p-3 text-slate-600">{doc.embeddingCount}</td>
                      <td className="p-3 text-xs text-slate-500">{doc.updatedAt ? new Date(doc.updatedAt).toLocaleString(isAr ? "ar-EG" : "en-US") : "-"}</td>
                      <td className="p-3 text-right space-x-2 rtl:space-x-reverse">
                        <button type="button" onClick={() => { setDetailsDocumentId(doc.id); setDetailsDocumentTitle(doc.title); }} className="p-1 text-slate-400 hover:text-blue-600" title={isAr ? "التفاصيل" : "Details"}>
                          <Eye size={16} />
                        </button>
                        <button type="button" onClick={() => handleRewrite(doc.id)} disabled={processingDocs.has(doc.id)} className="p-1 text-slate-400 hover:text-amber-600 disabled:opacity-50 disabled:cursor-not-allowed" title={isAr ? "إعادة الصياغة بالذكاء الاصطناعي" : "AI Rewrite"}>
                          <RefreshCcw size={16} />
                        </button>
                        <button type="button" onClick={() => handleRetrain(doc.id)} disabled={processingDocs.has(doc.id)} className="p-1 text-slate-400 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed" title={isAr ? "إجبار إعادة التدريب" : "Force Retrain"}>
                          <DatabaseZap size={16} />
                        </button>
                        <button type="button" onClick={() => handleDelete(doc.id)} disabled={processingDocs.has(doc.id)} className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed" title={isAr ? "حذف" : "Delete"}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-6 text-sm text-slate-500">{isAr ? "لا توجد مصادر معرفة بعد." : "No knowledge sources yet."}</p>
          )}
        </article>
      </section>

      {detailsDocumentId && (
        <KnowledgeDetailsModal
          documentId={detailsDocumentId}
          documentTitle={detailsDocumentTitle}
          onClose={() => setDetailsDocumentId(null)}
        />
      )}
      {isTestModalOpen && selectedBot && (
        <KnowledgeTestModal
          botId={selectedBot}
          onClose={() => setIsTestModalOpen(false)}
        />
      )}
    </div>
  );
}
