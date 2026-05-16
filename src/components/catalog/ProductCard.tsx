"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { Product } from "@/lib/productTypes";

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const initialVariantId = product.variants[0]?.id ?? "missing";
  const [variantId, setVariantId] = useState(() => initialVariantId);
  const [imageOpacity, setImageOpacity] = useState(1);
  const fadeTimer = useRef<number | null>(null);

  const activeVariant =
    product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const mainImage =
    activeVariant?.images[0] ||
    product.variants[0]?.images[0] ||
    "/products/valise-cabine.svg";
  const safeMainImage = mainImage && mainImage.trim().length ? mainImage : "/products/valise-cabine.svg";

  // Keep product cards consistent with product page default selection (20" Cabine).
  const defaultPrice = (() => {
    const sizes = product.sizes;
    const p20 = Number(sizes?.["20"]?.price || 0);
    if (Number.isFinite(p20) && p20 > 0) return p20;
    // Fallback for legacy/incomplete data: use the minimum positive price.
    if (!sizes) return 0;
    const vals = Object.values(sizes)
      .map((s) => Number(s?.price || 0))
      .filter((n) => Number.isFinite(n) && n > 0);
    return vals.length ? Math.min(...vals) : 0;
  })();

  function formatDh(value: number) {
    const n = Number.isFinite(value) ? Math.round(value) : 0;
    return `${n.toLocaleString("fr-FR")} DH`;
  }

  function openProduct() {
    router.push(`/produit/${product.slug}`);
  }

  function selectColor(e: React.MouseEvent, nextId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (nextId === variantId) return;

    // Smooth fade between images.
    setImageOpacity(0);
    if (fadeTimer.current) window.clearTimeout(fadeTimer.current);
    fadeTimer.current = window.setTimeout(() => {
      setVariantId(nextId);
      requestAnimationFrame(() => setImageOpacity(1));
    }, 140);
  }

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={openProduct}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") openProduct();
      }}
      className={[
        "group cursor-pointer overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm",
        "flex h-full flex-col",
        "transition duration-200 hover:shadow-lg hover:-translate-y-[2px]",
      ].join(" ")}
    >
      <div className="relative flex h-[230px] w-full items-center justify-center overflow-hidden bg-zinc-50 sm:h-[300px]">
        <div className="relative h-[95%] w-[95%]">
          <Image
            src={safeMainImage}
            alt={product.name}
            fill
            className="object-contain object-center transition-opacity duration-300 ease-out"
            style={{ opacity: imageOpacity }}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={false}
          />
        </div>
        <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-zinc-900 ring-1 ring-zinc-200 backdrop-blur">
          {product.reference}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold leading-6 text-zinc-900 line-clamp-1">
              {product.name}
            </h3>
            <p className="mt-1 text-sm text-zinc-600 line-clamp-3">
              {product.description}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-zinc-600">Couleurs:</span>
          <div className="flex items-center gap-2">
            {product.variants.slice(0, 5).map((v) => (
              <button
                key={v.id}
                title={v.colorName}
                aria-label={v.colorName}
                type="button"
                onClick={(e) => selectColor(e, v.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    // Prevent card navigation on keyboard activation.
                    e.preventDefault();
                    e.stopPropagation();
                    setVariantId(v.id);
                    setImageOpacity(1);
                  }
                }}
                className={[
                  "h-5 w-5 cursor-pointer rounded-full ring-1 ring-inset transition",
                  v.id === (activeVariant?.id ?? "")
                    ? "ring-zinc-900"
                    : "ring-zinc-300 hover:ring-zinc-400",
                ].join(" ")}
                style={{ backgroundColor: v.colorHex }}
              />
            ))}
          </div>
        </div>

        <div className="mt-3 text-sm font-medium text-zinc-600">
          {product.stockText || "Stock limité"}
        </div>

        {defaultPrice ? (
          <div className="mt-2 text-sm font-semibold text-zinc-900">
            <span className="text-[#009B5A]">{formatDh(defaultPrice)}</span>
          </div>
        ) : null}

        <div className="mt-auto grid gap-3 pt-4 sm:grid-cols-2">
          <Link
            href={`/produit/${product.slug}`}
            onClick={(e) => e.stopPropagation()}
            className={[
              "inline-flex w-full items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 shadow-sm",
              "transition duration-200 hover:bg-zinc-50 hover:shadow-md hover:scale-[1.01]",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
            ].join(" ")}
          >
            Voir produit
          </Link>
          <Link
            href={`/produit/${product.slug}?order=1`}
            onClick={(e) => e.stopPropagation()}
            className={[
              "inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm",
              "transition duration-200 hover:bg-emerald-700 hover:shadow-md hover:scale-[1.03]",
              "sm:group-hover:scale-[1.03] sm:group-hover:bg-emerald-700",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40",
            ].join(" ")}
          >
            Commander
          </Link>
        </div>

        <div className="mt-3 text-center text-xs font-medium text-zinc-500">
          Paiement à la livraison · Livraison 24–48h
        </div>
      </div>
    </div>
  );
}
