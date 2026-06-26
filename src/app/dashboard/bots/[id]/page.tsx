import { notFound } from "next/navigation";
import { getBot } from "@/lib/dashboard-data";
import { getLocale } from "@/lib/i18n";
import { PageHeader } from "@/components/dashboard/page-header";
import { BotForm } from "@/components/dashboard/bot-form";
import { requireDashboardPermission } from "@/server/auth/guards";
import { permissions } from "@/server/permissions/permissions";

export default async function EditBotPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireDashboardPermission(permissions.aiManage);
  const { id } = await params;
  const bot = await getBot(session.user.tenantId, id);
  if (!bot) notFound();

  const locale = await getLocale();
  const isAr = locale === "ar";

  return (
    <>
      <PageHeader
        title={isAr ? "تعديل البوت" : "Edit bot"}
        description={isAr ? "غيّر الاسم والوصف وحالة التفعيل." : "Update the name, description, and activation status."}
      />
      <BotForm bot={bot} />
    </>
  );
}
