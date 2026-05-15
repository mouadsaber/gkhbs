"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function MetaPixelPageView() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.fbq) return;
    window.fbq("track", "PageView");
  }, [pathname]);

  return null;
}
