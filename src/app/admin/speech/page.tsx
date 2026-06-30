import { requirePlatformAdmin } from "@/lib/authz";
import { PageHeader } from "@/components/dashboard/page-header";
import { SpeechSettingsAdmin } from "@/components/admin/speech-settings-admin";

export default async function AdminSpeechSettingsPage() {
  await requirePlatformAdmin();

  return (
    <>
      <PageHeader
        title="إعدادات الصوت"
        description="إدارة تفريغ الرسائل الصوتية للذكاء الاصطناعي بدون كشف مفاتيح API للمستخدمين."
      />
      <SpeechSettingsAdmin />
    </>
  );
}
