import { requireSession } from "@/lib/auth";
import { getTenantSummary } from "@/lib/dashboard-data";
import { getLocale } from "@/lib/i18n";
import { User, Mail, Shield, Building2 } from "lucide-react";

export default async function ProfilePage() {
  const session = await requireSession();
  const [summary, locale] = await Promise.all([
    getTenantSummary(session.user.tenantId),
    getLocale(),
  ]);
  const isAr = locale === "ar";

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-[#0B0C1E] dark:text-white transition-colors duration-200">
          {isAr ? "الملف الشخصي" : "Profile"}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {isAr ? "إدارة إعدادات حسابك الشخصي" : "Manage your personal account settings"}
        </p>
      </div>

      <div className="rounded-3xl bg-white dark:bg-[#1a1b36] p-8 shadow-xl shadow-black/5 dark:shadow-none transition-colors duration-200">
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-600 text-3xl font-black text-white shadow-lg">
            {(session.user.name || "User").charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#0B0C1E] dark:text-white">{session.user.name || "User"}</h2>
            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{session.user.email}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4 transition-colors duration-200">
            <Shield className="text-emerald-500" size={20} />
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{isAr ? "الصلاحية" : "Role"}</p>
              <p className="text-sm font-bold text-[#0B0C1E] dark:text-white capitalize">{session.user.role || "Admin"}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 rounded-2xl border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4 transition-colors duration-200">
            <Building2 className="text-blue-500" size={20} />
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{isAr ? "الشركة" : "Company"}</p>
              <p className="text-sm font-bold text-[#0B0C1E] dark:text-white capitalize">{summary.tenantName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
