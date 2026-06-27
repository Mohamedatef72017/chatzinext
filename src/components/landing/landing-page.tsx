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

export function LandingPage({ locale, botId }: { locale: LandingLocale; botId?: string }) {
  const copy = landingContent[locale];
  const isEnglish = copy.dir === "ltr";
  const ArrowIcon = isEnglish ? ArrowRight : ArrowLeft;
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <main
      dir={copy.dir}
      lang={copy.lang}
      className="theme-rescue min-h-screen bg-white font-sans text-slate-950 selection:bg-secondary-100 selection:text-secondary-900"
    >
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={isEnglish ? "/" : locale === "ar-jo" ? "/ar-jo" : "/ar-ae"} className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-slate-950 shadow-sm">
              <img src="/images/logo.png" alt="ChatZi" className="h-full w-full object-contain" />
            </span>
            <span className="text-xl font-extrabold tracking-tight text-slate-950">ChatZi</span>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {copy.nav.map((item) => (
              <a key={item.href} href={item.href} className="text-sm font-semibold text-slate-600 transition hover:text-primary-700">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 sm:flex">
              <Languages size={15} className="mx-1 text-slate-500" />
              {localeLinks.map((item) => {
                const active = item.locale === locale;
                return (
                  <Link
                    key={item.locale}
                    href={item.href}
                    className={`rounded-md px-2.5 py-1.5 text-xs font-bold transition ${
                      active ? "bg-white text-primary-700 shadow-sm" : "text-slate-500 hover:text-slate-900"
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
              className="hidden rounded-lg px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 sm:inline-flex"
            >
              {copy.login}
            </button>

            <Link
              href="/register"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-primary-900/20 transition hover:bg-primary-800"
            >
              <span>{copy.start}</span>
              <ArrowIcon size={16} />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative min-h-[82svh] overflow-hidden bg-slate-950 text-white">
        <Image
          src="/images/chatzi-hero.png"
          alt={copy.imageAlt.hero}
          fill
          priority
          sizes="100vw"
          className="object-cover object-top opacity-30"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.94),rgba(17,24,39,0.82),rgba(97,25,230,0.42))]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,rgba(2,6,23,0),rgba(2,6,23,0.96))]" />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="relative z-10 mx-auto flex max-w-7xl flex-col justify-center px-4 py-20 sm:px-6 lg:min-h-[calc(82svh-4rem)] lg:px-8"
        >
          <motion.div variants={fadeUp} className="max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-white shadow-sm backdrop-blur">
              <Sparkles size={16} className="text-secondary-300" />
              {copy.heroLabel}
            </span>

            <h1 className="mt-7 max-w-5xl text-4xl font-extrabold leading-tight tracking-normal text-white sm:text-6xl lg:text-7xl">
              {copy.title}
            </h1>

            <p className="mt-6 max-w-3xl text-base font-medium leading-8 text-slate-200 sm:text-xl">
              {copy.subtitle}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-secondary-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-secondary-950/30 transition hover:bg-secondary-700"
              >
                {copy.primary}
                <ArrowIcon size={18} />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/20 bg-white/10 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-white/15"
              >
                {copy.secondary}
              </Link>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-12 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {copy.stats.map(([value, label]) => (
              <div key={`${value}-${label}`} className="rounded-lg border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-2xl font-extrabold text-white">{value}</p>
                <p className="mt-1 text-sm font-semibold text-slate-300">{label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      <section id="workflow" className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-120px" }}
            className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center"
          >
            <div>
              <motion.p variants={fadeUp} className="text-sm font-extrabold uppercase tracking-wide text-secondary-600">
                {copy.proof}
              </motion.p>
              <motion.h2 variants={fadeUp} className="mt-3 text-3xl font-extrabold leading-tight text-slate-950 sm:text-5xl">
                {copy.workflowTitle}
              </motion.h2>
              <motion.p variants={fadeUp} className="mt-5 text-lg leading-8 text-slate-600">
                {copy.workflowSubtitle}
              </motion.p>

              <motion.div variants={stagger} className="mt-8 space-y-3">
                {copy.workflow.map((step, index) => {
                  const Icon = workflowIcons[index] || CheckCircle2;
                  return (
                    <motion.div
                      variants={fadeUp}
                      key={step.title}
                      className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[3rem_1fr]"
                    >
                      <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                        <Icon size={22} />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-extrabold text-slate-950">{step.title}</h3>
                          <span className="rounded-md bg-secondary-50 px-2 py-1 text-xs font-bold text-secondary-700">
                            {step.metric}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-7 text-slate-600">{step.text}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>

            <motion.div variants={fadeUp} className="space-y-4">
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-xl shadow-slate-900/10">
                <Image
                  src="/images/omnichannel_channels.png"
                  alt={copy.imageAlt.channels}
                  width={1024}
                  height={1024}
                  className="aspect-[4/3] w-full object-cover object-center"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-2 text-sm font-extrabold text-slate-950">
                    <Inbox size={18} className="text-primary-700" />
                    Smart Inbox
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {isEnglish ? "One queue for every customer entry point." : "صندوق واحد لكل نقاط دخول العملاء."}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-2 text-sm font-extrabold text-slate-950">
                    <ShieldCheck size={18} className="text-secondary-600" />
                    Human handoff
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {isEnglish ? "Escalate with context, not confusion." : "تصعيد واضح مع كامل سياق المحادثة."}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-wide text-primary-700">{isEnglish ? "Product" : "المنتج"}</p>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight text-slate-950 sm:text-5xl">{copy.featuresTitle}</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">{copy.featuresSubtitle}</p>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg shadow-slate-900/10">
              <div className="flex h-10 items-center gap-2 border-b border-slate-200 bg-slate-100 px-4">
                <span className="h-2.5 w-2.5 rounded-md bg-secondary-500" />
                <span className="h-2.5 w-2.5 rounded-md bg-primary-600" />
                <span className="h-2.5 w-2.5 rounded-md bg-emerald-500" />
                <span className="ms-auto text-xs font-bold text-slate-500">ChatZi workspace</span>
              </div>
              <Image
                src="/images/chatzi-hero.png"
                alt={copy.imageAlt.dashboard}
                width={1672}
                height={941}
                className="aspect-video w-full object-cover object-top"
              />
            </div>
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
                  className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary-50 text-secondary-700">
                    <Icon size={21} />
                  </span>
                  <h3 className="mt-5 text-lg font-extrabold text-slate-950">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
                </motion.article>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section id="channels" className="bg-white py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-wide text-secondary-600">{isEnglish ? "Channels" : "القنوات"}</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight text-slate-950 sm:text-5xl">{copy.channelsTitle}</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">{copy.channelsSubtitle}</p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {copy.channels.map((channel, index) => {
                const Icon = channelIcons[index] || PlugZap;
                return (
                  <div key={channel} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-primary-700 shadow-sm">
                      <Icon size={19} />
                    </span>
                    <span className="text-sm font-extrabold text-slate-800">{channel}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-950 p-3 shadow-xl shadow-slate-900/20">
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

      <section id="security" className="bg-slate-950 py-20 text-white sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:px-8">
          <div>
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10 text-secondary-300">
              <LockKeyhole size={24} />
            </span>
            <h2 className="mt-5 text-3xl font-extrabold leading-tight sm:text-5xl">{copy.securityTitle}</h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">{copy.security}</p>
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
                <div key={label as string} className="rounded-lg border border-white/10 bg-white/5 p-5">
                  <SafeIcon size={22} className="text-secondary-300" />
                  <p className="mt-4 text-sm font-extrabold text-white">{label as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-extrabold uppercase tracking-wide text-primary-700">{isEnglish ? "Rollout" : "البداية"}</p>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight text-slate-950">{copy.pricingTitle}</h2>
              <p className="mt-4 text-base leading-8 text-slate-600">{copy.pricing}</p>
              <Link
                href="/book"
                className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary-700 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-primary-800"
              >
                {isEnglish ? "Book a workflow review" : "احجز مراجعة سير العمل"}
                <ArrowIcon size={17} />
              </Link>
            </div>

            <div className="space-y-3">
              <h3 className="text-2xl font-extrabold text-slate-950">{copy.faqTitle}</h3>
              {copy.faq.map(([question, answer]) => (
                <details key={question} className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <summary className="cursor-pointer list-none text-base font-extrabold text-slate-950">
                    <span className="inline-flex w-full items-center justify-between gap-4">
                      {question}
                      <CheckCircle2 size={18} className="shrink-0 text-secondary-600 transition group-open:rotate-45" />
                    </span>
                  </summary>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-secondary-600 py-20 text-white sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-white/15">
            <Zap size={26} />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold leading-tight sm:text-5xl">{copy.ctaTitle}</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/90">{copy.ctaSubtitle}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-extrabold text-primary-800 transition hover:bg-slate-100"
            >
              {copy.start}
              <ArrowIcon size={18} />
            </Link>
            <button
              onClick={() => setIsLoginOpen(true)}
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/25 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-white/10"
            >
              {copy.login}
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-10 text-sm text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-4 sm:px-6 md:flex-row lg:px-8">
          <div className="flex items-center gap-3">
            <img src="/images/logo.png" alt="ChatZi" className="h-8 w-8 rounded-lg" />
            <span className="font-extrabold text-slate-800">ChatZi</span>
          </div>
          <p className="text-center font-semibold">{copy.footer}</p>
          <div className="flex flex-wrap justify-center gap-4 text-xs font-bold">
            <Link href="/privacy" className="hover:text-primary-700">{isEnglish ? "Privacy" : "الخصوصية"}</Link>
            <Link href="/terms" className="hover:text-primary-700">{isEnglish ? "Terms" : "الشروط"}</Link>
            <Link href="/data-deletion" className="hover:text-primary-700">{isEnglish ? "Data deletion" : "حذف البيانات"}</Link>
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
