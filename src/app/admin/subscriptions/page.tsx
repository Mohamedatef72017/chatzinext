import { requirePlatformAdmin } from "@/lib/authz";
import { getSubscriptionAnalytics, getAllSubscriptions } from "@/lib/billing";
import { PageHeader } from "@/components/dashboard/page-header";
import { SubscriptionsDashboard } from "@/components/admin/subscriptions-dashboard";

export default async function AdminSubscriptionsPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  await requirePlatformAdmin();
  
  const searchParams = await props.searchParams;
  const page = typeof searchParams.page === "string" ? parseInt(searchParams.page, 10) : 1;

  const analytics = await getSubscriptionAnalytics();
  const data = await getAllSubscriptions(page, 20);

  return (
    <>
      <PageHeader
        title="الاشتراكات والإيرادات"
        description="تابع الإيرادات الشهرية (MRR) وحالات المشتركين في جميع الخطط لزيادة المبيعات."
      />
      <SubscriptionsDashboard 
        analytics={analytics} 
        subscriptions={data.subscriptions}
        currentPage={data.pagination.currentPage}
        totalPages={data.pagination.totalPages}
      />
    </>
  );
}
