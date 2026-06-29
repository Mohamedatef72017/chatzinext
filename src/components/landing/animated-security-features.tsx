"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, Lock, Users, Unplug, KeySquare, Bot, ShieldCheck } from "lucide-react";
import { FormattedText } from "./formatted-text";

interface SecurityPoint {
  title: string;
  text: string;
}

export function AnimatedSecurityFeatures({ points }: { points: readonly SecurityPoint[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const duration = 5000; // 5 seconds per tab

  const icons = [Link2, Lock, Users, Unplug, KeySquare, Bot];

  useEffect(() => {
    if (!points || points.length === 0) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % points.length);
      setProgressKey((prev) => prev + 1);
    }, duration);
    return () => clearInterval(timer);
  }, [points?.length, progressKey]);

  if (!points) return null;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col gap-4">
        {points.map((point, idx) => {
          const Icon = icons[idx] || ShieldCheck;
          const isActive = activeIndex === idx;

          return (
            <div
              key={idx}
              className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 transition-all duration-300 cursor-pointer ${
                isActive
                  ? "border-[#6119E6]/40 bg-white shadow-lg dark:border-[#E13382]/40 dark:bg-[#0c081c]"
                  : "border-slate-200 bg-white/50 hover:bg-white dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/10"
              }`}
              onClick={() => {
                setActiveIndex(idx);
                setProgressKey((prev) => prev + 1);
              }}
            >
              <div className="flex items-start gap-4 sm:gap-6">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${
                    isActive
                      ? "bg-[#6119E6] text-white dark:bg-[#E13382]"
                      : "bg-[#6119E6]/10 text-[#6119E6] dark:bg-[#E13382]/20 dark:text-[#E13382]"
                  }`}
                >
                  <Icon size={24} />
                </div>
                <div className="flex-1">
                  <h3
                    className={`text-xl font-extrabold transition-colors duration-300 ${
                      isActive ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {point.title}
                  </h3>
                  
                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.div
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: "auto", opacity: 1, marginTop: 12 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
                          <FormattedText>{point.text}</FormattedText>
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Progress bar container at the bottom of the active card */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800">
                  <motion.div
                    key={progressKey}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: duration / 1000, ease: "linear" }}
                    className="h-full bg-[#6119E6] dark:bg-[#E13382]"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
