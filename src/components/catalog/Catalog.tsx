"use client";

import { useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/productTypes";
import { ProductCard } from "@/components/catalog/ProductCard";

const PER_PAGE = 6;
export function Catalog({
  products,
  cover,
}: {
  products: Product[];
  cover: {
    desktopUrl: string;
    mobileUrl: string;
    linkUrl: string;
    linkedProductSlug: string;
    alt: string;
  };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.max(1, Math.ceil(products.length / PER_PAGE));

  const currentPage = useMemo(() => {
    const raw = searchParams.get("page");
    const n = raw ? Number(raw) : 1;
    if (!Number.isFinite(n) || n < 1) return 1;
    return Math.min(totalPages, Math.floor(n));
  }, [searchParams, totalPages]);

  const pagedProducts = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE;
    return products.slice(start, start + PER_PAGE);
  }, [currentPage, products]);

  const bestSellers = useMemo(() => {
    return products.filter((p) => p.bestSeller).slice(0, 3);
  }, [products]);

  const fadeKey = currentPage;

  function goToPage(page: number) {
    const next = Math.min(totalPages, Math.max(1, page));
    const params = new URLSearchParams(searchParams.toString());
    if (next === 1) params.delete("page");
    else params.set("page", String(next));

    startTransition(() => {
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-6 sm:px-6">
          {(() => {
            const href = cover.linkedProductSlug
              ? `/produit/${cover.linkedProductSlug}`
              : cover.linkUrl || "";
            const clickable = Boolean(href);
            const block = (
              <div
                className={[
                  "mb-4 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50",
                  clickable
                    ? "cursor-pointer transition hover:shadow-md hover:-translate-y-[1px]"
                    : "",
                ].join(" ")}
              >
                <CoverImages cover={cover} />
              </div>
            );
            if (!clickable) return block;
            return (
              <Link href={href} className="block">
                {block}
              </Link>
            );
          })()}

          <div className="text-center">
            <p className="text-sm font-medium text-zinc-600">
              Catalogue valises • Maroc
            </p>
            <div className="pointer-events-none relative mx-auto mt-3 h-10 w-[135px] opacity-70">
              <Image
                src="/brand/gkh-logo.png"
                alt=""
                fill
                className="object-contain"
                sizes="135px"
                priority={false}
              />
            </div>
            <h1 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
              Valises premium au Maroc
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-pretty text-base leading-7 text-zinc-700 sm:text-lg">
              Valises premium dès <span className="font-semibold">550 DH</span> · Pack 3 valises disponible
            </p>
            <p className="mx-auto mt-2 max-w-2xl text-pretty text-sm leading-6 text-zinc-600 sm:text-base">
              Livraison partout au Maroc · Paiement à la livraison · Demande par email
            </p>
          </div>

          <div className="mt-4 overflow-hidden rounded-3xl border border-zinc-200/80 bg-amber-50/35 p-5 ring-1 ring-amber-200/30 sm:p-6">
            <div className="text-center">
              <h2 className="text-base font-semibold tracking-tight text-zinc-900 sm:text-lg">
                🔥 Best sellers cette semaine
              </h2>
            </div>

            <div
              className={[
                "mt-4 flex gap-4 overflow-x-auto pb-2",
                "snap-x snap-mandatory",
                "no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none]",
                "md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:pb-0",
              ].join(" ")}
              style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x pan-y" }}
            >
              {bestSellers.map((p) => (
                <div key={p.id} className="snap-start w-[320px] shrink-0 md:w-auto">
                  <ProductCard product={p} />
                </div>
              ))}
              <div className="w-1 shrink-0 md:hidden" />
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <TrustBadge label="Livraison partout au Maroc" />
              <TrustBadge label="Paiement à la livraison" />
              <TrustBadge label="Support client réactif" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6">
          <div
            key={fadeKey}
            className={[
              "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3",
              "transition-opacity duration-200",
              isPending ? "opacity-70" : "opacity-100",
            ].join(" ")}
            style={{ animation: "catalogFade 180ms ease" }}
          >
            {pagedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onChange={goToPage}
          />
        </div>
      </section>
    </>
  );
}

function CoverImages({
  cover,
}: {
  cover: { desktopUrl: string; mobileUrl: string; alt: string };
}) {
  return (
    <>
      <div className="relative hidden aspect-[1600/520] w-full sm:block">
        <Image
          src={cover.desktopUrl}
          alt={cover.alt}
          fill
          className="object-cover"
          sizes="(min-width: 640px) 1200px, 100vw"
          priority
        />
      </div>
      <div className="relative aspect-[900/720] w-full sm:hidden">
        <Image
          src={cover.mobileUrl}
          alt={cover.alt}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
      </div>
    </>
  );
}

function TrustBadge({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm">
      <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onChange,
}: {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <>
      <style jsx global>{`
        @keyframes catalogFade {
          from {
            opacity: 0.75;
            transform: translateY(2px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className="mt-10 flex items-center justify-between gap-3">
        {/* Mobile: simple buttons */}
        <div className="flex w-full items-center justify-between gap-3 sm:hidden">
          <button
            type="button"
            onClick={() => onChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="inline-flex w-full items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => onChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="inline-flex w-full items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>

        {/* Desktop: previous / numbers / next */}
        <div className="hidden w-full items-center justify-between gap-3 sm:flex">
          <button
            type="button"
            onClick={() => onChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50"
          >
            Previous
          </button>

          <div className="flex items-center gap-2">
            {pages.map((p) => {
              const active = p === currentPage;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onChange(p)}
                  className={[
                    "h-11 min-w-11 rounded-2xl px-4 text-sm font-semibold transition",
                    active
                      ? "bg-zinc-900 text-white"
                      : "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50",
                  ].join(" ")}
                  aria-current={active ? "page" : undefined}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => onChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}
