"use client";

import React, { useState } from "react";
import { CheckCircle2, ArrowRight, ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { landingContent, type LandingLocale } from "@/lib/landing-content";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";

export function PricingPage({ locale }: { locale: LandingLocale }) {
  const copy = landingContent[locale];
  const isEnglish = copy.dir === "ltr";
  const ArrowIcon = isEnglish ? ArrowRight : ArrowLeft;
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  let rate = 1;
  let currencySymbol = isEnglish ? "$" : "$";
  
  if (locale === "ar-eg") {
    rate = 50; // Approximate
    currencySymbol = " ج.م";
  } else if (locale === "ar-ae") {
    rate = 3.67;
    currencySymbol = " د.إ";
  } else if (locale === "ar-jo") {
    rate = 0.71;
    currencySymbol = " د.أ";
  }

  const formatPrice = (usd: number) => {
    const converted = Math.round(usd * rate);
    return isEnglish ? `${currencySymbol}${converted}` : `${converted}${currencySymbol}`;
  };

  const plans = [
    {
      name: isEnglish ? "Starter" : "الانطلاق",
      price: formatPrice(39),
      period: isEnglish ? "/month" : "/شهر",
      description: isEnglish ? "Start with a light setup. Includes 14 days free." : "ابدأ بنظام تشغيل خفيف من اليوم الأول. وتوسع عليه لاحقاً بدون ما تبدأ من صفر.",
      features: isEnglish
        ? [
            { text: "2,500 AI messages included/mo", desc: "Covers standard automated replies and interactions." },
            { text: `${formatPrice(10)} per integration feature`, desc: "Connect CRM, payments, or custom APIs." },
            { text: "WhatsApp + Messenger + Instagram + Telegram + Web", desc: "All core channels included out of the box." },
            { text: `Omnichannel platform available for +${formatPrice(25)}`, desc: "Manage all conversations in one unified inbox." }
          ]
        : [
            { text: "2,500 رسالة ذكاء اصطناعي مشمولة شهرياً", desc: "يغطي الردود الآلية القياسية والتفاعلات." },
            { text: `${formatPrice(10)} لكل ميزة تكامل`, desc: "لربط أنظمة الـ CRM والدفع وغيرها." },
            { text: "واتساب + ماسنجر + انستغرام + تيليغرام + الموقع", desc: "جميع القنوات الأساسية مشمولة." },
            { text: `المنصة متعددة القنوات متاحة بـ${formatPrice(25)} إضافية`, desc: "إدارة جميع المحادثات من صندوق وارد موحد." }
          ],
      button: isEnglish ? "Start Free Trial" : "ابدأ تجربتك المجانية",
      highlighted: false,
    },
    {
      name: isEnglish ? "Pro" : "النمو",
      price: formatPrice(299),
      period: isEnglish ? "/month" : "/شهر",
      description: isEnglish ? "Everything in Starter, plus dedicated human receptionist during working hours." : "كل شيء في Starter، مع موظف استقبال بشري مخصص خلال ساعات الدوام.",
      features: isEnglish
        ? [
            { text: "5,000 AI messages included/mo", desc: "Larger allowance for growing businesses." },
            { text: `${formatPrice(10)} per integration feature`, desc: "Connect CRM, payments, or custom APIs." },
            { text: "Human receptionist: 8 hours - Mon to Fri", desc: "Dedicated human support during work hours." },
            { text: "300 human conversations included/mo", desc: "Conversations handled fully by the human receptionist." },
            { text: `${formatPrice(0.25)} per additional human conversation`, desc: "Pay as you go if you exceed the human limit." },
            { text: "Omnichannel platform included", desc: "Manage all channels from one dashboard." }
          ]
        : [
            { text: "5,000 رسالة ذكاء اصطناعي مشمولة شهرياً", desc: "سعة أكبر للشركات النامية." },
            { text: `${formatPrice(10)} لكل ميزة تكامل`, desc: "لربط أنظمة الـ CRM والدفع وغيرها." },
            { text: "موظف استقبال بشري: 8 ساعات - الإثنين إلى الجمعة", desc: "دعم بشري مخصص خلال الدوام." },
            { text: "300 محادثة بشرية مشمولة شهرياً", desc: "محادثات تتم بالكامل عبر الموظف البشري." },
            { text: `${formatPrice(0.25)} لكل محادثة بشرية إضافية`, desc: "ادفع فقط مقابل ما تتجاوزه من الحد المسموح." },
            { text: "المنصة متعددة القنوات مشمولة", desc: "إدارة جميع القنوات من واجهة واحدة." }
          ],
      button: isEnglish ? "Start Free Trial" : "ابدأ تجربتك المجانية",
      highlighted: true,
    },
    {
      name: isEnglish ? "Enterprise" : "التوسع",
      price: formatPrice(799),
      period: isEnglish ? "/month" : "/شهر",
      description: isEnglish ? "Everything in Pro, with 24/7 human coverage for non-stop businesses." : "كل شيء في Pro، مع تغطية بشرية على مدار الساعة للأعمال اللي لا تتوقف.",
      features: isEnglish
        ? [
            { text: "10,000 AI messages included/mo", desc: "Massive allowance for high-volume businesses." },
            { text: `${formatPrice(10)} per integration feature`, desc: "Connect CRM, payments, or custom APIs." },
            { text: "Human receptionist: 24 hours - Mon to Fri", desc: "Round-the-clock dedicated human support." },
            { text: "600 human conversations included/mo", desc: "Conversations handled fully by the human receptionist." },
            { text: `${formatPrice(0.25)} per additional human conversation`, desc: "Pay as you go if you exceed the human limit." },
            { text: "WhatsApp + Messenger + Instagram + Telegram + Web", desc: "All core channels included out of the box." },
            { text: "Omnichannel platform included", desc: "Manage all conversations in one unified inbox." }
          ]
        : [
            { text: "10,000 رسالة ذكاء اصطناعي مشمولة شهرياً", desc: "سعة هائلة لتناسب الأعمال ذات الحجم العالي." },
            { text: `${formatPrice(10)} لكل ميزة تكامل`, desc: "لربط أنظمة الـ CRM والدفع وغيرها." },
            { text: "موظف استقبال بشري: 24 ساعة - الإثنين للجمعة", desc: "دعم بشري مخصص على مدار الساعة." },
            { text: "600 محادثة بشرية مشمولة شهرياً", desc: "محادثات تتم إدارتها بالكامل بواسطة موظف بشري." },
            { text: `${formatPrice(0.25)} لكل محادثة بشرية إضافية`, desc: "الدفع حسب الاستخدام في حال تجاوز الحد البشري." },
            { text: "واتساب + ماسنجر + انستغرام + تيليغرام + الموقع", desc: "جميع القنوات الأساسية مشمولة." },
            { text: "المنصة متعددة القنوات مشمولة", desc: "إدارة جميع المحادثات من صندوق وارد موحد." }
          ],
      button: isEnglish ? "Book a Demo" : "احجز عرضاً",
      highlighted: false,
    },
    {
      name: isEnglish ? "+Enterprise" : "متخصص",
      price: isEnglish ? "Custom" : "مخصص",
      period: "",
      description: isEnglish ? "Full workflow design and custom launch planning suited for your operating environment." : "تصميم كامل لسير العمل، وتخطيط مخصص للإطلاق يناسب بيئتك التشغيلية.",
      features: isEnglish
        ? [
            { text: "Unlimited AI messages and full features", desc: "No limits on AI messages or capabilities." },
            { text: "Everything in Enterprise with custom workflow design", desc: "Tailored to your specific operational needs." },
            { text: "Dedicated support and detailed launch planning", desc: "Hands-on setup and ongoing management." },
            { text: "Enterprise-grade human team model", desc: "Scalable human support teams available." },
            { text: "Omnichannel platform fully included", desc: "Manage all conversations in one unified inbox." },
            { text: "Pricing based on your organization's needs", desc: "Customized quote based on volume and requirements." }
          ]
        : [
            { text: "رسائل ذكاء اصطناعي غير محدودة وميزات كاملة", desc: "بدون حدود للرسائل أو القدرات." },
            { text: "كل شيء في Enterprise مع تصميم مخصص لسير العمل", desc: "مصمم لتلبية احتياجاتك التشغيلية المحددة." },
            { text: "دعم مخصص وتخطيط تفصيلي للإطلاق", desc: "إعداد مباشر وإدارة مستمرة." },
            { text: "نموذج فريق بشري بمستوى المؤسسات", desc: "فرق دعم بشري قابلة للتوسع متاحة." },
            { text: "المنصة متعددة القنوات مشمولة بالكامل", desc: "إدارة جميع المحادثات من صندوق وارد موحد." },
            { text: "التسعير يحدد وفق احتياجات مؤسستك", desc: "عرض سعر مخصص يعتمد على الحجم والمتطلبات." }
          ],
      button: isEnglish ? "Request Custom Pricing" : "اطلب عرض سعر مخصص",
      highlighted: false,
    }
  ];

  return (
    <div
      dir={copy.dir}
      lang={copy.lang}
      className="relative min-h-screen flex flex-col overflow-x-hidden bg-slate-50 font-sans text-slate-950 selection:bg-[#6119E6]/10 dark:bg-[#06030e] dark:text-white dark:selection:bg-[#E13382]/20"
    >
      <SiteHeader locale={locale} setIsLoginOpen={setIsLoginOpen} />

      <main className="flex-1 relative z-10 py-20 sm:py-24">
        <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6119E6]/30 dark:bg-[#6119E6]/20 blur-[150px] pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">

          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-6xl">{copy.pricingTitle}</h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-slate-600 dark:text-slate-300">
              {copy.pricing}
            </p>
            <div className="mt-4 max-w-2xl mx-auto rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 border border-amber-200 dark:border-amber-900/50">
              <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
                {isEnglish ? "Note: Prices may vary slightly based on the current exchange rate in your country." : "ملاحظة: السعر قد يتغير بشكل طفيف حسب سعر الصرف الحالي في بلدك."}
              </p>
            </div>
          </div>

          <div className="mt-20 grid gap-6 lg:grid-cols-4 mb-24">
            {plans.map((plan, i) => (
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
                  {plan.features.map((feature, idx) => {
                    const tooltipId = `${i}-${idx}`;
                    return (
                      <li key={idx} className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 size={18} className="shrink-0 text-[#6119E6] dark:text-[#E13382] mt-0.5" />
                          <span className="flex-1 leading-snug">{feature.text}</span>
                          <button
                            onClick={() => setActiveTooltip(activeTooltip === tooltipId ? null : tooltipId)}
                            className="shrink-0 text-slate-400 hover:text-[#6119E6] dark:hover:text-[#E13382] transition"
                            aria-label="More info"
                          >
                            <Info size={16} />
                          </button>
                        </div>
                        {activeTooltip === tooltipId && (
                          <div className="ml-7 mt-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-200/50 dark:bg-white/5 p-2 rounded animate-in fade-in zoom-in-95 duration-200">
                            {feature.desc}
                          </div>
                        )}
                      </li>
                    );
                  })}
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
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
