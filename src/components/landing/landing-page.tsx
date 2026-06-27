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
  Cpu,
  Database,
  Globe,
  Inbox,
  Key,
  Languages,
  LockKeyhole,
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

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } }
};

const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.09 } }
};

const localeLinks: Array<{ locale: LandingLocale; href: string; label: string; short: string }> = [
  { locale: "en", href: "/", label: "English", short: "EN" },
  { locale: "ar-ae", href: "/ar-ae", label: "الإمارات", short: "AE" },
  { locale: "ar-jo", href: "/ar-jo", label: "الأردن", short: "JO" }
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

  return (
    <main
      dir={copy.dir}
      lang={copy.lang}
      className="min-h-screen bg-slate-100 font-sans text-slate-950 selection:bg-secondary-100 selection:text-secondary-900 dark:bg-primary-950 dark:text-secondary-50 dark:selection:bg-secondary-500 dark:selection:text-white"
    >
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-xl dark:border-secondary-300/25 dark:bg-primary-900/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={isEnglish ? "/" : locale === "ar-jo" ? "/ar-jo" : "/ar-ae"} className="flex items-center">
            <BrandLogo />
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {copy.nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-extrabold text-slate-600 transition hover:text-primary-700 dark:text-secondary-100 dark:hover:text-secondary-300"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 sm:flex dark:border-secondary-300/25 dark:bg-primary-900/70">
              <Languages size={15} className="mx-1 text-slate-500 dark:text-secondary-200" />
              {localeLinks.map((item) => {
                const active = item.locale === locale;
                return (
                  <Link
                    key={item.locale}
                    href={item.href}
                    className={`rounded-md px-2.5 py-1.5 text-xs font-extrabold transition ${
                      active
                        ? "bg-white text-primary-700 shadow-sm dark:bg-secondary-500 dark:text-white"
                        : "text-slate-500 hover:text-slate-900 dark:text-secondary-100 dark:hover:text-white"
                    }`}
                    title={item.label}
                  >
                    {item.short}
                  </Link>
                );
              })}
            </div>

            <button
              onClick={() => setIsLoginOpen(true)}
              className="hidden rounded-lg px-3 py-2 text-sm font-extrabold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 dark:text-secondary-100 dark:hover:bg-secondary-500/20 dark:hover:text-white sm:inline-flex"
            >
              {copy.login}
            </button>

            <Link
              href="/register"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-extrabold text-white shadow-lg shadow-primary-600/20 transition hover:bg-primary-700 dark:bg-secondary-500 dark:shadow-secondary-950/20 dark:hover:bg-secondary-600"
            >
              <span>{copy.start}</span>
              <ArrowIcon size={16} />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-14 dark:from-primary-950 dark:via-primary-900 dark:to-primary-950 sm:py-20">
        <div className="absolute end-[-5rem] top-24 hidden h-72 w-72 rotate-45 rounded-[2rem] bg-primary-600/90 dark:bg-secondary-500/25 lg:block" />
        <div className="absolute start-10 top-24 h-12 w-12 rotate-12 rounded-lg bg-primary-100 dark:bg-secondary-500/35" />
        <div className="absolute bottom-16 end-24 h-10 w-10 -rotate-12 rounded-lg bg-secondary-100 dark:bg-secondary-400/35" />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="relative z-10 mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8"
        >
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2 rounded-md bg-primary-100 px-3 py-1.5 text-xs font-extrabold text-primary-700 dark:bg-primary-900/70 dark:text-secondary-200">
              <Sparkles size={15} className="text-secondary-500" />
              {copy.heroLabel}
            </span>

            <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-normal text-slate-950 dark:text-secondary-100 sm:text-6xl">
              {copy.title}
            </h1>

            <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-slate-600 dark:text-secondary-100/85 sm:text-lg">
              {copy.subtitle}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-primary-700/25 transition hover:bg-primary-700 dark:bg-secondary-500 dark:hover:bg-secondary-600"
              >
                {copy.primary}
                <ArrowIcon size={18} />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-primary-200 bg-white px-6 py-3 text-sm font-extrabold text-primary-700 shadow-sm transition hover:border-primary-300 hover:bg-primary-50 dark:border-secondary-300/30 dark:bg-primary-900/40 dark:text-secondary-100 dark:hover:bg-secondary-500/15"
              >
                {copy.secondary}
              </Link>
            </div>

            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              {(isEnglish
                ? ["No credit card required", "14-day free trial", "Cancel anytime"]
                : ["لا حاجة لبطاقة", "تجربة 14 يوم", "إلغاء في أي وقت"]
              ).map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs font-extrabold text-slate-500 dark:text-secondary-100">
                  <CheckCircle2 size={16} className="text-primary-600 dark:text-secondary-300" />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="relative">
            <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xl shadow-primary-950/10 dark:border-secondary-300/30 dark:bg-primary-900/60 dark:shadow-primary-950/25">
              <div className="flex h-9 items-center gap-2 rounded-t-md border-b border-slate-100 bg-slate-50 px-3 dark:border-secondary-300/20 dark:bg-primary-900/45">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="mx-auto rounded-full bg-white px-16 py-1 text-[10px] font-bold text-slate-400 dark:bg-primary-900 dark:text-secondary-100">
                  chatzi.io
                </span>
              </div>
              <div className="relative overflow-hidden rounded-b-md bg-slate-50 dark:bg-primary-900/40">
                <Image
                  src="/images/chatzi-hero.png"
                  alt={copy.imageAlt.hero}
                  width={1672}
                  height={941}
                  priority
                  className="aspect-[16/10] w-full object-cover object-top"
                />
                <div className="absolute inset-x-4 bottom-4 grid gap-3 sm:grid-cols-3">
                  {copy.stats.slice(0, 3).map(([value, label]) => (
                    <div key={`${value}-${label}`} className="rounded-lg border border-white/60 bg-white/90 p-3 shadow-sm backdrop-blur dark:border-secondary-300/30 dark:bg-primary-900/90">
                      <p className="text-xl font-extrabold text-primary-700 dark:text-secondary-300">{value}</p>
                      <p className="text-xs font-bold text-slate-500 dark:text-secondary-100">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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

      <section id="features" className="bg-slate-50 py-20 dark:bg-primary-900 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-extrabold uppercase tracking-wide text-primary-700 dark:text-secondary-300">{isEnglish ? "Powerful features" : "مميزات قوية"}</p>
            <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-extrabold leading-tight text-slate-950 dark:text-secondary-100 sm:text-5xl">{copy.featuresTitle}</h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-secondary-100/85">{copy.featuresSubtitle}</p>
          </div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-120px" }}
            className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {copy.features.map(([title, text], index) => {
              const Icon = featureIcons[index] || Bot;
              return (
                <motion.article
                  variants={fadeUp}
                  key={title}
                  className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-secondary-300/30 dark:bg-primary-900/65"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-50 text-primary-700 dark:bg-secondary-500 dark:text-white">
                    <Icon size={21} />
                  </span>
                  <h3 className="mt-5 text-lg font-extrabold text-slate-950 dark:text-secondary-100">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-secondary-100/80">{text}</p>
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
              <p className="text-sm font-extrabold uppercase tracking-wide text-primary-700 dark:text-secondary-300">{isEnglish ? "Rollout" : "البداية"}</p>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight text-slate-950 dark:text-secondary-100">{copy.pricingTitle}</h2>
              <p className="mt-4 text-base leading-8 text-slate-600 dark:text-secondary-100/80">{copy.pricing}</p>
              <Link
                href="/book"
                className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-primary-700 dark:bg-secondary-500 dark:hover:bg-secondary-600"
              >
                {isEnglish ? "Book a workflow review" : "احجز مراجعة سير العمل"}
                <ArrowIcon size={17} />
              </Link>
            </div>

            <div className="space-y-3">
              <h3 className="text-2xl font-extrabold text-slate-950 dark:text-secondary-100">{copy.faqTitle}</h3>
              {copy.faq.map(([question, answer]) => (
                <details key={question} className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-secondary-300/30 dark:bg-primary-900/70">
                  <summary className="cursor-pointer list-none text-base font-extrabold text-slate-950 dark:text-secondary-100">
                    <span className="inline-flex w-full items-center justify-between gap-4">
                      {question}
                      <CheckCircle2 size={18} className="shrink-0 text-secondary-600 transition group-open:rotate-45 dark:text-secondary-300" />
                    </span>
                  </summary>
                  <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-secondary-100/80">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 dark:bg-primary-950 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-lg border border-primary-100 bg-primary-950 px-6 py-10 text-white shadow-2xl shadow-primary-950/20 dark:border-secondary-300/25 dark:bg-primary-900 sm:px-10">
            <div className="absolute end-0 top-0 h-full w-1 bg-secondary-500" />
            <div className="absolute -start-16 -top-16 h-40 w-40 rounded-full bg-secondary-500/20 blur-2xl" />
            <div className="absolute -bottom-20 end-20 h-48 w-48 rounded-full bg-primary-600/40 blur-3xl" />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-secondary-500 text-white shadow-lg shadow-secondary-950/20">
                  <Zap size={24} />
                </div>
                <h2 className="mt-5 max-w-3xl text-3xl font-extrabold leading-tight text-white sm:text-5xl">{copy.ctaTitle}</h2>
                <p className="mt-4 max-w-2xl text-base leading-8 text-secondary-100/90 sm:text-lg">{copy.ctaSubtitle}</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link
                  href="/register"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-secondary-500 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-secondary-600"
                >
                  {copy.start}
                  <ArrowIcon size={18} />
                </Link>
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-secondary-200/30 px-6 py-3 text-sm font-extrabold text-secondary-100 transition hover:bg-white/10"
                >
                  {copy.login}
                </button>
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
