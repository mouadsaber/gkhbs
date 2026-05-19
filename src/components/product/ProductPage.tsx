"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Product, ProductVariant, SizeKey } from "@/lib/productTypes";
import { SIZE_CONFIG } from "@/lib/productTypes";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ProductGallery } from "@/components/product/ProductGallery";
import {
  trackAddToCart,
  trackInitiateCheckout,
  trackLead,
  trackPurchase,
  trackViewContent,
} from "@/lib/metaPixel";
import { getSizeConfig } from "@/lib/sizeConfig";

export function ProductPage({
  product,
  similarProducts,
  autoOpenOrder = false,
}: {
  product: Product;
  similarProducts: Product[];
  autoOpenOrder?: boolean;
}) {
  const landing = product.landing || {};
  const heroHook =
    typeof landing.heroHook === "string" && landing.heroHook.trim().length
      ? landing.heroHook.trim()
      : "";
  const heroBullets =
    Array.isArray(landing.heroBullets) && landing.heroBullets.length
      ? landing.heroBullets.slice(0, 6)
      : null;
  const pointsForts =
    Array.isArray(landing.pointsForts) && landing.pointsForts.length
      ? landing.pointsForts.slice(0, 6)
      : null;
  const faqs =
    Array.isArray(landing.faq) && landing.faq.length ? landing.faq.slice(0, 8) : null;
  const reviews =
    Array.isArray(landing.reviews) && landing.reviews.length
      ? landing.reviews.slice(0, 6)
      : null;

  const initialVariant = product.variants[0] as ProductVariant | undefined;
  function selectVariant(v: ProductVariant) {
    setVariant(v);
  }

  const [variant, setVariant] = useState<ProductVariant>(
    initialVariant || {
      id: "missing",
      colorName: "—",
      colorHex: "#0A0A0A",
      media: [{ type: "image", url: "/products/valise-cabine.svg" }],
      images: ["/products/valise-cabine.svg"],
      available: true,
    }
  );
  const [selectedSizeKeys, setSelectedSizeKeys] = useState<Set<SizeKey>>(
    () => new Set<SizeKey>([firstAvailableSizeKey(variant)])
  );
  const [quantity, setQuantity] = useState(1);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const purchaseFiredRef = useRef(false);
  const initiateFiredRef = useRef(false);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);
  const cityInputRef = useRef<HTMLInputElement | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsIndex, setDetailsIndex] = useState(0);
  const [pricePulse, setPricePulse] = useState(false);

  const demandeMobileRef = useRef<HTMLDivElement | null>(null);
  const demandeDesktopRef = useRef<HTMLDivElement | null>(null);
  const colorMobileRef = useRef<HTMLDivElement | null>(null);
  const colorDesktopRef = useRef<HTMLDivElement | null>(null);
  const sizeMobileRef = useRef<HTMLDivElement | null>(null);
  const sizeDesktopRef = useRef<HTMLDivElement | null>(null);

  const selectedKeys = useMemo(() => Array.from(selectedSizeKeys), [selectedSizeKeys]);
  const productAvailable = (product as any).available !== false;
  const canOrder =
    productAvailable &&
    selectedKeys.length > 0 &&
    selectedKeys.every((k) => Boolean(product.sizes[k]) && product.sizes[k].inStock);
  const selectedPrice = selectedKeys.reduce((sum, k) => {
    const p = product.sizes[k]?.price;
    return sum + (typeof p === "number" && Number.isFinite(p) ? p : 0);
  }, 0);
  const clampQty = (n: number) => Math.min(99, Math.max(1, Math.trunc(n)));
  const safeQuantity = Number.isFinite(quantity) ? clampQty(quantity) : 1;
  const totalPrice = Math.max(0, selectedPrice) * safeQuantity;
  const selectedSizeLabel =
    selectedKeys.length === 0
      ? "Sélectionnez une taille"
      : selectedKeys.length === 1
        ? getSizeConfig(product, selectedKeys[0] as SizeKey).label
        : `${selectedKeys.length} tailles sélectionnées`;
  const selectedOldPrice =
    selectedKeys.length === 1 &&
    product.sizes[selectedKeys[0] as SizeKey] &&
    typeof (product.sizes[selectedKeys[0] as SizeKey] as unknown as { oldPrice?: number }).oldPrice === "number"
      ? (product.sizes[selectedKeys[0] as SizeKey] as unknown as { oldPrice?: number }).oldPrice!
      : null;

  const commanderLabel = !productAvailable
    ? "Produit indisponible"
    : !canOrder && selectedSizeKeys.has("pack3")
      ? "Bientôt disponible"
      : "Commander maintenant";

  function scrollToOrder() {
    requestAnimationFrame(() => {
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      const target = isDesktop ? demandeDesktopRef.current : demandeMobileRef.current;
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => nameInputRef.current?.focus(), 250);
    });
  }

  function scrollToMissing(kind: "color" | "size" | "name" | "phone" | "city") {
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    const colorRef = isDesktop ? colorDesktopRef.current : colorMobileRef.current;
    const sizeRef = isDesktop ? sizeDesktopRef.current : sizeMobileRef.current;
    if (kind === "color") {
      colorRef?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (kind === "size") {
      sizeRef?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const input =
      kind === "name"
        ? nameInputRef.current
        : kind === "phone"
          ? phoneInputRef.current
          : cityInputRef.current;
    input?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => input?.focus(), 250);
  }

  function fireInitiateCheckoutOnce() {
    if (initiateFiredRef.current) return;
    initiateFiredRef.current = true;
    const sizeLabel = selectedKeys.map((k) => getSizeConfig(product, k).label).join(" + ");
    trackInitiateCheckout({
      contentName: product.name,
      contentIds: [product.reference].filter(Boolean),
      contentType: "product",
      value: Math.max(0, totalPrice),
      currency: "MAD",
      extra: {
        product_ref: product.reference,
        size: sizeLabel || undefined,
        color: variant?.colorName || undefined,
        quantity: safeQuantity,
      },
    });
  }

  const detailImages = (variant.media || [])
    .filter((m) => m.type === "image")
    .map((m) => m.url)
    .slice(1, 5);

  useEffect(() => {
    if (!autoOpenOrder) return;
    window.setTimeout(() => {
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      const target = isDesktop ? demandeDesktopRef.current : demandeMobileRef.current;
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
      fireInitiateCheckoutOnce();
    }, 0);
  }, [autoOpenOrder]);

  useEffect(() => {
    const defaultLabel = getSizeConfig(product, "20").label;
    trackViewContent({
      contentName: `${product.name} — ${defaultLabel}`,
      contentIds: [product.reference].filter(Boolean),
      contentType: "product",
      value: Math.max(0, selectedPrice),
      currency: "MAD",
      extra: {
        product_ref: product.reference,
        size: selectedKeys.map((k) => getSizeConfig(product, k).label).join(" + ") || undefined,
        color: variant?.colorName || undefined,
        quantity: safeQuantity,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.slug, product.reference]);

  useEffect(() => {
    setPricePulse(true);
    const t = window.setTimeout(() => setPricePulse(false), 220);
    return () => window.clearTimeout(t);
  }, [selectedSizeLabel, selectedPrice, safeQuantity]);

  // Always reset quantity per product and keep quantity state clamped.
  useEffect(() => {
    setQuantity(1);
    purchaseFiredRef.current = false;
    initiateFiredRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.reference]);

  useEffect(() => {
    if (quantity !== safeQuantity) setQuantity(safeQuantity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeQuantity]);

  function toggleSize(key: SizeKey) {
    const s = product.sizes[key];
    if (!s?.inStock) return;
    setSelectedSizeKeys((prev) => {
      const next = new Set(prev);
      if (key === "pack3") {
        if (next.has("pack3")) next.delete("pack3");
        else {
          next.clear();
          next.add("pack3");
        }
        return next;
      }
      next.delete("pack3");
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function sendOrder(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setFormError(null);
    setSent(false);

    const qty = safeQuantity;
    const normalizedName = fullName.trim();
    const normalizedPhone = phone.trim();
    const normalizedCity = city.trim();

    // If something is missing, scroll/focus only to the missing section.
    if (!variant?.id || variant.id === "missing") {
      setFormError("Veuillez sélectionner une couleur.");
      scrollToMissing("color");
      return;
    }
    if (!selectedKeys.length) {
      setFormError("Veuillez sélectionner une taille.");
      scrollToMissing("size");
      return;
    }
    if (!normalizedName) {
      setFormError("Merci de remplir Nom complet, Téléphone et Ville.");
      scrollToMissing("name");
      return;
    }
    if (!normalizedPhone) {
      setFormError("Merci de remplir Nom complet, Téléphone et Ville.");
      scrollToMissing("phone");
      return;
    }
    if (!normalizedCity) {
      setFormError("Merci de remplir Nom complet, Téléphone et Ville.");
      scrollToMissing("city");
      return;
    }

    if (!canOrder) {
      setFormError("Veuillez sélectionner une taille disponible.");
      scrollToMissing("size");
      return;
    }

    if (!Number.isFinite(selectedPrice) || selectedPrice <= 0) {
      setFormError("Prix introuvable. Veuillez réessayer ou nous contacter.");
      return;
    }

    fireInitiateCheckoutOnce();

    // COD flow: AddToCart when user clicks order button (i.e. submits the order).
    trackAddToCart({
      contentName: `${product.name} — ${selectedSizeLabel}`,
      contentIds: [product.reference].filter(Boolean),
      contentType: "product",
      value: Math.max(0, selectedPrice),
      currency: "MAD",
      extra: {
        product_ref: product.reference,
        size: selectedKeys.map((k) => getSizeConfig(product, k).label).join(" + ") || undefined,
        color: variant.colorName,
        quantity: safeQuantity,
      },
    });

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
            productImage:
              (variant.media || []).find((m) => m.type === "image")?.url ||
              variant.images?.[0] ||
              "",
            color: variant.colorName,
            size: selectedKeys.map((k) => getSizeConfig(product, k).label).join(" + "),
            unitPrice: selectedPrice,
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
      const json = (await res.json().catch(() => null)) as
        | { ok?: boolean; orderNumber?: string; emailSent?: boolean }
        | null;
      if (!json?.ok || !json.orderNumber || !json.emailSent) {
        console.error("Orders API invalid response:", json);
        setFormError(
          "Impossible d’envoyer la demande. Contactez-nous sur WhatsApp."
        );
        return;
      }
      // COD flow: Lead after successful submission.
      trackLead({
        contentName: `${product.name} — ${selectedSizeLabel}`,
        contentIds: [product.reference].filter(Boolean),
        contentType: "product",
        contents: [
          {
            id: product.reference,
            quantity: safeQuantity,
            item_price: Math.max(0, selectedPrice),
          },
        ],
        value: Math.max(0, totalPrice),
        currency: "MAD",
        extra: {
          product_ref: product.reference,
          size: selectedKeys.map((k) => getSizeConfig(product, k).label).join(" + ") || undefined,
          color: variant.colorName,
          quantity: safeQuantity,
        },
      });
      // Purchase: only after order is saved AND email is sent successfully.
      if (!purchaseFiredRef.current) {
        purchaseFiredRef.current = true;
        // Minimal Purchase payload (as requested).
        if (typeof window !== "undefined" && typeof window.fbq === "function") {
          window.fbq("track", "Purchase", { value: Math.max(0, totalPrice), currency: "MAD" });
        }
        trackPurchase({
          contentName: product.name,
          contentIds: [product.reference].filter(Boolean),
          contentType: "product",
          contents: [
            {
              id: product.reference,
              quantity: safeQuantity,
              item_price: Math.max(0, selectedPrice),
            },
          ],
          value: Math.max(0, totalPrice),
          currency: "MAD",
          extra: {
            product_ref: product.reference,
            size: selectedKeys.map((k) => getSizeConfig(product, k).label).join(" + ") || undefined,
            color: variant.colorName,
            quantity: safeQuantity,
          },
        });
      }
      setSent(true);
    } catch (err) {
      console.error("[order] submit failed", err);
      setFormError("Impossible d’envoyer la demande. Contactez-nous sur WhatsApp.");
    } finally {
      setSending(false);
    }
  }

  function onCommanderNowClick() {
    const normalizedName = fullName.trim();
    const normalizedPhone = phone.trim();
    const normalizedCity = city.trim();
    if (!variant?.id || variant.id === "missing") {
      scrollToMissing("color");
      return;
    }
    if (!selectedKeys.length) {
      scrollToMissing("size");
      return;
    }
    if (!normalizedName) {
      scrollToMissing("name");
      return;
    }
    if (!normalizedPhone) {
      scrollToMissing("phone");
      return;
    }
    if (!normalizedCity) {
      scrollToMissing("city");
      return;
    }
    fireInitiateCheckoutOnce();
    // Everything valid -> submit immediately without scrolling away.
    void sendOrder();
  }

  return (
    <div className="bg-zinc-50">
      <div className="mx-auto w-full max-w-[1400px] px-4 pt-6 pb-28 sm:px-6 sm:pt-10 sm:pb-20">
        <nav className="mb-6 text-sm text-zinc-600">
          <Link href="/" className="hover:text-zinc-900">
            Catalogue
          </Link>
          <span className="px-2 text-zinc-400">/</span>
          <span className="text-zinc-900">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[3fr_2fr] lg:items-start">
          {/* 1) Hero product section — Left: gallery */}
          <section className="min-w-0">
            <ProductGallery
              media={variant.media}
              alt={product.name}
              className="rounded-[28px] bg-white p-3 ring-1 ring-zinc-200 shadow-sm"
            />
            {!productAvailable ? (
              <div className="mt-3 inline-flex rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 lg:hidden">
                Rupture de stock
              </div>
            ) : null}

            {/* Mobile ordering flow (keep desktop layout unchanged) */}
            <div
              ref={demandeMobileRef}
              className="mt-4 rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm lg:hidden"
            >
              <div className="text-base font-semibold text-zinc-900">
                Demande de commande
              </div>
              <div className="mt-1 text-sm text-zinc-600">
                Sélectionnez votre modèle, taille et couleur, puis envoyez votre demande.
              </div>

              <div className="mt-3 text-sm font-medium text-zinc-700">
                🚚 Livraison estimée : 24–48h
              </div>

            <div className="mt-4">
                <Label>Couleur</Label>
                <div ref={colorMobileRef} className="mt-2 flex flex-wrap gap-2">
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

              <form onSubmit={sendOrder} className="mt-4 space-y-4">
                <div>
                  <Label>Taille</Label>
                  <div ref={sizeMobileRef} className="mt-2 grid gap-2 sm:grid-cols-2">
                    {(
                      Object.keys(SIZE_CONFIG) as Array<keyof typeof SIZE_CONFIG>
                    ).map((k) => {
                      const key = k as SizeKey;
                      const cfg = getSizeConfig(product, key);
                      const s = product.sizes[key];
                      const disabled = !s?.inStock;
                      const active = selectedSizeKeys.has(key);
                      const price = typeof s?.price === "number" ? s.price : 0;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            if (disabled) return;
                            toggleSize(key);
                          }}
                          className={[
                            "rounded-2xl p-3 text-left ring-1 ring-inset transition",
                            active
                              ? "bg-zinc-900 text-white ring-zinc-900 shadow-sm shadow-zinc-900/15"
                              : disabled
                                ? "bg-zinc-50 text-zinc-400 ring-zinc-200"
                                : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50 hover:shadow-sm hover:-translate-y-[1px]",
                          ].join(" ")}
                          aria-pressed={active}
                          aria-disabled={disabled}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold">{cfg.label}</div>
                              <div
                                className={[
                                  "mt-1 text-xs",
                                  active ? "text-white/80" : "text-zinc-500",
                                ].join(" ")}
                              >
                                {cfg.details}
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              {disabled && key === "pack3" ? (
                                <div
                                  className={[
                                    "text-xs font-semibold",
                                    active ? "text-white/80" : "text-zinc-500",
                                  ].join(" ")}
                                >
                                  Bientôt disponible
                                </div>
                              ) : (
                                <div
                                  className={[
                                    "text-sm font-semibold",
                                    active
                                      ? "text-white"
                                      : disabled
                                        ? "text-zinc-400"
                                        : "text-zinc-900",
                                  ].join(" ")}
                                >
                                  {formatDh(price)}
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-3xl border border-emerald-200/70 bg-gradient-to-b from-emerald-50/70 to-white px-4 py-3 shadow-sm ring-1 ring-emerald-200/30">
                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <div className="inline-flex rounded-full bg-emerald-600/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                        Prix sélectionné
                      </div>
                      <div className="mt-2 text-sm font-semibold text-zinc-900">
                        {selectedSizeLabel}
                      </div>
                    </div>
                    <div
                      className={[
                        "text-right font-extrabold leading-none tracking-tight text-[#009B5A]",
                        "text-[28px]",
                        "transition-transform duration-200",
                        pricePulse ? "scale-[1.03]" : "scale-100",
                    ].join(" ")}
                  >
                      {formatDh(selectedPrice)}
                    </div>
                  </div>
                  {safeQuantity > 1 ? (
                    <div className="mt-2 text-xs font-semibold text-zinc-600">
                      Total :{" "}
                      <span className="font-extrabold text-zinc-900">{formatDh(totalPrice)}</span>
                    </div>
                  ) : null}
                </div>

                <div>
                  <Label>Quantité</Label>
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => clampQty(q - 1))}
                      className="h-11 w-11 rounded-2xl border border-zinc-200 bg-white text-lg font-semibold text-zinc-900 hover:bg-zinc-50"
                      aria-label="Diminuer"
                    >
                      −
                    </button>
                    <input
                      inputMode="numeric"
                      value={safeQuantity}
                      onChange={(e) =>
                        setQuantity(clampQty(Number(e.target.value || 1)))
                      }
                      className="h-11 w-16 rounded-2xl border border-zinc-200 bg-white text-center text-sm font-semibold text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900/20"
                      aria-label="Quantité"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => clampQty(q + 1))}
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
                      ref={nameInputRef}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      onFocus={fireInitiateCheckoutOnce}
                      className="mt-2 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900/15"
                      placeholder="Votre nom"
                      autoComplete="name"
                    />
                  </label>
                  <label className="block">
                    <div className="text-sm font-semibold text-zinc-900">Téléphone</div>
                    <input
                      ref={phoneInputRef}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onFocus={fireInitiateCheckoutOnce}
                      className="mt-2 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900/15"
                      placeholder="06..."
                      autoComplete="tel"
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <div className="text-sm font-semibold text-zinc-900">Ville</div>
                    <input
                      ref={cityInputRef}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      onFocus={fireInitiateCheckoutOnce}
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
                  className={[
                    "inline-flex w-full items-center justify-center",
                    "rounded-3xl px-5 py-4 text-sm font-extrabold text-white",
                    "bg-gradient-to-b from-emerald-600 to-emerald-700",
                    "shadow-sm shadow-emerald-600/20 transition",
                    "hover:from-emerald-600 hover:to-emerald-800 hover:shadow-md hover:scale-[1.01]",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40",
                    "disabled:opacity-50",
                  ].join(" ")}
                >
                  {sending ? "Envoi en cours…" : commanderLabel}
                </button>
              </form>
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

            <div className="mt-10 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="text-lg font-semibold tracking-tight text-zinc-900">
                Points forts
              </div>
              <div className="mt-1 text-sm text-zinc-600">
                Des détails pensés pour voyager sereinement, au quotidien comme en long séjour.
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {(pointsForts || [
                  {
                    title: "Protection premium",
                    text: "Coque rigide anti-choc, finitions propres et durables.",
                  },
                  {
                    title: "Confort de roulage",
                    text: "Roues 360° silencieuses, maniabilité fluide.",
                  },
                  {
                    title: "Sécurité",
                    text: "Serrure TSA pour plus de tranquillité en déplacement.",
                  },
                  {
                    title: "Service rapide",
                    text: "Confirmation par téléphone + livraison 24–48h.",
                  },
                ]).map((x) => (
                  <BulletCard key={x.title} title={x.title} text={x.text} />
                ))}
              </div>
            </div>

            {detailImages.length ? (
              <div className="mt-10">
                <SectionTitle
                  title="Galerie détails"
                  subtitle="Zoom sur les finitions et les angles du modèle."
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  {detailImages.map((src, idx) => (
                    <button
                      key={`${src}_${idx}`}
                      type="button"
                      onClick={() => {
                        setDetailsIndex(idx);
                        setDetailsOpen(true);
                      }}
                      className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50"
                      aria-label="Voir l’image"
                    >
                      <div className="relative h-[210px] w-full">
                        <Image
                          src={src}
                          alt=""
                          fill
                          className="object-contain p-5 transition-transform duration-300 group-hover:scale-[1.02]"
                          sizes="(max-width: 640px) 100vw, 50vw"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-10">
              <SectionTitle
                title="Dimensions et poids"
                subtitle="Informations utiles avant achat."
              />
              <ProductDetails product={product} />
            </div>
          </section>

          {/* 1) Hero product section — Right: info + order card (sticky) */}
          <section className="min-w-0 lg:sticky lg:top-6">
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
            {!productAvailable ? (
              <div className="mt-2 inline-flex rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                Rupture de stock
              </div>
            ) : null}
            <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl lg:text-[42px]">
              {product.name}
            </h1>
            <div className="mt-3">
              <PriceLine
                price={selectedPrice}
                oldPrice={selectedOldPrice}
                label={selectedSizeLabel}
              />
            </div>
            {heroHook ? (
              <div className="mt-3 text-sm font-semibold text-zinc-800">
                {heroHook}
              </div>
            ) : null}
            <p className="mt-3 text-pretty text-sm leading-6 text-zinc-600 sm:text-base">
              {product.description}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {(heroBullets || [
                "Livraison gratuite",
                "Paiement à la livraison",
                "Livraison partout au Maroc",
                "Support WhatsApp",
              ]).map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
            </div>

            <div className="mt-4">
              <StockBadge available={(product as any).available !== false} />
            </div>

            <div className="mt-3 grid gap-1.5 text-sm font-medium text-zinc-700">
              <div>🔥 Forte demande aujourd’hui</div>
              <div>🚚 Livraison 24–48h</div>
              <div>✅ Paiement à la livraison</div>
            </div>

            <div
              ref={demandeDesktopRef}
              className="mt-6 hidden rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm sm:p-7 lg:block"
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
                <div ref={colorDesktopRef} className="mt-2 flex flex-wrap gap-2">
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
                  <div ref={sizeDesktopRef} className="mt-2 grid gap-2 sm:grid-cols-2">
                    {(
                      Object.keys(SIZE_CONFIG) as Array<keyof typeof SIZE_CONFIG>
                    ).map((k) => {
                      const key = k as SizeKey;
                      const cfg = getSizeConfig(product, key);
                      const s = product.sizes[key];
                      const disabled = !s?.inStock;
                      const active = selectedSizeKeys.has(key);
                      const price = typeof s?.price === "number" ? s.price : 0;
                  return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            if (disabled) return;
                            toggleSize(key);
                          }}
                          className={[
                            "rounded-2xl p-3 text-left ring-1 ring-inset transition",
                            active
                              ? "bg-zinc-900 text-white ring-zinc-900 shadow-sm shadow-zinc-900/15"
                              : disabled
                                ? "bg-zinc-50 text-zinc-400 ring-zinc-200"
                                : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50 hover:shadow-sm hover:-translate-y-[1px]",
                          ].join(" ")}
                          aria-pressed={active}
                          aria-disabled={disabled}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold">{cfg.label}</div>
                              <div
                                className={[
                                  "mt-1 text-xs",
                                  active ? "text-white/80" : "text-zinc-500",
                                ].join(" ")}
                              >
                                {cfg.details}
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              {disabled && key === "pack3" ? (
                                <div
                                  className={[
                                    "text-xs font-semibold",
                                    active ? "text-white/80" : "text-zinc-500",
                                  ].join(" ")}
                                >
                                  Bientôt disponible
                                </div>
                              ) : (
                                <div
                                  className={[
                                    "text-sm font-semibold",
                                    active
                                      ? "text-white"
                                      : disabled
                                        ? "text-zinc-400"
                                        : "text-zinc-900",
                                  ].join(" ")}
                                >
                                  {formatDh(price)}
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Desktop-only selected price box below sizes */}
                <div className="rounded-3xl border border-emerald-200/70 bg-gradient-to-b from-emerald-50/70 to-white px-4 py-3 shadow-sm ring-1 ring-emerald-200/30">
                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <div className="inline-flex rounded-full bg-emerald-600/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                        Prix sélectionné
                      </div>
                      <div className="mt-2 text-sm font-semibold text-zinc-900">
                        {selectedSizeLabel}
                      </div>
                    </div>
                    <div
                      className={[
                        "text-right font-extrabold leading-none tracking-tight text-[#009B5A]",
                        "text-[28px] sm:text-[32px]",
                        "transition-transform duration-200",
                        pricePulse ? "scale-[1.03]" : "scale-100",
                    ].join(" ")}
                  >
                      {formatDh(selectedPrice)}
                    </div>
                  </div>
                  {safeQuantity > 1 ? (
                    <div className="mt-2 text-xs font-semibold text-zinc-600">
                      {formatDh(selectedPrice)} × {safeQuantity} ={" "}
                      <span className="font-extrabold text-zinc-900">
                        {formatDh(totalPrice)}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div>
                  <Label>Quantité</Label>
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => clampQty(q - 1))}
                      className="h-11 w-11 rounded-2xl border border-zinc-200 bg-white text-lg font-semibold text-zinc-900 hover:bg-zinc-50"
                      aria-label="Diminuer"
                    >
                      −
                    </button>
                    <input
                      inputMode="numeric"
                      value={safeQuantity}
                      onChange={(e) =>
                        setQuantity(clampQty(Number(e.target.value || 1)))
                      }
                      className="h-11 w-16 rounded-2xl border border-zinc-200 bg-white text-center text-sm font-semibold text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900/20"
                      aria-label="Quantité"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => clampQty(q + 1))}
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
                      ref={nameInputRef}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      onFocus={fireInitiateCheckoutOnce}
                      className="mt-2 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900/15"
                      placeholder="Votre nom"
                      autoComplete="name"
                    />
                  </label>
                  <label className="block">
                    <div className="text-sm font-semibold text-zinc-900">Téléphone</div>
                    <input
                      ref={phoneInputRef}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onFocus={fireInitiateCheckoutOnce}
                      className="mt-2 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900/15"
                      placeholder="06..."
                      autoComplete="tel"
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <div className="text-sm font-semibold text-zinc-900">Ville</div>
                    <input
                      ref={cityInputRef}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      onFocus={fireInitiateCheckoutOnce}
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

                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-800">
                  Total : <span className="font-extrabold text-zinc-900">{formatDh(totalPrice)}</span>
                  {safeQuantity > 1 ? (
                    <span className="ml-2 text-xs font-semibold text-zinc-600">
                      ({formatDh(selectedPrice)} × {safeQuantity})
                    </span>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={!canOrder || sending}
                  className={[
                    "inline-flex w-full items-center justify-center",
                    "rounded-3xl px-5 py-4 text-sm font-extrabold text-white",
                    "bg-gradient-to-b from-emerald-600 to-emerald-700",
                    "shadow-sm shadow-emerald-600/20 transition",
                    "hover:from-emerald-600 hover:to-emerald-800 hover:shadow-md hover:scale-[1.01]",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40",
                    "disabled:opacity-50",
                  ].join(" ")}
                >
                  {sending ? "Envoi en cours…" : commanderLabel}
                </button>
              </form>

              <div className="mt-4 grid gap-1.5 text-sm text-zinc-700">
                <div>Confirmation par téléphone</div>
                <div>Livraison partout au Maroc</div>
                <div>Support WhatsApp rapide</div>
              </div>

              <div className="mt-4 grid gap-1.5 text-sm text-zinc-700">
                <TrustRow label="Livraison 24–48h" />
                <TrustRow label="Paiement à la livraison" />
                <TrustRow label="Livraison partout au Maroc" />
              </div>
            </div>
          </section>
        </div>

        {/* Below: full-width sections */}
        <div className="mt-12 space-y-12">
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
                {(reviews || [
                  {
                    name: "Samira",
                    city: "Rabat",
                    text: "Très belle qualité, roues silencieuses. Livraison rapide.",
                  },
                  {
                    name: "Fatima",
                    city: "Rabat",
                    text: "وصلاتني الفاليز بجودة فوق التوقعات، الرويدات خفاف والتوصيل كان سريع بزاف.",
                    rtl: true,
                  },
                  {
                    name: "Nadia",
                    city: "Marrakech",
                    text: "Commande facile, confirmation par téléphone, rien à dire.",
                  },
                ]).slice(0, 3).map((r) => (
                  <ReviewCard
                    key={`${r.name}_${r.city}`}
                    name={r.name}
                    city={r.city}
                    text={r.text}
                    rtl={Boolean(r.rtl)}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <SectionTitle
              title="Livraison & paiement"
              subtitle="Simple, rapide et sécurisé."
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MiniInfo icon={<IconTruck />} title="Livraison gratuite" text="Partout au Maroc en 24–48h." />
              <MiniInfo icon={<IconCoin />} title="Paiement à la livraison" text="Vous payez à la réception." />
              <MiniInfo icon={<IconPhone />} title="Confirmation" text="Validation par téléphone." />
              <MiniInfo icon={<IconWhatsApp />} title="Support WhatsApp" text="Réponse rapide en cas de besoin." />
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
              {(faqs || [
                {
                  q: "Livraison",
                  a: "Livraison partout au Maroc. Les délais varient selon la ville et la disponibilité.",
                },
                {
                  q: "Paiement",
                  a: "Paiement à la livraison (COD). Vous payez à la réception du colis.",
                },
                {
                  q: "Commande",
                  a: "Choisissez taille/couleur, puis cliquez sur « Commander maintenant ».",
                },
                {
                  q: "Échange",
                  a: "Échange possible sous 7 jours selon l’état du produit. Contactez-nous pour la procédure.",
                },
              ]).map((f) => (
                <FaqItem key={f.q} q={f.q} a={f.a} />
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* 2) Mobile sticky bottom CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-3.5 sm:px-6">
          <button
            type="button"
            onClick={onCommanderNowClick}
            disabled={!productAvailable}
            className={[
              "inline-flex w-full items-center justify-center",
              "rounded-3xl px-5 py-4 text-sm font-extrabold text-white",
              "bg-gradient-to-b from-emerald-600 to-emerald-700",
              "shadow-sm shadow-emerald-600/20 transition",
              "hover:from-emerald-600 hover:to-emerald-800 hover:shadow-md",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40",
              !productAvailable ? "opacity-50" : "",
            ].join(" ")}
          >
            {productAvailable ? "Commander maintenant" : "Produit indisponible"}
          </button>
        </div>
      </div>

      {/* Detail lightbox (for "Galerie détails") */}
      {detailsOpen && detailImages.length ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            onClick={() => setDetailsOpen(false)}
            aria-label="Fermer"
          />
          <div className="absolute inset-x-0 top-0 mx-auto flex h-full w-full max-w-6xl items-center justify-center p-4">
            <div className="relative w-full overflow-hidden rounded-3xl bg-black">
              <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDetailsOpen(false)}
                  className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
                >
                  Fermer
                </button>
              </div>
              <div className="relative h-[70vh] w-full">
                <Image
                  src={detailImages[detailsIndex] || detailImages[0]!}
                  alt={product.name}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </div>
              {detailImages.length > 1 ? (
                <div className="flex gap-2 overflow-x-auto border-t border-white/10 bg-black/40 p-3">
                  {detailImages.map((src, idx) => {
                    const active = idx === detailsIndex;
                    return (
                      <button
                        key={`d_${src}_${idx}`}
                        type="button"
                        onClick={() => setDetailsIndex(idx)}
                        className={[
                          "relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl ring-1 ring-inset transition",
                          active ? "ring-white" : "ring-white/20 hover:ring-white/40",
                        ].join(" ")}
                        aria-pressed={active}
                      >
                        <Image
                          src={src}
                          alt=""
                          fill
                          className="object-contain p-2"
                          sizes="64px"
                        />
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

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-semibold text-zinc-900">{children}</div>;
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
      {children}
    </div>
  );
}

function StockBadge({ available }: { available: boolean }) {
  if (!available) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">
        <span>Rupture de stock</span>
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
      <span>En stock</span>
    </div>
  );
}

function BulletCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="text-sm font-semibold text-zinc-900">{title}</div>
      <div className="mt-1 text-sm leading-6 text-zinc-600">{text}</div>
    </div>
  );
}

function MiniInfo({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white ring-1 ring-zinc-200 text-zinc-900">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-zinc-900">{title}</div>
        <div className="mt-1 text-sm leading-6 text-zinc-600">{text}</div>
      </div>
    </div>
  );
}

function formatDh(value: number) {
  const n = Number.isFinite(value) ? Math.round(value) : 0;
  return `${n.toLocaleString("fr-FR")} DH`;
}

function PriceLine({
  price,
  oldPrice,
  label,
  variant = "default",
}: {
  price: number;
  oldPrice: number | null;
  label: string;
  variant?: "default" | "order";
}) {
  const showOld = typeof oldPrice === "number" && oldPrice > price;
  const compact = variant === "order";
  return (
    <div className={compact ? "flex items-end justify-between gap-3" : ""}>
      <div
        className={
          compact
            ? "text-xs font-medium text-zinc-600"
            : "text-sm font-medium text-zinc-600"
        }
      >
        {label}
      </div>
      <div className={compact ? "flex items-end gap-2" : "mt-1 flex items-end gap-2"}>
        {showOld ? (
          <div className="text-sm font-semibold text-zinc-400 line-through">
            {formatDh(oldPrice!)}
          </div>
        ) : null}
        <div
          className={
            compact
              ? "text-[30px] font-extrabold tracking-tight text-[#009B5A] leading-none"
              : "text-2xl font-semibold tracking-tight text-zinc-900"
          }
        >
          {formatDh(price)}
        </div>
      </div>
    </div>
  );
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

function IconCoin() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20c4.42 0 8-2.24 8-5s-3.58-5-8-5-8 2.24-8 5 3.58 5 8 5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4 15v-6c0-2.76 3.58-5 8-5s8 2.24 8 5v6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 4h4l1 5-2 1c1 2.6 3 4.6 5.6 5.6l1-2 5 1v4c0 1.1-.9 2-2 2C10.4 21 3 13.6 3 4c0-1.1.9-2 2-2h2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconWhatsApp() {
  return (
    <svg width="18" height="18" viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M16 3C8.82 3 3 8.82 3 16c0 2.2.58 4.34 1.68 6.24L3.58 28.6a1 1 0 0 0 1.22 1.22l6.36-1.1A12.94 12.94 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3Zm0 23.5c-2.12 0-4.2-.56-6.02-1.62a1 1 0 0 0-.7-.1l-3.78.66.66-3.78a1 1 0 0 0-.1-.7A11.5 11.5 0 1 1 16 26.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M19.11 17.4c-.28-.14-1.64-.8-1.9-.9s-.44-.14-.63.14-.72.9-.88 1.08-.32.2-.6.06a7.62 7.62 0 0 1-2.24-1.38 8.42 8.42 0 0 1-1.56-1.94c-.16-.28 0-.44.12-.58.12-.12.28-.32.42-.48.14-.16.18-.28.28-.46.1-.18.06-.36 0-.5s-.63-1.52-.86-2.08c-.22-.52-.44-.46-.63-.46h-.54c-.18 0-.5.06-.76.36-.26.28-1 1-.98 2.44s1 2.84 1.14 3.04c.14.2 1.98 3.02 4.8 4.24.68.3 1.22.48 1.64.62.7.22 1.34.2 1.84.12.56-.08 1.64-.66 1.88-1.28.24-.62.24-1.14.16-1.28-.08-.14-.26-.2-.54-.34Z"
        fill="currentColor"
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
        touchAction: "pan-x pan-y",
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
  // Size availability is global on product; default to 20".
  void variant;
  return "20";
}
