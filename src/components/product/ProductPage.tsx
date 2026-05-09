"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Product, ProductVariant, SizeKey } from "@/lib/productTypes";
import { SIZE_CONFIG } from "@/lib/productTypes";
import { ProductCard } from "@/components/catalog/ProductCard";

export function ProductPage({
  product,
  similarProducts,
  autoOpenOrder = false,
}: {
  product: Product;
  similarProducts: Product[];
  autoOpenOrder?: boolean;
}) {
  const initialVariant = product.variants[0] as ProductVariant | undefined;
  function selectVariant(v: ProductVariant) {
    setVariant(v);
    setSelectedImage(v.images[0] || "/products/valise-cabine.svg");
    setSizeKey(firstAvailableSizeKey(v));
  }

  const [variant, setVariant] = useState<ProductVariant>(
    initialVariant || {
      id: "missing",
      colorName: "—",
      colorHex: "#0A0A0A",
      images: ["/products/valise-cabine.svg"],
      sizes: {
        "20": { price: 0, inStock: false },
        "24": { price: 0, inStock: false },
        "28": { price: 0, inStock: false },
        pack3: { price: 0, inStock: false },
      },
    }
  );
  const [selectedImage, setSelectedImage] = useState(
    variant.images[0] || "/products/valise-cabine.svg"
  );
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [hoverZoomActive, setHoverZoomActive] = useState(false);
  const [hoverOrigin, setHoverOrigin] = useState({ x: 50, y: 50 });
  const [sizeKey, setSizeKey] = useState<SizeKey>(() => firstAvailableSizeKey(variant));
  const [quantity, setQuantity] = useState(1);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const demandeRef = useRef<HTMLDivElement | null>(null);
  const hoverZoomEnabled = useRef(false);

  const selectedSize = variant.sizes[sizeKey];
  const canOrder = Boolean(selectedSize) && selectedSize.inStock;

  const commanderLabel =
    !canOrder && sizeKey === "pack3"
      ? "Bientôt disponible"
      : "Envoyer la demande";

  useEffect(() => {
    if (!autoOpenOrder) return;
    window.setTimeout(() => {
      demandeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }, [autoOpenOrder]);

  useEffect(() => {
    // Enable hover zoom only on devices that support hover with a fine pointer.
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

  async function sendOrder(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setFormError(null);
    setSent(false);
    requestAnimationFrame(() => {
      demandeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    const qty = Number.isFinite(quantity) ? Math.max(1, quantity) : 1;
    const normalizedName = fullName.trim();
    const normalizedPhone = phone.trim();
    const normalizedCity = city.trim();

    if (!normalizedName || !normalizedPhone || !normalizedCity) {
      setFormError("Merci de remplir Nom complet, Téléphone et Ville.");
      return;
    }

    if (!canOrder) {
      setFormError("Veuillez sélectionner une taille disponible.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fullName: normalizedName,
          phone: normalizedPhone,
          city: normalizedCity,
          productName: product.name,
          reference: product.reference,
          productImage: variant.images[0] || "",
          color: variant.colorName,
          size: SIZE_CONFIG[sizeKey].label,
          quantity: qty,
        }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Orders API error:", errorText);
        setFormError(
          "Impossible d’envoyer la demande. Contactez-nous sur WhatsApp."
        );
        return;
      }
      setSent(true);
    } catch (err) {
      console.error("[order] submit failed", err);
      setFormError("Impossible d’envoyer la demande. Contactez-nous sur WhatsApp.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-white">
      <div className="mx-auto w-full max-w-[1400px] px-4 pt-8 pb-20 sm:px-6">
        <nav className="mb-6 text-sm text-zinc-600">
          <Link href="/" className="hover:text-zinc-900">
            Catalogue
          </Link>
          <span className="px-2 text-zinc-400">/</span>
          <span className="text-zinc-900">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[3fr_2fr] lg:items-start">
          {/* Left: gallery only */}
          <section className="min-w-0">
            <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white">
              <button
                type="button"
                onClick={() => {
                  setZoomOpen(true);
                  setZoomScale(1);
                }}
                onMouseEnter={() => {
                  if (!hoverZoomEnabled.current) return;
                  setHoverZoomActive(true);
                }}
                onMouseLeave={() => {
                  setHoverZoomActive(false);
                  setHoverOrigin({ x: 50, y: 50 });
                }}
                onMouseMove={(e) => {
                  if (!hoverZoomEnabled.current) return;
                  if (!hoverZoomActive) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  setHoverOrigin({
                    x: Math.max(0, Math.min(100, x)),
                    y: Math.max(0, Math.min(100, y)),
                  });
                }}
                className={[
                  "relative block w-full cursor-zoom-in bg-white",
                  "h-[360px] sm:h-[460px] lg:h-[650px]",
                ].join(" ")}
                aria-label="Zoom image"
              >
                <Image
                  src={selectedImage}
                  alt={product.name}
                  fill
                  className={[
                    "object-contain p-4 sm:p-6",
                    "will-change-transform",
                    "transition-transform duration-300 ease-out",
                  ].join(" ")}
                  style={{
                    transformOrigin: hoverZoomActive
                      ? `${hoverOrigin.x}% ${hoverOrigin.y}%`
                      : "center center",
                    transform: hoverZoomActive ? "scale(1.8)" : "scale(1)",
                  }}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {variant.images.map((img) => {
                const active = img === selectedImage;
                return (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    className={[
                      "relative h-16 w-16 overflow-hidden rounded-2xl bg-white ring-1 sm:h-18 sm:w-18",
                      active
                        ? "ring-zinc-900"
                        : "ring-zinc-200 hover:ring-zinc-300 hover:shadow-sm",
                    ].join(" ")}
                    aria-pressed={active}
                    aria-label="Miniature"
                  >
                    <Image
                      src={img}
                      alt=""
                      fill
                      className="object-contain p-2"
                      sizes="80px"
                    />
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              <div className="mb-3 text-sm font-semibold text-zinc-900">
                Pourquoi ce modèle ?
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <FeatureCard icon={<IconWheels />} title="Roues 360° silencieuses" />
                <FeatureCard icon={<IconShield />} title="Coque anti-choc" />
                <FeatureCard icon={<IconLock />} title="Serrure TSA" />
                <FeatureCard icon={<IconPlane />} title="Compatible cabine avion" />
                <FeatureCard icon={<IconMaterial />} title="Matière ABS/PC premium" />
                <FeatureCard icon={<IconTruck />} title="Livraison rapide 24–48h" />
              </div>
            </div>

            <ProductDetails product={product} />
          </section>

          <section className="min-w-0 lg:sticky lg:top-8">
            <div className="mb-3 flex items-center gap-3">
              <div className="relative h-9 w-24 opacity-90">
                <Image
                  src="/brand/gkh-logo.png"
                  alt=""
                  fill
                  className="object-contain object-left"
                  sizes="96px"
                  priority={false}
                />
              </div>
            </div>
            <p className="text-sm font-semibold text-zinc-600">{product.reference}</p>
            <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-3 text-pretty text-sm leading-6 text-zinc-600 sm:text-base">
              {product.description}
            </p>

            <div
              ref={demandeRef}
              className="mt-7 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm"
            >
              <div className="text-base font-semibold text-zinc-900">
                Demande de commande
              </div>
              <div className="mt-1 text-sm text-zinc-600">
                Sélectionnez votre modèle, taille et couleur, puis envoyez votre demande.
              </div>

              <div className="mt-4 text-sm font-medium text-zinc-700">
                🚚 Livraison estimée : 24–48h
              </div>

              <div className="mt-5">
                <Label>Couleur</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.variants.map((v) => {
                    const active = v.id === variant.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => selectVariant(v)}
                        className={[
                          "relative h-10 w-10 rounded-full ring-1 ring-inset transition",
                          active
                            ? "ring-zinc-900"
                            : "ring-zinc-200 hover:ring-zinc-300",
                        ].join(" ")}
                        aria-pressed={active}
                        aria-label={v.colorName}
                        title={v.colorName}
                      >
                        <span
                          className="absolute inset-1 rounded-full"
                          style={{ backgroundColor: v.colorHex }}
                          aria-hidden
                        />
                        {active ? (
                          <span
                            className="absolute inset-0 grid place-items-center text-white"
                            aria-hidden
                          >
                            ✓
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={sendOrder} className="mt-5 space-y-5">
                <div>
                  <Label>Taille</Label>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {(
                      Object.keys(SIZE_CONFIG) as Array<keyof typeof SIZE_CONFIG>
                    ).map((k) => {
                      const key = k as SizeKey;
                      const cfg = SIZE_CONFIG[key];
                      const s = variant.sizes[key];
                      const disabled = !s?.inStock;
                      const active = key === sizeKey;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            if (disabled) return;
                            setSizeKey(key);
                          }}
                          className={[
                            "rounded-2xl p-3 text-left ring-1 ring-inset transition",
                            active
                              ? "bg-zinc-900 text-white ring-zinc-900"
                              : disabled
                                ? "bg-zinc-50 text-zinc-400 ring-zinc-200"
                                : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50",
                          ].join(" ")}
                          aria-pressed={active}
                          aria-disabled={disabled}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold">{cfg.label}</div>
                              <div
                                className={[
                                  "mt-0.5 text-xs",
                                  active ? "text-white/80" : "text-zinc-500",
                                ].join(" ")}
                              >
                                {cfg.details}
                              </div>
                            </div>
                            {disabled && key === "pack3" ? (
                              <div
                                className={[
                                  "text-xs font-semibold",
                                  active ? "text-white/80" : "text-zinc-500",
                                ].join(" ")}
                              >
                                Bientôt disponible
                              </div>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label>Quantité</Label>
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="h-11 w-11 rounded-2xl border border-zinc-200 bg-white text-lg font-semibold text-zinc-900 hover:bg-zinc-50"
                      aria-label="Diminuer"
                    >
                      −
                    </button>
                    <input
                      inputMode="numeric"
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(Math.max(1, Number(e.target.value || 1)))
                      }
                      className="h-11 w-16 rounded-2xl border border-zinc-200 bg-white text-center text-sm font-semibold text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900/20"
                      aria-label="Quantité"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                      className="h-11 w-11 rounded-2xl border border-zinc-200 bg-white text-lg font-semibold text-zinc-900 hover:bg-zinc-50"
                      aria-label="Augmenter"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <div className="text-sm font-semibold text-zinc-900">Nom complet</div>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="mt-2 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900/15"
                      placeholder="Votre nom"
                      autoComplete="name"
                    />
                  </label>
                  <label className="block">
                    <div className="text-sm font-semibold text-zinc-900">Téléphone</div>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-2 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900/15"
                      placeholder="06..."
                      autoComplete="tel"
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <div className="text-sm font-semibold text-zinc-900">Ville</div>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="mt-2 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900/15"
                      placeholder="Casablanca, Rabat..."
                      autoComplete="address-level2"
                    />
                  </label>
                </div>

                {formError ? (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-800">
                    {formError}
                  </div>
                ) : null}

                {sent ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                    Merci, votre demande a été envoyée. Nous allons vous contacter rapidement.
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={!canOrder || sending}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 disabled:opacity-50"
                >
                  {sending ? "Envoi en cours…" : commanderLabel}
                </button>
              </form>

              <div className="mt-4 grid gap-1.5 text-sm text-zinc-700">
                <TrustRow label="Livraison 24–48h" />
                <TrustRow label="Paiement à la livraison" />
                <TrustRow label="Livraison partout au Maroc" />
              </div>
            </div>
          </section>
        </div>

        {/* Below: full-width sections */}
        <div className="mt-10 space-y-12">
          {product.variants.length > 1 ? (
            <section>
              <SectionTitle
                title="Autres couleurs disponibles"
                subtitle="Appuyez sur une couleur pour mettre à jour l’image."
              />
              <HorizontalCarousel>
                {product.variants.map((v) => {
                  const img = v.images[0] || "/products/valise-cabine.svg";
                  const active = v.id === variant.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => selectVariant(v)}
                      className={[
                        "snap-start text-left",
                        "w-[190px] shrink-0 overflow-hidden rounded-3xl border bg-white shadow-sm transition",
                        active
                          ? "border-zinc-900"
                          : "border-zinc-200 hover:border-zinc-300 hover:shadow-md",
                      ].join(" ")}
                      aria-pressed={active}
                    >
                      <div className="relative aspect-[4/3] w-full bg-zinc-50">
                        <Image
                          src={img}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="190px"
                        />
                      </div>
                      <div className="p-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3.5 w-3.5 rounded-full ring-1 ring-zinc-200"
                            style={{ backgroundColor: v.colorHex }}
                            aria-hidden
                          />
                        <div className="text-sm font-semibold text-zinc-900">
                          {v.colorName}
                        </div>
                      </div>
                      <div className="mt-2 text-xs font-medium text-zinc-600">
                        Appuyez pour sélectionner
                      </div>
                    </div>
                  </button>
                );
              })}
              </HorizontalCarousel>
            </section>
          ) : null}

          <section className="grid gap-8 lg:grid-cols-2 lg:items-start">
            <div>
              <SectionTitle
                title="Guide des tailles"
                subtitle="Choisissez la taille qui correspond à votre voyage."
              />
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <GuideCard title='20" Cabine' desc="Court voyage" />
                <GuideCard title='24" Moyen' desc="1 semaine" />
                <GuideCard title='28" Grand' desc="Famille / long voyage" />
              </div>
            </div>
            <div>
              <SectionTitle title="Avis clients" subtitle="Quelques retours récents." />
              <div className="grid gap-4 lg:grid-cols-1">
                <ReviewCard
                  name="Samira"
                  city="Rabat"
                  text="Très belle qualité, roues silencieuses. Livraison rapide."
                />
                <ReviewCard
                  name="Fatima"
                  city="Rabat"
                  text="وصلاتني الفاليز بجودة فوق التوقعات، الرويدات خفاف والتوصيل كان سريع بزاف."
                  rtl
                />
                <ReviewCard
                  name="Nadia"
                  city="Marrakech"
                  text="Commande facile, confirmation par téléphone, rien à dire."
                />
              </div>
            </div>
          </section>

          <section>
            <SectionTitle
              title="Modèles similaires"
              subtitle="Découvrez d’autres modèles."
            />
            <HorizontalCarousel>
              {similarProducts.map((p) => (
                <div key={p.id} className="snap-start w-[320px] shrink-0">
                  <ProductCard product={p} />
                </div>
              ))}
            </HorizontalCarousel>
          </section>

          <section>
            <SectionTitle title="FAQ" subtitle="Réponses rapides." />
            <div className="grid gap-2">
              <FaqItem
                q="Livraison"
                a="Livraison partout au Maroc. Les délais varient selon la ville et la disponibilité."
              />
              <FaqItem
                q="Paiement"
                a="Paiement à la livraison (COD). Vous payez à la réception du colis."
              />
              <FaqItem
                q="Commande"
                a="Choisissez taille/couleur, puis cliquez sur « Envoyer la demande par email »."
              />
              <FaqItem
                q="Échange"
                a="Échange possible sous 7 jours selon l’état du produit. Contactez-nous pour la procédure."
              />
            </div>
          </section>
        </div>
      </div>

      {zoomOpen ? (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setZoomOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-x-0 top-0 mx-auto flex h-full w-full max-w-5xl items-center justify-center p-4">
            <div className="relative w-full overflow-hidden rounded-3xl bg-black">
              <button
                type="button"
                onClick={() => setZoomOpen(false)}
                className="absolute right-3 top-3 z-10 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => setZoomScale((s) => (s === 1 ? 1.6 : 1))}
                className="absolute left-3 top-3 z-10 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
              >
                {zoomScale === 1 ? "Zoom +" : "Zoom −"}
              </button>
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={selectedImage}
                  alt={product.name}
                  fill
                  className="object-contain transition-transform duration-200"
                  style={{ transform: `scale(${zoomScale})` }}
                  sizes="100vw"
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-semibold text-zinc-900">{children}</div>;
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-4">
      <div className="text-lg font-semibold tracking-tight text-zinc-900">
        {title}
      </div>
      <div className="mt-1 text-sm text-zinc-600">{subtitle}</div>
    </div>
  );
}

function FeatureCard({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-start gap-3 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-zinc-50 ring-1 ring-zinc-200 text-zinc-900">
        {icon}
      </div>
      <div className="text-sm font-semibold leading-6 text-zinc-900">{title}</div>
    </div>
  );
}

function ProductDetails({ product }: { product: Product }) {
  const d = product.details || {};
  const items: Array<{ label: string; value: string; icon: React.ReactNode }> = [
    { label: "Matière", value: d.material || "", icon: <IconMaterial /> },
    { label: "Dimensions", value: d.dimensions || "", icon: <IconRuler /> },
    { label: "Poids", value: d.weight || "", icon: <IconWeight /> },
    { label: "Roues", value: d.wheels || "", icon: <IconWheelsSmall /> },
    { label: "Serrure", value: d.lock || "", icon: <IconLock /> },
    { label: "Poignée", value: d.handle || "", icon: <IconHandle /> },
    { label: "Garantie", value: d.warranty || "", icon: <IconWarranty /> },
    { label: "Livraison", value: d.shipping || "", icon: <IconTruck /> },
  ].filter((x) => x.value.trim().length > 0);

  const hasText = (product.detailedDescription || "").trim().length > 0;
  if (!items.length && !hasText) return null;

  return (
    <div className="mt-8 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-semibold text-zinc-900">Détails du produit</div>
      {items.length ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {items.map((it) => (
            <div
              key={it.label}
              className="flex items-start gap-3 rounded-3xl border border-zinc-200 bg-zinc-50 p-4"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-white ring-1 ring-zinc-200 text-zinc-900">
                {it.icon}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-zinc-600">{it.label}</div>
                <div className="mt-1 text-sm font-semibold text-zinc-900">
                  {it.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {hasText ? (
        <div className="mt-4 rounded-3xl bg-zinc-50 p-4 ring-1 ring-zinc-200">
          <div className="text-xs font-semibold text-zinc-600">
            Description détaillée
          </div>
          <div className="mt-2 text-sm leading-6 text-zinc-700 whitespace-pre-line">
            {product.detailedDescription}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function IconWheels() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M6 17V6.5A2.5 2.5 0 0 1 8.5 4h7A2.5 2.5 0 0 1 18 6.5V17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10 8h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconWheelsSmall() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M7 16V7.5A2.5 2.5 0 0 1 9.5 5h5A2.5 2.5 0 0 1 17 7.5V16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3 20 6.5V12c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6.5L12 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 12.5 11 14l3.5-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 11V8a5 5 0 0 1 10 0v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M7.5 11h9A2.5 2.5 0 0 1 19 13.5v4A2.5 2.5 0 0 1 16.5 20h-9A2.5 2.5 0 0 1 5 17.5v-4A2.5 2.5 0 0 1 7.5 11Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPlane() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 16l-8.5-3.5V3.5a1.5 1.5 0 0 0-3 0v9L3 16l.5 2L10 16.5V20l-2 1v1.5l4-1 4 1V21l-2-1v-3.5l6.5 1.5.5-2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconMaterial() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2 3 7v10l9 5 9-5V7l-9-5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 22V12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M21 7 12 12 3 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconTruck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 7h11v10H3V7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M14 10h4l3 3v4h-2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm12 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconRuler() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 20 20 4l0 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M7 17l-2-2m5-1-2-2m5-1-2-2m5-1-2-2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconWeight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 7a3 3 0 0 1 6 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M7 21h10l2-11H5l2 11Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconHandle() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 7a4 4 0 0 1 8 0v3H8V7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M7 10h10v10H7V10Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconWarranty() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2 4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 12.5 11 14l3.5-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrustRow({ label }: { label: string }) {
  return (
    <div className="flex items-start gap-2 text-sm text-zinc-700">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
      <span className="leading-6">{label}</span>
    </div>
  );
}

function GuideCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-semibold text-zinc-900">{title}</div>
      <div className="mt-1 text-sm text-zinc-600">{desc}</div>
    </div>
  );
}

function Stars() {
  return (
    <div className="flex items-center gap-0.5" aria-label="5 étoiles">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className="text-amber-500" aria-hidden>
          ★
        </span>
      ))}
    </div>
  );
}

function ReviewCard({
  name,
  city,
  text,
  rtl = false,
}: {
  name: string;
  city: string;
  text: string;
  rtl?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-zinc-900">
          {name} <span className="text-zinc-500">• {city}</span>
        </div>
        <Stars />
      </div>
      <div
        className="mt-2 text-sm text-zinc-600"
        dir={rtl ? "rtl" : undefined}
        style={rtl ? { textAlign: "right" } : undefined}
      >
        {text}
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-3xl border border-zinc-200 bg-white px-5 py-4 shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
        <span className="text-sm font-semibold text-zinc-900">{q}</span>
        <span
          className="text-zinc-500 transition group-open:rotate-45"
          aria-hidden
        >
          +
        </span>
      </summary>
      <div className="mt-3 text-sm leading-6 text-zinc-600">{a}</div>
    </details>
  );
}

function HorizontalCarousel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={[
        "flex gap-4 overflow-x-auto pb-2",
        "snap-x snap-mandatory",
        "[scrollbar-width:none]",
        "[-ms-overflow-style:none]",
      ].join(" ")}
      style={{
        WebkitOverflowScrolling: "touch",
        touchAction: "pan-x",
      }}
    >
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {children}
      <div className="w-1 shrink-0" />
    </div>
  );
}

function firstAvailableSizeKey(variant: ProductVariant): SizeKey {
  const order: SizeKey[] = ["20", "24", "28", "pack3"];
  for (const k of order) {
    const s = variant.sizes[k];
    if (s && s.inStock) return k;
  }
  return "20";
}
