"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Store, Stethoscope, Building2, TerminalSquare, Lightbulb, CheckCircle2, Loader2, ArrowLeft, Sparkles, BookOpen, MessageCircle } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { getDefaultIndustryKnowledgeDocuments, getDefaultIndustryLabel, type DefaultIndustryId } from "@/lib/knowledge-default-templates";

type Industry = DefaultIndustryId | null;

const INDUSTRIES: { id: Industry; icon: React.ReactNode }[] = [
  { id: "ecommerce", icon: <Store size={24} /> },
  { id: "medical", icon: <Stethoscope size={24} /> },
  { id: "realestate", icon: <Building2 size={24} /> },
  { id: "tech", icon: <TerminalSquare size={24} /> },
  { id: "other", icon: <Lightbulb size={24} /> }
];

export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [botId, setBotId] = useState("");
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const { t, locale, setLocale } = useI18n();

  // Step 2 State
  const [industry, setIndustry] = useState<Industry>(null);
  
  // Step 3 State
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  
  // Mock Verification State
  const [sendingPhone, setSendingPhone] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((response) => response.json())
      .then((providers) => setGoogleEnabled(Boolean(providers?.google)))
      .catch(() => setGoogleEnabled(false));
  }, []);

  function formatRegisterError(message: string) {
    if (/password/i.test(message) && /12/.test(message)) {
      return locale === "ar"
        ? "كلمة المرور يجب أن تكون 12 حرفا على الأقل وتحتوي على حرف كبير وحرف صغير ورقم."
        : "Password must be at least 12 characters and include uppercase, lowercase, and a number.";
    }
    return message;
  }

  async function onRegisterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
      tenantName: form.get("tenantName")
    };

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError(formatRegisterError(data.error || t.errors.serverError));
        setLoading(false);
        return;
      }

      await signIn("credentials", {
        email: payload.email,
        password: payload.password,
        redirect: false
      });

      if (data.botId) {
        setBotId(data.botId);
        setStep(2);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError(t.auth.unexpectedError);
    } finally {
      setLoading(false);
    }
  }

  async function onSaveCategory() {
    if (!botId) return;
    setLoading(true);
    setError("");

    const selectedIndustry = industry || "other";
    const selectedIndustryLabel = getDefaultIndustryLabel(selectedIndustry, locale === "ar" ? "ar" : "en");

    const postData = async (formData: FormData) => {
      formData.append("botId", botId);
      formData.append("collectionName", "عام");
      const res = await fetch("/api/knowledge", { method: "POST", body: formData });
      if (!res.ok) throw new Error((await res.json()).error || t.auth.linkError);
    };

    const postTextKnowledge = async (payload: {
      title: string;
      sourceType: "custom_text";
      categoryName: string;
      text: string;
      tags?: string[];
    }) => {
      const fd = new FormData();
      fd.append("title", payload.title);
      fd.append("sourceType", payload.sourceType);
      fd.append("categoryName", payload.categoryName);
      fd.append("text", payload.text);
      fd.append("tags", ["onboarding", selectedIndustry, ...(payload.tags || [])].join(","));
      await postData(fd);
    };

    try {
      const defaultDocs = getDefaultIndustryKnowledgeDocuments(selectedIndustry);
      for (const doc of defaultDocs) {
        await postTextKnowledge({
          title: `${doc.title} — ${selectedIndustryLabel}`,
          sourceType: doc.sourceType,
          categoryName: doc.categoryName,
          text: doc.text,
          tags: doc.tags,
        });
      }

      setStep(3);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.uploadError);
      setLoading(false);
    }
  }

  const handleSendPhone = () => {
    if (!phoneNumber) return;
    setSendingPhone(true);
    setTimeout(() => setSendingPhone(false), 1000);
  };

  const handleSendEmail = () => {
    setSendingEmail(true);
    setTimeout(() => setSendingEmail(false), 1000);
  };

  const handleVerifyPhone = () => {
    if (!phoneCode) return;
    setVerifyingPhone(true);
    setTimeout(() => {
      setVerifyingPhone(false);
      setPhoneVerified(true);
    }, 1000);
  };

  const handleVerifyEmail = () => {
    if (!emailCode) return;
    setVerifyingEmail(true);
    setTimeout(() => {
      setVerifyingEmail(false);
      setEmailVerified(true);
    }, 1000);
  };

  function handleActivationContinue() {
    if (!phoneNumber.trim() || !phoneVerified || !emailVerified) {
      setError(locale === "ar" ? "التفعيل مطلوب قبل المتابعة. أدخل رقم الهاتف وتحقق من كود الهاتف والبريد." : "Activation is required before continuing. Verify phone and email codes.");
      return;
    }
    setError("");
    setStep(4);
  }

  function finishOnboarding() {
    router.push("/dashboard");
    router.refresh();
  }

  const renderProgress = () => {
    const stepsArr = [
      locale === "ar" ? "التسجيل" : "Register",
      locale === "ar" ? "الفئة" : "Category",
      locale === "ar" ? "التفعيل" : "Activation",
      locale === "ar" ? "البدء" : "Get Started"
    ];
    return (
      <div className="mb-8 flex gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-slate-100 dark:border-slate-800">
        {stepsArr.map((label, index) => {
          const active = step === index + 1;
          const done = step > index + 1;
          return (
            <span key={label} className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${active ? "bg-primary-600 text-white" : done ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
              {index + 1}. {label}
            </span>
          );
        })}
      </div>
    );
  };

  const renderStep = () => {
    if (step === 4) {
      return (
        <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-300 mx-auto">
          {renderProgress()}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-600 shadow-sm ring-8 ring-primary-50">
              <Sparkles size={32} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {locale === "ar" ? "مرحباً بك في النظام!" : "Welcome to the System!"}
            </h1>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg mx-auto">
              {locale === "ar" 
                ? "يعتمد النظام على تغذية البوت بالمعلومات الخاصة بنشاطك من خلال قاعدة المعرفة، ثم ربط قنوات التواصل ليرد تلقائياً على عملائك بذكاء." 
                : "The system relies on feeding knowledge to your AI, then connecting it to your communication channels to auto-reply to customers."}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/dashboard/knowledge" className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-slate-100 p-6 text-center transition hover:border-primary-500 hover:bg-primary-50 dark:border-slate-800 dark:hover:bg-slate-900">
              <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                <BookOpen size={24} />
              </div>
              <div className="font-bold text-slate-800 dark:text-white">{locale === "ar" ? "قاعدة المعرفة" : "Knowledge Base"}</div>
              <div className="text-xs text-slate-500">{locale === "ar" ? "إضافة ملفات ومعلومات" : "Add files & info"}</div>
            </Link>
            <Link href="/dashboard/channels" className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-slate-100 p-6 text-center transition hover:border-primary-500 hover:bg-primary-50 dark:border-slate-800 dark:hover:bg-slate-900">
              <div className="rounded-full bg-green-100 p-3 text-green-600">
                <MessageCircle size={24} />
              </div>
              <div className="font-bold text-slate-800 dark:text-white">{locale === "ar" ? "قنوات التواصل" : "Channels"}</div>
              <div className="text-xs text-slate-500">{locale === "ar" ? "ربط واتساب وغيرها" : "Connect WhatsApp etc"}</div>
            </Link>
          </div>
          <div className="mt-8 text-center">
            <button onClick={finishOnboarding} className="text-sm font-semibold text-primary-600 hover:underline">
              {locale === "ar" ? "الذهاب إلى لوحة التحكم الرئيسية" : "Go to main dashboard"}
            </button>
          </div>
        </div>
      );
    }

    if (step === 3) {
      return (
      <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-300 mx-auto">
        {renderProgress()}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600 shadow-sm ring-4 ring-primary-50">
            <CheckCircle2 size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.auth.step3Title}</h1>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            {t.auth.step3Subtitle}
          </p>
        </div>

        {error ? <p className="mb-6 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-100">{error}</p> : null}

        <div className="space-y-6">
          {/* Phone Section */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-900/50">
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">{t.auth.phoneLabel}</label>
            <div className="flex gap-2">
              <input 
                type="tel"
                className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:bg-slate-950 dark:border-slate-800 dark:text-white" 
                placeholder="+201234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={phoneVerified}
              />
              <button 
                onClick={handleSendPhone}
                disabled={!phoneNumber || sendingPhone || phoneVerified}
                className="shrink-0 rounded-md bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300"
              >
                {sendingPhone ? <Loader2 size={16} className="animate-spin" /> : locale === "ar" ? "إرسال الرمز" : "Send Code"}
              </button>
            </div>
            {!phoneVerified && (
              <div className="mt-3 flex gap-2">
                <input 
                  type="text"
                  className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:bg-slate-950 dark:border-slate-800 dark:text-white" 
                  placeholder={locale === "ar" ? "رمز الهاتف" : "Phone Code"}
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value)}
                />
                <button 
                  onClick={handleVerifyPhone}
                  disabled={!phoneCode || verifyingPhone}
                  className="shrink-0 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {verifyingPhone ? <Loader2 size={16} className="animate-spin" /> : locale === "ar" ? "تحقق" : "Verify"}
                </button>
              </div>
            )}
            {phoneVerified && (
              <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <CheckCircle2 size={14} /> {locale === "ar" ? "تم التحقق من الهاتف" : "Phone verified"}
              </p>
            )}
          </div>

          {/* Email Section */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-900/50">
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">{locale === "ar" ? "البريد الإلكتروني" : "Email"}</label>
            <div className="flex gap-2">
              <button 
                onClick={handleSendEmail}
                disabled={sendingEmail || emailVerified}
                className="w-full rounded-md bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300"
              >
                {sendingEmail ? <Loader2 size={16} className="animate-spin inline mr-2 rtl:ml-2 rtl:mr-0" /> : null}
                {locale === "ar" ? "إرسال رمز البريد" : "Send Email Code"}
              </button>
            </div>
            {!emailVerified && (
              <div className="mt-3 flex gap-2">
                <input 
                  type="text"
                  className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:bg-slate-950 dark:border-slate-800 dark:text-white" 
                  placeholder={locale === "ar" ? "رمز البريد" : "Email Code"}
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value)}
                />
                <button 
                  onClick={handleVerifyEmail}
                  disabled={!emailCode || verifyingEmail}
                  className="shrink-0 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {verifyingEmail ? <Loader2 size={16} className="animate-spin" /> : locale === "ar" ? "تحقق" : "Verify"}
                </button>
              </div>
            )}
            {emailVerified && (
              <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <CheckCircle2 size={14} /> {locale === "ar" ? "تم التحقق من البريد" : "Email verified"}
              </p>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <button 
            onClick={handleActivationContinue} 
            className="w-full h-12 rounded-lg bg-primary-600 text-white font-bold tracking-wide hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2"
          >
            {locale === "ar" ? "المتابعة" : "Continue"}
            <ArrowLeft size={18} className="rtl:rotate-0 rotate-180" />
          </button>
        </div>
      </div>
      );
    }

    if (step === 2) {
      return (
      <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-300 mx-auto">
        {renderProgress()}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600 shadow-sm ring-4 ring-primary-50">
            <Store size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {locale === "ar" ? "ما هي فئة نشاطك التجاري؟" : "What is your business category?"}
          </h1>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            {locale === "ar" ? "سيساعدنا ذلك في تهيئة إعدادات البوت الافتراضية بشكل أفضل." : "This will help us better configure the default bot settings."}
          </p>
        </div>

        {error ? <p className="mb-6 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-100">{error}</p> : null}

        {/* Industry Selector */}
        <div className="mb-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {INDUSTRIES.map((ind) => {
              const indKey = ind.id as keyof typeof t.auth.industries;
              const tr = t.auth.industries[indKey] || { title: "", desc: "" };
              return (
                <button
                  key={ind.id}
                  type="button"
                  onClick={() => setIndustry(ind.id)}
                  className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 p-6 text-center transition-all ${
                    industry === ind.id 
                      ? "border-primary-500 bg-primary-50 text-primary-700 shadow-md ring-1 ring-primary-500 dark:bg-slate-900" 
                      : "border-slate-100 bg-white text-slate-600 hover:border-primary-300 hover:bg-slate-50 dark:bg-slate-950 dark:border-slate-800"
                  }`}
                >
                  <div className={industry === ind.id ? "text-primary-600" : "text-slate-400"}>
                    {ind.icon}
                  </div>
                  <div>
                    <span className="block text-sm font-bold dark:text-slate-200">{tr.title}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={() => onSaveCategory()} 
            disabled={loading || !industry}
            className="w-full h-12 rounded-lg bg-primary-600 text-white font-bold tracking-wide hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? <Loader2 size={18} className="animate-spin mr-2 rtl:ml-2 rtl:mr-0" /> : null}
            {loading ? t.auth.processing : t.auth.saveContinueButton}
          </button>
        </div>
      </div>
      );
    }

    return (
      <form onSubmit={onRegisterSubmit} className="w-full max-w-md mx-auto animate-in fade-in zoom-in-95 duration-300">
        {renderProgress()}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t.auth.registerTitle}</h1>
          <button
            type="button"
            onClick={() => setLocale(locale === "en" ? "ar" : "en")}
            className="text-xs font-semibold text-slate-500 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            {locale === "en" ? "العربية" : "English"}
          </button>
        </div>
        {error ? <p className="mb-6 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-100">{error}</p> : null}

        {googleEnabled ? (
          <div className="mb-6">
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="flex w-full items-center justify-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white font-bold text-[#4285f4]">G</span>
              {locale === "ar" ? "المتابعة باستخدام Google" : "Continue with Google"}
            </button>
            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              <span className="text-xs font-semibold text-slate-400">{locale === "ar" ? "أو" : "or"}</span>
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        ) : null}
        
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <div>
            <label className="block text-xs text-slate-500 font-semibold mb-1.5" htmlFor="name">{t.auth.nameLabel}</label>
            <input className="w-full border-b-2 border-slate-200 bg-transparent py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none transition-colors dark:text-white dark:border-slate-800" id="name" name="name" placeholder={t.auth.nameLabel} required />
          </div>
          <div>
            <label className="block text-xs text-slate-500 font-semibold mb-1.5" htmlFor="tenantName">{t.auth.companyLabel}</label>
            <input className="w-full border-b-2 border-slate-200 bg-transparent py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none transition-colors dark:text-white dark:border-slate-800" id="tenantName" name="tenantName" placeholder={t.auth.companyLabel} required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-500 font-semibold mb-1.5" htmlFor="email">{t.auth.emailLabel}</label>
            <input className="w-full border-b-2 border-slate-200 bg-transparent py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none transition-colors dark:text-white dark:border-slate-800" id="email" name="email" type="email" placeholder={t.auth.emailLabel} required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-500 font-semibold mb-1.5" htmlFor="password">{t.auth.passwordLabel}</label>
            <input
              className="w-full border-b-2 border-slate-200 bg-transparent py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none transition-colors dark:text-white dark:border-slate-800"
              id="password"
              name="password"
              type="password"
              placeholder={t.auth.passwordLabel}
              minLength={12}
              pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,128}"
              title={locale === "ar" ? "12 حرفا على الأقل مع حرف كبير وحرف صغير ورقم" : "At least 12 characters with uppercase, lowercase, and a number"}
              required
            />
            <p className="mt-2 text-xs text-slate-400">
              {locale === "ar" ? "12 حرفا على الأقل مع حرف كبير وحرف صغير ورقم." : "At least 12 characters with uppercase, lowercase, and a number."}
            </p>
          </div>
        </div>

        <div className="mb-8 flex flex-col gap-3">
          <div className="flex items-start gap-2">
            <input 
              type="checkbox" 
              id="terms" 
              name="terms" 
              required 
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              className="mt-1 border-slate-300 text-primary-600 focus:ring-primary-500 rounded cursor-pointer" 
            />
            <label htmlFor="terms" className="text-xs text-slate-500 cursor-pointer select-none">
              {locale === "en" ? "I agree to the " : "أوافق على "}
              <a href="/terms" className="text-slate-800 dark:text-slate-300 hover:text-primary-600 hover:underline" target="_blank" onClick={(e) => e.stopPropagation()}>
                {locale === "en" ? "Terms and Conditions" : "شروط الخدمة"}
              </a>
            </label>
          </div>
          <div className="flex items-start gap-2">
            <input 
              type="checkbox" 
              id="privacy" 
              name="privacy" 
              required 
              checked={agreedPrivacy}
              onChange={(e) => setAgreedPrivacy(e.target.checked)}
              className="mt-1 border-slate-300 text-primary-600 focus:ring-primary-500 rounded cursor-pointer" 
            />
            <label htmlFor="privacy" className="text-xs text-slate-500 cursor-pointer select-none">
              {locale === "en" ? "I agree to the " : "أقر بموافقتي على "}
              <a href="/privacy" className="text-slate-800 dark:text-slate-300 hover:text-primary-600 hover:underline" target="_blank" onClick={(e) => e.stopPropagation()}>
                {locale === "en" ? "Privacy Policy" : "سياسة الخصوصية"}
              </a>
            </label>
          </div>
        </div>
        
        <button 
          className="w-full h-12 rounded-lg bg-primary-600 text-white font-bold tracking-wide hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center" 
          disabled={!agreedTerms || !agreedPrivacy || loading}
        >
          {loading ? <Loader2 size={18} className="animate-spin mr-2 rtl:ml-2 rtl:mr-0" /> : null}
          {loading ? t.auth.registering : (locale === "en" ? "Register" : "إنشاء حساب")}
        </button>
        
        <div className="mt-8 text-center text-sm text-slate-500">
          {locale === "en" ? "Already a member? " : "لديك حساب بالفعل؟ "}
          <a href="/login" className="text-primary-600 hover:underline font-bold transition">
            {locale === "en" ? "Login" : "تسجيل الدخول"}
          </a>
        </div>
      </form>
    );
  };

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row bg-white dark:bg-slate-950">
      {/* Left Panel */}
      <div className="w-full md:w-4/12 lg:w-5/12 bg-[#2c2d43] p-10 lg:p-16 text-white flex flex-col relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-primary-500/20 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-purple-500/20 blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col h-full">
          <div className="mb-auto">
            <img src="/images/logo.png" alt="ChatZi Logo" className="h-10" />
          </div>
          
          <div className="my-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-white leading-tight">
              {locale === "en" ? "Start our journey" : "ابدأ رحلتنا"}
            </h2>
            <p className="text-base text-slate-300 leading-relaxed max-w-sm">
              {locale === "en" 
                ? "Join ChatZi today and revolutionize the way you communicate with your customers. Experience the power of omnichannel AI to build better relationships."
                : "انضم إلى منصة ChatZi اليوم وطوّر طريقة تواصلك مع عملائك لتجربة استثنائية وبناء علاقات أفضل من خلال الذكاء الاصطناعي."}
            </p>
          </div>
          
          <div className="mt-auto">
            <p className="text-sm text-slate-400">© {new Date().getFullYear()} ChatZi. All rights reserved.</p>
          </div>
        </div>
      </div>
      
      {/* Right Panel */}
      <div className="w-full md:w-8/12 lg:w-7/12 p-8 md:p-16 flex flex-col justify-center overflow-y-auto">
        {renderStep()}
      </div>
    </div>
  );
}
