import { requirePlatformAdmin } from "@/lib/authz";
import { getGlobalAnalytics, getGlobalActivityChart, getTenantsWithEmployees } from "@/lib/admin-analytics";
import { PageHeader } from "@/components/dashboard/page-header";
import { AdminMainDashboard } from "@/components/admin/main-dashboard";

export default async function AdminPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  await requirePlatformAdmin();
  
  const searchParams = await props.searchParams;
  const page = typeof searchParams.page === "string" ? parseInt(searchParams.page, 10) : 1;
  const q = typeof searchParams.q === "string" ? searchParams.q : "";

  const [stats, chartData, tenantsData] = await Promise.all([
    getGlobalAnalytics(),
    getGlobalActivityChart(),
    getTenantsWithEmployees(page, 10, q)
  ]);

  return (
    <>
      <PageHeader
        title="لوحة التحكم المركزية"
        description="نظرة شاملة على جميع الإحصاءات والمتاجر والمستخدمين في النظام."
      />
      <AdminMainDashboard 
        stats={stats} 
        chartData={chartData} 
        tenants={tenantsData.data} 
        totalTenants={tenantsData.total}
        totalPages={tenantsData.totalPages}
        currentPage={page}
        currentQuery={q}
      />
    </>
  );
}
