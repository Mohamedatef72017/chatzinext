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
  Bot,
  CheckCircle2,
  ChevronDown,
  Cpu,
  Database,
  Globe,
  Inbox,
  Key,
  Languages,
  LockKeyhole,
  Menu,
  MessageSquare,
  Play,
  PlugZap,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
  X,
  Zap
} from "lucide-react";
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
const featureIcons = [Bot, Inbox, MessageSquare, User, Database, PlugZap];
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
        className="hidden h-full w-full object-contain object-left dark:block"
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
  const isAuthenticated = useAuthStatus();

  return (
    <main
      dir={copy.dir}
      lang={copy.lang}
      className="min-h-screen bg-slate-50 font-sans text-slate-950 selection:bg-[#6119E6]/10 dark:bg-[#06030e] dark:text-white dark:selection:bg-[#E13382]/20 overflow-x-hidden"
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
                          href={`/sectors/${sector.id}`}
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
            <div className="hidden items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 sm:flex dark:border-white/10 dark:bg-white/5">
              <Languages size={15} className="mx-1 text-slate-500 dark:text-slate-400" />
              {localeLinks.map((item) => {
                const active = item.locale === locale;
                return (
                  <Link
                    key={item.locale}
                    href={item.href}
                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-extrabold transition ${
                      active
                        ? "bg-white text-primary-700 shadow-sm dark:bg-white/10 dark:text-white"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    }`}
                    title={item.label}
                  >
                    <span className="text-base">{item.flag}</span>
                    <span>{item.short}</span>
                  </Link>
                );
              })}
            </div>

            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#6119E6] px-4 py-2 text-sm font-extrabold text-white shadow-lg shadow-[#6119E6]/25 transition hover:opacity-90 dark:bg-[#E13382]"
              >
                <span>{copy.secondary}</span>
                <ArrowIcon size={16} />
              </Link>
            ) : (
              <>
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="inline-flex rounded-lg px-3 py-2 text-sm font-extrabold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                >
                  {copy.login}
                </button>

                <Link
                  href="/register"
                  className="hidden sm:inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#6119E6] px-4 py-2 text-sm font-extrabold text-white shadow-lg shadow-[#6119E6]/25 transition hover:opacity-90 dark:bg-[#E13382]"
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
                    href={`/sectors/${sector.id}`}
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

      <section className="relative overflow-hidden bg-white text-slate-950 py-14 dark:bg-[#06030e] dark:text-white sm:py-24">
        {/* Radiating perspective lines */}
        <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.12] pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="line-glow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="1" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
              </linearGradient>
            </defs>
            {Array.from({ length: 24 }).map((_, i) => {
              const x2 = (i / 23) * 100;
              return (
                <line
                  key={i}
                  x1="50%"
                  y1="20%"
                  x2={`${x2}%`}
                  y2="100%"
                  stroke="url(#line-glow)"
                  strokeWidth="0.75"
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
          <motion.div variants={fadeUp} className="flex flex-col items-start text-start">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-800 shadow-sm border border-slate-200/60 dark:bg-white/10 dark:text-slate-200 dark:border-white/5">
              <span className="rounded-full bg-[#6119E6] px-2 py-0.5 text-xs text-white dark:bg-[#E13382]">New</span>
              {copy.heroLabel} <ArrowIcon size={14} className="opacity-50" />
            </span>

            <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-950 dark:text-white sm:text-6xl">
              {copy.title.split(' ').map((word, i, arr) => 
                i === Math.floor(arr.length / 2) ? (
                  <span key={i} className="text-[#6119E6] dark:text-[#E13382]"> {word} </span>
                ) : (
                  <span key={i}> {word} </span>
                )
              )}
            </h1>

            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-600 dark:text-slate-300 sm:text-xl">
              {copy.subtitle}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row flex-wrap">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/book"
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#6119E6] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#6119E6]/25 transition hover:opacity-90 dark:bg-[#E13382] dark:shadow-[#E13382]/25"
                >
                  {copy.heroButtons?.demo}
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/register"
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-emerald-500/20 bg-emerald-50 px-5 py-2.5 text-sm font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                >
                  <Zap size={16} />
                  {copy.heroButtons?.try}
                </Link>
              </motion.div>
            </div>
            <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
              {copy.heroButtons?.trySub}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-6">
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

          <motion.div variants={fadeUp} className="relative w-full max-w-2xl lg:mx-0 mx-auto">
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

      <section id="workflow" className="bg-white py-20 dark:bg-primary-950 sm:py-24">
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
                      className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-secondary-300/30 dark:bg-primary-900/70 sm:grid-cols-[3rem_1fr]"
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 dark:border-secondary-300/30 dark:bg-primary-900/70">
                  <div className="flex items-center gap-2 text-sm font-extrabold text-slate-950 dark:text-secondary-100">
                    <Inbox size={18} className="text-primary-700 dark:text-secondary-300" />
                    Smart Inbox
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-secondary-100/80">
                    {isEnglish ? "One queue for every customer entry point." : "صندوق واحد لكل نقاط دخول العملاء."}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 dark:border-secondary-300/30 dark:bg-primary-900/70">
                  <div className="flex items-center gap-2 text-sm font-extrabold text-slate-950 dark:text-secondary-100">
                    <ShieldCheck size={18} className="text-secondary-600 dark:text-secondary-300" />
                    Human handoff
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-secondary-100/80">
                    {isEnglish ? "Escalate with context, not confusion." : "تصعيد واضح مع كامل سياق المحادثة."}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="bg-slate-50 py-20 dark:bg-[#06030e] sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
                  className="flex flex-col items-center text-center px-4"
                >
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#6119E6] shadow-xl shadow-slate-200/50 dark:bg-white/5 dark:text-[#E13382] dark:shadow-none">
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

      <section id="channels" className="bg-white py-20 dark:bg-primary-950 sm:py-24">
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

      <section id="security" className="bg-slate-50 py-20 dark:bg-primary-900 sm:py-24">
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
              [User, isEnglish ? "Human handoff control" : "تحكم بالتسليم البشري"]
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

      <section className="bg-white py-20 dark:bg-primary-950 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 dark:border-secondary-300/30 dark:bg-primary-900/70">
              <p className="text-sm font-extrabold uppercase tracking-wide text-primary-700 dark:text-secondary-300">{isEnglish ? "Pricing" : "الأسعار"}</p>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight text-slate-950 dark:text-secondary-100">{copy.pricingTitle}</h2>
              <p className="mt-4 text-base leading-8 text-slate-600 dark:text-secondary-100/80">{copy.pricing}</p>
              <Link
                href="/book"
                className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#6119E6] px-5 py-3 text-sm font-extrabold text-white transition hover:opacity-90 dark:bg-[#E13382]"
              >
                {isEnglish ? "Book a workflow review" : "احجز مراجعة سير العمل"}
                <ArrowIcon size={17} />
              </Link>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-secondary-300/30 dark:bg-primary-900/70">
               <p className="text-sm font-extrabold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">{copy.contact?.title}</p>
               <h3 className="mt-3 text-2xl font-extrabold text-slate-950 dark:text-secondary-100">{copy.contact?.subtitle}</h3>
               
               <div className="mt-6 space-y-4">
                 <div className="flex items-center gap-4">
                   <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                     <MessageSquare size={20} />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-slate-900 dark:text-white">Email</p>
                     <a href={`mailto:${copy.contact?.email}`} className="text-sm text-slate-500 hover:text-[#6119E6] dark:text-slate-400 dark:hover:text-[#E13382]">{copy.contact?.email}</a>
                   </div>
                 </div>
                 <div className="flex items-center gap-4">
                   <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                     <Zap size={20} />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-slate-900 dark:text-white">WhatsApp / Phone</p>
                     <a href={`tel:${copy.contact?.phone}`} className="text-sm text-slate-500 hover:text-[#6119E6] dark:text-slate-400 dark:hover:text-[#E13382]" dir="ltr">{copy.contact?.phone}</a>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16 dark:bg-[#06030e] sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 shadow-2xl dark:border-white/10">
            <video src="/promo.mp4" autoPlay loop muted playsInline className="aspect-video w-full object-cover" />
          </div>
        </div>
      </section>

      <section className="bg-white py-16 dark:bg-primary-950 sm:py-20">
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

      <footer className="border-t border-slate-200 bg-white py-10 text-sm text-slate-500 dark:border-secondary-300/25 dark:bg-primary-900 dark:text-secondary-100">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-4 sm:px-6 md:flex-row lg:px-8">
          <BrandLogo />
          <p className="text-center font-semibold">{copy.footer}</p>
          <div className="flex flex-wrap justify-center gap-4 text-xs font-extrabold">
            <Link href="/privacy" className="hover:text-primary-700 dark:hover:text-secondary-300">{isEnglish ? "Privacy" : "الخصوصية"}</Link>
            <Link href="/terms" className="hover:text-primary-700 dark:hover:text-secondary-300">{isEnglish ? "Terms" : "الشروط"}</Link>
            <Link href="/data-deletion" className="hover:text-primary-700 dark:hover:text-secondary-300">{isEnglish ? "Data deletion" : "حذف البيانات"}</Link>
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
