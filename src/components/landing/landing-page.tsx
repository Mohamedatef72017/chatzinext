"use client";

import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { Suspense, useState } from "react";
import { motion, Variants } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BadgeCheck,
  Bot,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Cpu,
  Database,
  Globe,
  Handshake,
  Headphones,
  Inbox,
  Key,
  Layers3,
  Languages,
  LockKeyhole,
  Menu,
  MessageSquare,
  MessagesSquare,
  Play,
  PlugZap,
  Route,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Workflow,
  User,
  X,
  Zap,
  Building,
  MapPin
} from "lucide-react";
import { FaWhatsapp, FaFacebookMessenger, FaEnvelope, FaLinkedinIn, FaTwitter, FaInstagram, FaYoutube } from "react-icons/fa";
import { LoginForm } from "@/components/auth/login-form";
import { landingContent, type LandingLocale } from "@/lib/landing-content";
import { sectorsData } from "@/lib/sectors-content";
import { useAuthStatus } from "@/components/landing/use-auth-status";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } }
};

const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.09 } }
};

const localeLinks: Array<{ locale: LandingLocale; href: string; label: string; short: string; flag: string }> = [
  { locale: "en", href: "/", label: "English", short: "EN", flag: "🇺🇸" },
  { locale: "ar-ae", href: "/ar-ae", label: "الإمارات", short: "AE", flag: "🇦🇪" },
  { locale: "ar-jo", href: "/ar-jo", label: "الأردن", short: "JO", flag: "🇯🇴" }
];

const workflowIcons = [Globe, Cpu, Send];
const featureIcons = [Bot, MessagesSquare, Handshake, Database, Workflow, BarChart3];
const channelIcons = [MessageSquare, Zap, Sparkles, Inbox, Bot, Settings];

function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`relative block shrink-0 overflow-hidden ${compact ? "h-10 w-10" : "h-11 w-28 sm:w-32"}`}>
      <img
        src="/profile_black_trans.png"
        alt="ChatZi"
        className="h-full w-full object-contain object-left dark:hidden"
      />
      <img
        src="/profile_white_trans.png"
        alt="ChatZi"
        className="hidden h-full w-full object-contain object-left dark:block scale-[1.3] origin-left"
      />
    </span>
  );
}

export function LandingPage({ locale, botId }: { locale: LandingLocale; botId?: string }) {
  const copy = landingContent[locale];
  const isEnglish = copy.dir === "ltr";
  const ArrowIcon = isEnglish ? ArrowRight : ArrowLeft;
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSectorsOpen, setIsSectorsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const activeLocale = localeLinks.find((item) => item.locale === locale) || localeLinks[0];
  const sectorBasePath = isEnglish ? "" : locale === "ar-jo" ? "/ar-jo" : "/ar-ae";
  const localizedPath = (path: string) => (isEnglish ? path : `${sectorBasePath}${path}`);
  const isAuthenticated = useAuthStatus();
  const signupLabel = isAuthenticated ? (isEnglish ? "Open dashboard" : "دخول لوحة التحكم") : copy.heroButtons?.signup;
  const tryLabel = isAuthenticated ? (isEnglish ? "Open dashboard" : "دخول لوحة التحكم") : copy.heroButtons?.try;
  const dashboardLabel = isEnglish ? "Dashboard" : "لوحة التحكم";
  const renderHeroTitle = () => {
    const words = copy.title.split(" ");
    return words.map((word, index) => {
      const normalized = word.replace(/[؟?،,.!]/g, "").toLowerCase();
      const isBrand = normalized === "chatzi";
      const shouldAccent = isBrand || (!copy.title.includes("ChatZi") && index === Math.floor(words.length / 2));

      return (
        <span key={`${word}-${index}`} className={shouldAccent ? "text-[#6119E6] dark:text-[#E13382]" : undefined}>
          {index === 0 ? "" : " "}
          {word}
        </span>
      );
    });
  };

  return (
    <main
      dir={copy.dir}
      lang={copy.lang}
      className="relative min-h-screen overflow-x-hidden bg-slate-50 font-sans text-slate-950 selection:bg-[#6119E6]/10 dark:bg-[#06030e] dark:text-white dark:selection:bg-[#E13382]/20"
    >
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-xl text-slate-950 dark:border-white/10 dark:bg-[#06030e]/90 dark:text-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={isEnglish ? "/" : locale === "ar-jo" ? "/ar-jo" : "/ar-ae"} className="flex items-center">
            <BrandLogo />
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {copy.nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-extrabold text-slate-600 transition hover:text-primary-700 dark:text-slate-300 dark:hover:text-white"
              >
                {item.label}
              </a>
            ))}

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
                      {sectorsData[locale as keyof typeof sectorsData]?.map((sector) => (
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
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLanguageOpen((open) => !open)}
                aria-expanded={isLanguageOpen}
                aria-label={isEnglish ? "Choose language" : "اختيار اللغة"}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm font-extrabold text-slate-700 transition hover:border-[#6119E6]/30 hover:bg-white hover:text-[#6119E6] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-[#E13382]/40 dark:hover:bg-white/10 dark:hover:text-[#E13382]"
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
                        href={item.href}
                        onClick={() => setIsLanguageOpen(false)}
                        className={`flex min-h-11 items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-extrabold transition ${active
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

                <Link
                  href="/register"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#6119E6] px-4 py-2 text-sm font-extrabold text-white shadow-lg shadow-[#6119E6]/25 transition hover:opacity-90 dark:bg-[#E13382]"
                >
                  <span>{copy.start}</span>
                  <ArrowIcon size={16} />
                </Link>
              </>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex lg:hidden rounded-lg px-2 py-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white dark:border-white/10 dark:bg-[#06030e]">
            <nav className="flex flex-col space-y-4 p-4">
              {copy.nav.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-base font-extrabold text-slate-600 transition hover:text-primary-700 dark:text-slate-300 dark:hover:text-white"
                >
                  {item.label}
                </a>
              ))}
              
              <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex flex-col gap-3">
                <div className="text-sm font-extrabold text-slate-500">{isEnglish ? "Sectors" : "القطاعات"}</div>
                {sectorsData[locale as keyof typeof sectorsData]?.map((sector) => (
                  <Link 
                    key={sector.id} 
                    href={`${sectorBasePath}/sectors/${sector.id}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-slate-50 dark:hover:bg-white/5"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-sm dark:bg-white/5">
                      {sector.icon}
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{sector.title}</h4>
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        )}
      </header>

      <section className="relative overflow-hidden bg-white text-slate-950 pt-8 pb-32 dark:bg-[#06030e] dark:text-white sm:pt-12 sm:pb-48">
        {/* Radiating perspective lines */}
        <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.12] pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="line-glow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="1" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
              </linearGradient>
            </defs>
            {Array.from({ length: 48 }).map((_, i) => {
              const x2 = (i / 47) * 200 - 50;
              return (
                <line
                  key={i}
                  x1="50%"
                  y1="-30%"
                  x2={`${x2}%`}
                  y2="100%"
                  stroke="url(#line-glow)"
                  strokeWidth="1"
                />
              );
            })}
          </svg>
        </div>

        {/* Centered abstract glow - Semi-circle dome behind image */}
        <div className="absolute left-1/2 bottom-0 -translate-x-1/2 h-[350px] w-[800px] sm:w-[1000px] rounded-t-full bg-[#6119E6]/25 blur-[80px] dark:bg-[#E13382]/35 pointer-events-none" />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="relative z-10 mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-2 lg:items-center sm:px-6 lg:px-8"
        >
          <motion.div variants={fadeUp} className="flex flex-col items-center text-center lg:items-start lg:text-start">
            <span className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-800 shadow-sm border border-slate-200/60 dark:bg-white/10 dark:text-slate-200 dark:border-white/5">
              <span className="rounded-full bg-[#6119E6] px-2 py-0.5 text-xs text-white dark:bg-[#E13382]">New</span>
              {copy.heroLabel} <ArrowIcon size={14} className="opacity-50" />
            </span>

            <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-950 dark:text-white sm:text-6xl">
              {renderHeroTitle()}
            </h1>

            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-600 dark:text-slate-300 sm:text-xl">
              {copy.subtitle}
            </p>

            <div className="mt-8 flex w-full max-w-sm flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:justify-center lg:justify-start">
              <Link
                href={localizedPath("/book")}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#6119E6] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#6119E6]/25 transition hover:opacity-90 dark:bg-[#E13382] dark:shadow-[#E13382]/25"
              >
                {copy.heroButtons?.demo}
              </Link>
              <Link
                href={isAuthenticated ? "/dashboard" : "/register"}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              >
                {signupLabel}
              </Link>
              <Link
                href={isAuthenticated ? "/dashboard" : "/register"}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-emerald-500/20 bg-emerald-50 px-5 py-2.5 text-sm font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
              >
                <Zap size={16} />
                {tryLabel}
              </Link>
            </div>
            <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
              {copy.heroButtons?.trySub}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:justify-start">
              {(isEnglish
                ? ["No credit card required", "14-day free trial", "Cancel anytime"]
                : ["لا حاجة لبطاقة", "تجربة 14 يوم", "إلغاء في أي وقت"]
              ).map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                  <CheckCircle2 size={16} className="text-[#6119E6] dark:text-[#E13382]" />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="relative mx-auto w-full max-w-xl sm:max-w-2xl lg:mx-0">
            <Image
              src="/newhero.png"
              alt={copy.imageAlt.hero}
              width={800}
              height={800}
              priority
              className="w-full object-contain drop-shadow-2xl"
            />
          </motion.div>
        </motion.div>

      </section>

      <section id="features" className="relative z-10 -mt-20 sm:-mt-32 pb-20 sm:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-3xl bg-white p-8 sm:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:bg-[#0c081c] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-200/50 dark:border-white/5">
          <div className="text-center">
            <h2 className="mx-auto max-w-3xl text-3xl font-extrabold leading-tight text-slate-950 dark:text-white sm:text-5xl">{copy.featuresTitle}</h2>
            {copy.featuresSubtitle && <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">{copy.featuresSubtitle}</p>}
          </div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-120px" }}
            className="mt-16 grid gap-10 sm:gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {copy.features.map(([title, text], index) => {
              const Icon = featureIcons[index] || Bot;
              return (
                <motion.article
                  variants={fadeUp}
                  key={title}
                  className="flex flex-col items-center text-center rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition hover:shadow-md dark:border-white/5 dark:bg-[#0c081c]/50"
                >
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#6119E6]/10 text-[#6119E6] dark:bg-[#E13382]/20 dark:text-[#E13382]">
                    <Icon size={32} strokeWidth={1.5} />
                  </span>
                  <h3 className="mt-6 text-xl font-extrabold text-slate-950 dark:text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{text}</p>
                </motion.article>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section id="workflow" className="relative z-20 py-20 sm:py-24">
        <div className="absolute left-0 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6119E6]/30 dark:bg-[#6119E6]/20 blur-[120px] pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-120px" }}
            className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center"
          >
            <div>
              <motion.p variants={fadeUp} className="text-sm font-extrabold uppercase tracking-wide text-secondary-600 dark:text-secondary-300">
                {copy.proof}
              </motion.p>
              <motion.h2 variants={fadeUp} className="mt-3 text-3xl font-extrabold leading-tight text-slate-950 dark:text-secondary-100 sm:text-5xl">
                {copy.workflowTitle}
              </motion.h2>
              <motion.p variants={fadeUp} className="mt-5 text-lg leading-8 text-slate-600 dark:text-secondary-100/85">
                {copy.workflowSubtitle}
              </motion.p>

              <motion.div variants={stagger} className="mt-8 space-y-3">
                {copy.workflow.map((step, index) => {
                  const Icon = workflowIcons[index] || CheckCircle2;
                  return (
                    <motion.div
                      variants={fadeUp}
                      key={step.title}
                      className="grid gap-4 rounded-lg border border-slate-200 bg-white/50 p-4 shadow-sm dark:border-secondary-300/30 dark:bg-primary-900/70 sm:grid-cols-[3rem_1fr]"
                    >
                      <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary-700 dark:bg-secondary-500 dark:text-white">
                        <Icon size={22} />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-extrabold text-slate-950 dark:text-secondary-100">{step.title}</h3>
                          <span className="rounded-md bg-secondary-50 px-2 py-1 text-xs font-bold text-secondary-700 dark:bg-secondary-500/20 dark:text-secondary-100">
                            {step.metric}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-secondary-100/80">{step.text}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>

            <motion.div variants={fadeUp} className="space-y-4">
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-xl shadow-slate-900/10 dark:border-secondary-300/30 dark:bg-primary-900/60 dark:shadow-primary-950/25">
                <Image
                  src="/images/omnichannel_channels.png"
                  alt={copy.imageAlt.channels}
                  width={1024}
                  height={1024}
                  className="aspect-[4/3] w-full object-cover object-center"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>



      <section id="channels" className="relative z-10 py-20 sm:py-24">
        <div className="absolute right-0 top-1/2 h-[600px] w-[600px] translate-x-1/3 -translate-y-1/2 rounded-full bg-[#E13382]/30 dark:bg-[#E13382]/20 blur-[120px] pointer-events-none" />
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-wide text-secondary-600 dark:text-secondary-300">{isEnglish ? "Our services" : "خدماتنا"}</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight text-slate-950 dark:text-secondary-100 sm:text-5xl">{copy.channelsTitle}</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-secondary-100/85">{copy.channelsSubtitle}</p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {copy.channels.map((channel, index) => {
                const Icon = channelIcons[index] || PlugZap;
                return (
                  <div key={channel} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-secondary-300/30 dark:bg-primary-900/70">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-primary-700 shadow-sm dark:bg-secondary-500 dark:text-white">
                      <Icon size={19} />
                    </span>
                    <span className="text-sm font-extrabold text-slate-800 dark:text-secondary-100">{channel}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10 dark:border-secondary-300/30 dark:bg-primary-900/65 dark:shadow-primary-950/25">
            <div className="relative overflow-hidden rounded-lg bg-slate-900">
              <video src="/promo.mp4" autoPlay loop muted playsInline className="aspect-video h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(2,6,23,0),rgba(2,6,23,0.86))] p-5 text-white">
                <div className="flex items-center gap-2 text-sm font-extrabold">
                  <Play size={16} className="text-secondary-300" />
                  {isEnglish ? "Workflow demo" : "عرض سير العمل"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="security" className="relative z-10 py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:px-8">
          <div>
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary-700 dark:bg-secondary-500 dark:text-white">
              <LockKeyhole size={24} />
            </span>
            <h2 className="mt-5 text-3xl font-extrabold leading-tight text-slate-950 dark:text-secondary-100 sm:text-5xl">{copy.securityTitle}</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-secondary-100/85">{copy.security}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              [ShieldCheck, isEnglish ? "Tenant-scoped data" : "عزل بيانات كل شركة"],
              [Key, isEnglish ? "Encrypted AI secrets" : "تشفير مفاتيح AI"],
              [BarChart3, isEnglish ? "Visible webhook logs" : "سجلات Webhook واضحة"],
              [User, isEnglish ? "Team routing control" : "تحكم بتوجيه المحادثات"]
            ].map(([Icon, label]) => {
              const SafeIcon = Icon as typeof ShieldCheck;
              return (
                <div key={label as string} className="rounded-lg border border-slate-200 bg-white p-5 dark:border-secondary-300/30 dark:bg-primary-900/65">
                  <SafeIcon size={22} className="text-secondary-600 dark:text-secondary-300" />
                  <p className="mt-4 text-sm font-extrabold text-slate-950 dark:text-secondary-100">{label as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>


      <section id="pricing" className="relative z-10 py-20 sm:py-24">
        <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6119E6]/30 dark:bg-[#6119E6]/20 blur-[150px] pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">

          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold leading-tight text-slate-950 dark:text-white sm:text-5xl">{copy.pricingTitle}</h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-300">{copy.pricing}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-4 mb-24">
            {[
              {
                name: isEnglish ? "Starter" : "الانطلاق",
                price: isEnglish ? "$39" : "39$",
                period: isEnglish ? "/month" : "/شهر",
                description: isEnglish ? "Start with a light setup. Includes 14 days free." : "ابدأ بنظام تشغيل خفيف من اليوم الأول. وتوسع عليه لاحقاً بدون ما تبدأ من صفر.",
                features: isEnglish
                  ? ["2,500 AI messages included/mo", "$10 per integration feature", "WhatsApp + Messenger + Instagram + Telegram + Web", "Omnichannel platform available for +$25"]
                  : ["2,500 رسالة ذكاء اصطناعي مشمولة شهرياً", "10$ لكل ميزة تكامل", "واتساب + ماسنجر + انستغرام + تيليغرام + الموقع", "المنصة متعددة القنوات متاحة بـ25$ إضافية"],
                button: isEnglish ? "Start Free Trial" : "ابدأ تجربتك المجانية",
                highlighted: false,
              },
              {
                name: isEnglish ? "Pro" : "النمو",
                price: isEnglish ? "$299" : "299$",
                period: isEnglish ? "/month" : "/شهر",
                description: isEnglish ? "Everything in Starter, plus dedicated human receptionist during working hours." : "كل شيء في Starter، مع موظف استقبال بشري مخصص خلال ساعات الدوام.",
                features: isEnglish
                  ? ["5,000 AI messages included/mo", "$10 per integration feature", "Human receptionist: 8 hours - Mon to Fri", "300 human conversations included/mo", "$0.25 per additional human conversation", "WhatsApp + Messenger + Instagram + Telegram + Web", "Omnichannel platform included"]
                  : ["5,000 رسالة ذكاء اصطناعي مشمولة شهرياً", "10$ لكل ميزة تكامل", "موظف استقبال بشري: 8 ساعات - الإثنين للجمعة", "300 محادثة بشرية مشمولة شهرياً", "0.25$ لكل محادثة بشرية إضافية", "واتساب + ماسنجر + انستغرام + تيليغرام + الموقع", "المنصة متعددة القنوات مشمولة"],
                button: isEnglish ? "Book a Demo" : "احجز عرضاً",
                highlighted: true,
              },
              {
                name: isEnglish ? "Enterprise" : "التوسع",
                price: isEnglish ? "$799" : "799$",
                period: isEnglish ? "/month" : "/شهر",
                description: isEnglish ? "Everything in Pro, with 24/7 human coverage for non-stop businesses." : "كل شيء في Pro، مع تغطية بشرية على مدار الساعة للأعمال اللي لا تتوقف.",
                features: isEnglish
                  ? ["10,000 AI messages included/mo", "$10 per integration feature", "Human receptionist: 24 hours - Mon to Fri", "600 human conversations included/mo", "$0.25 per additional human conversation", "WhatsApp + Messenger + Instagram + Telegram + Web", "Omnichannel platform included"]
                  : ["10,000 رسالة ذكاء اصطناعي مشمولة شهرياً", "10$ لكل ميزة تكامل", "موظف استقبال بشري: 24 ساعة - الإثنين للجمعة", "600 محادثة بشرية مشمولة شهرياً", "0.25$ لكل محادثة بشرية إضافية", "واتساب + ماسنجر + انستغرام + تيليغرام + الموقع", "المنصة متعددة القنوات مشمولة"],
                button: isEnglish ? "Book a Demo" : "احجز عرضاً",
                highlighted: false,
              },
              {
                name: isEnglish ? "+Enterprise" : "متخصص",
                price: isEnglish ? "Custom" : "مخصص",
                period: "",
                description: isEnglish ? "Full workflow design and custom launch planning suited for your operating environment." : "تصميم كامل لسير العمل، وتخطيط مخصص للإطلاق يناسب بيئتك التشغيلية.",
                features: isEnglish
                  ? ["Unlimited AI messages and full features", "Everything in Enterprise with custom workflow design", "Dedicated support and detailed launch planning", "Enterprise-grade human team model", "Omnichannel platform fully included", "Pricing based on your organization's needs"]
                  : ["رسائل ذكاء اصطناعي غير محدودة وميزات كاملة", "كل شيء في Enterprise مع تصميم مخصص لسير العمل", "دعم مخصص وتخطيط تفصيلي للإطلاق", "نموذج فريق بشري بمستوى المؤسسات", "المنصة متعددة القنوات مشمولة بالكامل", "التسعير يحدد وفق احتياجات مؤسستك"],
                button: isEnglish ? "Request Custom Pricing" : "اطلب عرض سعر مخصص",
                highlighted: false,
              }
            ].map((plan, i) => (
              <div key={i} className={`relative flex flex-col rounded-2xl border ${plan.highlighted ? 'border-[#6119E6] dark:border-[#E13382] shadow-2xl shadow-[#6119E6]/20' : 'border-slate-200 dark:border-white/10'} bg-white/50 dark:bg-[#0c081c]/50 p-6 backdrop-blur-xl`}>
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#6119E6] to-[#E13382] px-4 py-1 text-xs font-bold text-white whitespace-nowrap">
                    {isEnglish ? "Most Popular" : "الأكثر شهرة"}
                  </div>
                )}
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                <div className="mt-4 flex items-baseline text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white">
                  {plan.price}
                  <span className="ml-1 text-base lg:text-xl font-medium text-slate-500 dark:text-slate-400">{plan.period}</span>
                </div>
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 min-h-[60px]">{plan.description}</p>
                <ul className="mt-8 flex-1 space-y-4">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                      <CheckCircle2 size={18} className="shrink-0 text-[#6119E6] dark:text-[#E13382] mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/book"
                  className={`mt-8 block rounded-xl px-6 py-3 text-center text-sm font-bold transition ${plan.highlighted ? 'bg-[#6119E6] text-white hover:opacity-90 dark:bg-[#E13382]' : 'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20'}`}
                >
                  {plan.button}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 shadow-2xl dark:border-white/10">
            <video src="/promo.mp4" autoPlay loop muted playsInline className="aspect-video w-full object-cover" />
          </div>
        </div>
      </section>

      <section className="relative z-10 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-primary-100 bg-primary-950 px-6 py-12 text-white shadow-2xl shadow-primary-950/20 dark:border-secondary-300/25 dark:bg-[#06030e] sm:px-12">
            <div className="absolute end-0 top-0 h-full w-1 bg-[#6119E6] dark:bg-[#E13382]" />
            <div className="absolute -start-16 -top-16 h-40 w-40 rounded-full bg-[#6119E6]/20 blur-2xl dark:bg-[#E13382]/20" />
            <div className="absolute -bottom-20 end-20 h-48 w-48 rounded-full bg-[#6119E6]/40 blur-3xl dark:bg-[#E13382]/40" />
            <div className="relative flex flex-col items-center text-center gap-6">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6119E6] text-white shadow-lg dark:bg-[#E13382]">
                <Zap size={28} />
              </div>
              <h2 className="max-w-3xl text-4xl font-extrabold leading-tight text-white sm:text-5xl">{copy.ctaTitle}</h2>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">{copy.ctaSubtitle}</p>

              <div className="mt-4 flex flex-col gap-4 sm:flex-row flex-wrap justify-center">
                <Link
                  href="/book"
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-[#6119E6] px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:opacity-90 dark:bg-[#E13382]"
                >
                  {copy.heroButtons?.demo}
                </Link>
                <Link
                  href="/register"
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 border-white/50 bg-transparent px-8 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  {copy.heroButtons?.signup}
                </Link>
                <Link
                  href="/register"
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 border-emerald-500/30 bg-emerald-500/20 px-8 py-3 text-sm font-bold text-emerald-300 shadow-sm transition hover:bg-emerald-500/30"
                >
                  <Zap size={18} />
                  {copy.heroButtons?.try}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="relative z-10 py-16 sm:py-20 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2 items-stretch">
            {/* Contact Us Card */}
            <div className="rounded-3xl border border-slate-200 bg-white/50 p-8 shadow-lg backdrop-blur-xl dark:border-white/5 dark:bg-[#0c081c]/50">
               <h3 className="text-2xl font-extrabold text-slate-950 dark:text-white mb-8 text-center">{isEnglish ? "Contact Us" : "تواصل معنا"}</h3>
               <div className="flex flex-col gap-6">
                 {/* Company */}
                 <div className="flex items-center gap-4 justify-between">
                   <div className="text-right flex-1" dir={copy.dir}>
                     <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{isEnglish ? "Company" : "الشركة"}</p>
                     <p className="font-bold text-slate-900 dark:text-white">Chatzi AI Solutions FZE LLC</p>
                   </div>
                   <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#6119E6]/10 text-[#6119E6] dark:bg-[#E13382]/20 dark:text-[#E13382]">
                     <Building size={20} />
                   </div>
                 </div>
                 {/* Phone (WhatsApp) */}
                 <div className="flex items-center gap-4 justify-between">
                   <div className="text-right flex-1" dir={copy.dir}>
                     <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{isEnglish ? "WhatsApp" : "الهاتف (واتساب)"}</p>
                     <a href={`https://wa.me/${copy.contact?.phone?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="font-bold text-slate-900 hover:text-[#25D366] dark:text-white" dir="ltr">{copy.contact?.phone}</a>
                   </div>
                   <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366]">
                     <FaWhatsapp size={22} />
                   </div>
                 </div>
                 {/* Email */}
                 <div className="flex items-center gap-4 justify-between">
                   <div className="text-right flex-1" dir={copy.dir}>
                     <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{isEnglish ? "Email" : "البريد الإلكتروني"}</p>
                     <a href={`mailto:${copy.contact?.email}`} className="font-bold text-slate-900 hover:text-rose-500 dark:text-white">{copy.contact?.email}</a>
                   </div>
                   <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-500">
                     <FaEnvelope size={20} />
                   </div>
                 </div>
                 {/* Address */}
                 <div className="flex items-center gap-4 justify-between">
                   <div className="text-right flex-1" dir={copy.dir}>
                     <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{isEnglish ? "Address" : "العنوان"}</p>
                     <p className="text-sm font-bold text-slate-900 dark:text-white" dir="ltr">UAE, Ajman, Sheikh Khalifa Street, Amber Gem Tower, 26th Floor</p>
                   </div>
                   <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#6119E6]/10 text-[#6119E6] dark:bg-[#E13382]/20 dark:text-[#E13382]">
                     <MapPin size={20} />
                   </div>
                 </div>
               </div>
            </div>

            {/* Follow Us Card */}
            <div className="rounded-3xl border border-slate-200 bg-white/50 p-8 shadow-lg backdrop-blur-xl dark:border-white/5 dark:bg-[#0c081c]/50 flex flex-col">
               <h3 className="text-2xl font-extrabold text-slate-950 dark:text-white mb-8 text-center">{isEnglish ? "Follow Us" : "تابعنا"}</h3>
               <div className="flex-1 flex items-center justify-center gap-4 flex-wrap">
                  <a href="#" className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#6119E6]/10 text-[#6119E6] dark:bg-[#E13382]/20 dark:text-[#E13382] transition hover:scale-110">
                     <FaLinkedinIn size={28} />
                  </a>
                  <a href="#" className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#6119E6]/10 text-[#6119E6] dark:bg-[#E13382]/20 dark:text-[#E13382] transition hover:scale-110">
                     <FaTwitter size={28} />
                  </a>
                  <a href="#" className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#6119E6]/10 text-[#6119E6] dark:bg-[#E13382]/20 dark:text-[#E13382] transition hover:scale-110">
                     <FaInstagram size={28} />
                  </a>
                  <a href="#" className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#6119E6]/10 text-[#6119E6] dark:bg-[#E13382]/20 dark:text-[#E13382] transition hover:scale-110">
                     <FaYoutube size={28} />
                  </a>
               </div>
            </div>


          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-10 text-sm text-slate-500 dark:border-secondary-500/25 dark:bg-[#090615] dark:text-slate-300">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-4 sm:px-6 md:flex-row lg:px-8">
          <BrandLogo />
          <p className="text-center font-semibold">{copy.footer}</p>
          <div className="flex flex-wrap justify-center gap-4 text-xs font-extrabold">
            <Link href={localizedPath("/privacy")} className="hover:text-primary-700 dark:hover:text-white">{isEnglish ? "Privacy" : "الخصوصية"}</Link>
            <Link href={localizedPath("/terms")} className="hover:text-primary-700 dark:hover:text-white">{isEnglish ? "Terms" : "الشروط"}</Link>
            <Link href={localizedPath("/data-deletion")} className="hover:text-primary-700 dark:hover:text-white">{isEnglish ? "Data deletion" : "حذف البيانات"}</Link>
          </div>
        </div>
      </footer>

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

      {botId && <Script src="/widget.js" data-bot-id={botId} strategy="lazyOnload" />}
    </main>
  );
}
