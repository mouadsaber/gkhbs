"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { VariantMediaItem } from "@/lib/productTypes";

export function ProductGallery({
  media,
  alt,
  className,
}: {
  media: VariantMediaItem[];
  alt: string;
  className?: string;
}) {
  type GalleryItem = { type: "image" | "video"; url: string; posterUrl?: string };

  const safeImages: GalleryItem[] = useMemo(() => {
    const list = Array.isArray(media) ? media.filter((m) => m && m.url) : [];
    const normalized: GalleryItem[] = list
      .map(
        (m): GalleryItem => ({
          type: m.type === "video" ? "video" : "image",
          url: m.url,
          posterUrl: m.posterUrl,
        })
      )
      .slice(0, 6);
    return normalized.length
      ? normalized
      : [{ type: "image" as const, url: "/products/valise-cabine.svg" }];
  }, [media]);

  const [activeIndex, setActiveIndex] = useState(0);
  const activeSrc = safeImages[activeIndex] || safeImages[0]!;
  const [failed, setFailed] = useState<Record<string, true>>({});

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imageVisible, setImageVisible] = useState(true);
  const hoverZoomEnabled = useRef(false);
  const [hoverZoomActive, setHoverZoomActive] = useState(false);
  const [hoverOrigin, setHoverOrigin] = useState({ x: 50, y: 50 });

  const touchStartX = useRef<number | null>(null);

  // Reset when images set changes (e.g. color change).
  useEffect(() => {
    setActiveIndex(0);
    setFailed({});
  }, [safeImages.map((x) => `${x.type}:${x.url}:${x.posterUrl || ""}`).join("|")]);

  // Smooth fade when switching images.
  useEffect(() => {
    setImageVisible(false);
    const t = window.setTimeout(() => setImageVisible(true), 30);
    return () => window.clearTimeout(t);
  }, [activeSrc.url]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => {
      hoverZoomEnabled.current = Boolean(mq.matches);
      if (!mq.matches) {
        setHoverZoomActive(false);
        setHoverOrigin({ x: 50, y: 50 });
      }
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen, activeIndex, safeImages.length]);

  function prev() {
    setActiveIndex((i) => (i - 1 + safeImages.length) % safeImages.length);
  }
  function next() {
    setActiveIndex((i) => (i + 1) % safeImages.length);
  }

  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length !== 1) return;
    touchStartX.current = e.touches[0]!.clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    const startX = touchStartX.current;
    touchStartX.current = null;
    if (startX == null) return;
    const endX = e.changedTouches[0]?.clientX;
    if (typeof endX !== "number") return;
    const delta = endX - startX;
    if (Math.abs(delta) < 45) return;
    if (delta > 0) prev();
    else next();
  }

  return (
    <div className={className}>
      <div className="grid gap-4 lg:grid-cols-[92px_1fr]">
        {/* Thumbnails (desktop left) */}
        <div className="hidden lg:flex lg:flex-col lg:gap-3">
          {safeImages.map((item, idx) => {
            const active = idx === activeIndex;
            const thumbSrc =
              item.type === "video"
                ? item.posterUrl || "/products/valise-cabine.svg"
                : failed[item.url]
                  ? "/products/valise-cabine.svg"
                  : item.url;
            return (
              <button
                key={`${item.type}_${item.url}_${idx}`}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={[
                  "relative h-[76px] w-[76px] overflow-hidden rounded-2xl bg-zinc-50 ring-1 ring-inset transition",
                  active ? "ring-zinc-900" : "ring-zinc-200 hover:ring-zinc-300",
                ].join(" ")}
                aria-pressed={active}
                aria-label="Miniature"
              >
                {item.type === "video" ? (
                  <>
                    <Image
                      src={thumbSrc}
                      alt=""
                      fill
                      className="object-contain p-2"
                      sizes="80px"
                      onError={() =>
                        setFailed((m) => ({ ...m, [item.posterUrl || item.url]: true }))
                      }
                    />
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold text-white">
                        ▶
                      </div>
                    </div>
                  </>
                ) : (
                  <Image
                    src={thumbSrc}
                    alt=""
                    fill
                    className="object-contain p-2"
                    sizes="80px"
                    onError={() => setFailed((m) => ({ ...m, [item.url]: true }))}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Main image */}
        <div className="min-w-0">
          <div className="relative overflow-hidden rounded-[24px] bg-white ring-1 ring-zinc-200">
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              onMouseEnter={() => {
                if (!hoverZoomEnabled.current) return;
                if (activeSrc.type === "image") setHoverZoomActive(true);
              }}
              onMouseLeave={() => {
                setHoverZoomActive(false);
                setHoverOrigin({ x: 50, y: 50 });
              }}
              onMouseMove={(e) => {
                if (!hoverZoomEnabled.current) return;
                if (!hoverZoomActive) return;
                if (activeSrc.type !== "image") return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                setHoverOrigin({
                  x: Math.max(0, Math.min(100, x)),
                  y: Math.max(0, Math.min(100, y)),
                });
              }}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              className={[
                "relative block w-full bg-white",
                "h-[360px] sm:h-[460px] lg:h-[650px]",
                hoverZoomEnabled.current ? "cursor-zoom-in" : "cursor-pointer",
              ].join(" ")}
              aria-label="Voir l’image en plein écran"
            >
              {activeSrc.type === "video" ? (
                <video
                  key={activeSrc.url}
                  className={[
                    "absolute inset-0 h-full w-full p-4 sm:p-6",
                    imageVisible ? "opacity-100" : "opacity-0",
                    "transition-opacity duration-300 ease-out",
                  ].join(" ")}
                  style={{ objectFit: "contain" }}
                  src={activeSrc.url}
                  poster={activeSrc.posterUrl}
                  controls
                  playsInline
                  muted
                  autoPlay
                  preload="metadata"
                />
              ) : (
                <Image
                  key={activeSrc.url}
                  src={failed[activeSrc.url] ? "/products/valise-cabine.svg" : activeSrc.url}
                  alt={alt}
                  fill
                  className={[
                    "object-contain p-4 sm:p-6",
                    "will-change-transform",
                    "transition-[transform,opacity] duration-300 ease-out",
                    imageVisible ? "opacity-100" : "opacity-0",
                  ].join(" ")}
                  onError={() => setFailed((m) => ({ ...m, [activeSrc.url]: true }))}
                  style={{
                    transformOrigin: hoverZoomActive
                      ? `${hoverOrigin.x}% ${hoverOrigin.y}%`
                      : "center center",
                    transform: hoverZoomActive ? "scale(1.8)" : "scale(1)",
                  }}
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  priority
                />
              )}
              {/* Subtle slide hint on mobile */}
              {safeImages.length > 1 ? (
                <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur lg:hidden">
                  Glissez pour voir plus
                </div>
              ) : null}
            </button>
          </div>

          {/* Thumbnails (mobile bottom) */}
          {safeImages.length > 1 ? (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-1 lg:hidden">
              {safeImages.map((item, idx) => {
                const active = idx === activeIndex;
                const thumbSrc =
                  item.type === "video"
                    ? item.posterUrl || "/products/valise-cabine.svg"
                    : failed[item.url]
                      ? "/products/valise-cabine.svg"
                      : item.url;
                return (
                  <button
                    key={`${item.type}_${item.url}_${idx}`}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className={[
                      "relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-zinc-50 ring-1 ring-inset transition",
                      active
                        ? "ring-zinc-900"
                        : "ring-zinc-200 hover:ring-zinc-300 hover:shadow-sm",
                    ].join(" ")}
                    aria-pressed={active}
                    aria-label="Miniature"
                  >
                    {item.type === "video" ? (
                      <>
                        <Image
                          src={thumbSrc}
                          alt=""
                          fill
                          className="object-contain p-2"
                          sizes="80px"
                          onError={() =>
                            setFailed((m) => ({ ...m, [item.posterUrl || item.url]: true }))
                          }
                        />
                        <div className="absolute inset-0 grid place-items-center">
                          <div className="rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold text-white">
                            ▶
                          </div>
                        </div>
                      </>
                    ) : (
                      <Image
                        src={thumbSrc}
                        alt=""
                        fill
                        className="object-contain p-2"
                        sizes="80px"
                        onError={() => setFailed((m) => ({ ...m, [item.url]: true }))}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            onClick={() => setLightboxOpen(false)}
            aria-label="Fermer"
          />
          <div className="absolute inset-x-0 top-0 mx-auto flex h-full w-full max-w-6xl items-center justify-center p-4">
            <div className="relative w-full overflow-hidden rounded-3xl bg-black">
              <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLightboxOpen(false)}
                  className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
                >
                  Fermer
                </button>
              </div>

              {safeImages.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={prev}
                    className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
                    aria-label="Image précédente"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
                    aria-label="Image suivante"
                  >
                    →
                  </button>
                </>
              ) : null}

              <div
                className="relative h-[70vh] w-full"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
              >
                {activeSrc.type === "video" ? (
                  <video
                    className="absolute inset-0 h-full w-full"
                    style={{ objectFit: "contain" }}
                    src={activeSrc.url}
                    poster={activeSrc.posterUrl}
                    controls
                    playsInline
                    muted
                    preload="metadata"
                    autoPlay
                  />
                ) : (
                  <Image
                    src={failed[activeSrc.url] ? "/products/valise-cabine.svg" : activeSrc.url}
                    alt={alt}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    priority
                    onError={() => setFailed((m) => ({ ...m, [activeSrc.url]: true }))}
                  />
                )}
              </div>

              {safeImages.length > 1 ? (
                <div className="flex gap-2 overflow-x-auto border-t border-white/10 bg-black/40 p-3">
                  {safeImages.map((item, idx) => {
                    const active = idx === activeIndex;
                    return (
                      <button
                        key={`lb_${item.type}_${item.url}_${idx}`}
                        type="button"
                        onClick={() => setActiveIndex(idx)}
                        className={[
                          "relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl ring-1 ring-inset transition",
                          active ? "ring-white" : "ring-white/20 hover:ring-white/40",
                        ].join(" ")}
                        aria-pressed={active}
                        aria-label="Miniature"
                      >
                        {item.type === "video" ? (
                          <>
                            <Image
                              src={item.posterUrl || "/products/valise-cabine.svg"}
                              alt=""
                              fill
                              className="object-contain p-2"
                              sizes="64px"
                            />
                            <div className="absolute inset-0 grid place-items-center">
                              <div className="rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold text-white">
                                ▶
                              </div>
                            </div>
                          </>
                        ) : (
                          <Image
                            src={item.url}
                            alt=""
                            fill
                            className="object-contain p-2"
                            sizes="64px"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
