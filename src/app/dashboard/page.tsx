import Link from "next/link";
import type { ReactNode } from "react";
import {
  MessageSquare,
  Users,
  Settings,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Globe,
  Send,
  Ticket,
  Activity,
  TrendingUp,
  BookOpen,
  CreditCard,
  ShieldCheck,
  UserCog,
  MessageCircle,
  ChevronLeft,
  Sparkles,
  ArrowDownRight,
  PlugZap,
} from "lucide-react";
import { requireSession } from "@/lib/auth";
import {
  getDashboardActivity,
  getDashboardChannels,
  getTenantSummary,
} from "@/lib/dashboard-data";
import { getLocale } from "@/lib/i18n";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { RecentConversationsWidget } from "@/components/dashboard/recent-conversations-widget";

function ChannelIcon({ type }: { type: string }) {
  const base = "h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-white";
  if (type === "whatsapp") return <span className={`${base} bg-[#25D366]`}><svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg></span>;
  if (type === "instagram") return <span className={`${base} bg-gradient-to-br from-[#833ab4] via-[#fd1d1d] to-[#fcb045]`}><svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg></span>;
  if (type === "facebook" || type === "messenger") return <span className={`${base} bg-[#0099FF]`}><svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.193 14.963l-3.056-3.259-5.963 3.259 6.559-6.963 3.13 3.259 5.889-3.259-6.559 6.963z" /></svg></span>;
  if (type === "telegram") return <span className={`${base} bg-[#2CA5E0]`}><Send size={14} /></span>;
  return <span className={`${base} bg-slate-400 dark:bg-slate-600`}><Globe size={14} /></span>;
}

function StatRow({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-white/5 last:border-0 transition-colors duration-200">
      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</span>
      <div className="text-end">
        <span className="text-sm font-bold text-[#0B0C1E] dark:text-white">{value}</span>
        {sub && <p className="text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

function QuickAction({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/85 px-4 py-2 text-sm font-extrabold text-slate-700 shadow-sm shadow-slate-200/50 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-700 hover:shadow-md dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100 dark:shadow-none dark:hover:border-indigo-400/40 dark:hover:bg-white/[0.09]"
    >
      {icon}
      <span className="truncate">{label}</span>
    </Link>
  );
}

export default async function DashboardPage() {
  const session = await requireSession();
  const [summary, activity, channels, locale] = await Promise.all([
    getTenantSummary(session.user.tenantId),
    getDashboardActivity(session.user.tenantId),
    getDashboardChannels(session.user.tenantId),
    getLocale(),
  ]);
  const isAr = locale === "ar";

  // Subscription info
  const subStatus = summary.subscriptionStatus;
  const subEnds = summary.subscriptionEndsAt
    ? new Date(summary.subscriptionEndsAt).toLocaleDateString(isAr ? "ar-EG" : "en-US", { year: "numeric", month: "short", day: "numeric" })
    : "—";
  const subStatusLabel = subStatus === "active" ? (isAr ? "نشط" : "Active") :
    subStatus === "trialing" ? (isAr ? "تجريبي" : "Trial") :
    subStatus === "canceled" ? (isAr ? "ملغى" : "Canceled") : subStatus;
  const subStatusColor = subStatus === "active" ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400" :
    subStatus === "trialing" ? "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400" : "text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400";

  // Conversion rate
  const conversionRate = summary.conversations > 0
    ? Math.round((summary.totalLeads / summary.conversations) * 100)
    : 0;

  // AI resolution rate
  const aiRate = summary.aiResolutionRate;

  const kpis = [
    {
      label: isAr ? "إجمالي المحادثات" : "Total Conversations",
      value: summary.conversations.toLocaleString(isAr ? "ar-EG" : "en-US"),
      sub: isAr ? `${summary.todayMessages} رسالة اليوم` : `${summary.todayMessages} today`,
      icon: MessageSquare,
      color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10",
    },
    {
      label: isAr ? "معدل الاستجابة (AI)" : "AI Resolution Rate",
      value: aiRate > 0 ? `${aiRate}%` : "—",
      sub: isAr ? "مقارنة مع الشهر الماضي" : "vs last month",
      icon: Activity,
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10",
    },
    {
      label: isAr ? "العملاء المحتملون" : "Leads",
      value: summary.totalLeads.toLocaleString(isAr ? "ar-EG" : "en-US"),
      sub: isAr ? "مقارنة مع الشهر الماضي" : "vs last month",
      icon: Users,
      color: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10",
    },
    {
      label: isAr ? "المحادثات النشطة" : "Active Chats",
      value: summary.activeConversations.toLocaleString(isAr ? "ar-EG" : "en-US"),
      sub: isAr ? "مفتوحة أو بانتظار الرد" : "open or pending",
      icon: MessageSquare,
      color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10",
    },
  ];
  const greeting = isAr ? "أهلاً،" : "Welcome,";
  const accountName = session.user.name || session.user.email || (isAr ? "فريقك" : "your team");

  return (
    <div className="flex min-h-full flex-col gap-5 xl:flex-row xl:items-start">

      {/* ── MAIN LEFT PANEL ── */}
      <div className="min-w-0 flex-1 flex flex-col gap-5 rounded-[1.75rem] border border-slate-200 bg-white p-3 shadow-xl shadow-black/5 transition-colors duration-200 dark:border-white/10 dark:bg-[#12132A] dark:shadow-none sm:p-4 lg:rounded-[2rem] lg:p-6">

        {/* Modern command header */}
        <div className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-indigo-50/70 p-4 shadow-sm dark:border-white/10 dark:from-[#181934] dark:via-[#15162c] dark:to-[#21194a] sm:p-5 lg:p-6">
          <div className="pointer-events-none absolute -end-16 -top-20 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-400/10" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/70 px-3 py-1 text-xs font-extrabold text-indigo-700 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-indigo-200">
                <Sparkles size={13} />
                {isAr ? "مركز تشغيل ChatZi" : "ChatZi command center"}
              </span>
              <h1 className="mt-4 text-2xl font-black leading-tight text-[#0B0C1E] transition-colors duration-200 dark:text-white sm:text-3xl lg:text-4xl">
                {greeting} <span className="text-indigo-700 dark:text-indigo-300">{accountName}</span>
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-7 text-slate-600 dark:text-slate-300">
                {isAr
                  ? "تابع المحادثات، التذاكر، العملاء المحتملين، وحالة الفريق من شاشة واحدة محسنة للهاتف وسطح المكتب."
                  : "Track conversations, tickets, leads, and team health from one responsive workspace."}
              </p>
            </div>

            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
              <QuickAction href="/dashboard/conversations" label={isAr ? "فتح المحادثات" : "Open chats"} icon={<MessageSquare size={16} />} />
              <QuickAction href="/dashboard/channels" label={isAr ? "إدارة القنوات" : "Manage channels"} icon={<PlugZap size={16} />} />
              <Link href="/dashboard/settings" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-extrabold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400">
                <Settings size={16} />
                <span>{isAr ? "الإعدادات" : "Settings"}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {kpis.map((kpi, index) => {
            const Icon = kpi.icon;
            // Provide sharper solid colors and borders
            const styles = [
              "bg-blue-50/50 border-b-4 border-b-blue-500 dark:bg-blue-500/10 dark:border-b-blue-400",
              "bg-emerald-50/50 border-b-4 border-b-emerald-500 dark:bg-emerald-500/10 dark:border-b-emerald-400",
              "bg-violet-50/50 border-b-4 border-b-violet-500 dark:bg-violet-500/10 dark:border-b-violet-400",
              "bg-indigo-50/50 border-b-4 border-b-indigo-500 dark:bg-indigo-500/10 dark:border-b-indigo-400",
            ];
            return (
              <div key={kpi.label} className={`group rounded-[1.35rem] ${styles[index % 4]} p-4 border-x border-t border-slate-200 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:shadow-none sm:p-5`}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{kpi.label}</p>
                  <span className={`flex h-9 w-9 items-center justify-center rounded-2xl ring-4 ring-white/90 transition group-hover:scale-105 dark:ring-white/10 ${kpi.color}`}>
                    <Icon size={14} />
                  </span>
                </div>
                <p className="text-3xl font-black tracking-tight text-[#0B0C1E] dark:text-white">{kpi.value}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{kpi.sub}</p>
                  <ArrowDownRight size={14} className="text-slate-400 transition group-hover:text-indigo-600 dark:text-slate-500" />
                </div>
              </div>
            );
          })}
        </div>
        <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm transition-colors duration-200 dark:border-white/10 dark:bg-[#1a1b36] sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-[#0B0C1E] dark:text-white">{isAr ? "نظرة عامة على المحادثات" : "Conversation Overview"}</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{isAr ? "آخر 7 أيام" : "Last 7 days"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 dark:bg-white/10 px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors duration-200">
                {summary.messages.toLocaleString(isAr ? "ar-EG" : "en-US")} {isAr ? "رسالة" : "msgs"}
              </span>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200">
                {isAr ? "7 أيام" : "7 days"}
              </span>
            </div>
          </div>
          <ActivityChart data={activity.chartData} isAr={isAr} />
        </div>

        {/* Channels */}
        <div className="rounded-2xl border border-slate-100 dark:border-white/5 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/10 dark:to-[#1a1b36] transition-colors duration-200 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0B0C1E] dark:text-white">{isAr ? "القنوات المتصلة" : "Connected Channels"}</h2>
            <Link href="/dashboard/channels" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">{isAr ? "إدارة" : "Manage"}</Link>
          </div>

          <div className="flex flex-wrap items-center justify-around gap-4 sm:justify-start sm:gap-6">
            <div className="flex flex-col items-center gap-2">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 ring-4 ring-white dark:ring-[#1a1b36] shadow-sm">
                <MessageCircle size={22} />
              </span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{isAr ? "واتساب" : "WhatsApp"}</span>
              <span className="text-[9px] rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 font-bold">{isAr ? "فعال" : "Active"}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 ring-4 ring-white dark:ring-[#1a1b36] shadow-sm">
                <Send size={22} />
              </span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{isAr ? "تيليجرام" : "Telegram"}</span>
              <span className="text-[9px] rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 px-2 py-0.5 font-bold">{isAr ? "قريباً" : "Soon"}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 ring-4 ring-white dark:ring-[#1a1b36] shadow-sm">
                <Globe size={22} />
              </span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{isAr ? "فيسبوك" : "Facebook"}</span>
              <span className="text-[9px] rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 px-2 py-0.5 font-bold">{isAr ? "قريباً" : "Soon"}</span>
            </div>
          </div>
        </div>


        {/* Detailed Stats Grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          {/* Subscription & Account */}
          <div className="overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white shadow-sm transition-colors duration-200 dark:border-white/10 dark:bg-[#1a1b36]">
            <div className="flex items-center gap-2 border-b border-indigo-100 bg-indigo-50/80 px-5 py-4 dark:border-indigo-500/20 dark:bg-indigo-500/10">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                <CreditCard size={14} />
              </span>
              <h3 className="text-sm font-black text-[#0B0C1E] dark:text-indigo-100">{isAr ? "الاشتراك والحساب" : "Subscription & Account"}</h3>
            </div>
            <div className="px-5 pb-4 pt-1">
              <StatRow
                label={isAr ? "حالة الاشتراك" : "Status"}
                value={<span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${subStatusColor}`}><ShieldCheck size={11} />{subStatusLabel}</span>}
              />
              <StatRow
                label={isAr ? "تاريخ التجديد" : "Renewal Date"}
                value={subEnds}
                sub={isAr ? "تاريخ انتهاء الفترة الحالية" : "Current period end"}
              />
              <StatRow
                label={isAr ? "نسبة جذب العملاء" : "Lead Conversion"}
                value={`${conversionRate}%`}
                sub={isAr ? "من المحادثات إلى عملاء محتملين" : "conversations → leads"}
              />
              <StatRow
                label={isAr ? "تسوية بالذكاء الاصطناعي" : "AI Resolutions"}
                value={summary.aiResolutionRate > 0 ? `${summary.aiResolutionRate}%` : "—"}
              />
            </div>
          </div>

          {/* Knowledge Base */}
          <div className="overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white shadow-sm transition-colors duration-200 dark:border-white/10 dark:bg-[#1a1b36]">
            <div className="flex items-center justify-between border-b border-violet-100 bg-violet-50/80 px-5 py-4 dark:border-violet-500/20 dark:bg-violet-500/10">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
                  <BookOpen size={14} />
                </span>
                <h3 className="text-sm font-black text-[#0B0C1E] dark:text-violet-100">{isAr ? "قاعدة المعرفة" : "Knowledge Base"}</h3>
              </div>
              <Link href="/dashboard/knowledge" className="rounded-full bg-white px-3 py-1 text-xs font-bold text-violet-600 shadow-sm transition-colors hover:text-violet-800 dark:bg-violet-500/20 dark:text-violet-200 dark:hover:bg-violet-500/30">{isAr ? "إدارة" : "Manage"}</Link>
            </div>
            <div className="px-5 pb-4 pt-1">
              <StatRow
                label={isAr ? "حالة قاعدة المعرفة" : "Status"}
                value={<span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${summary.knowledgeDocs > 0 ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400" : "text-slate-500 bg-slate-100 dark:bg-white/10 dark:text-slate-400"}`}>
                  {summary.knowledgeDocs > 0 ? (isAr ? "✓ نشطة" : "✓ Active") : (isAr ? "فارغة" : "Empty")}
                </span>}
              />
              <StatRow
                label={isAr ? "عدد المستندات" : "Documents"}
                value={summary.knowledgeDocs.toLocaleString(isAr ? "ar-EG" : "en-US")}
                sub={isAr ? "مستند في قاعدة المعرفة" : "docs in knowledge base"}
              />
              <StatRow
                label={isAr ? "عدد البوتات" : "AI Bots"}
                value={summary.bots}
              />
              <StatRow
                label={isAr ? "القنوات النشطة" : "Active Channels"}
                value={summary.activeChannels}
              />
            </div>
          </div>

          {/* Team */}
          <div className="overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white shadow-sm transition-colors duration-200 dark:border-white/10 dark:bg-[#1a1b36]">
            <div className="flex items-center justify-between border-b border-blue-100 bg-blue-50/80 px-5 py-4 dark:border-blue-500/20 dark:bg-blue-500/10">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                  <UserCog size={14} />
                </span>
                <h3 className="text-sm font-black text-[#0B0C1E] dark:text-blue-100">{isAr ? "فريق العمل" : "Team"}</h3>
              </div>
              <Link href="/dashboard/support-agents" className="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-600 shadow-sm transition-colors hover:text-blue-800 dark:bg-blue-500/20 dark:text-blue-200 dark:hover:bg-blue-500/30">{isAr ? "إدارة" : "Manage"}</Link>
            </div>
            <div className="px-5 pb-4 pt-1">
              <StatRow label={isAr ? "إجمالي المستخدمين" : "Total Users"} value={summary.totalUsers} />
              <StatRow
                label={isAr ? "المديرون والمشرفون" : "Admins & Managers"}
                value={summary.adminUsers}
                sub={isAr ? "owner / admin / manager" : "owner / admin / manager"}
              />
              <StatRow
                label={isAr ? "وكلاء الدعم" : "Support Agents"}
                value={summary.agentUsers}
                sub={isAr ? "agent / viewer" : "agent / viewer"}
              />
            </div>
          </div>

          {/* Performance */}
          <div className="overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white shadow-sm transition-colors duration-200 dark:border-white/10 dark:bg-[#1a1b36]">
            <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50/80 px-5 py-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <TrendingUp size={14} />
              </span>
              <h3 className="text-sm font-black text-[#0B0C1E] dark:text-emerald-100">{isAr ? "الأداء والتحويل" : "Performance"}</h3>
            </div>
            <div className="px-5 pb-4 pt-1">
              <StatRow label={isAr ? "إجمالي الرسائل" : "Total Messages"} value={summary.messages.toLocaleString(isAr ? "ar-EG" : "en-US")} />
              <StatRow label={isAr ? "رسائل اليوم" : "Today's Messages"} value={summary.todayMessages} />
              <StatRow label={isAr ? "نسبة جذب العملاء" : "Lead Conversion"} value={`${conversionRate}%`} />
              <StatRow
                label={isAr ? "البشري مقابل AI" : "Human vs AI"}
                value={`${summary.humanResolutionRate}% / ${summary.aiResolutionRate}%`}
                sub={isAr ? "بشري / ذكاء اصطناعي" : "human / ai"}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex w-full flex-col gap-5 rounded-[1.75rem] border border-slate-200 bg-white p-3 shadow-xl shadow-black/5 transition-colors duration-200 dark:border-white/10 dark:bg-[#12132A] dark:shadow-none sm:p-4 lg:rounded-[2rem] lg:p-6 xl:w-[22rem] xl:shrink-0">

        {/* Chat Live */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1b36] overflow-hidden shadow-sm transition-colors duration-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"><MessageSquare size={16} /></span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Live</p>
                <h2 className="text-sm font-bold text-[#0B0C1E] dark:text-white">{isAr ? "الشات لايف" : "Live Chat"}</h2>
              </div>
            </div>
            <Link href="/dashboard/conversations" className="flex items-center gap-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              {isAr ? "الكل" : "All"} <ChevronRight size={13} className="rtl:rotate-180" />
            </Link>
          </div>
          <div className="p-4 bg-slate-50/30 dark:bg-[#171830]/50">
            <RecentConversationsWidget conversations={activity.recentConversations} isAr={isAr} />
          </div>
          <div className="flex items-center justify-between bg-slate-50 dark:bg-[#171830] px-5 py-3 border-t border-slate-100 dark:border-white/5 transition-colors duration-200">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{isAr ? "مفتوحة الآن" : "Open now"}</span>
            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{summary.activeConversations}</span>
          </div>
        </div>

        {/* Tickets */}
        <div className="overflow-hidden rounded-[1.4rem] border border-slate-200 shadow-sm transition-colors duration-200 dark:border-amber-400/20 dark:bg-gradient-to-br dark:from-amber-500/[0.08] dark:to-[#15162c]">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 transition-colors duration-200 dark:border-amber-400/10">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-4 ring-amber-50/50 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/10"><Ticket size={16} /></span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-amber-200/60">Support</p>
                <h2 className="text-sm font-bold text-[#0B0C1E] dark:text-white">{isAr ? "التذاكر" : "Tickets"}</h2>
              </div>
            </div>
            <Link href="/dashboard/tickets" className="flex items-center gap-0.5 text-xs font-semibold text-indigo-600 hover:underline dark:text-amber-200">
              {isAr ? "الكل" : "All"} {isAr ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
            </Link>
          </div>
          <div className="divide-y divide-slate-50 transition-colors duration-200 dark:divide-amber-400/10">
            {[
              { label: isAr ? "مفتوحة" : "Open", value: summary.tickets, Icon: AlertCircle, color: "text-rose-500 dark:text-rose-400" },
              { label: isAr ? "محلولة" : "Resolved", value: summary.resolvedTickets, Icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400" },
              { label: isAr ? "الإجمالي" : "Total", value: summary.totalTickets, Icon: Activity, color: "text-slate-400 dark:text-slate-500" },
            ].map(({ label, value, Icon, color }) => (
              <div key={label} className="flex items-center justify-between px-5 py-3">
                <div className={`flex items-center gap-2 text-sm font-semibold ${color}`}>
                  <Icon size={14} />
                  <span className="text-slate-700 dark:text-slate-300">{label}</span>
                </div>
                <span className="text-lg font-black text-[#0B0C1E] dark:text-white">{value}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3 transition-colors duration-200 dark:border-amber-400/10 dark:bg-amber-500/[0.06]">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{isAr ? "معدل الحل" : "Resolution"}</span>
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
              {summary.totalTickets > 0 ? Math.round((summary.resolvedTickets / summary.totalTickets) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Leads */}
        <div className="overflow-hidden rounded-[1.4rem] border border-slate-200 shadow-sm transition-colors duration-200 dark:border-violet-400/20 dark:bg-gradient-to-br dark:from-violet-500/[0.08] dark:to-[#15162c]">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 transition-colors duration-200 dark:border-violet-400/10">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-4 ring-violet-50/60 dark:bg-violet-500/15 dark:text-violet-200 dark:ring-violet-500/10"><Users size={16} /></span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-violet-200/60">CRM</p>
                <h2 className="text-sm font-bold text-[#0B0C1E] dark:text-white">{isAr ? "العملاء المحتملون" : "Leads"}</h2>
              </div>
            </div>
            <Link href="/dashboard/leads" className="flex items-center gap-0.5 text-xs font-semibold text-indigo-600 hover:underline dark:text-violet-200">
              {isAr ? "الكل" : "All"} {isAr ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
            </Link>
          </div>
          <div className="divide-y divide-slate-50 transition-colors duration-200 dark:divide-violet-400/10">
            {[
              { label: isAr ? "إجمالي العملاء" : "Total Leads", value: summary.totalLeads, color: "text-violet-600 dark:text-violet-400" },
              { label: isAr ? "نسبة التحويل" : "Conversion Rate", value: `${conversionRate}%`, color: "text-indigo-600 dark:text-indigo-400" },
              { label: isAr ? "القنوات النشطة" : "Active Channels", value: summary.activeChannels, color: "text-blue-600 dark:text-blue-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{label}</span>
                <span className={`text-lg font-black ${color}`}>{value}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 transition-colors duration-200 dark:border-violet-400/10 dark:bg-violet-500/[0.06]">
            <Link href="/dashboard/leads" className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 dark:bg-violet-500 dark:hover:bg-violet-400">
              <ArrowUpRight size={15} />
              {isAr ? "إدارة العملاء المحتملين" : "Manage Leads"}
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
