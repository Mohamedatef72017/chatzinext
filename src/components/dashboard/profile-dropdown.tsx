"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, Settings, CreditCard, LogOut, ChevronDown } from "lucide-react";

export function ProfileDropdown({ name, email }: { name: string; email: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full bg-slate-100 dark:bg-white/5 p-1 pr-3 rtl:pr-1 rtl:pl-3 transition-colors hover:bg-slate-200 dark:hover:bg-white/10"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white shadow-sm">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="hidden text-start sm:block">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{name}</p>
        </div>
        <ChevronDown size={14} className="text-slate-500 dark:text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 rtl:right-auto rtl:left-0 top-full mt-2 w-56 origin-top-right rtl:origin-top-left rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1b36] p-1.5 shadow-xl transition-all z-50">
          <div className="border-b border-slate-100 dark:border-white/10 px-3 py-2.5 mb-1">
            <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{name}</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{email}</p>
          </div>
          
          <div className="flex flex-col gap-0.5">
            <Link
              href="/dashboard/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <User size={16} />
              الملف الشخصي
            </Link>
            <Link
              href="/dashboard/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <Settings size={16} />
              الإعدادات
            </Link>
            <Link
              href="/dashboard/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <CreditCard size={16} />
              الاشتراك
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
