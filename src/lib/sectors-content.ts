export type Sector = {
  id: string;
  title: string;
  desc: string;
  icon: string;
  benefits: string[];
  imagePlaceholder?: string;
};

export const sectorsData = {
  en: [
    {
      id: "medical",
      title: "Medical Clinics",
      desc: "Auto-replies, appointments, and 24/7 visits confirmation.",
      icon: "🏥",
      benefits: [
        "Answer appointment questions and clinic hours instantly.",
        "Collect patient name, phone, preferred doctor, and visit reason.",
        "Confirm, reschedule, or remind patients before appointments.",
        "Escalate urgent cases to reception with the full conversation context."
      ],
    },
    {
      id: "real-estate",
      title: "Real Estate",
      desc: "Answer inquiries, qualify leads, and follow up.",
      icon: "🏢",
      benefits: [
        "Qualify buyers and tenants by budget, area, property type, and timeline.",
        "Share available units and capture viewing requests automatically.",
        "Follow up with cold leads before they disappear.",
        "Route serious opportunities to the right broker or sales team."
      ],
    },
    {
      id: "education",
      title: "Schools & Institutes",
      desc: "Handle parent inquiries and manage registration requests.",
      icon: "🎓",
      benefits: [
        "Answer admission, fees, curriculum, and schedule questions.",
        "Collect student details and preferred grade or course.",
        "Send registration requirements and next steps clearly.",
        "Notify admissions when a parent is ready for a call."
      ],
    },
    {
      id: "ecommerce",
      title: "E-commerce",
      desc: "Order tracking, customer support, and sales assistance.",
      icon: "🛍️",
      benefits: [
        "Track order status and answer delivery questions at any time.",
        "Recommend products based on customer needs and previous interest.",
        "Collect return, exchange, and complaint details before handoff.",
        "Recover abandoned conversations with helpful follow-up prompts."
      ],
    },
    {
      id: "restaurants",
      title: "Restaurants & Cafes",
      desc: "Receive orders, manage reservations, and answer queries.",
      icon: "🍽️",
      benefits: [
        "Handle table reservations with date, time, and guest count.",
        "Answer menu, branch, delivery, and opening-hours questions.",
        "Collect order notes before sending them to your team.",
        "Promote offers and popular items inside the conversation."
      ],
    },
    {
      id: "insurance",
      title: "Insurance Companies",
      desc: "Receive claims, collect data, and route to agents.",
      icon: "🛡️",
      benefits: [
        "Collect claim type, policy number, documents, and contact details.",
        "Explain policy coverage and required next steps simply.",
        "Route complex claims to the correct agent or department.",
        "Keep customers updated before the support team replies."
      ],
    },
    {
      id: "automotive",
      title: "Automotive & Showrooms",
      desc: "Book maintenance, follow up with customers, and schedule test drives.",
      icon: "🚗",
      benefits: [
        "Book service appointments with vehicle model and preferred timing.",
        "Qualify test-drive requests by model, budget, and location.",
        "Answer warranty, financing, and availability questions.",
        "Remind customers about maintenance and pending follow-ups."
      ],
    },
    {
      id: "hospitality",
      title: "Hotels & Hospitality",
      desc: "Manage bookings, assist guests, and provide customer service.",
      icon: "🏨",
      benefits: [
        "Answer room, rate, check-in, and facility questions instantly.",
        "Collect booking dates, guest count, and special requests.",
        "Support guests before arrival and during their stay.",
        "Escalate VIP or urgent requests with clear context."
      ],
    },
    {
      id: "consulting",
      title: "Consulting & Services",
      desc: "Book meetings, qualify clients, and manage communications.",
      icon: "⚖️",
      benefits: [
        "Qualify client needs before booking a consultation.",
        "Collect case details, service type, budget, and preferred time.",
        "Share service packages and required documents clearly.",
        "Route high-value inquiries to the right consultant."
      ],
    },
    {
      id: "retail",
      title: "Retail Stores",
      desc: "Customer service, order tracking, and upselling opportunities.",
      icon: "🛒",
      benefits: [
        "Answer product availability, branch, and pricing questions.",
        "Suggest alternatives and complementary products.",
        "Collect customer preferences before human follow-up.",
        "Support warranty, exchange, and pickup requests."
      ],
    }
  ],
  "ar-ae": [
    {
      id: "medical",
      title: "العيادات والمراكز الطبية",
      desc: "رد تلقائي، حجز المواعيد، وتأكيد الزيارات 24/7.",
      icon: "🏥",
      benefits: [
        "يرد فوراً على أسئلة المواعيد وساعات العمل والتخصصات.",
        "يجمع اسم المريض ورقم الهاتف والطبيب المفضل وسبب الزيارة.",
        "يساعد في تأكيد الموعد أو تغييره أو إرسال تذكير قبل الزيارة.",
        "يحوّل الحالات العاجلة للاستقبال مع كامل سياق المحادثة."
      ],
    },
    {
      id: "real-estate",
      title: "العقارات",
      desc: "الرد على الاستفسارات وتأهيل العملاء المحتملين ومتابعتهم.",
      icon: "🏢",
      benefits: [
        "يؤهل العميل حسب الميزانية والمنطقة ونوع العقار ووقت الشراء.",
        "يعرض الوحدات المناسبة ويجمع طلبات المعاينة تلقائياً.",
        "يتابع العملاء المهتمين قبل أن ينسوا الطلب أو ينتقلوا لمنافس.",
        "يحوّل الفرص الجادة للوسيط أو فريق المبيعات المناسب."
      ],
    },
    {
      id: "education",
      title: "المدارس والمعاهد",
      desc: "استقبال استفسارات أولياء الأمور وإدارة طلبات التسجيل.",
      icon: "🎓",
      benefits: [
        "يرد على أسئلة القبول والرسوم والمناهج ومواعيد الدراسة.",
        "يجمع بيانات الطالب والصف أو الدورة المطلوبة.",
        "يرسل متطلبات التسجيل والخطوات التالية بشكل واضح.",
        "ينبه فريق القبول عندما يكون ولي الأمر جاهزاً للتواصل."
      ],
    },
    {
      id: "ecommerce",
      title: "التجارة الإلكترونية",
      desc: "متابعة الطلبات، الإجابة على العملاء، ودعم المبيعات.",
      icon: "🛍️",
      benefits: [
        "يتابع حالة الطلب ويجيب على أسئلة التوصيل في أي وقت.",
        "يقترح منتجات مناسبة حسب حاجة العميل واهتمامه.",
        "يجمع تفاصيل الاستبدال أو الإرجاع أو الشكوى قبل التحويل.",
        "يعيد تنشيط المحادثات المتروكة برسائل متابعة ذكية."
      ],
    },
    {
      id: "restaurants",
      title: "المطاعم والمقاهي",
      desc: "استقبال الطلبات، الحجوزات، والرد على الاستفسارات.",
      icon: "🍽️",
      benefits: [
        "يدير حجوزات الطاولات حسب التاريخ والوقت وعدد الضيوف.",
        "يرد على أسئلة المنيو والفروع والتوصيل وساعات العمل.",
        "يجمع ملاحظات الطلب قبل تحويلها للفريق.",
        "يعرض العروض والأصناف الأكثر طلباً داخل المحادثة."
      ],
    },
    {
      id: "insurance",
      title: "شركات التأمين",
      desc: "استقبال طلبات العملاء، جمع البيانات، وتحويلها للموظفين.",
      icon: "🛡️",
      benefits: [
        "يجمع نوع المطالبة ورقم الوثيقة والمستندات وبيانات التواصل.",
        "يشرح التغطية والخطوات المطلوبة بلغة بسيطة.",
        "يحوّل المطالبات المعقدة للموظف أو القسم المختص.",
        "يبقي العميل مطلعاً على الخطوة التالية قبل رد الفريق."
      ],
    },
    {
      id: "automotive",
      title: "السيارات والمعارض",
      desc: "حجز مواعيد الصيانة، متابعة العملاء، وجدولة التجارب.",
      icon: "🚗",
      benefits: [
        "يحجز مواعيد الصيانة مع موديل السيارة والوقت المناسب.",
        "يؤهل طلبات تجربة القيادة حسب الموديل والميزانية والموقع.",
        "يرد على أسئلة الضمان والتمويل والتوفر.",
        "يرسل تذكيرات بالصيانة والمتابعات المفتوحة."
      ],
    },
    {
      id: "hospitality",
      title: "الفنادق والضيافة",
      desc: "إدارة الحجوزات، الإجابة على الضيوف، وخدمة العملاء.",
      icon: "🏨",
      benefits: [
        "يرد فوراً على أسئلة الغرف والأسعار والدخول والمرافق.",
        "يجمع تواريخ الحجز وعدد الضيوف والطلبات الخاصة.",
        "يساعد الضيوف قبل الوصول وأثناء الإقامة.",
        "يحوّل الطلبات المهمة أو العاجلة مع كامل التفاصيل."
      ],
    },
    {
      id: "consulting",
      title: "الاستشارات والخدمات المهنية",
      desc: "حجز الاجتماعات، تأهيل العملاء، وإدارة التواصل.",
      icon: "⚖️",
      benefits: [
        "يؤهل احتياج العميل قبل حجز الاستشارة.",
        "يجمع تفاصيل الحالة ونوع الخدمة والميزانية والوقت المناسب.",
        "يعرض الباقات والمستندات المطلوبة بشكل واضح.",
        "يحوّل الاستفسارات عالية القيمة للمستشار المناسب."
      ],
    },
    {
      id: "retail",
      title: "متاجر التجزئة",
      desc: "خدمة العملاء، متابعة الطلبات، وزيادة فرص البيع.",
      icon: "🛒",
      benefits: [
        "يرد على أسئلة توفر المنتجات والفروع والأسعار.",
        "يقترح بدائل ومنتجات مكملة لزيادة قيمة الطلب.",
        "يجمع تفضيلات العميل قبل متابعة الموظف.",
        "يدعم طلبات الضمان والاستبدال والاستلام."
      ],
    }
  ]
};

// Map ar-jo to ar-ae since they share the same translations for now
(sectorsData as any)["ar-jo"] = sectorsData["ar-ae"];
