import React from "react";
import { Hospital, Building2, GraduationCap, ShoppingBag, Utensils, ShieldCheck, Car, Hotel, Scale, Store } from "lucide-react";

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
      icon: <Hospital className="w-5 h-5 text-indigo-500" />,
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
      icon: <Building2 className="w-5 h-5 text-blue-500" />,
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
      icon: <GraduationCap className="w-5 h-5 text-green-500" />,
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
      icon: <ShoppingBag className="w-5 h-5 text-pink-500" />,
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
      icon: <Utensils className="w-5 h-5 text-orange-500" />,
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
      icon: <ShieldCheck className="w-5 h-5 text-teal-500" />,
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
      icon: <Car className="w-5 h-5 text-red-500" />,
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
      icon: <Hotel className="w-5 h-5 text-cyan-500" />,
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
      icon: <Scale className="w-5 h-5 text-slate-500" />,
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
      icon: <Store className="w-5 h-5 text-purple-500" />,
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
      icon: <Hospital className="w-5 h-5 text-indigo-500" />,
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
      icon: <Building2 className="w-5 h-5 text-blue-500" />,
      benefits: [
        "يؤهل المشترين والمستأجرين حسب الميزانية والمنطقة ونوع العقار.",
        "يعرض الوحدات المتاحة ويسجل طلبات المعاينة تلقائياً.",
        "يتابع مع العملاء المحتملين لضمان عدم ضياع أي فرصة.",
        "يحوّل العملاء الجادين للوسيط العقاري أو فريق المبيعات فوراً."
      ],
    },
    {
      id: "education",
      title: "المدارس والمعاهد",
      desc: "الرد على أولياء الأمور وإدارة طلبات التسجيل.",
      icon: <GraduationCap className="w-5 h-5 text-green-500" />,
      benefits: [
        "يجيب على أسئلة القبول والرسوم والمناهج والجداول.",
        "يجمع بيانات الطالب والصف أو الدورة المطلوبة.",
        "يرسل متطلبات التسجيل والخطوات التالية بوضوح.",
        "يبلغ قسم القبول عندما يكون ولي الأمر جاهزاً للتواصل."
      ],
    },
    {
      id: "ecommerce",
      title: "المتاجر الإلكترونية",
      desc: "تتبع الطلبات، خدمة العملاء، والمساعدة في المبيعات.",
      icon: <ShoppingBag className="w-5 h-5 text-pink-500" />,
      benefits: [
        "يتتبع حالة الطلب ويجيب على أسئلة التوصيل في أي وقت.",
        "يقترح منتجات بناءً على احتياجات العميل واهتماماته السابقة.",
        "يجمع تفاصيل الاسترجاع والاستبدال والشكاوى قبل تدخل الموظف.",
        "يستعيد المحادثات المتروكة برسائل متابعة ذكية لتحفيز الشراء."
      ],
    },
    {
      id: "restaurants",
      title: "المطاعم والمقاهي",
      desc: "استقبال الطلبات، إدارة الحجوزات، والرد على الاستفسارات.",
      icon: <Utensils className="w-5 h-5 text-orange-500" />,
      benefits: [
        "يدير حجوزات الطاولات مع التاريخ والوقت وعدد الأشخاص.",
        "يجيب على أسئلة المنيو والفروع والتوصيل وساعات العمل.",
        "يجمع ملاحظات الطلب قبل إرسالها لفريقك.",
        "يروج للعروض والأطباق الأكثر مبيعاً داخل المحادثة."
      ],
    },
    {
      id: "insurance",
      title: "شركات التأمين",
      desc: "استقبال المطالبات، جمع البيانات، والتوجيه للموظفين.",
      icon: <ShieldCheck className="w-5 h-5 text-teal-500" />,
      benefits: [
        "يجمع نوع المطالبة ورقم الوثيقة والمستندات وبيانات التواصل.",
        "يشرح تغطية البوليصة والخطوات المطلوبة ببساطة.",
        "يحوّل المطالبات المعقدة للموظف أو القسم المختص.",
        "يبقي العملاء على اطلاع قبل رد فريق الدعم."
      ],
    },
    {
      id: "automotive",
      title: "السيارات والمعارض",
      desc: "حجز الصيانة، متابعة العملاء، وتحديد مواعيد تجربة القيادة.",
      icon: <Car className="w-5 h-5 text-red-500" />,
      benefits: [
        "يحجز مواعيد الصيانة مع تحديد موديل السيارة والوقت المفضل.",
        "يؤهل طلبات تجربة القيادة حسب الموديل والميزانية والموقع.",
        "يجيب على أسئلة الضمان والتمويل وتوفر السيارات.",
        "يذكّر العملاء بمواعيد الصيانة والمتابعات المعلقة."
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
