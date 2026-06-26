"use client";

import { useEffect, useState } from "react";

export type SidebarCounts = {
  conversations: {
    active: number;
    unread: number;
    byChannel: Array<{ channel: string; count: number }>;
  };
  tickets: {
    open: number;
    new: number;
  };
  leads: {
    new: number;
  };
};

const initialCounts: SidebarCounts = {
  conversations: { active: 0, unread: 0, byChannel: [] },
  tickets: { open: 0, new: 0 },
  leads: { new: 0 },
};

export function useSidebarCounts() {
  const [counts, setCounts] = useState<SidebarCounts>(initialCounts);

  useEffect(() => {
    async function loadCounts() {
      try {
        const response = await fetch("/api/dashboard/sidebar-counts", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as SidebarCounts;
        setCounts(data);
      } catch {
        // keep existing values
      }
    }

    loadCounts();
    const onRealtime = () => loadCounts();
    window.addEventListener("chatzi:realtime-event", onRealtime);
    const interval = window.setInterval(loadCounts, 30_000);
    return () => {
      window.removeEventListener("chatzi:realtime-event", onRealtime);
      window.clearInterval(interval);
    };
  }, []);

  return counts;
}
