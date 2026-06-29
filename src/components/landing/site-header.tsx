"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, Fragment } from "react";
import { ArrowLeft, ArrowRight, ChevronDown, Languages, Play, PlugZap, Globe, Sun, Moon, Menu, X } from "lucide-react";
import { landingContent, type LandingLocale } from "@/lib/landing-content";
import { sectorsData } from "@/lib/sectors-content";
import { useAuthStatus } from "@/components/landing/use-auth-status";
import { useTheme } from "@/components/theme-provider";
import { BrandLogo } from "./brand-logo";

export function SiteHeader({ locale, setIsLoginOpen }: { locale: LandingLocale; setIsLoginOpen: (val: boolean) => void }) {
  const pathname = usePathname() || "";
  const copy = landingContent[locale];
  const isEnglish = copy.dir === "ltr";
  const sectorLang = locale.startsWith("en") ? "en" : "ar-ae";
  const sectors = sectorsData[sectorLang as keyof typeof sectorsData] || sectorsData["ar-ae"];
  const ArrowIcon = isEnglish ? ArrowRight : ArrowLeft;
  
  const [isSectorsOpen, setIsSectorsOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [showArabicOptions, setShowArabicOptions] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { resolvedTheme, toggleTheme } = useTheme();

  const isAuthenticated = useAuthStatus();
  const dashboardLabel = isEnglish ? "Dashboard" : "لوحة التحكم";
  const sectorBasePath = isEnglish ? "" : locale === "ar-jo" ? "/ar-jo" : locale === "ar-eg" ? "/ar-eg" : "/ar-ae";

  const isArabic = locale.startsWith("ar");

  const arabicLinks = [
    { locale: "ar-jo", href: "/ar-jo", label: "الأردن", short: "JO", flag: "🇯🇴" },
    { locale: "ar-ae", href: "/ar-ae", label: "الإمارات", short: "AE", flag: "🇦🇪" },
    { locale: "ar-eg", href: "/ar-eg", label: "مصر", short: "EG", flag: "🇪🇬" }
  ];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-xl text-slate-950 dark:border-white/10 dark:bg-[#06030e]/90 dark:text-white">
        <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={isEnglish ? "/" : locale === "ar-jo" ? "/ar-jo" : locale === "ar-eg" ? "/ar-eg" : "/ar-ae"} className="flex items-center">
            <BrandLogo />
          </Link>

          <nav className="hidden items-center gap-1.5 lg:flex">
            {copy.nav.map((item) => {
              const isHash = item.href.startsWith("#");
              const targetHref = isHash ? `${sectorBasePath || "/"}${item.href}` : `${sectorBasePath}${item.href}`;
              // For hash links, we won't strictly match pathname.
              const isActive = !isHash && pathname === targetHref;

              return (
                <Fragment key={item.href}>
                  <Link
                    href={targetHref}
                    className={`text-sm font-extrabold transition ${
                      isActive 
                        ? "text-[#6119E6] dark:text-[#E13382]" 
                        : "text-slate-600 hover:text-primary-700 dark:text-slate-300 dark:hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                  <span className="text-slate-300 dark:text-slate-700 font-light select-none">|</span>
                </Fragment>
              );
            })}

            {/* Mega Menu for Sectors */}
            <div
              className="relative"
              onMouseEnter={() => setIsSectorsOpen(true)}
              onMouseLeave={() => setIsSectorsOpen(false)}
            >
              <button
                onClick={() => setIsSectorsOpen(!isSectorsOpen)}
                className="flex items-center gap-1 text-sm font-extrabold text-slate-600 transition hover:text-primary-700 dark:text-slate-300 dark:hover:text-white"
              >
                {isEnglish ? "Sectors" : "القطاعات"}
                <ChevronDown size={14} className={`transition-transform duration-200 ${isSectorsOpen ? "rotate-180" : ""}`} />
              </button>

              {isSectorsOpen && (
                <div className="absolute top-full end-[-150px] pt-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="w-[800px] rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#0c081c] dark:shadow-2xl dark:backdrop-blur-xl">
                    <div className="grid grid-cols-2 gap-4">
                      {sectors?.map((sector) => (
                        <Link
                          key={sector.id}
                          href={`${sectorBasePath}/sectors/${sector.id}`}
                          onClick={() => setIsSectorsOpen(false)}
                          className="flex items-start gap-4 rounded-lg p-3 transition hover:bg-slate-50 dark:hover:bg-white/5"
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-xl dark:bg-white/5">
                            {sector.icon}
                          </span>
                          <div>
                            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{sector.title}</h4>
                            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{sector.desc}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative" onMouseLeave={() => setShowArabicOptions(false)}>
              <button
                type="button"
                onClick={() => setIsLanguageOpen((open) => !open)}
                aria-expanded={isLanguageOpen}
                aria-label={isEnglish ? "Choose language" : "اختيار اللغة"}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm font-extrabold text-slate-700 transition hover:border-[#6119E6]/30 hover:bg-white hover:text-[#6119E6] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-[#E13382]/40 dark:hover:bg-white/10 dark:hover:text-[#E13382]"
              >
                <Globe size={15} className="text-slate-500 dark:text-slate-300" />
                <span className="text-base leading-none">{isArabic ? "العربية" : "English"}</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isLanguageOpen ? "rotate-180" : ""}`} />
              </button>

              {isLanguageOpen && (
                <div className="absolute end-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-xl shadow-slate-900/10 dark:border-white/10 dark:bg-[#0c081c] dark:shadow-black/30">
                  <Link
                    href="/"
                    onClick={() => setIsLanguageOpen(false)}
                    className={`flex min-h-11 items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-extrabold transition ${locale === "en" ? "bg-[#6119E6]/10 text-[#6119E6] dark:bg-[#E13382]/15 dark:text-[#E13382]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"}`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg leading-none">🇺🇸</span>
                      <span>English</span>
                    </span>
                  </Link>
                  <div
                    className={`flex cursor-pointer min-h-11 items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-extrabold transition ${locale.startsWith("ar") ? "bg-[#6119E6]/10 text-[#6119E6] dark:bg-[#E13382]/15 dark:text-[#E13382]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"}`}
                    onClick={() => setShowArabicOptions(!showArabicOptions)}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg leading-none">🌐</span>
                      <span>العربية</span>
                    </span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${showArabicOptions ? "rotate-180" : ""}`} />
                  </div>
                  {showArabicOptions && (
                    <div className="pl-6 pr-2 py-1 space-y-1">
                      {arabicLinks.map((item) => {
                        const active = item.locale === locale;
                        return (
                          <Link
                            key={item.locale}
                            href={item.href}
                            onClick={() => {
                              setIsLanguageOpen(false);
                              setShowArabicOptions(false);
                            }}
                            className={`flex min-h-10 items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-extrabold transition ${active ? "bg-slate-100 text-[#6119E6] dark:bg-white/10 dark:text-[#E13382]" : "text-slate-500 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"}`}
                          >
                            <span className="flex items-center gap-2">
                              <span className="text-lg leading-none">{item.flag}</span>
                              <span>{item.label}</span>
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition hover:border-[#6119E6]/30 hover:bg-white hover:text-[#6119E6] dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-[#E13382]/40 dark:hover:bg-white/10 dark:hover:text-[#E13382]"
              aria-label={locale.startsWith("ar") ? "تبديل المظهر" : "Toggle theme"}
              title={resolvedTheme === "dark" ? (locale.startsWith("ar") ? "الوضع المضيء" : "Light mode") : (locale.startsWith("ar") ? "الوضع المظلم" : "Dark mode")}
            >
              {resolvedTheme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#6119E6] px-4 py-2 text-sm font-extrabold text-white shadow-lg shadow-[#6119E6]/25 transition hover:opacity-90 dark:bg-[#E13382]"
              >
                <span>{dashboardLabel}</span>
                <ArrowIcon size={16} />
              </Link>
            ) : (
              <>
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="hidden rounded-lg px-3 py-2 text-sm font-extrabold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white sm:inline-flex"
                >
                  {copy.login}
                </button>

                {/* Mobile Login Button */}
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="inline-flex sm:hidden min-h-10 items-center justify-center gap-2 rounded-lg bg-[#6119E6] px-4 py-2 text-sm font-extrabold text-white shadow-lg shadow-[#6119E6]/25 transition hover:opacity-90 dark:bg-[#E13382]"
                >
                  <span>{copy.login}</span>
                  <ArrowIcon size={16} />
                </button>

                {/* Desktop Register Button */}
                <Link
                  href="/register"
                  className="hidden sm:inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#6119E6] px-4 py-2 text-sm font-extrabold text-white shadow-lg shadow-[#6119E6]/25 transition hover:opacity-90 dark:bg-[#E13382]"
                >
                  <span>{copy.start}</span>
                  <ArrowIcon size={16} />
                </Link>
              </>
            )}

            {/* Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 lg:hidden"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/20 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div 
            className={`fixed top-0 bottom-0 ${isEnglish ? 'right-0' : 'left-0'} w-64 bg-white shadow-2xl dark:bg-[#06030e] p-6 flex flex-col`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <BrandLogo compact />
              <button onClick={() => setIsMobileMenuOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10">
                <X size={20} />
              </button>
            </div>
            <nav className="flex flex-col gap-4">
              {copy.nav.map((item) => {
                const isHash = item.href.startsWith("#");
                const targetHref = isHash ? `${sectorBasePath || "/"}${item.href}` : `${sectorBasePath}${item.href}`;
                const isActive = !isHash && pathname === targetHref;

                return (
                  <Link
                    key={item.href}
                    href={targetHref}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`text-lg font-bold transition ${
                      isActive 
                        ? "text-[#6119E6] dark:text-[#E13382]" 
                        : "text-slate-800 hover:text-[#6119E6] dark:text-slate-200 dark:hover:text-[#E13382]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
                <p className="mb-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {isEnglish ? "Sectors" : "القطاعات"}
                </p>
                <div className="flex flex-col gap-3">
                  {sectors?.map((sector) => (
                    <Link
                      key={sector.id}
                      href={`${sectorBasePath}/sectors/${sector.id}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-base font-medium text-slate-700 transition hover:text-[#6119E6] dark:text-slate-300 dark:hover:text-[#E13382]"
                    >
                      {sector.title}
                    </Link>
                  ))}
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
