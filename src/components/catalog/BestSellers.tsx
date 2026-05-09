import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/data/products";

export function BestSellers({ products }: { products: Product[] }) {
  // Manual best-sellers (do not randomize).
  const BEST_SELLER_IDS = ["GK-TERRA-PC", "GK-AERO-ABS", "GK-NOVA-AL"] as const;
  const topSellers = BEST_SELLER_IDS.map((id) => products.find((p) => p.ref === id)).filter(
    (p): p is Product => Boolean(p)
  );
  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 pt-10 sm:px-6">
        <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-zinc-50">
          <div className="px-6 pt-6">
            <h2 className="text-balance text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
              🔥 Best sellers cette semaine
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Les modèles les plus commandés en ce moment.
            </p>
          </div>

          <div className="px-4 pb-6 pt-5 sm:px-6">
            <div
              className={[
                "flex gap-4 overflow-x-auto pb-2",
                "snap-x snap-mandatory",
                "no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none]",
                "md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:pb-0",
              ].join(" ")}
              style={{
                WebkitOverflowScrolling: "touch",
                touchAction: "pan-x",
              }}
            >
              {topSellers.map((p) => {
                return (
                  <div
                    key={p.id}
                    className={[
                      "snap-start group overflow-hidden rounded-3xl border bg-white shadow-sm",
                      "border-amber-200/70 ring-1 ring-amber-200/40",
                      "transition duration-200 hover:shadow-lg hover:scale-[1.02]",
                      "md:scale-[1.06] md:hover:scale-[1.08]",
                      "w-[85%] shrink-0 md:w-auto",
                    ].join(" ")}
                  >
                    <div className="relative aspect-[4/3] w-full bg-zinc-50">
                      <Image
                        src={p.images[0]}
                        alt={p.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        priority={false}
                      />
                      <div className="absolute left-3 top-3 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white shadow-sm ring-1 ring-white/30">
                        Top vente 🔥
                      </div>
                      <div
                        className="pointer-events-none absolute inset-0 opacity-0 transition duration-200 group-hover:opacity-100"
                        aria-hidden
                        style={{
                          boxShadow: "inset 0 0 0 1px rgba(245, 158, 11, 0.35)",
                        }}
                      />
                    </div>

                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-base font-semibold leading-6 text-zinc-900">
                            {p.name}
                          </div>
                          <div className="mt-1 text-sm text-zinc-600">
                            {p.tagline}
                          </div>
                        </div>
                      </div>

                      <Link
                        href={`/produit/${p.slug}`}
                        className={[
                          "mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm",
                          "transition duration-200 hover:bg-zinc-800 hover:shadow-md hover:scale-[1.01]",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30",
                        ].join(" ")}
                      >
                        Voir produit
                      </Link>
                    </div>
                  </div>
                );
              })}

              {/* Spacer so last card isn't glued to the edge on mobile */}
              <div className="w-1 shrink-0 md:hidden" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
