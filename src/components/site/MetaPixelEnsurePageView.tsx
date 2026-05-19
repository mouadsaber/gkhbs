"use client";

import { useEffect, useRef } from "react";

/**
 * Safety-net for App Router navigations + ad-block edge cases:
 * ensures a client-side PageView attempt happens after hydration.
 * Renders nothing and does not affect UI.
 */
export function MetaPixelEnsurePageView() {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    if (typeof window === "undefined") return;

    const attempt = () => {
      const fbq = window.fbq;
      if (typeof fbq === "function") {
        console.log("[META] PageView attempt (client)");
        try {
          fbq("track", "PageView");
          console.log("[META] PageView fired (client)");
        } catch (error) {
          console.error("[META] PageView failed (client)", error);
        }
      } else {
        console.log("[META] fbq missing (client)");
      }
    };

    // Attempt immediately after hydration...
    attempt();
    // ...and once more shortly after to catch late fbevents load.
    const t = window.setTimeout(attempt, 800);
    return () => window.clearTimeout(t);
  }, []);

  return null;
}
