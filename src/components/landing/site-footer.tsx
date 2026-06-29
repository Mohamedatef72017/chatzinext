"use client";

import Link from "next/link";
import { FaLinkedinIn, FaInstagram, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { landingContent, type LandingLocale } from "@/lib/landing-content";
import { BrandLogo } from "./brand-logo";
import { sectorsData } from "@/lib/sectors-content";

export function SiteFooter({ locale }: { locale: LandingLocale }) {
  const copy = landingContent[locale];
  const isEnglish = copy.dir === "ltr";
  
  // Use "en" as fallback if locale is not perfectly matching "en" or "ar"
  const sectorLang = locale.startsWith("en") ? "en" : "ar-ae";
  const sectors = sectorsData[sectorLang as keyof typeof sectorsData] || sectorsData["ar-ae"];

  const colProduct = isEnglish ? "PRODUCT" : "المنتجات";
  const colIndustries = isEnglish ? "INDUSTRIES" : "القطاعات";
  const colCompany = isEnglish ? "COMPANY" : "الشركة";
  const colLegal = isEnglish ? "LEGAL" : "قانوني";
  const sectorBasePath = isEnglish ? "" : `/${locale}`;

  return (
    <footer className="bg-[#06030e] text-white py-16 border-t border-white/10" dir={copy.dir}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
          
          {/* Logo and Social */}
          <div className="lg:col-span-4">
            <Link href={isEnglish ? "/" : locale === "ar-jo" ? "/ar-jo" : locale === "ar-eg" ? "/ar-eg" : "/ar-ae"} className="inline-block">
              <span className="relative block shrink-0 overflow-hidden h-11 w-28 sm:w-32">
                <img
                  src="/profile_white_trans.png"
                  alt="Chatzi"
                  className="h-full w-full object-contain object-left scale-[1.3] origin-left"
                />
              </span>
            </Link>
            <p className="mt-6 text-sm text-slate-400 max-w-xs leading-relaxed">
              {isEnglish 
                ? "Every conversation. One place. Zero noise. The unified inbox + AI agents for modern customer teams." 
                : "كل محادثاتك في مكان واحد. صندوق الوارد الموحد + وكلاء الذكاء الاصطناعي لفرق خدمة العملاء الحديثة."}
            </p>
            <div className="mt-8 flex items-center gap-3">
              <a href="https://www.youtube.com/@chatzi.social" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/20 hover:text-[#E13382]">
                <FaYoutube size={16} />
              </a>
              <a href="https://x.com/chatzisocial" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/20 hover:text-slate-300">
                <FaXTwitter size={16} />
              </a>
              <a href="https://www.instagram.com/chatzi_io/" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/20 hover:text-[#E13382]">
                <FaInstagram size={16} />
              </a>
            </div>
          </div>

          {/* Links columns */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2">
              {colProduct}
            </h4>
            <ul className="space-y-4 text-sm text-slate-300">
              <li><Link href="#" className="hover:text-[#6119E6] transition flex items-center gap-2">{isEnglish ? "Unified Inbox" : "صندوق الوارد الموحد"}</Link></li>
              <li><Link href="#" className="hover:text-[#6119E6] transition flex items-center gap-2">{isEnglish ? "AI Agents" : "وكلاء الذكاء الاصطناعي"}</Link></li>
              <li><Link href="#" className="hover:text-[#6119E6] transition flex items-center gap-2">{isEnglish ? "Automation" : "الأتمتة"}</Link></li>
              <li><Link href="#" className="hover:text-[#6119E6] transition flex items-center gap-2">{isEnglish ? "Broadcast" : "البث"}</Link></li>
              <li><Link href="/pricing" className="hover:text-[#6119E6] transition flex items-center gap-2">{isEnglish ? "Pricing" : "الأسعار"}</Link></li>
              <li><Link href="/login" className="hover:text-[#6119E6] transition flex items-center gap-2">{isEnglish ? "Sign in" : "تسجيل الدخول"}</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2">
              {colIndustries}
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-300">
              {sectors.map((sector) => (
                <li key={sector.id}>
                  <Link href={`${sectorBasePath}/sectors/${sector.id}`} className="hover:text-[#E13382] transition flex items-center gap-2">
                    <span className="opacity-70 scale-75">{sector.icon}</span>
                    <span>{sector.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-8">
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2">
                {colCompany}
              </h4>
              <ul className="space-y-4 text-sm text-slate-300">
                <li><Link href={isEnglish ? "/#contact" : `/${locale}/#contact`} className="hover:text-[#6119E6] transition flex items-center gap-2">{isEnglish ? "Contact" : "اتصل بنا"}</Link></li>
                <li><Link href="#" className="hover:text-[#6119E6] transition flex items-center gap-2">{isEnglish ? "FAQ" : "الأسئلة الشائعة"}</Link></li>
                <li><Link href="/book" className="hover:text-[#6119E6] transition flex items-center gap-2">{isEnglish ? "Book a Demo" : "احجز عرضاً"}</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2">
                {colLegal}
              </h4>
              <ul className="space-y-4 text-sm text-slate-300">
                <li><Link href="/privacy" className="hover:text-[#6119E6] transition flex items-center gap-2">{isEnglish ? "Privacy Policy" : "سياسة الخصوصية"}</Link></li>
                <li><Link href="/terms" className="hover:text-[#6119E6] transition flex items-center gap-2">{isEnglish ? "Terms & Conditions" : "الشروط والأحكام"}</Link></li>
                <li><Link href="#" className="hover:text-[#6119E6] transition flex items-center gap-2">{isEnglish ? "Service Level Agreement" : "اتفاقية مستوى الخدمة"}</Link></li>
              </ul>
            </div>
          </div>

        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 Chatzi. All rights reserved.</p>
          <p>Made with care for customer teams.</p>
        </div>
      </div>
    </footer>
  );
}
