"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaWhatsapp, FaFacebookMessenger, FaInstagram, FaTelegramPlane } from "react-icons/fa";
import { MessageSquare, PlugZap } from "lucide-react";

interface ChannelData {
  name: string;
  description: string;
}

export function CircularChannels({ channelsData }: { channelsData: readonly ChannelData[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div className="h-[400px] sm:h-[500px]" />;

  const getIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("whatsapp")) return <FaWhatsapp size={28} className="text-white" />;
    if (lowerName.includes("messenger")) return <FaFacebookMessenger size={28} className="text-white" />;
    if (lowerName.includes("instagram")) return <FaInstagram size={28} className="text-white" />;
    if (lowerName.includes("telegram")) return <FaTelegramPlane size={28} className="text-white" />;
    if (lowerName.includes("website") || lowerName.includes("موقع") || lowerName.includes("chat")) return <MessageSquare size={28} className="text-white" />;
    return <PlugZap size={28} className="text-white" />;
  };

  const getColors = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("whatsapp")) return "from-[#25D366] to-[#128C7E] shadow-[#25D366]/40";
    if (lowerName.includes("messenger")) return "from-[#00B2FF] to-[#006AFF] shadow-[#0084FF]/40";
    if (lowerName.includes("instagram")) return "from-[#f09433] via-[#dc2743] to-[#bc1888] shadow-[#E1306C]/40";
    if (lowerName.includes("telegram")) return "from-[#0088cc] to-[#00a2ff] shadow-[#0088cc]/40";
    if (lowerName.includes("website") || lowerName.includes("موقع") || lowerName.includes("chat")) return "from-slate-700 to-slate-900 shadow-slate-900/40";
    return "from-[#7B61FF] to-blue-600 shadow-[#7B61FF]/40";
  };

  return (
    <div className="relative mx-auto mt-16 flex h-[350px] w-full max-w-[600px] items-center justify-center sm:h-[500px]">
      {/* Central Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute z-20 flex h-28 w-28 items-center justify-center rounded-full bg-white shadow-[0_0_40px_rgba(97,25,230,0.15)] dark:bg-slate-900 dark:shadow-[0_0_40px_rgba(225,51,130,0.15)] sm:h-36 sm:w-36"
      >
        <div className="absolute inset-0 -z-10 animate-pulse rounded-full bg-[#6119E6]/10 blur-xl dark:bg-[#E13382]/10" />
        <img
          src="/profile_black_trans.png"
          alt="Chatzi"
          className="h-14 w-14 object-contain dark:hidden sm:h-20 sm:w-20"
        />
        <img
          src="/profile_white_trans.png"
          alt="Chatzi"
          className="hidden h-14 w-14 object-contain dark:block sm:h-20 sm:w-20"
        />
      </motion.div>

      {/* Orbit Rings */}
      <div className="absolute h-[260px] w-[260px] rounded-full border border-slate-200/70 dark:border-slate-700/50 sm:h-[360px] sm:w-[360px]" />
      <div className="absolute h-[170px] w-[170px] rounded-full border border-slate-200/50 border-dashed dark:border-slate-800/50 sm:h-[240px] sm:w-[240px]" />

      {/* Channels */}
      {channelsData.map((channel, i) => {
        const angle = (i * 360) / channelsData.length - 90; // -90 to start at top
        const angleRad = (angle * Math.PI) / 180;
        
        const isHovered = hoveredIndex === i;

        return (
          <motion.div
            key={channel.name}
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{ 
              opacity: 1, 
              x: `calc(cos(${angleRad}rad) * var(--radius))`, 
              y: `calc(sin(${angleRad}rad) * var(--radius))` 
            }}
            transition={{ duration: 0.8, delay: i * 0.1, ease: "backOut" }}
            className="absolute z-30"
            style={{ 
              "--radius": "180px" 
            } as any}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* The Channel Icon */}
            <motion.div
              whileHover={{ scale: 1.15 }}
              className={`flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br shadow-xl backdrop-blur-sm sm:h-16 sm:w-16 ${getColors(channel.name)}`}
            >
              {getIcon(channel.name)}
            </motion.div>

            {/* Tooltip */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  className="pointer-events-none absolute left-1/2 mt-4 w-48 -translate-x-1/2 rounded-xl bg-slate-900 p-3 text-center shadow-2xl dark:bg-white"
                  style={{ zIndex: 50 }}
                >
                  <div className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-slate-900 dark:bg-white" />
                  <p className="relative z-10 text-sm font-extrabold text-white dark:text-slate-900">
                    {channel.name}
                  </p>
                  <p className="relative z-10 mt-1 text-xs font-medium text-slate-300 dark:text-slate-600">
                    {channel.description}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
      {/* Small inline style to handle responsive radius in framer-motion since we used CSS variable */}
      <style>{`
        @media (max-width: 640px) {
          .absolute.z-30 { --radius: 130px !important; }
        }
      `}</style>
    </div>
  );
}
