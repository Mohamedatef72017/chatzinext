"use client";

import { motion } from "framer-motion";
import { Bot, MessagesSquare, Database, Handshake, Workflow, BarChart3, Sparkles } from "lucide-react";
import { FormattedText } from "./formatted-text";

interface FeatureData {
  title: string;
  text: string;
}

export function GlassmorphicFeatures({
  featuresTitle,
  featuresData,
}: {
  featuresTitle: string;
  featuresData: FeatureData[];
}) {
  const icons = [Bot, MessagesSquare, Database, Handshake, Workflow, BarChart3];

  return (
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-32 sm:pb-40 z-10">
      {/* Background Glow Trails */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
        <div className="absolute w-[800px] h-[400px] bg-[#7B61FF]/20 dark:bg-[#7B61FF]/10 blur-[120px] rounded-full rotate-45 -translate-x-1/4" />
        <div className="absolute w-[600px] h-[600px] bg-blue-500/20 dark:bg-blue-500/10 blur-[120px] rounded-full translate-x-1/3" />
      </div>

      {/* Main Glass Panel */}
      <div className="relative z-10 rounded-[40px] border border-white/40 bg-white/40 p-8 sm:p-12 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0c081c]/60">
        
        {/* Header Section */}
        <div className="flex flex-col items-center justify-center text-center mb-16 relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/50 bg-white/50 px-3 py-1 mb-6 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
            <Sparkles size={14} className="text-[#7B61FF]" />
            <span className="text-[10px] font-extrabold tracking-wider text-slate-600 dark:text-slate-300">
              POWERED BY DENT-IX AI
            </span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-[#7B61FF] to-blue-500 drop-shadow-sm pb-2">
            {featuresTitle}
          </h2>
        </div>

        {/* 2x3 Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 relative">
          {/* SVG Connecting Lines for Desktop */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none hidden lg:block z-0" style={{ stroke: 'url(#gradient)', strokeWidth: 3, strokeDasharray: '8 8', opacity: 0.3 }}>
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7B61FF" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
            <path d="M 200 150 Q 350 250 500 150 T 800 150" fill="none" />
            <path d="M 200 450 Q 350 350 500 450 T 800 450" fill="none" />
          </svg>

          {featuresData.map((feature, idx) => {
            const Icon = icons[idx] || Bot;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="relative z-10 group flex flex-col items-center text-center rounded-3xl border border-white/60 bg-white/60 p-8 shadow-xl backdrop-blur-xl transition-all hover:-translate-y-2 hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              >
                <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7B61FF]/20 to-blue-500/20 shadow-inner">
                  <div className="absolute inset-0 rounded-2xl bg-white/50 backdrop-blur-sm dark:bg-black/20" />
                  <Icon size={36} className="relative z-10 text-[#7B61FF] drop-shadow-md transition-transform group-hover:scale-110" strokeWidth={1.5} />
                </div>
                <h3 className="mb-3 text-2xl font-extrabold text-slate-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-4 text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300 relative z-10 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors duration-300">
                  <FormattedText>{feature.text}</FormattedText>
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
