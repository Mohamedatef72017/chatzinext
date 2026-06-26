import { requireAdmin } from "@/lib/authz";
import { getLocale } from "@/lib/i18n";
import { getSupportAgentsData } from "@/lib/support-agents";
import { PageHeader } from "@/components/dashboard/page-header";
import { SupportAgentsManager } from "@/components/dashboard/support-agents-manager";

export const dynamic = "force-dynamic";

export default async function SupportAgentsPage() {
  const session = await requireAdmin();
  const [data, locale] = await Promise.all([
    getSupportAgentsData(session.user.tenantId),
    getLocale(),
  ]);
  const isAr = locale === "ar";

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAr ? "وكلاء الدعم" : "Support agents"}
        description={
          isAr
            ? "إدارة فريق الدعم الخاص بهذا المستأجر: حتى 4 وكلاء دعم و2 مديرين."
            : "Manage this tenant support team: up to 4 support agents and 2 managers."
        }
      />

      <SupportAgentsManager
        users={data.users}
        usage={data.usage}
        limits={data.limits}
        isAr={isAr}
      />
    </div>
  );
}
