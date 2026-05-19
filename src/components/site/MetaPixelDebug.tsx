"use client";

import { useEffect } from "react";

export function MetaPixelDebug() {
  useEffect(() => {
    // Enable by adding ?pixel_debug=1
    if (typeof window === "undefined") return;
    const enabled = new URLSearchParams(window.location.search).get("pixel_debug") === "1";
    if (!enabled) return;

    const anyWin = window as any;
    console.log("[pixel_debug] fbq exists:", typeof anyWin.fbq === "function");
    console.log("[pixel_debug] fbq.loaded:", anyWin.fbq?.loaded);
    console.log("[pixel_debug] fbq.queue length:", anyWin.fbq?.queue?.length);

    const scripts = Array.from(document.scripts).map((s) => s.src).filter(Boolean);
    console.log("[pixel_debug] scripts include fbevents:", scripts.some((s) => s.includes("fbevents.js")));

    // Observe network availability by requesting fbevents.js as an <img> (often blocked by ad blockers too).
    const img = new Image();
    img.onload = () => console.log("[pixel_debug] connect.facebook.net reachable (img load ok)");
    img.onerror = () => console.warn("[pixel_debug] connect.facebook.net blocked/unreachable (img error)");
    img.src = "https://connect.facebook.net/en_US/fbevents.js";
  }, []);

  return null;
}

