export type Sector = {
  id: string;
  title: string;
  desc: string;
  icon: string;
  imagePlaceholder?: string;
};

export const sectorsData = {
  en: [
    {
      id: "medical",
      title: "Medical Clinics",
      desc: "Auto-replies, appointments, and 24/7 visits confirmation.",
      icon: "🏥",
    },
    {
      id: "real-estate",
      title: "Real Estate",
      desc: "Answer inquiries, qualify leads, and follow up.",
      icon: "🏢",
    },
    {
      id: "education",
      title: "Schools & Institutes",
      desc: "Handle parent inquiries and manage registration requests.",
      icon: "🎓",
    },
    {
      id: "ecommerce",
      title: "E-commerce",
      desc: "Order tracking, customer support, and sales assistance.",
      icon: "🛍️",
    },
    {
      id: "restaurants",
      title: "Restaurants & Cafes",
      desc: "Receive orders, manage reservations, and answer queries.",
      icon: "🍽️",
    },
    {
      id: "insurance",
      title: "Insurance Companies",
      desc: "Receive claims, collect data, and route to agents.",
      icon: "🛡️",
    },
    {
      id: "automotive",
      title: "Automotive & Showrooms",
      desc: "Book maintenance, follow up with customers, and schedule test drives.",
      icon: "🚗",
    },
    {
      id: "hospitality",
      title: "Hotels & Hospitality",
      desc: "Manage bookings, assist guests, and provide customer service.",
      icon: "🏨",
    },
    {
      id: "consulting",
      title: "Consulting & Services",
      desc: "Book meetings, qualify clients, and manage communications.",
      icon: "⚖️",
    },
    {
      id: "retail",
      title: "Retail Stores",
      desc: "Customer service, order tracking, and upselling opportunities.",
      icon: "🛒",
    }
  ],
  "ar-ae": [
    {
      id: "medical",
      title: "العيادات والمراكز الطبية",
      desc: "رد تلقائي، حجز المواعيد، وتأكيد الزيارات 24/7.",
      icon: "🏥",
    },
    {
      id: "real-estate",
      title: "العقارات",
      desc: "الرد على الاستفسارات وتأهيل العملاء المحتملين ومتابعتهم.",
      icon: "🏢",
    },
    {
      id: "education",
      title: "المدارس والمعاهد",
      desc: "استقبال استفسارات أولياء الأمور وإدارة طلبات التسجيل.",
      icon: "🎓",
    },
    {
      id: "ecommerce",
      title: "التجارة الإلكترونية",
      desc: "متابعة الطلبات، الإجابة على العملاء، ودعم المبيعات.",
      icon: "🛍️",
    },
    {
      id: "restaurants",
      title: "المطاعم والمقاهي",
      desc: "استقبال الطلبات، الحجوزات، والرد على الاستفسارات.",
      icon: "🍽️",
    },
    {
      id: "insurance",
      title: "شركات التأمين",
      desc: "استقبال طلبات العملاء، جمع البيانات، وتحويلها للموظفين.",
      icon: "🛡️",
    },
    {
      id: "automotive",
      title: "السيارات والمعارض",
      desc: "حجز مواعيد الصيانة، متابعة العملاء، وجدولة التجارب.",
      icon: "🚗",
    },
    {
      id: "hospitality",
      title: "الفنادق والضيافة",
      desc: "إدارة الحجوزات، الإجابة على الضيوف، وخدمة العملاء.",
      icon: "🏨",
    },
    {
      id: "consulting",
      title: "الاستشارات والخدمات المهنية",
      desc: "حجز الاجتماعات، تأهيل العملاء، وإدارة التواصل.",
      icon: "⚖️",
    },
    {
      id: "retail",
      title: "متاجر التجزئة",
      desc: "خدمة العملاء، متابعة الطلبات، وزيادة فرص البيع.",
      icon: "🛒",
    }
  ]
};

// Map ar-jo to ar-ae since they share the same translations for now
(sectorsData as any)["ar-jo"] = sectorsData["ar-ae"];
