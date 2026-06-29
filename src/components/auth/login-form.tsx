"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";

const loginCopy = {
  en: {
    title: "Login",
    username: "Email",
    usernamePlaceholder: "Type your email",
    password: "Password",
    passwordPlaceholder: "Type your password",
    forgotPassword: "Forgot password?",
    loading: "Loading...",
    submit: "Login",
    signUpHint: "New to ChatZi?",
    signUp: "Sign up",
    invalid: "Invalid credentials"
  },
  ar: {
    title: "تسجيل الدخول",
    username: "البريد الإلكتروني",
    usernamePlaceholder: "اكتب بريدك الإلكتروني",
    password: "كلمة المرور",
    passwordPlaceholder: "اكتب كلمة المرور",
    forgotPassword: "نسيت كلمة المرور؟",
    loading: "جاري الدخول...",
    submit: "دخول",
    signUpHint: "جديد في ChatZi؟",
    signUp: "إنشاء حساب",
    invalid: "بيانات الدخول غير صحيحة"
  }
} as const;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, dir } = useI18n();
  const copy = loginCopy[locale];
  const callbackUrl = searchParams?.get("callbackUrl") || "/dashboard";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((response) => response.json())
      .then((providers) => setGoogleEnabled(Boolean(providers?.google)))
      .catch(() => setGoogleEnabled(false));
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false
    });
    setLoading(false);

    if (result?.error) {
      setError(copy.invalid);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form
      dir={dir}
      onSubmit={onSubmit}
      className="theme-rescue relative z-10 flex min-h-[460px] w-full max-w-[560px] flex-col justify-center rounded-2xl border border-slate-200 bg-white px-8 py-8 shadow-[0_24px_80px_rgba(2,6,23,0.18)] dark:border-white/10 dark:bg-[#0b0418] sm:px-10 sm:py-10"
    >
      <div className="mb-8 flex flex-col items-center justify-center gap-3">
        <div className="flex items-center gap-3">
          <img src="/profile_black_trans.png" alt="ChatZi Logo" className="h-12 w-auto dark:hidden" />
          <img src="/profile_white_trans.png" alt="ChatZi Logo" className="hidden h-12 w-auto dark:block" />
        </div>
        <span className="inline-flex rounded-full bg-[#6119E6]/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.25em] text-[#6119E6] dark:bg-[#E13382]/15 dark:text-[#E13382]">
          ChatZi
        </span>
      </div>

      <h1 className="mb-8 text-center text-[32px] font-extrabold leading-[1.15] text-slate-950 dark:text-white">
        {copy.title}
      </h1>

      {error ? <p className="callout-error mb-4">{error}</p> : null}

      {googleEnabled ? (
        <>
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl })}
            className="mb-6 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white font-bold text-[#4285f4]">G</span>
            {locale === "ar" ? "المتابعة باستخدام Google" : "Continue with Google"}
          </button>
          <div className="mb-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-semibold text-slate-400">{locale === "ar" ? "أو" : "or"}</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>
        </>
      ) : null}

      <div className="mb-7">
        <label className="mb-2 block text-sm font-bold text-slate-800 dark:text-slate-200" htmlFor="email">
          {copy.username}
        </label>
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 transition-colors focus-within:border-[#6119E6] focus-within:bg-white dark:border-white/10 dark:bg-white/5 dark:focus-within:border-[#E13382]">
          <User className="mx-2 shrink-0 text-slate-400" size={16} strokeWidth={2.5} />
          <input
            className="w-full bg-transparent py-2 text-[15px] font-medium text-slate-950 outline-none placeholder:text-slate-400 dark:text-white"
            id="email"
            name="email"
            type="email"
            dir="ltr"
            placeholder={copy.usernamePlaceholder}
            required
          />
        </div>
      </div>

      <div className="mb-5">
        <label className="mb-2 block text-sm font-bold text-slate-800 dark:text-slate-200" htmlFor="password">
          {copy.password}
        </label>
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 transition-colors focus-within:border-[#6119E6] focus-within:bg-white dark:border-white/10 dark:bg-white/5 dark:focus-within:border-[#E13382]">
          <Lock className="mx-2 shrink-0 text-slate-400" size={16} strokeWidth={2.5} />
          <input
            className="w-full bg-transparent py-2 text-[15px] font-medium text-slate-950 outline-none placeholder:text-slate-400 dark:text-white"
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder={copy.passwordPlaceholder}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-slate-400 transition-colors hover:text-[#6119E6] focus:outline-none dark:hover:text-[#E13382]"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className="mb-7 flex justify-end">
        <a href="#" className="text-[13px] font-semibold text-slate-500 transition-colors hover:text-[#6119E6] dark:hover:text-[#E13382]">
          {copy.forgotPassword}
        </a>
      </div>

      <button
        className="mb-8 w-full rounded-xl bg-[#6119E6] py-4 text-sm font-extrabold uppercase tracking-[0.2em] text-white shadow-[0_14px_34px_-12px_rgba(97,25,230,0.75)] transition-all hover:scale-[1.01] hover:bg-[#4f13c2] dark:bg-[#E13382] dark:shadow-[0_14px_34px_-12px_rgba(225,51,130,0.75)] dark:hover:bg-[#c91f6c] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={loading}
      >
        {loading ? copy.loading : copy.submit}
      </button>

      <div className="mt-auto text-center">
        <span className="mb-2 block text-sm font-semibold text-slate-500 dark:text-slate-300">{copy.signUpHint}</span>
        <a href="/register" className="text-sm font-extrabold uppercase tracking-[0.2em] text-slate-950 transition-colors hover:text-[#6119E6] dark:text-white dark:hover:text-[#E13382]">
          {copy.signUp}
        </a>
      </div>
    </form>
  );
}
