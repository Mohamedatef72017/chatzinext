const arabicCopy = (marketName: "الإمارات" | "الأردن", marketLabel: "Arabic - UAE" | "Arabic - Jordan") => ({
  lang: marketName === "الإمارات" ? "ar-AE" : "ar-JO",
  dir: "rtl",
  marketName,
  marketLabel,
  nav: [
    { label: "آلية العمل", href: "#workflow" },
    { label: "المميزات", href: "#features" },
    { label: "القنوات", href: "#channels" },
    { label: "الأمان", href: "#security" }
  ],
  login: "دخول",
  start: "ابدأ الآن",
  heroLabel: `منصة AI لخدمة العملاء في ${marketName}`,
  title: "حوّل محادثاتك إلى موظف استقبال ذكي",
  subtitle: "يعمل 24/7 من منصة موحدة لإدارة العملاء والمحادثات.",
  primary: "إنشاء حساب",
  secondary: "مشاهدة لوحة التحكم",
  proof: "مبني للشركات التي تريد أتمتة ذكية مع تحكم واضح للفريق.",
  stats: [
    ["24/7", "استقبال وردود فورية"],
    ["5+", "قنوات محادثة"],
    ["AI + Team", "تسليم بشري واضح"],
    [marketName, "تجربة عربية محلية"]
  ],
  workflowTitle: "كيف يعمل ChatZi؟",
  workflowSubtitle:
    "بدلاً من توزيع المحادثات بين أدوات منفصلة، يجمع ChatZi الاستقبال، الذكاء الاصطناعي، سير العمل، والتسليم للفريق داخل تجربة واحدة.",
  workflow: [
    {
      title: "التقاط الطلب من كل قناة",
      text: "يستقبل رسائل الموقع، واتساب، ماسنجر، إنستغرام، تليجرام والقنوات الرقمية في Inbox واحد بدل تبديل الأدوات.",
      metric: "Omnichannel intake"
    },
    {
      title: "فهم نية العميل والرد",
      text: "يستخدم قاعدة المعرفة الخاصة بالشركة للرد على الأسئلة المتكررة، تلخيص الطلب، وتجميع البيانات اللازمة.",
      metric: "AI handling"
    },
    {
      title: "تشغيل الإجراء أو التصعيد",
      text: "عندما تحتاج المحادثة إجراء، يحولها إلى مسار عمل واضح أو يسلمها للموظف مع كل السياق.",
      metric: "Workflow + handoff"
    }
  ],
  featuresTitle: "المميزات الأساسية",
  featuresSubtitle:
    "هذه نسخة أبسط من رسالة الموقع القديم: ChatZi ليس شات بوت فقط، بل طبقة تشغيل تربط المحادثة بالعمل اليومي.",
  features: [
    ["AI Chatbot & Reception", "ردود ذكية على الأسئلة المتكررة مع تصعيد الحالات الحساسة للفريق بدون فقدان السياق."],
    ["Smart Omnichannel Inbox", "كل محادثات العملاء من الموقع والسوشال والقنوات الفورية داخل مساحة واحدة منظمة."],
    ["Website Widget", "إضافة محادثة ذكية للموقع مع نماذج قبل المحادثة ورسائل تفاعلية وتجميع بيانات الزائر."],
    ["Workspace CRM", "ملفات عملاء، سجل محادثات، ملاحظات داخلية، وتوزيع المحادثات على الموظفين."],
    ["Knowledge Base Training", "تدريب AI من ملفات PDF وWord وروابط الموقع والبيانات الداخلية للحصول على إجابات دقيقة."],
    ["Integrations & AI Control", "إدارة مفاتيح AI، Webhooks، وربط الأنظمة الخارجية من لوحة واحدة آمنة."]
  ],
  channelsTitle: "قنوات جاهزة للانتشار",
  channelsSubtitle:
    "ابدأ من القناة الأهم ثم وسع التغطية تدريجياً بدون أن تتغير طريقة العمل خلف الكواليس.",
  channels: ["Website Chat", "WhatsApp", "Instagram", "Facebook Messenger", "Telegram", "Generic Webhooks"],
  securityTitle: "تحكم وأمان مناسب لفرق العمل",
  security:
    "عزل بيانات كل شركة، صلاحيات واضحة، مفاتيح AI مخفية ومشفرة، وسجل Webhooks يساعدك على مراقبة ما حدث في كل قناة.",
  pricingTitle: "ابدأ بمسار واضح",
  pricing:
    "اختر أول سير عمل متكرر في شركتك: استفسارات المبيعات، الدعم، الحجز، أو متابعة العملاء. بعدها نوسع القنوات والأتمتة حسب الحاجة.",
  faqTitle: "أسئلة سريعة",
  faq: [
    ["هل يدعم العربية والإنجليزية؟", `نعم، الصفحة تدعم الإنجليزية ونسختين عربيتين موجهتين إلى ${marketName}.`],
    ["هل هو مجرد شات بوت؟", "لا. ChatZi يجمع الرد الآلي، Inbox موحد، قاعدة معرفة، CRM خفيف، وتسليم بشري واضح."],
    ["هل يمكن تدريبه على بياناتي؟", "نعم، يمكن تدريبه من ملفاتك وروابط موقعك ومصادر المعرفة الخاصة بنشاطك."]
  ],
  ctaTitle: "حوّل المحادثات المتكررة إلى تشغيل منظم",
  ctaSubtitle:
    "ابدأ بأكثر طلب يستهلك وقت فريقك، واجعل ChatZi يستقبله، يفهمه، ويرسله للمسار الصحيح.",
  footer: `ChatZi AI Solutions FZE LLC - تجربة عربية مخصصة لـ ${marketName}`,
  imageAlt: {
    hero: "لقطة من لوحة ChatZi للمحادثات والقنوات",
    channels: "قنوات ChatZi المتعددة",
    dashboard: "لوحة تحكم ChatZi"
  }
});

export const landingContent = {
  en: {
    lang: "en",
    dir: "ltr",
    marketName: "UAE and Jordan",
    marketLabel: "English",
    nav: [
      { label: "How it works", href: "#workflow" },
      { label: "Features", href: "#features" },
      { label: "Channels", href: "#channels" },
      { label: "Security", href: "#security" }
    ],
    login: "Sign in",
    start: "Start now",
    heroLabel: "AI receptionist and operations hub",
    title: "ChatZi turns customer conversations into clear team action",
    subtitle:
      "Unify website chat, WhatsApp, social inboxes, AI replies, workflow automation, and human handoff in one workspace for teams in the UAE and Jordan.",
    primary: "Create account",
    secondary: "View dashboard",
    proof: "Built for teams that need automation, human handoff, and operational clarity in the same experience.",
    stats: [
      ["24/7", "Instant customer coverage"],
      ["5+", "Messaging channels"],
      ["AI + Team", "Clear human handoff"],
      ["UAE + JO", "Regional bilingual rollout"]
    ],
    workflowTitle: "How ChatZi works",
    workflowSubtitle:
      "ChatZi works best when intake, AI handling, workflow execution, and escalation live inside one operating model instead of disconnected tools.",
    workflow: [
      {
        title: "Capture intent across channels",
        text: "Bring inquiries from website chat, WhatsApp, Messenger, Instagram, Telegram, and digital inboxes into one Smart Inbox.",
        metric: "Omnichannel intake"
      },
      {
        title: "Let AI handle the first line",
        text: "Answer repeat questions, summarize requests, qualify leads, and collect structured details from your own knowledge base.",
        metric: "AI handling"
      },
      {
        title: "Route actions or hand off",
        text: "Move the conversation into a workflow or escalate to a human agent with the customer context still visible.",
        metric: "Workflow + handoff"
      }
    ],
    featuresTitle: "Core capabilities",
    featuresSubtitle:
      "A simplified version of the old ChatZi message: not just a chatbot, but an operational layer for customer communication.",
    features: [
      ["AI Chatbot & Reception", "Natural automated replies for common questions with intelligent escalation when a person should step in."],
      ["Smart Omnichannel Inbox", "One organized workspace for customer conversations across website, WhatsApp, Messenger, Instagram, Telegram, and more."],
      ["Website Widget", "Embed conversational AI on your site with pre-chat forms, interactive messages, and visitor data capture."],
      ["Workspace CRM", "Customer profiles, conversation history, internal notes, drafts, assignment, and team workload control."],
      ["Knowledge Base Training", "Train AI on PDFs, Word documents, websites, help pages, internal docs, or external APIs."],
      ["Integrations & AI Control", "Manage AI keys, webhooks, API integrations, and external systems from one secure dashboard."]
    ],
    channelsTitle: "Deploy where customers already ask",
    channelsSubtitle:
      "Start with the most important channel, then expand without changing the operating logic behind every conversation.",
    channels: ["Website Chat", "WhatsApp", "Instagram", "Facebook Messenger", "Telegram", "Generic Webhooks"],
    securityTitle: "Governed, visible, and team-friendly",
    security:
      "Tenant-scoped data, role-aware access, encrypted AI secrets, visible webhook logs, and clean handoff rules keep automation controlled instead of opaque.",
    pricingTitle: "Start from one real workflow",
    pricing:
      "Use the first rollout to map one repeated customer journey: lead qualification, support, appointment booking, or customer follow-up. Then scale channels and automation from there.",
    faqTitle: "Quick questions",
    faq: [
      ["Does it support Arabic and English?", "Yes. The landing experience now supports English, Arabic for the UAE, and Arabic for Jordan."],
      ["Is ChatZi only a chatbot?", "No. It combines AI replies, a Smart Inbox, knowledge training, workflow routing, lightweight CRM, and human handoff."],
      ["Can it learn from my business data?", "Yes. Train it with files, website URLs, help pages, internal documents, and connected data sources."]
    ],
    ctaTitle: "Make every repeated conversation easier to operate",
    ctaSubtitle:
      "Start with the customer request that costs your team the most time, then let ChatZi receive it, understand it, and route it clearly.",
    footer: "ChatZi AI Solutions FZE LLC - AI receptionist and operations assistant",
    imageAlt: {
      hero: "ChatZi customer conversations dashboard",
      channels: "ChatZi omnichannel channel map",
      dashboard: "ChatZi dashboard screenshot"
    }
  },
  "ar-ae": arabicCopy("الإمارات", "Arabic - UAE"),
  "ar-jo": arabicCopy("الأردن", "Arabic - Jordan")
} as const;

export type LandingLocale = keyof typeof landingContent;
