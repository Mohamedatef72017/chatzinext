"use client";

import { useState } from "react";
import { CreditCard, AlertTriangle, CheckCircle, Clock, Zap } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";

type PlanFeature = {
  key: string;
  type: "boolean" | "quota" | "count" | "storage" | "metered";
  enabled?: boolean;
  limit?: number;
  resetPeriod?: string;
  unit?: string;
};

type BillingItem = {
  id: string;
  name: string;
  priceCents: number;
  currency: string;
  isActive: boolean;
  interval?: string;
  aiMessageLimit?: number | null;
  messageCredits?: number;
  isPopular?: boolean;
  features?: PlanFeature[];
  description?: string;
};

type Subscription = {
  status: string;
  monthlyMessageLimit: number;
  usedMessages: number;
  extraMessageCredits: number;
  planName?: string;
  currentPeriodEnd?: string;
  trialEndsAt?: string | null;
  graceEndsAt?: string | null;
  cancelAtPeriodEnd?: boolean;
};

const copy = {
  ar: {
    credits: "استهلاك AI",
    manage: "إدارة الاشتراك",
    status: "الحالة",
    used: "المستخدم",
    available: "المتاح",
    plans: "الخطط الأساسية",
    packs: "زيادة رسائل AI",
    popular: "الأكثر اختيارًا",
    currentPlan: "الخطة الحالية",
    subscribe: "اشترك",
    buyPack: "شراء الباقة",
    redirecting: "جاري التحويل...",
    month: "شهر",
    year: "سنة",
    aiReply: "رد AI",
    extraMessage: "رسالة إضافية",
    trial: "فترة تجريبية",
    trialEnds: "تنتهي التجربة في",
    grace: "فترة السماح",
    graceEnds: "تنتهي فترة السماح في",
    cancelAtEnd: "سيُلغى عند انتهاء الدورة",
    pastDue: "دفعة متأخرة — يرجى تحديث طريقة الدفع",
    features: "المميزات",
    unlimited: "غير محدود",
    manageLoading: "جاري التحويل...",
    checkoutError: "تعذر بدء الدفع.",
    portalError: "تعذر فتح بوابة الدفع"
  },
  en: {
    credits: "AI Usage",
    manage: "Manage subscription",
    status: "Status",
    used: "Used",
    available: "Available",
    plans: "Base plans",
    packs: "Extra AI messages",
    popular: "Most selected",
    currentPlan: "Current plan",
    subscribe: "Subscribe",
    buyPack: "Buy pack",
    redirecting: "Redirecting...",
    month: "month",
    year: "year",
    aiReply: "AI replies",
    extraMessage: "extra messages",
    trial: "Trial",
    trialEnds: "Trial ends",
    grace: "Grace period",
    graceEnds: "Grace ends",
    cancelAtEnd: "Cancels at period end",
    pastDue: "Payment overdue — please update your payment method",
    features: "Features",
    unlimited: "Unlimited",
    manageLoading: "Redirecting...",
    checkoutError: "Unable to start checkout.",
    portalError: "Unable to open billing portal"
  }
} as const;

export function BillingCheckout({
  plans,
  packs,
  subscription
}: {
  plans: BillingItem[];
  packs: BillingItem[];
  subscription: Subscription | null;
}) {
  const { locale } = useI18n();
  const labels = copy[locale];
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");

  const allowance = (subscription?.monthlyMessageLimit ?? 0) + (subscription?.extraMessageCredits ?? 0);
  const usedPercent = allowance > 0 ? Math.min(100, Math.round(((subscription?.usedMessages ?? 0) / allowance) * 100)) : 0;

  async function checkout(kind: "plan" | "pack", itemId: string) {
    setError("");
    setLoading(`${kind}-${itemId}`);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, itemId })
      });
      const body = await res.json();
      if (!res.ok || !body.url) throw new Error(body.error || labels.checkoutError);
      window.location.href = body.url;
    } catch (e: any) { setError(e.message); }
    finally { setLoading(""); }
  }

  async function manageSubscription() {
    setError("");
    setLoading("portal");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const body = await res.json();
      if (!res.ok || !body.url) throw new Error(body.error || labels.portalError);
      window.location.href = body.url;
    } catch (e: any) { setError(e.message); }
    finally { setLoading(""); }
  }

  return (
    <div className="space-y-6">
      {error ? <p className="callout-error">{error}</p> : null}

      {/* ── Status Banners ── */}
      {subscription?.status === "past_due" && (
        <div className="flex items-center gap-3 rounded-md bg-red-50 p-4 text-red-700 dark:bg-red-950/30 dark:text-red-400">
          <AlertTriangle size={20} />
          <p className="text-sm font-medium">{labels.pastDue}</p>
        </div>
      )}
      {subscription?.cancelAtPeriodEnd && (
        <div className="flex items-center gap-3 rounded-md bg-amber-50 p-4 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
          <Clock size={20} />
          <p className="text-sm font-medium">{labels.cancelAtEnd}</p>
        </div>
      )}
      {subscription?.trialEndsAt && (
        <div className="flex items-center gap-3 rounded-md bg-blue-50 p-4 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
          <Zap size={20} />
          <p className="text-sm font-medium">{labels.trialEnds}: {new Date(subscription.trialEndsAt).toLocaleDateString()}</p>
        </div>
      )}

      {/* ── Usage Card ── */}
      <section className="panel p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-ink">{labels.credits}</h2>
            {subscription?.planName ? (
              <span className="rounded-full bg-violet-100 px-3 py-0.5 text-sm font-medium text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                {subscription.planName}
              </span>
            ) : null}
          </div>
          {subscription?.planName && subscription.planName.toLowerCase() !== "free" ? (
            <button onClick={manageSubscription} disabled={loading === "portal"} className="btn-secondary text-xs">
              {loading === "portal" ? labels.manageLoading : labels.manage}
            </button>
          ) : null}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Stat label={labels.status} value={subscription?.status || "inactive"} highlight={subscription?.status === "active"} />
          <Stat label={labels.used} value={String(subscription?.usedMessages ?? 0)} />
          <Stat label={labels.available} value={String(allowance)} />
        </div>
        {allowance > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>{usedPercent}% {locale === "ar" ? "مستخدم" : "used"}</span>
              <span>{subscription?.usedMessages ?? 0} / {allowance}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className={`h-2 rounded-full transition-all ${
                  usedPercent >= 90 ? "bg-red-500" : usedPercent >= 70 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${usedPercent}%` }}
              />
            </div>
          </div>
        )}
        {subscription?.currentPeriodEnd && (
          <p className="mt-3 text-xs text-slate-400">
            {locale === "ar" ? "تجديد في" : "Renews"}: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
          </p>
        )}
      </section>

      {/* ── Plans ── */}
      <PlanCatalog
        title={labels.plans}
        items={plans.filter(p => p.isActive)}
        kind="plan"
        labels={labels}
        loading={loading}
        checkout={checkout}
        currentPlanName={subscription?.planName}
      />

      {/* ── Packs ── */}
      <PackCatalog
        title={labels.packs}
        items={packs.filter(p => p.isActive)}
        labels={labels}
        loading={loading}
        checkout={checkout}
      />
    </div>
  );
}

function PlanCatalog({
  title, items, kind, labels, loading, checkout, currentPlanName
}: {
  title: string;
  items: BillingItem[];
  kind: "plan";
  labels: typeof copy.ar | typeof copy.en;
  loading: string;
  checkout: (kind: "plan" | "pack", id: string) => void;
  currentPlanName?: string;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!items.length) return null;

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold text-ink">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map(item => {
          const isCurrent = currentPlanName === item.name;
          const isExpanded = expanded === item.id;
          return (
            <article key={item.id} className={`panel p-5 flex flex-col ${isCurrent ? "ring-2 ring-violet-500" : ""}`}>
              {item.isPopular && <p className="mb-2 text-sm font-bold text-coral">{labels.popular}</p>}
              {isCurrent && (
                <div className="mb-2 flex items-center gap-1 text-xs font-semibold text-violet-600">
                  <CheckCircle size={13} /> {labels.currentPlan}
                </div>
              )}
              <h3 className="text-lg font-bold text-ink">{item.name}</h3>
              {item.description && <p className="mt-1 text-sm text-slate-500">{item.description}</p>}
              <p className="mt-3 text-3xl font-bold text-ink">
                {(item.priceCents / 100).toFixed(2)}
                <span className="text-sm font-normal text-slate-500 ms-1">{item.currency.toUpperCase()} / {item.interval === "year" ? labels.year : labels.month}</span>
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {item.aiMessageLimit?.toLocaleString() ?? 0} {labels.aiReply}
              </p>

              {/* Feature list */}
              {item.features?.length ? (
                <div className="mt-3">
                  {(isExpanded ? item.features : item.features.slice(0, 4)).map(f => (
                    <div key={f.key} className="flex items-center gap-2 py-0.5 text-sm">
                      <CheckCircle size={13} className="shrink-0 text-emerald-500" />
                      <span className="text-ink">
                        {f.type === "boolean"
                          ? f.key.replace(/_/g, " ")
                          : `${f.limit?.toLocaleString() ?? labels.unlimited} ${f.unit ?? ""} ${f.key.replace(/_/g, " ")}`}
                      </span>
                    </div>
                  ))}
                  {item.features.length > 4 && (
                    <button onClick={() => setExpanded(isExpanded ? null : item.id)}
                      className="mt-1 text-xs text-violet-600 hover:underline">
                      {isExpanded ? "عرض أقل" : `+${item.features.length - 4} ${labels.features}`}
                    </button>
                  )}
                </div>
              ) : null}

              <div className="flex-1" />
              {isCurrent ? (
                <button className="mt-5 w-full cursor-not-allowed rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500" disabled>
                  {labels.currentPlan}
                </button>
              ) : (
                <button
                  className="btn-primary mt-5 w-full"
                  onClick={() => checkout("plan", item.id)}
                  disabled={loading === `plan-${item.id}`}
                >
                  <CreditCard size={16} />
                  {loading === `plan-${item.id}` ? labels.redirecting : labels.subscribe}
                </button>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function PackCatalog({
  title, items, labels, loading, checkout
}: {
  title: string;
  items: BillingItem[];
  labels: typeof copy.ar | typeof copy.en;
  loading: string;
  checkout: (kind: "plan" | "pack", id: string) => void;
}) {
  if (!items.length) return null;
  return (
    <section>
      <h2 className="mb-4 text-xl font-bold text-ink">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map(item => (
          <article key={item.id} className="panel p-5 flex flex-col">
            <h3 className="text-lg font-bold text-ink">{item.name}</h3>
            <p className="mt-3 text-3xl font-bold text-ink">
              {(item.priceCents / 100).toFixed(2)}
              <span className="text-sm font-normal text-slate-500 ms-1">{item.currency.toUpperCase()}</span>
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {item.messageCredits?.toLocaleString() ?? 0} {labels.extraMessage}
            </p>
            <div className="flex-1" />
            <button
              className="btn-secondary mt-5 w-full"
              onClick={() => checkout("pack", item.id)}
              disabled={loading === `pack-${item.id}`}
            >
              <CreditCard size={16} />
              {loading === `pack-${item.id}` ? labels.redirecting : labels.buyPack}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-md border p-4 ${highlight ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30" : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60"}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${highlight ? "text-emerald-700 dark:text-emerald-400" : "text-ink"}`}>{value}</p>
    </div>
  );
}
