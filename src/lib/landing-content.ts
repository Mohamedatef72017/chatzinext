const arabicCopy = (marketName: "الإمارات" | "الأردن" | "مصر", marketLabel: "Arabic - UAE" | "Arabic - Jordan" | "Arabic - Egypt") => ({
  lang: marketName === "الإمارات" ? "ar-AE" : marketName === "الأردن" ? "ar-JO" : "ar-EG",
  dir: "rtl",
  marketName,
  marketLabel,
  nav: [
    { label: "كيف يعمل؟", href: "#workflow" },
    { label: "المميزات", href: "#features" },
    { label: "القنوات", href: "#channels" },
    { label: "الخصوصية والأمان", href: "#security" },
    { label: "الأسعار", href: "/pricing" },
    { label: "تواصل معنا", href: "#contact" }
  ],
  login: "تسجيل الدخول",
  start: "جرّب الآن",
  heroLabel: "منصة محادثات ذكية لخدمة العملاء",
  title: "ارتق بخدمة عملائك إلى آفاق جديدة",
  heroPoints: [
    { title: "الرد الفوري على مدار الساعة:", text: "موظف استقبال ذكي جاهز دائماً." },
    { title: "أتمتة المحادثات بالذكاء الاصطناعي:", text: "فهم دقيق وتصنيف للاحتياجات." },
    { title: "جمع وتحليل البيانات:", text: "رؤى قيمة لاتخاذ قرارات أفضل." },
    { title: "إدارة موحدة للقنوات:", text: "مكان واحد لـ WhatsApp, Messenger, Instagram." }
  ],
  primary: "أنشئ حساباً مجاناً",
  secondary: "مشاهدة لوحة التحكم",
  proof: "مبني للشركات التي تريد أتمتة ذكية مع تحكم واضح للفريق.",
  stats: [
    ["24/7", "استقبال وردود فورية"],
    ["5+", "قنوات محادثة"],
    ["AI + Team", "تسليم بشري واضح"],
    [marketName, "تجربة عربية محلية"]
  ],
  workflowTitle: "ابدأ خلال 3 خطوات بسيطة",
  workflowSubtitle: "اربط قنواتك، درّب Chatzi، وابدأ استقبال العملاء تلقائياً.",
  workflow: [
    {
      title: "اربط قنوات التواصل",
      text: "اربط WhatsApp وInstagram وMessenger وباقي قنواتك بسهولة.",
      metric: "1"
    },
    {
      title: "درّب Chatzi على معلومات شركتك",
      text: "أضف موقعك، ملفاتك، منتجاتك، وخدماتك ليجيب Chatzi بدقة.",
      metric: "2"
    },
    {
      title: "ابدأ باستقبال العملاء",
      text: "Chatzi يبدأ بالرد، جمع البيانات، وتحويل الطلبات لفريقك عند الحاجة.",
      metric: "3"
    }
  ],
  featuresTitle: "مميزات تساعدك على الرد أسرع وبيع أكثر",
  featuresSubtitle: "",
  features: [
    ["موظف استقبال ذكي", "يرد على عملائك 24/7، بلغتهم، وبأسلوب طبيعي يشبه موظفك."],
    ["جميع المحادثات في مكان واحد", "اجمع WhatsApp وInstagram وMessenger وباقي القنوات داخل لوحة واحدة سهلة."],
    ["يعرف شركتك كما يعرفها موظفوك", "يتعلم منتجاتك، خدماتك، أسعارك، عروضك، والأسئلة المتكررة الخاصة بشركتك فقط."],
    ["يحوّل العميل لموظفك عند الحاجة", "عندما يحتاج العميل لتدخل بشري، يحوّل المحادثة مباشرة لموظفك مع جميع تفاصيلها."],
    ["لا تضيع أي طلب", "يجمع بيانات العميل ويحوّل الطلب إلى تذكرة أو إشعار واضح لفريقك."],
    ["اعرف كل ما يحدث", "تقارير ذكية، CRM، وإحصائيات تساعدك على تطوير أعمالك."]
  ],
  heroButtons: {
    demo: "احجز عرضاً توضيحياً",
    signup: "أنشئ حساباً مجاناً",
    try: "جرّب Chatzi خلال أقل من دقيقة",
    trySub: "أدخل موقع شركتك، وسننشئ لك مساعداً ذكياً تجريبياً خلال أقل من دقيقة."
  },
  contact: {
    title: "طرق التواصل",
    subtitle: "نحن هنا لمساعدتك",
    email: "info@chatzi.io",
    phone: "+971 555452119",
    address: "UAE, Ajman, Sheikh Khalifa Street, Amber Gem Tower, 26th Floor, BC-893063"
  },
  channelsTitle: "كل قنوات التواصل في منصة واحدة",
  channelsSubtitle:
    "استقبل رسائل العملاء من WhatsApp وInstagram وMessenger والموقع الإلكتروني، ورد عليهم من لوحة واحدة منظمة.",
  channelsData: [
    { name: "WhatsApp", description: "استقبل ورد على عملاء واتساب مباشرة." },
    { name: "Messenger", description: "اربط صفحة فيسبوك لرد أسرع." },
    { name: "Instagram", description: "تفاعل مع رسائل وتعليقات إنستجرام." },
    { name: "Website Chat", description: "أضف أداة المحادثة (Widget) لموقعك." },
    { name: "Telegram", description: "استقبل رسائل تيليجرام من مكان واحد." },
    { name: "تكاملات مخصصة", description: "اربط أنظمتك الخاصة عبر Webhooks." }
  ],
  securityTitle: "اربط قنواتك بثقة… وخلّي بياناتك تحت سيطرتك",
  security: "اربط قنوات التواصل الخاصة بشركتك بسهولة، بدون مشاركة كلمات المرور، مع خصوصية كاملة لمحادثات العملاء وتحكم واضح بصلاحيات فريقك.",
  securityPoints: [
    { title: "ربط سهل للقنوات", text: "اربط قنوات التواصل الخاصة بشركتك بخطوات واضحة وبدون تعقيد تقني." },
    { title: "محادثاتك خاصة", text: "لا يطّلع فريق Chatzi على محادثات عملائك أو بياناتهم الخاصة." },
    { title: "تحكم كامل بصلاحيات فريقك", text: "حدد من يستطيع مشاهدة المحادثات، الرد على العملاء، أو إدارة القنوات." },
    { title: "افصل أي قناة بأي وقت", text: "إذا قررت التوقف أو تغيير الإعدادات، يمكنك إلغاء ربط أي قناة بسهولة." },
    { title: "بدون مشاركة كلمات المرور", text: "لا تحتاج لإعطاء كلمة مرور WhatsApp أو Instagram أو Facebook لأي شخص." },
    { title: "الذكاء الاصطناعي يعمل بتعليماتك", text: "Chatzi يرد بناءً على معلومات شركتك وتعليماتك فقط، وليس بشكل عشوائي." }
  ],
  pricingTitle: "أربع باقات مرنة حسب مسار نمو أعمالك",
  pricing:
    "من التجربة المجانية للانطلاق، ثم النمو، ثم التوسع، ثم الحل المؤسسي المخصص. مسار واضح بدون مفاجآت.",
  faqTitle: "أسئلة سريعة",
  faq: [
    ["هل يدعم العربية والإنجليزية؟", `نعم، الصفحة تدعم الإنجليزية ونسختين عربيتين موجهتين إلى ${marketName}.`],
    ["هل هو مجرد شات بوت؟", "لا. Chatzi يجمع الرد الآلي، Inbox موحد، قاعدة معرفة، CRM خفيف، وتسليم بشري واضح."],
    ["هل يمكن تدريبه على بياناتي؟", "نعم، يمكن تدريبه من ملفاتك وروابط موقعك ومصادر المعرفة الخاصة بنشاطك."]
  ],
  ctaTitle: "جاهز لتحويل خدمة العملاء لديك؟",
  ctaSubtitle:
    "انضم للعديد من الشركات التي تدير محادثاتها بذكاء.",
  footer: `Chatzi AI Solutions FZE LLC - تجربة عربية مخصصة لـ ${marketName}`,
  imageAlt: {
    hero: "لقطة من لوحة Chatzi للمحادثات والقنوات",
    channels: "قنوات Chatzi المتعددة",
    dashboard: "لوحة تحكم Chatzi"
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
      { label: "Security", href: "#security" },
      { label: "Pricing", href: "/pricing" },
      { label: "Contact", href: "#contact" }
    ],
    login: "Sign in",
    start: "Start now",
    heroLabel: "AI receptionist and operations hub",
    title: "Elevate your customer service to new horizons",
    heroPoints: [
      { title: "Instant reply around the clock:", text: "A smart receptionist always ready." },
      { title: "Automate conversations with AI:", text: "Accurate understanding and categorization of needs." },
      { title: "Data collection and analysis:", text: "Valuable insights for better decisions." },
      { title: "Unified channel management:", text: "One place for WhatsApp, Messenger, Instagram." }
    ],
    primary: "Create account",
    secondary: "View dashboard",
    proof: "Built for teams that need automation, human handoff, and operational clarity in the same experience.",
    stats: [
      ["24/7", "Instant customer coverage"],
      ["5+", "Messaging channels"],
      ["AI + Team", "Clear human handoff"],
      ["UAE + JO", "Regional bilingual rollout"]
    ],
    workflowTitle: "Start in 3 simple steps",
    workflowSubtitle:
      "Connect your channels, train Chatzi, and start receiving customers automatically.",
    workflow: [
      {
        title: "Connect your channels",
        text: "Connect WhatsApp, Instagram, Messenger, and your other channels easily.",
        metric: "1"
      },
      {
        title: "Train Chatzi on your business",
        text: "Add your website, files, products, and services for Chatzi to answer accurately.",
        metric: "2"
      },
      {
        title: "Start receiving customers",
        text: "Chatzi starts replying, collecting data, and routing requests to your team when needed.",
        metric: "3"
      }
    ],
    featuresTitle: "Features that help you reply faster and sell more",
    featuresSubtitle: "",
    features: [
      ["Smart Receptionist", "Replies to your customers 24/7, in their language, naturally like your own team."],
      ["All Conversations in One Place", "Bring WhatsApp, Instagram, Messenger, and more into one easy dashboard."],
      ["Team Routing When Needed", "When a customer needs human intervention, the chat is routed directly to your team with full context."],
      ["Knows Your Business", "Learns your products, services, prices, offers, and FAQs specific to your business."],
      ["Never Lose a Request", "Collects customer data and turns the request into a clear ticket or notification."],
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
      email: "info@chatzi.io",
      phone: "+971 555452119",
      address: "UAE, Ajman, Sheikh Khalifa Street, Amber Gem Tower, 26th Floor, BC-893063"
    },
    channelsTitle: "All communication channels in one platform",
    channelsSubtitle:
      "Receive customer messages from WhatsApp, Instagram, Messenger, and your website, and reply from one organized dashboard.",
    channelsData: [
      { name: "WhatsApp", description: "Receive and reply to WhatsApp customers directly." },
      { name: "Messenger", description: "Connect your Facebook page for faster replies." },
      { name: "Instagram", description: "Engage with Instagram messages and comments." },
      { name: "Website Chat", description: "Add a live chat widget to your website." },
      { name: "Telegram", description: "Receive Telegram messages from one place." },
      { name: "Custom Integrations", description: "Connect your systems via Webhooks." }
    ],
    securityTitle: "Connect your channels with confidence... and keep your data under your control",
    security: "Connect your company's communication channels easily, without sharing passwords, with full privacy for customer conversations and clear control over your team's permissions.",
    securityPoints: [
      { title: "Easy channel connection", text: "Connect your company's communication channels with clear steps and no technical complexity." },
      { title: "Your conversations are private", text: "The Chatzi team does not view your customers' conversations or private data." },
      { title: "Full control over team permissions", text: "Determine who can view conversations, reply to customers, or manage channels." },
      { title: "Disconnect any channel anytime", text: "If you decide to stop or change settings, you can easily unlink any channel." },
      { title: "No password sharing", text: "You don't need to give your WhatsApp, Instagram, or Facebook password to anyone." },
      { title: "AI works by your instructions", text: "Chatzi replies based solely on your company's information and instructions, not randomly." }
    ],
    pricingTitle: "Four flexible plans for every growth stage",
    pricing:
      "Start lean, grow into a dedicated AI receptionist, then scale into enterprise coverage with clear monthly message limits and support tiers.",
    faqTitle: "Quick questions",
    faq: [
      ["Does it support Arabic and English?", "Yes. The landing experience now supports English, Arabic for the UAE, and Arabic for Jordan."],
      ["Is Chatzi only a chatbot?", "No. It combines AI replies, a unified inbox, knowledge training, workflow routing, lightweight CRM, and team escalation."],
      ["Can it learn from my business data?", "Yes. Train it with files, website URLs, help pages, internal documents, and connected data sources."]
    ],
    ctaTitle: "Ready to transform your customer service?",
    ctaSubtitle:
      "Join many companies managing their conversations smartly.",
    footer: "Chatzi AI Solutions FZE LLC - AI receptionist and operations assistant",
    imageAlt: {
      hero: "Chatzi customer conversations dashboard",
      channels: "Chatzi omnichannel channel map",
      dashboard: "Chatzi dashboard screenshot"
    }
  },
  "ar-ae": arabicCopy("الإمارات", "Arabic - UAE"),
  "ar-jo": arabicCopy("الأردن", "Arabic - Jordan"),
  "ar-eg": arabicCopy("مصر", "Arabic - Egypt")
} as const;

export type LandingLocale = keyof typeof landingContent;
