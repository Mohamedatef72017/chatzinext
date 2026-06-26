import { requirePlatformAdmin } from "@/lib/authz";
import { getTenantProfileData } from "@/lib/admin-analytics";
import { PageHeader } from "@/components/dashboard/page-header";
import { notFound } from "next/navigation";
import { Building2, Mail, Phone, ShieldAlert, CheckCircle2, User as UserIcon, CalendarClock, CreditCard } from "lucide-react";

export default async function TenantProfilePage(props: { params: Promise<{ id: string }> }) {
  await requirePlatformAdmin();
  const params = await props.params;
  const data = await getTenantProfileData(params.id);

  if (!data) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title={`ملف المستأجر: ${data.name}`}
        description="جميع التفاصيل والمستخدمين والإحصائيات الخاصة بهذا المستأجر"
        backHref="/admin"
        backLabel="اللوحة المركزية"
      />
      
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="الموظفين" value={data.stats.users} />
          <StatCard title="البوتات" value={data.stats.bots} />
          <StatCard title="المحادثات" value={data.stats.conversations} />
          <StatCard title="الرسائل" value={data.stats.messages} />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <section className="panel p-5 md:col-span-1 h-fit">
            <h3 className="font-bold text-lg border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <Building2 size={20} className="text-indigo-500" />
              بيانات المتجر
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">الاسم</span>
                <span className="font-bold">{data.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">المعرف (Slug)</span>
                <span className="font-medium bg-slate-50 px-2 py-0.5 rounded">{data.slug}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">تاريخ التسجيل</span>
                <span>{data.createdAt ? new Date(data.createdAt).toLocaleDateString('ar-EG') : '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">تصنيف العمل</span>
                <span>{data.businessCategory || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">الحالة</span>
                <span>
                  {data.isActive ? (
                    <span className="text-emerald-600 font-semibold text-xs bg-emerald-50 px-2 py-1 rounded-full">نشط</span>
                  ) : (
                    <span className="text-red-600 font-semibold text-xs bg-red-50 px-2 py-1 rounded-full">معطل</span>
                  )}
                </span>
              </div>
            </div>

            <h3 className="font-bold text-lg border-b border-slate-100 pb-3 mt-8 mb-4 flex items-center gap-2">
              <CreditCard size={20} className="text-amber-500" />
              الاشتراك والخطة
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">الخطة الحالية</span>
                <span className="font-bold capitalize">{data.plan}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">الاشتراك</span>
                <span>
                  {data.subscription?.status === 'active' ? (
                    <span className="text-emerald-600 font-semibold text-xs bg-emerald-50 px-2 py-1 rounded-full">نشط</span>
                  ) : data.subscription?.status === 'trialing' ? (
                    <span className="text-blue-600 font-semibold text-xs bg-blue-50 px-2 py-1 rounded-full">تجريبي</span>
                  ) : (
                    <span className="text-slate-600 font-semibold text-xs bg-slate-100 px-2 py-1 rounded-full">{data.subscription?.status || 'لا يوجد'}</span>
                  )}
                </span>
              </div>
              {data.subscription?.currentPeriodEnd && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">تاريخ الانتهاء</span>
                  <span className="flex items-center gap-1">
                    <CalendarClock size={14} className="text-slate-400" />
                    {new Date(data.subscription.currentPeriodEnd).toLocaleDateString('ar-EG')}
                  </span>
                </div>
              )}
            </div>
          </section>

          <section className="panel md:col-span-2 overflow-hidden">
             <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <UserIcon size={20} className="text-blue-500" />
              <h3 className="font-bold text-lg">الموظفين والمستخدمين ({data.users.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3 font-medium">المستخدم</th>
                    <th className="px-5 py-3 font-medium">البريد والهاتف</th>
                    <th className="px-5 py-3 font-medium">الصلاحية</th>
                    <th className="px-5 py-3 font-medium">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-4">
                        <p className="font-bold text-ink">{u.name}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-600 text-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail size={12} className={u.emailVerified ? "text-emerald-500" : "text-slate-400"} />
                          {u.email}
                        </div>
                        {u.phone && (
                          <div className="flex items-center gap-2">
                            <Phone size={12} className={u.phoneVerified ? "text-emerald-500" : "text-slate-400"} />
                            <span dir="ltr">{u.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="bg-slate-100 px-2 py-1 rounded text-xs">{u.role}</span>
                      </td>
                      <td className="px-5 py-4">
                         {u.isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                            <CheckCircle2 size={12} />
                            نشط
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-700">
                            <ShieldAlert size={12} />
                            معطل
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="panel p-5 flex flex-col justify-between">
      <h3 className="text-sm font-semibold text-slate-500">{title}</h3>
      <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}
