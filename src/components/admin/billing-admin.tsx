"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Save, Archive, Copy, Edit2, ChevronDown, ChevronUp,
  Trash2, CheckCircle, XCircle, Eye, EyeOff, Star, DollarSign,
  Gift, Settings, BarChart3, History, ShieldCheck, RefreshCw
} from "lucide-react";
import { FEATURE_REGISTRY } from "@/lib/billing/feature-registry";

type PlanFeature = {
  key: string;
  type: "boolean" | "quota" | "count" | "storage" | "metered";
  enabled?: boolean;
  limit?: number;
  resetPeriod?: "monthly" | "yearly" | "never";
  overageAllowed?: boolean;
  unit?: string;
};

type PlanRow = {
  id: string;
  name: string;
  slug?: string;
  interval: string;
  priceCents: number;
  currency: string;
  aiMessageLimit: number;
  stripePriceId: string;
  isPopular: boolean;
  isActive: boolean;
  isArchived?: boolean;
  isHidden?: boolean;
  version?: number;
  features?: PlanFeature[];
};

type PackRow = {
  id: string;
  name: string;
  messageCredits: number;
  priceCents: number;
  currency: string;
  stripePriceId: string;
  sortOrder: number;
  isActive: boolean;
};

const BUILT_IN_FEATURES = Object.values(FEATURE_REGISTRY);

export function BillingAdmin({ plans, packs }: { plans: PlanRow[]; packs: PackRow[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"plans" | "packs" | "audit" | "history" | "overrides">("plans");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [planList, setPlanList] = useState(plans);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<PlanRow | null>(null);
  const [grantModal, setGrantModal] = useState(false);

  function flash(type: "ok" | "err", msg: string) {
    if (type === "ok") { setSuccess(msg); setError(""); }
    else { setError(msg); setSuccess(""); }
    setTimeout(() => { setSuccess(""); setError(""); }, 4000);
  }

  async function apiCall(path: string, method: string, body?: unknown): Promise<any> {
    const res = await fetch(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "خطأ غير متوقع");
    return data;
  }

  async function createPlan(form: HTMLFormElement) {
    const data = new FormData(form);
    const body: Record<string, unknown> = {};
    for (const [k, v] of data.entries()) body[k] = v;
    body.priceCents = Math.round(Number(body.price || 0) * 100);
    delete body.price;
    body.aiMessageLimit = Number(body.aiMessageLimit) || 0;
    body.isActive = data.get("isActive") === "on";
    body.isPopular = data.get("isPopular") === "on";
    body.isHidden = data.get("isHidden") === "on";

    // Auto-add ai_messages feature
    body.features = [
      {
        key: "ai_messages",
        type: "quota",
        limit: body.aiMessageLimit,
        resetPeriod: "monthly",
        unit: "message"
      }
    ];

    try {
      await apiCall("/api/admin/billing/plans", "POST", body);
      flash("ok", "تم إنشاء الخطة بنجاح.");
      form.reset();
      router.refresh();
    } catch (e: any) { flash("err", e.message); }
  }

  async function clonePlan(id: string) {
    try {
      await apiCall(`/api/admin/billing/plans/${id}/clone`, "POST");
      flash("ok", "تم استنساخ الخطة.");
      router.refresh();
    } catch (e: any) { flash("err", e.message); }
  }

  async function archivePlan(id: string, name: string) {
    if (!confirm(`هل أنت متأكد من أرشفة خطة "${name}"؟ لن تظهر للمستأجرين الجدد.`)) return;
    try {
      await apiCall(`/api/admin/billing/plans/${id}`, "DELETE");
      setPlanList(prev => prev.filter(p => p.id !== id));
      flash("ok", "تم أرشفة الخطة.");
    } catch (e: any) { flash("err", e.message); }
  }

  async function togglePlan(id: string, field: "isActive" | "isPopular" | "isHidden", current: boolean) {
    try {
      await apiCall(`/api/admin/billing/plans/${id}`, "PATCH", { [field]: !current });
      setPlanList(prev => prev.map(p => p.id === id ? { ...p, [field]: !current } : p));
    } catch (e: any) { flash("err", e.message); }
  }

  async function saveFeature(planId: string, feature: PlanFeature) {
    try {
      await apiCall(`/api/admin/billing/plans/${planId}/features`, "PATCH", feature);
      flash("ok", "تم حفظ الميزة.");
      router.refresh();
    } catch (e: any) { flash("err", e.message); }
  }

  async function removeFeature(planId: string, key: string) {
    if (!confirm(`حذف الميزة "${key}" من الخطة؟`)) return;
    try {
      await apiCall(`/api/admin/billing/plans/${planId}/features?key=${key}`, "DELETE");
      flash("ok", "تم حذف الميزة.");
      router.refresh();
    } catch (e: any) { flash("err", e.message); }
  }

  async function createPack(form: HTMLFormElement) {
    const data = new FormData(form);
    const body: Record<string, unknown> = {};
    for (const [k, v] of data.entries()) body[k] = v;
    body.priceCents = Math.round(Number(body.price || 0) * 100);
    delete body.price;
    body.messageCredits = Number(body.messageCredits) || 0;
    body.sortOrder = Number(body.sortOrder) || 0;
    body.isActive = data.get("isActive") === "on";
    try {
      await apiCall("/api/admin/billing/packs", "POST", body);
      flash("ok", "تم حفظ الباقة.");
      form.reset();
      router.refresh();
    } catch (e: any) { flash("err", e.message); }
  }

  async function grantCredits(form: HTMLFormElement) {
    const data = new FormData(form);
    try {
      await apiCall("/api/admin/billing/credits", "POST", {
        tenantId: data.get("tenantId"),
        credits: Number(data.get("credits")),
        description: data.get("description")
      });
      flash("ok", "تم منح الرصيد بنجاح.");
      setGrantModal(false);
    } catch (e: any) { flash("err", e.message); }
  }

  return (
    <div className="space-y-4">
      {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">{error}</p> : null}
      {success ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">{success}</p> : null}

      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        {(["plans", "packs", "audit", "history", "overrides"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${tab === t ? "bg-white dark:bg-slate-900 border border-b-white dark:border-slate-700 dark:border-b-slate-900 text-violet-600" : "text-slate-500 hover:text-ink"}`}>
            {t === "plans" ? "الخطط" : t === "packs" ? "باقات الرسائل" : t === "audit" ? "سجل التدقيق" : t === "history" ? "سجل الاشتراكات" : "تجاوزات الصلاحيات"}
          </button>
        ))}
        <button onClick={() => setGrantModal(true)}
          className="ms-auto flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">
          <Gift size={15} /> منح رصيد
        </button>
      </div>

      {/* ── PLANS TAB ── */}
      {tab === "plans" && (
        <div className="space-y-4">
          <CreatePlanForm onSubmit={createPlan} />
          <div className="space-y-3">
            {planList.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                expanded={expandedPlan === plan.id}
                onToggleExpand={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                onClone={() => clonePlan(plan.id)}
                onArchive={() => archivePlan(plan.id, plan.name)}
                onToggle={(field, cur) => togglePlan(plan.id, field, cur)}
                onSaveFeature={(f) => saveFeature(plan.id, f)}
                onRemoveFeature={(key) => removeFeature(plan.id, key)}
              />
            ))}
            {planList.length === 0 && (
              <p className="panel p-6 text-sm text-slate-500">لا توجد خطط. أضف خطة أدناه.</p>
            )}
          </div>
        </div>
      )}

      {/* ── PACKS TAB ── */}
      {tab === "packs" && (
        <div className="space-y-4">
          <form className="panel p-5" onSubmit={e => { e.preventDefault(); createPack(e.currentTarget); }}>
            <div className="mb-4 flex items-center gap-2">
              <Plus size={18} className="text-coral" />
              <h2 className="text-lg font-bold text-ink">إضافة باقة رسائل إضافية</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field name="name" label="اسم الباقة" required />
              <Field name="messageCredits" label="عدد الرسائل" type="number" required />
              <Field name="price" label="السعر" type="number" step="0.01" required />
              <Field name="currency" label="العملة" defaultValue="usd" />
              <Field name="stripePriceId" label="Stripe Price ID" />
              <Field name="sortOrder" label="الترتيب" type="number" defaultValue="0" />
              <div className="flex items-end pb-2">
                <CheckField name="isActive" label="مفعل" defaultChecked />
              </div>
            </div>
            <button className="btn-primary mt-4"><Save size={16} /> حفظ الباقة</button>
          </form>
        </div>
      )}

      {/* ── AUDIT TAB ── */}
      {tab === "audit" && <AuditLogPanel />}

      {/* ── SUBSCRIPTION HISTORY TAB ── */}
      {tab === "history" && <SubscriptionHistoryPanel />}

      {/* ── ENTITLEMENT OVERRIDES TAB ── */}
      {tab === "overrides" && <EntitlementOverridesPanel onFlash={flash} />}

      {/* ── GRANT MODAL ── */}
      {grantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="mb-4 text-lg font-bold text-ink">منح رصيد رسائل</h3>
            <form onSubmit={e => { e.preventDefault(); grantCredits(e.currentTarget); }} className="space-y-3">
              <Field name="tenantId" label="Tenant ID" required />
              <Field name="credits" label="عدد الرسائل" type="number" required />
              <Field name="description" label="السبب (اختياري)" />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1">منح الرصيد</button>
                <button type="button" onClick={() => setGrantModal(false)} className="btn-secondary flex-1">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function CreatePlanForm({ onSubmit }: { onSubmit: (f: HTMLFormElement) => void }) {
  return (
    <form className="panel p-5" onSubmit={e => { e.preventDefault(); onSubmit(e.currentTarget); }}>
      <div className="mb-4 flex items-center gap-2">
        <Plus size={18} className="text-accent" />
        <h2 className="text-lg font-bold text-ink">إضافة خطة جديدة</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field name="name" label="اسم الخطة" required />
        <Field name="price" label="السعر" type="number" step="0.01" required />
        <Field name="aiMessageLimit" label="حد رسائل AI" type="number" required />
        <div>
          <label className="label">الفترة</label>
          <select className="field" name="interval" defaultValue="month">
            <option value="month">شهري</option>
            <option value="year">سنوي</option>
          </select>
        </div>
        <Field name="currency" label="العملة" defaultValue="usd" />
        <Field name="stripePriceId" label="Stripe Price ID" />
        <div className="xl:col-span-2">
          <label className="label">الوصف</label>
          <input className="field" name="description" />
        </div>
        <div className="flex flex-wrap items-end gap-4 pb-2">
          <CheckField name="isActive" label="مفعل" defaultChecked />
          <CheckField name="isPopular" label="مميزة" />
          <CheckField name="isHidden" label="مخفية" />
        </div>
      </div>
      <button className="btn-primary mt-4"><Save size={16} /> حفظ الخطة</button>
    </form>
  );
}

function PlanCard({
  plan, expanded, onToggleExpand, onClone, onArchive, onToggle, onSaveFeature, onRemoveFeature
}: {
  plan: PlanRow;
  expanded: boolean;
  onToggleExpand: () => void;
  onClone: () => void;
  onArchive: () => void;
  onToggle: (field: "isActive" | "isPopular" | "isHidden", cur: boolean) => void;
  onSaveFeature: (f: PlanFeature) => void;
  onRemoveFeature: (key: string) => void;
}) {
  const [addFeatureKey, setAddFeatureKey] = useState("");
  const [addFeatureType, setAddFeatureType] = useState<PlanFeature["type"]>("boolean");
  const [addLimit, setAddLimit] = useState(0);
  const [addEnabled, setAddEnabled] = useState(false);
  const [addReset, setAddReset] = useState<"monthly" | "yearly" | "never">("monthly");

  function handleAddFeature() {
    if (!addFeatureKey) return;
    const meta = FEATURE_REGISTRY[addFeatureKey];
    const feature: PlanFeature = {
      key: addFeatureKey,
      type: addFeatureType,
      enabled: addEnabled,
      limit: addLimit,
      resetPeriod: addReset,
      unit: meta?.unit ?? ""
    };
    onSaveFeature(feature);
    setAddFeatureKey("");
  }

  const statusColor = plan.isActive && !plan.isArchived
    ? "bg-emerald-100 text-emerald-700"
    : "bg-slate-100 text-slate-500";

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" onClick={onToggleExpand}>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-ink">{plan.name}</span>
            {plan.version ? <span className="text-xs text-slate-400">v{plan.version}</span> : null}
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor}`}>
              {plan.isArchived ? "مؤرشفة" : plan.isActive ? "نشطة" : "معطلة"}
            </span>
            {plan.isPopular && <span className="rounded-full bg-coral/10 px-2 py-0.5 text-xs font-semibold text-coral">مميزة</span>}
            {plan.isHidden && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">مخفية</span>}
            <span className="text-sm text-slate-500">{plan.interval === "month" ? "شهري" : "سنوي"}</span>
            <span className="text-sm font-semibold text-ink">{(plan.priceCents / 100).toFixed(2)} {plan.currency.toUpperCase()}</span>
            <span className="text-xs text-slate-400">{plan.aiMessageLimit} رسالة AI</span>
          </div>
          {plan.features?.length ? (
            <p className="mt-1 text-xs text-slate-400">{plan.features.length} ميزة محددة</p>
          ) : (
            <p className="mt-1 text-xs text-amber-500">⚠ لا توجد ميزات — أضف ميزات لهذه الخطة</p>
          )}
        </div>
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <ActionBtn icon={<Copy size={14} />} title="استنساخ" onClick={onClone} />
          <ActionBtn icon={plan.isActive ? <XCircle size={14} /> : <CheckCircle size={14} />}
            title={plan.isActive ? "تعطيل" : "تفعيل"}
            onClick={() => onToggle("isActive", plan.isActive)} />
          <ActionBtn icon={plan.isPopular ? <Star size={14} className="fill-current" /> : <Star size={14} />}
            title={plan.isPopular ? "إلغاء التمييز" : "تمييز"}
            onClick={() => onToggle("isPopular", plan.isPopular)} />
          <ActionBtn icon={plan.isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
            title={plan.isHidden ? "إظهار" : "إخفاء"}
            onClick={() => onToggle("isHidden", plan.isHidden ?? false)} />
          {!plan.isArchived && (
            <ActionBtn icon={<Archive size={14} />} title="أرشفة" onClick={onArchive} className="text-red-500 hover:bg-red-50" />
          )}
        </div>
        {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </div>

      {expanded && (
        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <h4 className="mb-3 font-semibold text-ink flex items-center gap-2"><Settings size={15} /> الميزات</h4>

          {/* Existing features */}
          {plan.features?.length ? (
            <div className="mb-4 space-y-2">
              {plan.features.map(f => (
                <FeatureRow key={f.key} feature={f} onSave={onSaveFeature} onRemove={() => onRemoveFeature(f.key)} />
              ))}
            </div>
          ) : (
            <p className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
              هذه الخطة لا تحتوي على ميزات بعد. أضف ميزات حتى يعمل نظام الصلاحيات بشكل صحيح.
            </p>
          )}

          {/* Add feature form */}
          <div className="rounded-md border border-dashed border-slate-300 p-3 dark:border-slate-700">
            <h5 className="mb-3 text-sm font-semibold text-slate-600 dark:text-slate-400">إضافة ميزة</h5>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="label text-xs">الميزة</label>
                <select className="field text-sm" value={addFeatureKey} onChange={e => {
                  const key = e.target.value;
                  setAddFeatureKey(key);
                  const meta = FEATURE_REGISTRY[key];
                  if (meta) {
                    setAddFeatureType(meta.type);
                    setAddReset(meta.resetPeriod);
                  }
                }}>
                  <option value="">اختر ميزة...</option>
                  {BUILT_IN_FEATURES.map(f => (
                    <option key={f.key} value={f.key}>{f.name} ({f.key})</option>
                  ))}
                  <option value="__custom">ميزة مخصصة...</option>
                </select>
              </div>
              {addFeatureKey === "__custom" && (
                <div>
                  <label className="label text-xs">مفتاح مخصص</label>
                  <input className="field text-sm" placeholder="custom_feature" onChange={e => setAddFeatureKey(e.target.value)} />
                </div>
              )}
              <div>
                <label className="label text-xs">النوع</label>
                <select className="field text-sm" value={addFeatureType} onChange={e => setAddFeatureType(e.target.value as PlanFeature["type"])}>
                  <option value="boolean">Boolean (تفعيل/تعطيل)</option>
                  <option value="quota">Quota (حصة دورية)</option>
                  <option value="count">Count (عدد)</option>
                  <option value="storage">Storage (تخزين)</option>
                  <option value="metered">Metered (مقاس)</option>
                </select>
              </div>
              {addFeatureType === "boolean" ? (
                <div className="flex items-end pb-1">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input type="checkbox" checked={addEnabled} onChange={e => setAddEnabled(e.target.checked)} className="h-4 w-4" />
                    مفعّلة
                  </label>
                </div>
              ) : (
                <>
                  <div>
                    <label className="label text-xs">الحد</label>
                    <input type="number" className="field text-sm" value={addLimit} onChange={e => setAddLimit(Number(e.target.value))} min={0} />
                  </div>
                  <div>
                    <label className="label text-xs">إعادة التعيين</label>
                    <select className="field text-sm" value={addReset} onChange={e => setAddReset(e.target.value as any)}>
                      <option value="monthly">شهري</option>
                      <option value="yearly">سنوي</option>
                      <option value="never">لا يُعاد</option>
                    </select>
                  </div>
                </>
              )}
            </div>
            <button onClick={handleAddFeature}
              className="mt-3 flex items-center gap-1 rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700">
              <Plus size={14} /> إضافة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FeatureRow({
  feature, onSave, onRemove
}: { feature: PlanFeature; onSave: (f: PlanFeature) => void; onRemove: () => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(feature);
  const meta = FEATURE_REGISTRY[feature.key];

  if (!editing) {
    return (
      <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/50">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-slate-400">{feature.key}</span>
          <span className="font-medium text-ink">{meta?.name ?? feature.key}</span>
          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">{feature.type}</span>
          {feature.type === "boolean"
            ? <span className={`text-xs ${feature.enabled ? "text-emerald-600" : "text-slate-400"}`}>{feature.enabled ? "✓ مفعّل" : "✗ معطل"}</span>
            : <span className="text-xs text-ink">{feature.limit?.toLocaleString()} {meta?.unit ?? feature.unit ?? ""}</span>
          }
          {feature.resetPeriod && feature.resetPeriod !== "never" && (
            <span className="text-xs text-slate-400">/ {feature.resetPeriod === "monthly" ? "شهر" : "سنة"}</span>
          )}
        </div>
        <div className="flex gap-1">
          <ActionBtn icon={<Edit2 size={13} />} title="تعديل" onClick={() => setEditing(true)} />
          <ActionBtn icon={<Trash2 size={13} />} title="حذف" onClick={onRemove} className="text-red-500 hover:bg-red-50" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-violet-200 bg-violet-50 p-3 dark:border-violet-800 dark:bg-violet-950/20">
      <div className="grid gap-2 sm:grid-cols-3">
        {val.type === "boolean" ? (
          <label className="flex items-center gap-2 text-sm col-span-2">
            <input type="checkbox" checked={val.enabled} onChange={e => setVal(v => ({ ...v, enabled: e.target.checked }))} />
            {meta?.name ?? val.key} مفعّل
          </label>
        ) : (
          <>
            <div>
              <label className="label text-xs">الحد</label>
              <input type="number" className="field text-sm" value={val.limit ?? 0}
                onChange={e => setVal(v => ({ ...v, limit: Number(e.target.value) }))} min={0} />
            </div>
            <div>
              <label className="label text-xs">إعادة التعيين</label>
              <select className="field text-sm" value={val.resetPeriod ?? "never"}
                onChange={e => setVal(v => ({ ...v, resetPeriod: e.target.value as any }))}>
                <option value="monthly">شهري</option>
                <option value="yearly">سنوي</option>
                <option value="never">لا يُعاد</option>
              </select>
            </div>
          </>
        )}
      </div>
      <div className="mt-2 flex gap-2">
        <button className="btn-primary text-xs py-1 px-3" onClick={() => { onSave(val); setEditing(false); }}>
          <Save size={13} /> حفظ
        </button>
        <button className="btn-secondary text-xs py-1 px-3" onClick={() => { setVal(feature); setEditing(false); }}>
          إلغاء
        </button>
      </div>
    </div>
  );
}

function SubscriptionHistoryPanel() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [tenantFilter, setTenantFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 50;

  async function load(p = 1, tid = tenantFilter) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
      if (tid.trim()) params.set("tenantId", tid.trim());
      const res = await fetch(`/api/admin/billing/subscriptions/history?${params}`);
      const data = await res.json();
      setLogs(data.history ?? []);
      setTotal(data.total ?? 0);
      setPage(p);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }

  const statusColor: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    trialing: "bg-blue-100 text-blue-700",
    past_due: "bg-amber-100 text-amber-700",
    canceled: "bg-red-100 text-red-600",
  };

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
        <h2 className="flex items-center gap-2 text-lg font-bold text-ink"><History size={18} /> سجل الاشتراكات</h2>
        <input
          className="field w-56 text-sm"
          placeholder="Tenant ID (اختياري)"
          value={tenantFilter}
          onChange={e => setTenantFilter(e.target.value)}
        />
        <button className="btn-secondary text-sm" onClick={() => load(1)} disabled={loading}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {loading ? "جاري..." : "تحميل"}
        </button>
        {loaded && <span className="ms-auto text-xs text-slate-500">{total} سجل إجمالي</span>}
      </div>
      {loaded && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-right font-medium">Tenant</th>
                  <th className="px-4 py-3 text-right font-medium">الخطة</th>
                  <th className="px-4 py-3 text-right font-medium">الانتقال</th>
                  <th className="px-4 py-3 text-right font-medium">من → إلى</th>
                  <th className="px-4 py-3 text-right font-medium">المنفذ</th>
                  <th className="px-4 py-3 text-right font-medium">الوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.length === 0 && (
                  <tr><td colSpan={6} className="p-5 text-center text-slate-500">لا توجد سجلات.</td></tr>
                )}
                {logs.map((log: any, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 max-w-[140px] truncate">{String(log.tenantId)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-ink">{log.planName || "-"}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">{log.transition}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs">
                        {log.fromStatus ? <span className={`rounded-full px-2 py-0.5 font-semibold ${statusColor[log.fromStatus] ?? "bg-slate-100 text-slate-600"}`}>{log.fromStatus}</span> : null}
                        {log.fromStatus ? <span className="text-slate-400">→</span> : null}
                        <span className={`rounded-full px-2 py-0.5 font-semibold ${statusColor[log.toStatus] ?? "bg-slate-100 text-slate-600"}`}>{log.toStatus}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{log.actor}{log.actorId ? ` (${String(log.actorId).slice(0, 8)})` : ""}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(log.createdAt).toLocaleString("ar-EG")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > LIMIT && (
            <div className="flex items-center justify-center gap-3 border-t border-slate-100 p-3 dark:border-slate-800">
              <button className="btn-secondary text-xs" onClick={() => load(page - 1)} disabled={page <= 1 || loading}>السابق</button>
              <span className="text-xs text-slate-500">صفحة {page} من {Math.ceil(total / LIMIT)}</span>
              <button className="btn-secondary text-xs" onClick={() => load(page + 1)} disabled={page >= Math.ceil(total / LIMIT) || loading}>التالي</button>
            </div>
          )}
        </>
      )}
      {!loaded && !loading && (
        <p className="p-6 text-center text-sm text-slate-500">اضغط "تحميل" لعرض سجل الاشتراكات.</p>
      )}
    </div>
  );
}

function EntitlementOverridesPanel({ onFlash }: { onFlash: (t: "ok" | "err", m: string) => void }) {
  const [tenantId, setTenantId] = useState("");
  const [key, setKey] = useState("");
  const [valueType, setValueType] = useState<"number" | "boolean">("number");
  const [numValue, setNumValue] = useState(0);
  const [boolValue, setBoolValue] = useState(true);
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);

  const FEATURE_OPTIONS = Object.values(FEATURE_REGISTRY).map(f => ({ key: f.key, name: f.name, type: f.type }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId.trim() || !key.trim()) return onFlash("err", "Tenant ID والمفتاح مطلوبان.");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/billing/entitlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tenantId.trim(),
          key: key.trim(),
          value: valueType === "boolean" ? boolValue : numValue,
          expiresAt: expiresAt || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطأ غير متوقع");
      onFlash("ok", `تم تطبيق التجاوز على "${key}" للمستأجر.`);
      setTenantId(""); setKey(""); setNumValue(0); setBoolValue(true); setExpiresAt("");
    } catch (e: any) {
      onFlash("err", e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="panel p-5">
      <div className="mb-5 flex items-center gap-2">
        <ShieldCheck size={18} className="text-violet-500" />
        <h2 className="text-lg font-bold text-ink">تجاوز صلاحية مستأجر</h2>
      </div>
      <p className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
        يُستخدم لتخصيص حدود خطة معينة لمستأجر بعينه دون تغيير الخطة الأصلية. يُطبَّق فوراً ويُخزَّن في Entitlement collection.
      </p>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Tenant ID <span className="text-red-500">*</span></label>
            <input className="field" value={tenantId} onChange={e => setTenantId(e.target.value)} placeholder="ObjectId الخاص بالمستأجر" required />
          </div>
          <div>
            <label className="label">الميزة <span className="text-red-500">*</span></label>
            <select className="field" value={key} onChange={e => {
              const k = e.target.value;
              setKey(k);
              const meta = FEATURE_REGISTRY[k];
              if (meta) setValueType(meta.type === "boolean" ? "boolean" : "number");
            }}>
              <option value="">اختر ميزة...</option>
              {FEATURE_OPTIONS.map(f => (
                <option key={f.key} value={f.key}>{f.name} ({f.key})</option>
              ))}
              <option value="__custom">مفتاح مخصص</option>
            </select>
            {key === "__custom" && (
              <input className="field mt-2 text-sm" placeholder="مفتاح مخصص" onChange={e => setKey(e.target.value)} />
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="label">نوع القيمة</label>
            <select className="field" value={valueType} onChange={e => setValueType(e.target.value as any)}>
              <option value="number">رقم (حد)</option>
              <option value="boolean">منطقي (تفعيل/تعطيل)</option>
            </select>
          </div>
          {valueType === "number" ? (
            <div>
              <label className="label">القيمة</label>
              <input type="number" className="field" value={numValue} onChange={e => setNumValue(Number(e.target.value))} min={0} />
            </div>
          ) : (
            <div className="flex items-end pb-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={boolValue} onChange={e => setBoolValue(e.target.checked)} className="h-4 w-4" />
                مفعّل
              </label>
            </div>
          )}
          <div>
            <label className="label">تنتهي في (اختياري)</label>
            <input type="datetime-local" className="field text-sm" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="flex items-center gap-2 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50">
          <ShieldCheck size={16} />
          {saving ? "جاري الحفظ..." : "تطبيق التجاوز"}
        </button>
      </form>
    </div>
  );
}

function AuditLogPanel() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/billing/audit");
      const data = await res.json();
      setLogs(data.logs ?? []);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
        <h2 className="flex items-center gap-2 text-lg font-bold text-ink"><BarChart3 size={18} /> سجل تدقيق الفوترة</h2>
        <button className="btn-secondary text-sm" onClick={load} disabled={loading}>
          {loading ? "جاري التحميل..." : "تحميل السجل"}
        </button>
      </div>
      {loaded && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-right font-medium">الإجراء</th>
                <th className="px-4 py-3 text-right font-medium">المنفذ</th>
                <th className="px-4 py-3 text-right font-medium">الهدف</th>
                <th className="px-4 py-3 text-right font-medium">الوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.length === 0 && (
                <tr><td colSpan={4} className="p-5 text-center text-slate-500">لا توجد سجلات.</td></tr>
              )}
              {logs.map((log: any, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-mono text-xs text-violet-700 dark:text-violet-400">{log.action}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{log.actorEmail || log.actorId}</td>
                  <td className="px-4 py-3 text-slate-500">{log.targetType}: {log.targetId}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{new Date(log.createdAt).toLocaleString("ar-EG")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loaded && !loading && (
        <p className="p-6 text-center text-sm text-slate-500">اضغط "تحميل السجل" لعرض إجراءات الإدارة.</p>
      )}
    </div>
  );
}

function ActionBtn({
  icon, title, onClick, className = ""
}: { icon: React.ReactNode; title: string; onClick: () => void; className?: string }) {
  return (
    <button onClick={onClick} title={title}
      className={`rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 ${className}`}>
      {icon}
    </button>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  const { label, ...rest } = props;
  return (
    <div>
      <label className="label">{label}</label>
      <input className="field" {...rest} />
    </div>
  );
}

function CheckField({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
      <input name={name} type="checkbox" defaultChecked={defaultChecked} className="h-4 w-4" />
      {label}
    </label>
  );
}
