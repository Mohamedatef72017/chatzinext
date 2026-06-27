"use client";

import { useEffect, useState } from "react";

export function useAuthStatus() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((session) => {
        if (mounted) setIsAuthenticated(Boolean(session?.user));
      })
      .catch(() => {
        if (mounted) setIsAuthenticated(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return isAuthenticated;
}
