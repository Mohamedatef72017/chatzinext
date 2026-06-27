"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, Languages, X } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { sectorsData } from "@/lib/sectors-content";
import { landingContent, type LandingLocale } from "@/lib/landing-content";
import { useAuthStatus } from "@/components/landing/use-auth-status";

const localeLinks: Array<{ locale: LandingLocale; label: string; short: string; flag: string }> = [
  { locale: "en", label: "English", short: "EN", flag: "🇺🇸" },
  { locale: "ar-ae", label: "الإمارات", short: "AE", flag: "🇦🇪" },
  { locale: "ar-jo", label: "الأردن", short: "JO", flag: "🇯🇴" }
];

function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`relative block shrink-0 overflow-hidden ${compact ? "h-10 w-10" : "h-11 w-28 sm:w-32"}`}>
      <img src="/profile_black_trans.png" alt="ChatZi" className="h-full w-full object-contain object-left dark:hidden" />
      <img src="/profile_white_trans.png" alt="ChatZi" className="hidden h-full w-full object-contain object-left dark:block" />
    </span>
  );
}

export function SectorPage({ locale, id }: { locale: LandingLocale; id: string }) {
  const copy = landingContent[locale];
  const isEnglish = copy.dir === "ltr";
  const ArrowIcon = isEnglish ? ArrowRight : ArrowLeft;
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isSectorsOpen, setIsSectorsOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const activeLocale = localeLinks.find((item) => item.locale === locale) || localeLinks[0];
  const homeHref = isEnglish ? "/" : locale === "ar-jo" ? "/ar-jo" : "/ar-ae";
  const sectorBasePath = isEnglish ? "" : locale === "ar-jo" ? "/ar-jo" : "/ar-ae";
  const isAuthenticated = useAuthStatus();
  const accountHref = isAuthenticated ? "/dashboard" : "/register";
  const accountLabel = isAuthenticated ? (isEnglish ? "Dashboard" : "لوحة التحكم") : copy.start;
  const sectorHref = (targetLocale: LandingLocale) => {
    if (targetLocale === "en") return `/sectors/${id}`;
    return `/${targetLocale}/sectors/${id}`;
  };
  
  const sector = (sectorsData[locale as keyof typeof sectorsData] || []).find((s: any) => s.id === id);
  const benefits = sector?.benefits || [];
  
  if (!sector) {
    return (
      <div dir={copy.dir} className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-primary-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isEnglish ? "Sector not found" : "لم يتم العثور على القطاع"}
          </h1>
          <Link href={homeHref} className="mt-4 inline-block text-primary-600 hover:underline">
            {isEnglish ? "Return Home" : "العودة للرئيسية"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main
      dir={copy.dir}
      lang={copy.lang}
      className="min-h-screen bg-slate-50 font-sans text-slate-950 dark:bg-primary-950 dark:text-secondary-50"
    >
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl dark:bg-[#06030e]/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href={homeHref} className="flex items-center">
            <BrandLogo />
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {copy.nav.map((item) => (
              <Link
                key={item.href}
                href={`${homeHref}${item.href}`}
                className="text-sm font-extrabold text-slate-600 transition hover:text-primary-700 dark:text-slate-300 dark:hover:text-white"
              >
                {item.label}
              </Link>
            ))}

            <div
              className="relative"
              onMouseEnter={() => setIsSectorsOpen(true)}
              onMouseLeave={() => setIsSectorsOpen(false)}
            >
              <button
                type="button"
                onClick={() => setIsSectorsOpen((open) => !open)}
                className="flex items-center gap-1 text-sm font-extrabold text-slate-600 transition hover:text-primary-700 dark:text-slate-300 dark:hover:text-white"
              >
                {isEnglish ? "Sectors" : "القطاعات"}
                <ChevronDown size={14} className={`transition-transform duration-200 ${isSectorsOpen ? "rotate-180" : ""}`} />
              </button>

              {isSectorsOpen && (
                <div className="absolute top-full end-[-150px] z-50 pt-4">
                  <div className="w-[800px] rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#0c081c]">
                    <div className="grid grid-cols-2 gap-4">
                      {sectorsData[locale as keyof typeof sectorsData]?.map((item) => (
                        <Link
                          key={item.id}
                          href={`${sectorBasePath}/sectors/${item.id}`}
                          onClick={() => setIsSectorsOpen(false)}
                          className="flex items-start gap-4 rounded-lg p-3 transition hover:bg-slate-50 dark:hover:bg-white/5"
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-xl dark:bg-white/5">
                            {item.icon}
                          </span>
                          <span>
                            <span className="block text-sm font-extrabold text-slate-900 dark:text-white">{item.title}</span>
                            <span className="mt-1 block text-xs font-medium text-slate-500 dark:text-slate-400">{item.desc}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLanguageOpen((open) => !open)}
              aria-expanded={isLanguageOpen}
              aria-label={isEnglish ? "Choose language" : "اختيار اللغة"}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-extrabold text-slate-700 shadow-sm transition hover:border-[#6119E6]/30 hover:text-[#6119E6] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-[#E13382]/40 dark:hover:text-[#E13382]"
            >
              <Languages size={15} className="text-slate-500 dark:text-slate-300" />
              <span className="text-base leading-none">{activeLocale.flag}</span>
              <span className="hidden sm:inline">{activeLocale.short}</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${isLanguageOpen ? "rotate-180" : ""}`} />
            </button>

            {isLanguageOpen && (
              <div className="absolute end-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-xl shadow-slate-900/10 dark:border-white/10 dark:bg-[#0c081c] dark:shadow-black/30">
                {localeLinks.map((item) => {
                  const active = item.locale === locale;
                  return (
                    <Link
                      key={item.locale}
                      href={sectorHref(item.locale)}
                      onClick={() => setIsLanguageOpen(false)}
                      className={`flex min-h-11 items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-extrabold transition ${
                        active
                          ? "bg-[#6119E6]/10 text-[#6119E6] dark:bg-[#E13382]/15 dark:text-[#E13382]"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-lg leading-none">{item.flag}</span>
                        <span>{item.label}</span>
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">{item.short}</span>
                    </Link>
                  );
                })}
              </div>
              )}
            </div>

            {!isAuthenticated ? (
              <button
                onClick={() => setIsLoginOpen(true)}
                className="hidden rounded-lg px-3 py-2 text-sm font-extrabold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white sm:inline-flex"
              >
                {copy.login}
              </button>
            ) : null}

            <Link
              href={accountHref}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#6119E6] px-4 py-2 text-sm font-extrabold text-white shadow-lg shadow-[#6119E6]/25 transition hover:opacity-90 dark:bg-[#E13382]"
            >
              <span>{accountLabel}</span>
              <ArrowIcon size={16} />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative py-16 sm:py-24 overflow-hidden">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[400px] w-[800px] rounded-full bg-[#6119E6]/20 blur-[100px] dark:bg-[#E13382]/15 pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            
            {/* Content Side */}
            <div className="text-center md:text-start">
              <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white text-3xl shadow-sm dark:border-slate-800 dark:bg-primary-900 md:mx-0">
                {sector.icon}
              </span>
              <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
                {sector.title}
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300">
                {sector.desc}
              </p>
              
              <ul className="mx-auto mt-8 max-w-xl space-y-4 md:mx-0">
                {benefits.map((item) => (
                  <li key={item} className="flex items-start justify-center gap-3 text-center md:justify-start md:text-start">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#6119E6] dark:text-[#E13382]" />
                    <span className="text-base text-slate-700 dark:text-slate-200">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-10 flex justify-center md:justify-start">
                <Link
                  href={accountHref}
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-[#6119E6] px-8 py-3 text-base font-bold text-white shadow-lg transition hover:opacity-90 dark:bg-[#E13382]"
                >
                  {isAuthenticated ? (isEnglish ? "Open dashboard" : "دخول لوحة التحكم") : copy.primary}
                  <ArrowIcon size={18} />
                </Link>
              </div>
            </div>

            {/* Image Side */}
            <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200/50 bg-white/40 p-2 shadow-2xl backdrop-blur-xl dark:border-slate-700/50 dark:bg-primary-900/40 md:max-w-none">
              <div className="relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#0c081c]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(97,25,230,0.22),transparent_58%)] dark:bg-[radial-gradient(circle_at_center,rgba(225,51,130,0.20),transparent_58%)]" />
                <div className="relative flex h-36 w-36 items-center justify-center rounded-3xl border border-[#6119E6]/20 bg-[#6119E6]/10 text-7xl shadow-2xl shadow-[#6119E6]/15 dark:border-[#E13382]/25 dark:bg-[#E13382]/10 dark:shadow-[#E13382]/10 sm:h-44 sm:w-44 sm:text-8xl">
                  {sector.icon}
                </div>
                <h3 className="relative mt-8 text-xl font-bold text-slate-800 dark:text-slate-200">
                  {isEnglish ? `${sector.title} AI Workspace` : `مساحة عمل ذكية لقطاع ${sector.title}`}
                </h3>
                <p className="relative mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {isEnglish ? "A focused automation flow designed around this sector." : "تدفق أتمتة واضح ومصمم حول احتياجات هذا القطاع."}
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {isLoginOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="relative">
            <button
              onClick={() => setIsLoginOpen(false)}
              className="absolute end-4 top-4 z-50 rounded-lg bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-950"
              title="Close"
            >
              <X size={20} />
            </button>
            <Suspense fallback={<div className="rounded-lg bg-white p-6 text-center text-sm text-slate-600">Loading...</div>}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      )}
    </main>
  );
}
