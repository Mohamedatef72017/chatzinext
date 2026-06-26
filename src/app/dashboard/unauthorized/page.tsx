import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { getLocale } from "@/lib/i18n";

export default async function UnauthorizedPage({
  searchParams,
}: {
  searchParams: Promise<{ permission?: string }>;
}) {
  const [locale, params] = await Promise.all([getLocale(), searchParams]);
  const isAr = locale === "ar";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center">
      <section className="panel p-8 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          <ShieldAlert size={32} aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-black text-ink">
          {isAr ? "غير مصرح لك بفتح هذه الصفحة" : "You are not authorized to open this page"}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500 dark:text-slate-400">
          {isAr
            ? "هذه الصفحة تحتاج صلاحية غير مفعلة لحسابك. تواصل مع مدير الحساب إذا كنت تحتاج الوصول إليها."
            : "This page requires a permission that is not enabled for your account. Contact an account manager if you need access."}
        </p>
        {params.permission ? (
          <p className="mx-auto mt-4 w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300" dir="ltr">
            {params.permission}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Link href="/dashboard" className="btn-primary justify-center">
            {isAr ? "العودة للرئيسية" : "Back to dashboard"}
          </Link>
          <Link href="/dashboard/conversations" className="btn-secondary justify-center">
            {isAr ? "فتح المحادثات" : "Open conversations"}
          </Link>
        </div>
      </section>
    </div>
  );
}
