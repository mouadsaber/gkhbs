"use client";

import Link from "next/link";

export function WhatsAppHelpFab() {
  // Moroccan number: 0765-787157 => international wa.me format.
  const waNumber = "212765787157";
  const href = `https://wa.me/${waNumber}`;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Besoin d’aide ? WhatsApp"
        className={[
          "group inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-2",
          "text-sm font-semibold text-white shadow-lg shadow-emerald-600/15",
          "transition hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/15",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40",
        ].join(" ")}
      >
        <span
          aria-hidden
          className="grid h-9 w-9 place-items-center rounded-full bg-white/15"
        >
          <svg
            viewBox="0 0 32 32"
            width="18"
            height="18"
            fill="currentColor"
            aria-hidden
          >
            <path d="M19.11 17.4c-.28-.14-1.64-.8-1.9-.9s-.44-.14-.63.14-.72.9-.88 1.08-.32.2-.6.06a7.62 7.62 0 0 1-2.24-1.38 8.42 8.42 0 0 1-1.56-1.94c-.16-.28 0-.44.12-.58.12-.12.28-.32.42-.48.14-.16.18-.28.28-.46.1-.18.06-.36 0-.5s-.63-1.52-.86-2.08c-.22-.52-.44-.46-.63-.46h-.54c-.18 0-.5.06-.76.36-.26.28-1 1-.98 2.44s1 2.84 1.14 3.04c.14.2 1.98 3.02 4.8 4.24.68.3 1.22.48 1.64.62.7.22 1.34.2 1.84.12.56-.08 1.64-.66 1.88-1.28.24-.62.24-1.14.16-1.28-.08-.14-.26-.2-.54-.34M16 3C8.82 3 3 8.82 3 16c0 2.2.58 4.34 1.68 6.24L3.58 28.6a1 1 0 0 0 1.22 1.22l6.36-1.1A12.94 12.94 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3m0 23.5c-2.12 0-4.2-.56-6.02-1.62a1 1 0 0 0-.7-.1l-3.78.66.66-3.78a1 1 0 0 0-.1-.7A11.5 11.5 0 1 1 16 26.5" />
          </svg>
        </span>
        <span className="hidden text-xs font-semibold sm:inline">
          Besoin d’aide ?
        </span>
      </Link>
    </div>
  );
}

