"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { sectorsData } from "@/lib/sectors-content";
import { landingContent, type LandingLocale } from "@/lib/landing-content";

export function SectorPage({ locale, id }: { locale: LandingLocale; id: string }) {
  const copy = landingContent[locale];
  const isEnglish = copy.dir === "ltr";
  const ArrowIcon = isEnglish ? ArrowRight : ArrowLeft;
  
  const sector = (sectorsData[locale as keyof typeof sectorsData] || []).find((s: any) => s.id === id);
  
  if (!sector) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-primary-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sector not found</h1>
          <Link href={isEnglish ? "/" : locale === "ar-jo" ? "/ar-jo" : "/ar-ae"} className="mt-4 inline-block text-primary-600 hover:underline">
            Return Home
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
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-xl dark:border-secondary-300/25 dark:bg-primary-900/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Link href={isEnglish ? "/" : locale === "ar-jo" ? "/ar-jo" : "/ar-ae"} className="flex items-center gap-2 text-sm font-extrabold text-slate-600 transition hover:text-primary-700 dark:text-secondary-200">
            {isEnglish ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
            {isEnglish ? "Back to Home" : "العودة للرئيسية"}
          </Link>
        </div>
      </header>

      <section className="relative py-16 sm:py-24 overflow-hidden">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[400px] w-[800px] rounded-full bg-[#6119E6]/20 blur-[100px] dark:bg-[#E13382]/15 pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            
            {/* Content Side */}
            <div>
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-200 text-3xl dark:bg-primary-900 dark:border-slate-800">
                {sector.icon}
              </span>
              <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
                {sector.title}
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300">
                {sector.desc}
              </p>
              
              <ul className="mt-8 space-y-4">
                {[1, 2, 3].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#6119E6] dark:text-[#E13382]" />
                    <span className="text-base text-slate-700 dark:text-slate-200">
                      {isEnglish 
                        ? `Streamlined workflow and AI automation for ${sector.title} operations.`
                        : `أتمتة ذكية وسير عمل مخصص لقطاع ${sector.title} لتسهيل المهام اليومية.`}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-10">
                <Link
                  href="/register"
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-[#6119E6] px-8 py-3 text-base font-bold text-white shadow-lg transition hover:opacity-90 dark:bg-[#E13382]"
                >
                  {copy.primary}
                  <ArrowIcon size={18} />
                </Link>
              </div>
            </div>

            {/* Image Side */}
            <div className="rounded-2xl border border-slate-200/50 bg-white/40 p-2 shadow-2xl backdrop-blur-xl dark:border-slate-700/50 dark:bg-primary-900/40">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center text-center p-8 border border-slate-200 dark:border-slate-800">
                <div className="text-9xl opacity-20 dark:opacity-10 mb-8">{sector.icon}</div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">{isEnglish ? `${sector.title} Dashboard Overview` : `نظرة عامة على لوحة تحكم ${sector.title}`}</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{isEnglish ? "Interactive AI capabilities designed for this sector." : "قدرات ذكاء اصطناعي تفاعلية مصممة لهذا القطاع."}</p>
              </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
