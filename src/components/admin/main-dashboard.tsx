"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Building2, Users, Bot, MessageSquare, MessagesSquare, ShieldAlert, CheckCircle2, 
  CalendarClock, Search, ChevronRight, ChevronLeft, Trash2, Ban, Mail, Phone, Activity
} from "lucide-react";
import type { GlobalStats, TenantWithEmployees } from "@/lib/admin-analytics";
import { toggleUserActivation, deleteUser } from "@/app/admin/actions";
import { ActivityChart } from "@/components/dashboard/activity-chart";

export function AdminMainDashboard({ 
  stats, 
  chartData,
  tenants,
  totalTenants,
  totalPages,
  currentPage,
  currentQuery
}: { 
  stats: GlobalStats; 
  chartData: any[];
  tenants: TenantWithEmployees[];
  totalTenants: number;
  totalPages: number;
  currentPage: number;
  currentQuery: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState(currentQuery);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (searchQuery) {
      params.set("q", searchQuery);
    } else {
      params.delete("q");
    }
    params.set("page", "1");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("page", newPage.toString());
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function handleToggleUser(userId: string, isActive: boolean) {
    startTransition(async () => {
      try {
        await toggleUserActivation(userId, !isActive);
      } catch (err) {
        alert("حدث خطأ أثناء تغيير الحالة");
      }
    });
  }

  function handleDeleteUser(userId: string) {
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.")) return;
    startTransition(async () => {
      try {
        await deleteUser(userId);
      } catch (err) {
        alert("حدث خطأ أثناء الحذف");
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* Global Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="المتاجر (Tenants)" value={stats.totalTenants} icon={<Building2 className="text-violet-500" />} />
        <StatCard title="المستخدمين" value={stats.totalUsers} icon={<Users className="text-blue-500" />} />
        <StatCard title="البوتات النشطة" value={stats.totalBots} icon={<Bot className="text-emerald-500" />} />
        <StatCard title="المحادثات" value={stats.totalConversations} icon={<MessageSquare className="text-amber-500" />} />
        <StatCard title="إجمالي الرسائل" value={stats.totalMessages} icon={<MessagesSquare className="text-rose-500" />} />
      </div>

      {/* Activity Chart */}
      <section className="panel p-5">
        <div className="flex items-center gap-2">
          <Activity className="text-indigo-500" size={20} />
          <h2 className="text-lg font-bold text-ink">تفاعل المستخدمين (آخر 7 أيام)</h2>
        </div>
        <div className="mt-4">
          <ActivityChart data={chartData} isAr={true} />
        </div>
      </section>

      {/* Tenants & Employees Table */}
      <section className="panel overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-ink">المستأجرين</h2>
            <p className="mt-1 text-sm text-slate-500">نظرة عامة على جميع المتاجر المسجلة في النظام مع موظفيهم وصلاحياتهم.</p>
          </div>
          <form onSubmit={handleSearch} className="relative w-full sm:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="البحث بالاسم أو البريد..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-slate-50 py-2 pr-9 pl-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
            />
          </form>
        </div>
        <div className={`overflow-x-auto ${isPending ? "opacity-60 pointer-events-none" : ""}`}>
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 font-medium">المتجر (Tenant)</th>
                <th className="px-5 py-3 font-medium">الخطة</th>
                <th className="px-5 py-3 font-medium">الاشتراك</th>
                <th className="px-5 py-3 font-medium">الموظفين (Users)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-5 text-center text-slate-500">لا يوجد بيانات مطابقة.</td>
                </tr>
              ) : null}
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                  <td className="px-5 py-4 align-top">
                    <Link href={`/admin/tenants/${tenant.id}`} className="block group">
                      <p className="font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline">{tenant.name}</p>
                      <p className="text-xs text-slate-500">/{tenant.slug}</p>
                      {tenant.isActive ? (
                        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                          <CheckCircle2 size={12} />
                          متجر نشط
                        </span>
                      ) : (
                        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-400">
                          <ShieldAlert size={12} />
                          متجر معطل
                        </span>
                      )}
                    </Link>
                  </td>
                  <td className="px-5 py-4 align-top font-medium text-ink">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">
                      {tenant.plan}
                    </span>
                  </td>
                  <td className="px-5 py-4 align-top text-xs">
                    <div className="flex flex-col gap-1">
                      {tenant.subscriptionStatus === "active" ? (
                        <span className="inline-block rounded-full bg-emerald-100 px-2 py-1 text-[10px] text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 w-fit">اشتراك نشط</span>
                      ) : tenant.subscriptionStatus === "trialing" ? (
                        <span className="inline-block rounded-full bg-blue-100 px-2 py-1 text-[10px] text-blue-700 dark:bg-blue-900 dark:text-blue-300 w-fit">تجريبي</span>
                      ) : (
                        <span className="inline-block rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-700 dark:bg-slate-800 dark:text-slate-300 w-fit">{tenant.subscriptionStatus}</span>
                      )}
                      {tenant.subscriptionEndsAt ? (
                        <div className="flex items-center gap-1 mt-1 text-slate-500">
                          <CalendarClock size={12} />
                          {new Date(tenant.subscriptionEndsAt).toLocaleDateString("ar-EG")}
                        </div>
                      ) : <span className="text-slate-500">-</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="flex flex-col gap-2">
                      {tenant.employees.map((emp) => (
                        <div key={emp.id} className={`flex items-center gap-3 rounded-md border p-2 transition ${emp.isActive ? "border-slate-100 dark:border-slate-800" : "border-red-100 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10"}`}>
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 dark:bg-violet-900 dark:text-violet-300">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-ink flex items-center gap-2">
                              {emp.name}
                              {!emp.isActive && <span className="text-[10px] font-normal text-red-500">(معطل)</span>}
                            </p>
                            <p className="truncate text-[10px] text-slate-500">{emp.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span title={emp.emailVerified ? "بريد موثق" : "بريد غير موثق"} className={emp.emailVerified ? "text-emerald-500" : "text-slate-300 dark:text-slate-600"}>
                                <Mail size={12} />
                              </span>
                              <span title={emp.phoneVerified ? "هاتف موثق" : "هاتف غير موثق"} className={emp.phoneVerified ? "text-emerald-500" : "text-slate-300 dark:text-slate-600"}>
                                <Phone size={12} />
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <RoleBadge role={emp.role} />
                            <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-700 pr-2 rtl:border-r-0 rtl:border-l rtl:pr-0 rtl:pl-2">
                              <button 
                                onClick={() => handleToggleUser(emp.id, emp.isActive)}
                                title={emp.isActive ? "تعطيل المستخدم" : "تفعيل المستخدم"}
                                className={`p-1.5 rounded-md transition ${emp.isActive ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20" : "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"}`}
                              >
                                {emp.isActive ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(emp.id)}
                                title="حذف المستخدم"
                                className="p-1.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {tenant.employees.length === 0 && (
                        <p className="text-xs text-slate-500">لا يوجد مستخدمين مرتبطين.</p>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm">
            <span className="text-slate-500">
              إجمالي المستأجرين: <span className="font-bold text-ink">{totalTenants}</span>
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1 || isPending}
                className="p-1 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 disabled:opacity-50 disabled:pointer-events-none"
              >
                <ChevronRight size={16} />
              </button>
              <span className="text-slate-600 dark:text-slate-400">
                صفحة {currentPage} من {totalPages}
              </span>
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || isPending}
                className="p-1 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 disabled:opacity-50 disabled:pointer-events-none"
              >
                <ChevronLeft size={16} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="panel p-5 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-slate-50 p-2 dark:bg-slate-900">{icon}</div>
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</h3>
      </div>
      <p className="mt-4 text-3xl font-bold text-ink">{value}</p>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  switch (role) {
    case "super-admin":
      return <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-900 dark:text-violet-300">مدير المنصة</span>;
    case "owner":
      return <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">المالك</span>;
    case "admin":
      return <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">مشرف</span>;
    case "agent":
      return <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">موظف</span>;
    default:
      return <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">{role}</span>;
  }
}
