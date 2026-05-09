"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product, ProductVariant, SizeKey } from "@/lib/productTypes";
import { SIZE_CONFIG } from "@/lib/productTypes";

type ApiStoreResponse =
  | { ok: true; store: { version: 1; products: Product[] } }
  | { ok: false; error: string };

type SettingsResponse =
  | {
      ok: true;
      settings: {
        homepageCover?: {
          desktopUrl?: string;
          mobileUrl?: string;
          linkUrl?: string;
          linkedProductSlug?: string;
          alt?: string;
        };
      };
    }
  | { ok: false; error: string };

const CATEGORIES = [
  "Valises",
  "Valises (cabine)",
  "Valises (soute)",
  "Packs",
  "Enfant",
  "Autres",
] as const;

const SIZE_KEYS: SizeKey[] = ["20", "24", "28", "pack3"];

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cover, setCover] = useState({
    desktopUrl: "/cover/default-desktop.svg",
    mobileUrl: "/cover/default-mobile.svg",
    linkUrl: "",
    linkedProductSlug: "",
    alt: "Couverture boutique valises",
  });
  const [coverSaving, setCoverSaving] = useState(false);

  const selected = useMemo(
    () => products.find((p) => p.id === selectedId) ?? null,
    [products, selectedId]
  );

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products");
      const json = (await res.json()) as ApiStoreResponse;
      if (!json.ok) throw new Error(json.error);
      setProducts(json.store.products);
      if (!selectedId && json.store.products[0]) setSelectedId(json.store.products[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function loadCover() {
    try {
      const res = await fetch("/api/admin/settings");
      const json = (await res.json()) as SettingsResponse;
      if (!json.ok) return;
      const c = json.settings.homepageCover || {};
      setCover({
        desktopUrl: c.desktopUrl || "/cover/default-desktop.svg",
        mobileUrl: c.mobileUrl || "/cover/default-mobile.svg",
        linkUrl: c.linkUrl || "",
        linkedProductSlug: c.linkedProductSlug || "",
        alt: c.alt || "Couverture boutique valises",
      });
    } catch {
      // ignore
    }
  }

  async function saveCover() {
    setCoverSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          homepageCover: cover,
        }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!json.ok) throw new Error(json.error || "Erreur");
    } finally {
      setCoverSaving(false);
    }
  }

  useEffect(() => {
    // Load immediately; middleware should have ensured auth, but handle 401 gracefully.
    window.setTimeout(() => {
      load().catch(() => {});
      loadCover().catch(() => {});
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!error) return;
    if (error === "unauthorized") router.replace("/admin/login?next=/admin");
  }, [error, router]);

  async function createProduct() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: "Nouveau produit",
          reference: "REF-NEW",
          description: "Description…",
          category: "Valises",
          bestSeller: false,
          stockText: "Stock limité",
          variants: [createEmptyVariant()],
        }),
      });
      const json = (await res.json()) as { ok: boolean; product?: Product; error?: string };
      if (!json.ok || !json.product) throw new Error(json.error || "Erreur");
      setProducts((p) => [json.product!, ...p]);
      setSelectedId(json.product.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function updateProduct(next: Product) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(next),
      });
      const json = (await res.json()) as { ok: boolean; product?: Product; error?: string };
      if (!json.ok || !json.product) throw new Error(json.error || "Erreur");
      setProducts((p) => p.map((x) => (x.id === json.product!.id ? json.product! : x)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm("Supprimer ce produit ?")) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!json.ok) throw new Error(json.error || "Erreur");
      setProducts((p) => p.filter((x) => x.id !== id));
      setSelectedId((prev) => (prev === id ? null : prev));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function uploadImage(file: File) {
    const form = new FormData();
    form.set("file", file);
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: form,
    });
    const json = (await res.json()) as { ok: boolean; url?: string; error?: string };
    if (!json.ok || !json.url) throw new Error(json.error || "upload_failed");
    return json.url;
  }

  return (
    <div className="bg-zinc-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Dashboard produits
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Mini Shopify (local) — variantes, tailles, images.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={load}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Rafraîchir
            </button>
            <button
              type="button"
              onClick={createProduct}
              className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Ajouter produit
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800">
            Erreur: {error}
          </div>
        ) : null}

        <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-zinc-900">Cover homepage</div>
              <div className="mt-1 text-sm text-zinc-600">
                Desktop + mobile + lien optionnel.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.open("/", "_blank")}
                className="rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Preview cover
              </button>
              <button
                type="button"
                onClick={saveCover}
                disabled={coverSaving}
                className="rounded-2xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                {coverSaving ? "Sauvegarde..." : "Save cover"}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl bg-zinc-50 p-4 ring-1 ring-zinc-200">
              <div className="text-sm font-semibold text-zinc-900">Desktop</div>
              <div className="mt-2 flex flex-col gap-2">
                <input
                  value={cover.desktopUrl}
                  onChange={(e) => setCover({ ...cover, desktopUrl: e.target.value })}
                  className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
                  placeholder="URL desktop…"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const input = e.currentTarget;
                    const file = input.files?.[0];
                    if (!file) return;
                    const url = await uploadImage(file);
                    setCover((c) => ({ ...c, desktopUrl: url }));
                    input.value = "";
                  }}
                />
              </div>
            </div>

            <div className="rounded-3xl bg-zinc-50 p-4 ring-1 ring-zinc-200">
              <div className="text-sm font-semibold text-zinc-900">Mobile</div>
              <div className="mt-2 flex flex-col gap-2">
                <input
                  value={cover.mobileUrl}
                  onChange={(e) => setCover({ ...cover, mobileUrl: e.target.value })}
                  className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
                  placeholder="URL mobile…"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const input = e.currentTarget;
                    const file = input.files?.[0];
                    if (!file) return;
                    const url = await uploadImage(file);
                    setCover((c) => ({ ...c, mobileUrl: url }));
                    input.value = "";
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Cover link URL (optionnel)">
              <input
                value={cover.linkUrl}
                onChange={(e) => setCover({ ...cover, linkUrl: e.target.value })}
                className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
                placeholder="https://..."
              />
            </Field>
            <Field label="Produit lié au cover">
              <select
                value={cover.linkedProductSlug}
                onChange={(e) =>
                  setCover({ ...cover, linkedProductSlug: e.target.value })
                }
                className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
              >
                <option value="">— Aucun —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.slug}>
                    {p.name} ({p.reference})
                  </option>
                ))}
              </select>
              <div className="mt-2 text-xs text-zinc-500">
                Si un produit est sélectionné, le cover ouvrira sa page produit.
              </div>
            </Field>
            <Field label="Alt text">
              <input
                value={cover.alt}
                onChange={(e) => setCover({ ...cover, alt: e.target.value })}
                className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
                placeholder="Texte alternatif…"
              />
            </Field>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[340px_1fr]">
          <aside className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold text-zinc-900">Produits</div>
            <div className="mt-3 space-y-2">
              {products.map((p) => {
                const active = p.id === selectedId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    className={[
                      "w-full rounded-2xl px-3 py-3 text-left ring-1 ring-inset transition",
                      active
                        ? "bg-zinc-900 text-white ring-zinc-900"
                        : "bg-white text-zinc-900 ring-zinc-200 hover:bg-zinc-50",
                    ].join(" ")}
                  >
                    <div className="text-sm font-semibold">{p.name}</div>
                    <div className={active ? "text-xs text-white/75" : "text-xs text-zinc-500"}>
                      {p.reference}
                      {p.bestSeller ? " • BestSeller" : ""}
                    </div>
                  </button>
                );
              })}
              {!products.length ? (
                <div className="rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-600 ring-1 ring-zinc-200">
                  Aucun produit. Cliquez sur “Ajouter produit”.
                </div>
              ) : null}
            </div>
          </aside>

          <main className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            {!selected ? (
              <div className="text-sm text-zinc-600">
                Sélectionnez un produit.
              </div>
            ) : (
              <ProductEditor
                key={selected.id}
                product={selected}
                loading={loading}
                onSave={updateProduct}
                onDelete={() => deleteProduct(selected.id)}
                onUpload={uploadImage}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function ProductEditor({
  product,
  loading,
  onSave,
  onDelete,
  onUpload,
}: {
  product: Product;
  loading: boolean;
  onSave: (p: Product) => Promise<void>;
  onDelete: () => void;
  onUpload: (file: File) => Promise<string>;
}) {
  const [draft, setDraft] = useState<Product>(product);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await onSave(draft);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-zinc-900">Édition</div>
          <div className="text-xs text-zinc-500">ID: {draft.id}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDelete}
            className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100"
          >
            Supprimer
          </button>
          <button
            type="button"
            onClick={save}
            disabled={loading || saving}
            className="rounded-2xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Nom">
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
          />
        </Field>
        <Field label="Reference">
          <input
            value={draft.reference}
            onChange={(e) => setDraft({ ...draft, reference: e.target.value })}
            className="h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Description">
            <textarea
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              className="min-h-28 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Description détaillée">
            <textarea
              value={draft.detailedDescription || ""}
              onChange={(e) =>
                setDraft({ ...draft, detailedDescription: e.target.value })
              }
              className="min-h-28 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
              placeholder="Texte libre…"
            />
          </Field>
        </div>
        <Field label="Catégorie">
          <select
            value={draft.category}
            onChange={(e) =>
              setDraft({ ...draft, category: e.target.value as Product["category"] })
            }
            className="h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Stock text">
          <input
            value={draft.stockText}
            onChange={(e) => setDraft({ ...draft, stockText: e.target.value })}
            className="h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
          />
        </Field>
        <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
          <input
            id={`bs_${draft.id}`}
            type="checkbox"
            checked={draft.bestSeller}
            onChange={(e) => setDraft({ ...draft, bestSeller: e.target.checked })}
          />
          <label htmlFor={`bs_${draft.id}`} className="text-sm font-semibold text-zinc-900">
            Best seller
          </label>
        </div>
      </div>

      <div className="mt-8">
        <div className="text-sm font-semibold text-zinc-900">Détails produit</div>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label="Matière">
            <input
              value={draft.details?.material || ""}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  details: { ...(draft.details || {}), material: e.target.value },
                })
              }
              className="h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
            />
          </Field>
          <Field label="Dimensions">
            <input
              value={draft.details?.dimensions || ""}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  details: { ...(draft.details || {}), dimensions: e.target.value },
                })
              }
              className="h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
            />
          </Field>
          <Field label="Poids">
            <input
              value={draft.details?.weight || ""}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  details: { ...(draft.details || {}), weight: e.target.value },
                })
              }
              className="h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
            />
          </Field>
          <Field label="Roues">
            <input
              value={draft.details?.wheels || ""}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  details: { ...(draft.details || {}), wheels: e.target.value },
                })
              }
              className="h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
            />
          </Field>
          <Field label="Serrure">
            <input
              value={draft.details?.lock || ""}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  details: { ...(draft.details || {}), lock: e.target.value },
                })
              }
              className="h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
            />
          </Field>
          <Field label="Poignée">
            <input
              value={draft.details?.handle || ""}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  details: { ...(draft.details || {}), handle: e.target.value },
                })
              }
              className="h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
            />
          </Field>
          <Field label="Garantie">
            <input
              value={draft.details?.warranty || ""}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  details: { ...(draft.details || {}), warranty: e.target.value },
                })
              }
              className="h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
            />
          </Field>
          <Field label="Livraison">
            <input
              value={draft.details?.shipping || ""}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  details: { ...(draft.details || {}), shipping: e.target.value },
                })
              }
              className="h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
              placeholder="24–48h"
            />
          </Field>
        </div>
      </div>

      <div className="mt-8">
        <div className="text-sm font-semibold text-zinc-900">Variantes couleur</div>
        <div className="mt-3 space-y-4">
          {draft.variants.map((v) => (
            <VariantEditor
              key={v.id}
              variant={v}
              onChange={(next) =>
                setDraft({
                  ...draft,
                  variants: draft.variants.map((x) => (x.id === v.id ? next : x)),
                })
              }
              onDelete={() =>
                setDraft({ ...draft, variants: draft.variants.filter((x) => x.id !== v.id) })
              }
              onUpload={onUpload}
            />
          ))}

          <button
            type="button"
            onClick={() => setDraft({ ...draft, variants: [...draft.variants, createEmptyVariant()] })}
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
          >
            Ajouter variante
          </button>
        </div>
      </div>
    </div>
  );
}

function VariantEditor({
  variant,
  onChange,
  onDelete,
  onUpload,
}: {
  variant: ProductVariant;
  onChange: (v: ProductVariant) => void;
  onDelete: () => void;
  onUpload: (file: File) => Promise<string>;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="h-5 w-5 rounded-full ring-1 ring-zinc-200"
            style={{ backgroundColor: variant.colorHex }}
            aria-hidden
          />
          <div className="text-sm font-semibold text-zinc-900">{variant.colorName}</div>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
        >
          Supprimer
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Nom couleur">
          <input
            value={variant.colorName}
            onChange={(e) => onChange({ ...variant, colorName: e.target.value })}
            className="h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
          />
        </Field>
        <Field label="Hex">
          <input
            value={variant.colorHex}
            onChange={(e) => onChange({ ...variant, colorHex: e.target.value })}
            className="h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
          />
        </Field>
      </div>

      <div className="mt-5">
        <div className="text-sm font-semibold text-zinc-900">Images</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {variant.images.map((url) => (
            <div
              key={url}
              className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
            >
              <span className="max-w-[220px] truncate">{url}</span>
              <button
                type="button"
                onClick={() =>
                  onChange({ ...variant, images: variant.images.filter((x) => x !== url) })
                }
                className="rounded-full px-2 py-0.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="mt-3">
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const input = e.currentTarget;
              const file = input.files?.[0];
              if (!file) return;
              const url = await onUpload(file);
              onChange({ ...variant, images: [url, ...variant.images] });
              input.value = "";
            }}
          />
          <div className="mt-2 text-xs text-zinc-600">
            La 1ère image est l’image principale.
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="text-sm font-semibold text-zinc-900">Tailles</div>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {SIZE_KEYS.map((k) => (
            <div key={k} className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="text-sm font-semibold text-zinc-900">{SIZE_CONFIG[k].label}</div>
              <div className="mt-1 text-xs text-zinc-500">{SIZE_CONFIG[k].details}</div>
              <div className="mt-3 grid gap-2">
                <label className="block text-xs font-semibold text-zinc-700">
                  Prix (MAD)
                </label>
                <input
                  inputMode="numeric"
                  value={variant.sizes[k].price}
                  onChange={(e) =>
                    onChange({
                      ...variant,
                      sizes: {
                        ...variant.sizes,
                        [k]: { ...variant.sizes[k], price: Number(e.target.value || 0) },
                      },
                    })
                  }
                  className="h-10 w-full rounded-2xl border border-zinc-200 px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
                />
                <label className="mt-2 inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={variant.sizes[k].inStock}
                    onChange={(e) =>
                      onChange({
                        ...variant,
                        sizes: {
                          ...variant.sizes,
                          [k]: { ...variant.sizes[k], inStock: e.target.checked },
                        },
                      })
                    }
                  />
                  <span className="text-sm font-semibold text-zinc-900">
                    En stock
                  </span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-sm font-semibold text-zinc-900">{label}</div>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function createEmptyVariant(): ProductVariant {
  const baseSizes = Object.fromEntries(
    SIZE_KEYS.map((k) => [k, { price: 0, inStock: true }])
  ) as ProductVariant["sizes"];
  return {
    id: `var_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`,
    colorName: "Noir",
    colorHex: "#0A0A0A",
    images: [],
    sizes: baseSizes,
  };
}
