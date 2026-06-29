import React from "react";

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`relative block shrink-0 overflow-hidden ${compact ? "h-10 w-10" : "h-11 w-28 sm:w-32"}`}>
      <img
        src="/profile_black_trans.png"
        alt="Chatzi"
        className="h-full w-full object-contain object-left dark:hidden"
      />
      <img
        src="/profile_white_trans.png"
        alt="Chatzi"
        className="hidden h-full w-full object-contain object-left dark:block scale-[1.3] origin-left"
      />
    </span>
  );
}
