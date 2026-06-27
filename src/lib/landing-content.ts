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
  workflowTitle: "كيف بيشتغل؟",
  workflowSubtitle: "ثلاث خطوات فقط:",
  workflow: [
    {
      title: "اربط قنوات التواصل",
      text: "استقبل رسائل الموقع، واتساب، ماسنجر، وغيرها.",
      metric: "1"
    },
    {
      title: "درّب Chatzi على معلومات شركتك",
      text: "ارفع ملفاتك أو موقعك ليتعلم الرد.",
      metric: "2"
    },
    {
      title: "ابدأ باستقبال العملاء",
      text: "دع الذكاء الاصطناعي يقوم بالمهمة نيابة عنك.",
      metric: "3"
    }
  ],
  featuresTitle: "المميزات",
  featuresSubtitle: "",
  features: [
    ["موظف استقبال ذكي", "يرد على عملائك 24/7 بلغتهم وبأسلوب طبيعي."],
    ["جميع المحادثات في مكان واحد", "WhatsApp وInstagram وMessenger وباقي القنوات من منصة واحدة."],
    ["يحوّل العميل لموظفك عند الحاجة", "عندما يحتاج تدخل بشري، يتم تحويل المحادثة مباشرة مع جميع تفاصيلها."],
    ["يعرف شركتك كما يعرفها موظفوك", "يتم تدريبه على منتجاتك وخدماتك والعروض والأسئلة الخاصة بشركتك فقط."],
    ["لا تضيع أي طلب", "يجمع بيانات العميل وينشئ تذكرة أو إشعاراً لفريقك تلقائياً."],
    ["اعرف كل ما يحدث", "تقارير ذكية، CRM، وإحصائيات تساعدك على تطوير أعمالك."]
  ],
  heroButtons: {
    demo: "احجز عرضاً شخصياً",
    signup: "أنشئ حساباً مجانياً",
    try: "جرّب Chatzi خلال أقل من دقيقة",
    trySub: "أدخل موقع شركتك وسننشئ لك تجربة AI مخصصة خلال أقل من دقيقة."
  },
  contact: {
    title: "طرق التواصل",
    subtitle: "نحن هنا لمساعدتك",
    email: "support@chatzi.ai",
    phone: "+971 50 123 4567"
  },
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
  ctaTitle: "جاهز لتحويل خدمة العملاء لديك؟",
  ctaSubtitle:
    "انضم للعديد من الشركات التي تدير محادثاتها بذكاء.",
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
    workflowTitle: "How does it work?",
    workflowSubtitle:
      "Just three simple steps:",
    workflow: [
      {
        title: "Connect your channels",
        text: "Receive messages from Website, WhatsApp, Messenger, and more.",
        metric: "1"
      },
      {
        title: "Train Chatzi on your business",
        text: "Upload your files or website for it to learn.",
        metric: "2"
      },
      {
        title: "Start receiving customers",
        text: "Let AI handle the rest for you automatically.",
        metric: "3"
      }
    ],
    featuresTitle: "Features",
    featuresSubtitle: "",
    features: [
      ["Smart Receptionist", "Replies to your customers 24/7 in their language naturally."],
      ["All Conversations in One Place", "WhatsApp, Instagram, Messenger, and more from one platform."],
      ["Human Handoff When Needed", "When human intervention is needed, the chat is routed with full details."],
      ["Knows Your Business", "Trained on your products, services, offers, and specific questions."],
      ["Never Lose a Request", "Collects customer data and creates tickets or notifications automatically."],
      ["Know Everything That Happens", "Smart reports, CRM, and analytics to help you grow your business."]
    ],
    heroButtons: {
      demo: "Book a Demo",
      signup: "Sign Up Free",
      try: "Try Chatzi in 1 minute",
      trySub: "Enter your website and we'll create a custom AI experience in under a minute."
    },
    contact: {
      title: "Contact Us",
      subtitle: "We are here to help",
      email: "support@chatzi.ai",
      phone: "+971 50 123 4567"
    },
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
    ctaTitle: "Ready to transform your customer service?",
    ctaSubtitle:
      "Join many companies managing their conversations smartly.",
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
