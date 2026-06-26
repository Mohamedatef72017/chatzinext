import { PageHeader } from "@/components/dashboard/page-header";
import { BotForm } from "@/components/dashboard/bot-form";
import { getLocale } from "@/lib/i18n";
import { requireDashboardPermission } from "@/server/auth/guards";
import { permissions } from "@/server/permissions/permissions";

export default async function NewBotPage() {
  await requireDashboardPermission(permissions.aiManage);
  const locale = await getLocale();
  const isAr = locale === "ar";

  return (
    <>
      <PageHeader
        title={isAr ? "بوت جديد" : "New bot"}
        description={isAr ? "أنشئ بوتًا جديدًا واربطه بالقنوات لاحقًا." : "Create a new bot and connect it to channels later."}
      />
      <BotForm />
    </>
  );
}
