"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

function nowIso() {
  return new Date().toISOString();
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftProductIds, setDraftProductIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const successTimerRef = useRef<number | null>(null);
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

  async function readJsonOrThrow<T>(res: Response): Promise<T> {
    const text = await res.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      console.error("[admin] Non-JSON response:", {
        status: res.status,
        statusText: res.statusText,
        body: text.slice(0, 800),
      });
      throw new Error(res.ok ? "Réponse invalide du serveur" : `Erreur serveur (${res.status})`);
    }
  }

  async function load() {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products");
      const json = await readJsonOrThrow<ApiStoreResponse>(res);
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
      const json = await readJsonOrThrow<SettingsResponse>(res);
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
      const json = await readJsonOrThrow<{ ok: boolean; error?: string }>(res);
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
    try {
      setError(null);
      setSuccess(null);
      const createdAt = nowIso();
      const draftId = `draft_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`;
      const draft: Product = {
        id: draftId,
        slug: "",
        name: "Nouveau produit",
        reference: "REF-NEW",
        description: "Description…",
        detailedDescription: "",
        category: "Valises",
        bestSeller: false,
        available: true,
        stockText: "Stock limité",
        variants: [createEmptyVariant()],
        sizes: {
          "20": { price: 550, inStock: true },
          "24": { price: 650, inStock: true },
          "28": { price: 650, inStock: true },
          pack3: { price: 1650, inStock: true },
        },
        landing: {
          heroHook: "",
          heroBullets: [],
          pointsForts: [],
          faq: [],
          reviews: [],
        },
        details: {
          material: "",
          dimensions: "",
          weight: "",
          wheels: "",
          lock: "",
          handle: "",
          warranty: "",
          shipping: "",
        },
        createdAt,
        updatedAt: createdAt,
      };
      setProducts((p) => [draft, ...p]);
      setSelectedId(draftId);
      setDraftProductIds((ids) => [draftId, ...ids]);

      // Auto-hide success after 3s.
      if (successTimerRef.current) window.clearTimeout(successTimerRef.current);
      setSuccess("Produit ajouté avec succès");
      successTimerRef.current = window.setTimeout(() => {
        setSuccess(null);
        successTimerRef.current = null;
      }, 3000);
    } catch (e) {
      console.error("[admin] create product failed", e);
      setError("Erreur lors de l’ajout du produit");
    }
  }

  async function updateProduct(next: Product) {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const isDraft = draftProductIds.includes(next.id);
      const res = await fetch("/api/admin/products", {
        method: isDraft ? "POST" : "PUT",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(next),
      });
      const json = await readJsonOrThrow<{
        ok: boolean;
        product?: Product;
        error?: string;
        details?: { message?: string };
      }>(res);
      if (!json.ok || !json.product) {
        if (json.error === "missing_variants") {
          throw new Error("Ajoutez au moins une variante couleur");
        }
        const msg = json.details?.message ? `${json.error} (${json.details.message})` : json.error;
        throw new Error(msg || "Erreur");
      }
      if (isDraft) {
        setDraftProductIds((ids) => ids.filter((id) => id !== next.id));
        setProducts((p) => [json.product!, ...p.filter((x) => x.id !== next.id)]);
        setSelectedId(json.product!.id);
      } else {
        setProducts((p) => p.map((x) => (x.id === json.product!.id ? json.product! : x)));
      }
      // Refresh from DB to ensure catalogue/product pages see latest data immediately.
      await load();
      setSuccess("Produit enregistré.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm("Supprimer ce produit ?")) return;
    if (draftProductIds.includes(id)) {
      setProducts((p) => p.filter((x) => x.id !== id));
      setDraftProductIds((ids) => ids.filter((x) => x !== id));
      setSelectedId((prev) => (prev === id ? null : prev));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = await readJsonOrThrow<{ ok: boolean; error?: string }>(res);
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
    const json = await readJsonOrThrow<{ ok: boolean; url?: string; error?: string }>(res);
    if (!json.ok || !json.url) throw new Error(json.error || "upload_failed");
    // Ensure absolute public path (must start with "/uploads/...").
    const url = String(json.url);
    return url.startsWith("/") ? url : `/${url}`;
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
              Mini Shopify — variantes, tailles, images.
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
        {success ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {success}
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
            const available = (p as any).available !== false;
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
                      <span
                        className={[
                          "ml-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                          available
                            ? active
                              ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : active
                              ? "border-rose-400/40 bg-rose-400/10 text-rose-100"
                              : "border-rose-200 bg-rose-50 text-rose-700",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "h-1.5 w-1.5 rounded-full",
                            available ? "bg-emerald-500" : "bg-rose-500",
                          ].join(" ")}
                          aria-hidden
                        />
                        {available ? "Disponible" : "Rupture"}
                      </span>
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
  const [localError, setLocalError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setLocalError(null);
    try {
      await onSave(draft);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur";
      setLocalError(msg);
      throw e;
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

      {localError ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {localError}
        </div>
      ) : null}

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
        <Field label="Stock interne (optionnel)">
          <input
            value={draft.stockText}
            onChange={(e) => setDraft({ ...draft, stockText: e.target.value })}
            className="h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
          />
        </Field>
        <Field label="Statut stock">
          <select
            value={(draft as any).available === false ? "out" : "in"}
            onChange={(e) =>
              setDraft({ ...draft, available: e.target.value === "in" })
            }
            className="h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
          >
            <option value="in">En stock</option>
            <option value="out">Rupture de stock</option>
          </select>
        </Field>
        <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
          <input
            id={`av_${draft.id}`}
            type="checkbox"
            checked={(draft as any).available === false}
            onChange={(e) => setDraft({ ...draft, available: !e.target.checked })}
          />
          <label htmlFor={`av_${draft.id}`} className="text-sm font-semibold text-zinc-900">
            Rupture de stock
          </label>
        </div>
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
        <div className="text-sm font-semibold text-zinc-900">Tailles & Prix (global)</div>
        <div className="mt-1 text-sm text-zinc-600">
          Prix partagés par toutes les couleurs.
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {SIZE_KEYS.map((k) => (
            <div key={k} className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-sm font-semibold text-zinc-900">{SIZE_CONFIG[k].label}</div>
              <div className="mt-1 text-xs text-zinc-500">{SIZE_CONFIG[k].details}</div>
              <div className="mt-3 grid gap-2">
                <label className="block text-xs font-semibold text-zinc-700">Prix (DH)</label>
                <input
                  inputMode="numeric"
                  value={draft.sizes?.[k]?.price ?? 0}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      sizes: {
                        ...(draft.sizes || ({} as any)),
                        [k]: {
                          price: Number(e.target.value || 0),
                          inStock: Boolean(draft.sizes?.[k]?.inStock ?? true),
                        },
                      },
                    })
                  }
                  className="h-10 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
                />
                <label className="mt-2 inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(draft.sizes?.[k]?.inStock ?? true)}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        sizes: {
                          ...(draft.sizes || ({} as any)),
                          [k]: {
                            price: Number(draft.sizes?.[k]?.price ?? 0),
                            inStock: e.target.checked,
                          },
                        },
                      })
                    }
                  />
                  <span className="text-sm font-semibold text-zinc-900">En stock</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <div className="text-sm font-semibold text-zinc-900">Landing page</div>
        <div className="mt-1 text-sm text-zinc-600">
          Contenu spécifique à ce produit (accroche, points forts, FAQ, avis). Laissez vide pour utiliser les valeurs par défaut.
        </div>
        <div className="mt-4 grid gap-4">
          <Field label="Accroche (sous le titre)">
            <input
              value={draft.landing?.heroHook || ""}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  landing: { ...(draft.landing || {}), heroHook: e.target.value },
                })
              }
              className="h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
              placeholder="Ex: Valise premium, robuste et élégante…"
            />
          </Field>

          <Field label="Bullets (1 par ligne)">
            <textarea
              value={(draft.landing?.heroBullets || []).join("\n")}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  landing: {
                    ...(draft.landing || {}),
                    heroBullets: e.target.value
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  },
                })
              }
              className="min-h-24 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
              placeholder="Ex:\nLivraison gratuite\nPaiement à la livraison\nSupport WhatsApp"
            />
          </Field>

          <Field label="Points forts (1 par ligne : Titre | Texte)">
            <textarea
              value={(draft.landing?.pointsForts || [])
                .map((x) => `${x.title} | ${x.text}`)
                .join("\n")}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  landing: {
                    ...(draft.landing || {}),
                    pointsForts: e.target.value
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean)
                      .map((line) => {
                        const [title, ...rest] = line.split("|");
                        return {
                          title: (title || "").trim(),
                          text: rest.join("|").trim(),
                        };
                      })
                      .filter((x) => x.title && x.text),
                  },
                })
              }
              className="min-h-32 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
              placeholder="Ex:\nProtection premium | Coque rigide anti-choc…\nConfort de roulage | Roues 360° silencieuses…"
            />
          </Field>

          <Field label="FAQ (1 par ligne : Question | Réponse)">
            <textarea
              value={(draft.landing?.faq || []).map((x) => `${x.q} | ${x.a}`).join("\n")}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  landing: {
                    ...(draft.landing || {}),
                    faq: e.target.value
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean)
                      .map((line) => {
                        const [q, ...rest] = line.split("|");
                        return { q: (q || "").trim(), a: rest.join("|").trim() };
                      })
                      .filter((x) => x.q && x.a),
                  },
                })
              }
              className="min-h-32 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
              placeholder="Ex:\nLivraison | Livraison partout au Maroc…\nPaiement | Paiement à la livraison…"
            />
          </Field>

          <Field label="Avis (1 par ligne : Nom | Ville | Texte)">
            <textarea
              value={(draft.landing?.reviews || [])
                .map((x) => `${x.name} | ${x.city} | ${x.text}`)
                .join("\n")}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  landing: {
                    ...(draft.landing || {}),
                    reviews: e.target.value
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean)
                      .map((line) => {
                        const [name, city, ...rest] = line.split("|");
                        const text = rest.join("|").trim();
                        const rtl = /[\u0600-\u06FF]/.test(text);
                        return {
                          name: (name || "").trim(),
                          city: (city || "").trim(),
                          text,
                          rtl,
                        };
                      })
                      .filter((x) => x.name && x.city && x.text),
                  },
                })
              }
              className="min-h-32 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
              placeholder="Ex:\nSamira | Rabat | Très belle qualité…"
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
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const photoInputId = `upl_photo_${variant.id}`;
  const videoInputId = `upl_video_${variant.id}`;
  const posterInputId = `upl_poster_${variant.id}`;
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [posterTargetIndex, setPosterTargetIndex] = useState<number | null>(null);
  const [replaceTargetIndex, setReplaceTargetIndex] = useState<number | null>(null);
  const [replaceTargetType, setReplaceTargetType] = useState<"image" | "video">("image");

  type MediaItem = { type: "image" | "video"; url: string; posterUrl?: string };

  const media: MediaItem[] = Array.isArray((variant as unknown as { media?: unknown }).media)
    ? (variant as unknown as { media: Array<{ type?: string; url?: string; posterUrl?: string }> }).media
        .filter((m) => m && m.url)
        .map((m): MediaItem => ({
          type: m.type === "video" ? ("video" as const) : ("image" as const),
          url: String(m.url),
          posterUrl: m.posterUrl ? String(m.posterUrl) : undefined,
        }))
    : (variant.images || []).map((url): MediaItem => ({ type: "image" as const, url }));

  function updateMedia(nextMedia: MediaItem[]) {
    const images = nextMedia.filter((m) => m.type === "image").map((m) => m.url);
    onChange({ ...variant, media: nextMedia as any, images });
  }

  function setMainItem(index: number) {
    const item = media[index];
    if (!item) return;
    const next = [item, ...media.filter((_, i) => i !== index)];
    updateMedia(next);
  }

  function removeItem(index: number) {
    updateMedia(media.filter((_, i) => i !== index));
  }

  function moveItem(from: number, to: number) {
    if (from === to) return;
    if (from < 0 || to < 0) return;
    if (from >= media.length || to >= media.length) return;
    const next = [...media];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    updateMedia(next);
  }

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const files = input.files ? Array.from(input.files) : [];
    input.value = "";
    if (!files.length) return;
    setUploadError(null);
    setUploading(true);
    setUploadProgress({ current: 0, total: files.length });
    try {
      let nextMedia: MediaItem[] = [...media];
      for (let i = 0; i < files.length; i++) {
        setUploadProgress({ current: i + 1, total: files.length });
        const url = await onUpload(files[i]!);
        if (nextMedia.some((m) => m.url === url)) continue;
        nextMedia = [...nextMedia, { type: "image" as const, url }];
        updateMedia(nextMedia);
      }
    } catch (err) {
      console.error("[admin] upload failed", err);
      setUploadError("Upload impossible. Réessayez.");
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }

  async function onPickVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const url = await onUpload(file);
      if (media.some((m) => m.url === url)) return;
      updateMedia([...media, { type: "video" as const, url }]);
    } catch (err) {
      console.error("[admin] upload failed", err);
      setUploadError("Upload impossible. Réessayez.");
    } finally {
      setUploading(false);
    }
  }

  async function onPickPoster(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    if (posterTargetIndex == null) return;
    setUploadError(null);
    setUploading(true);
    try {
      const url = await onUpload(file);
      const next = media.map((m, i) =>
        i === posterTargetIndex ? { ...m, posterUrl: url } : m
      );
      updateMedia(next);
    } catch (err) {
      console.error("[admin] upload failed", err);
      setUploadError("Upload impossible. Réessayez.");
    } finally {
      setUploading(false);
      setPosterTargetIndex(null);
    }
  }

  async function onPickReplace(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    if (replaceTargetIndex == null) return;
    setUploadError(null);
    setUploading(true);
    try {
      const url = await onUpload(file);
      if (media.some((m, i) => i !== replaceTargetIndex && m.url === url)) {
        setUploadError("Ce média existe déjà.");
        return;
      }
      const next: MediaItem[] = media.map((m, i): MediaItem => {
        if (i !== replaceTargetIndex) return m;
        if (replaceTargetType === "video") {
          // Replacing a video: reset poster by default.
          return { ...m, type: "video" as const, url, posterUrl: undefined };
        }
        return { ...m, type: "image" as const, url };
      });
      updateMedia(next);
    } catch (err) {
      console.error("[admin] upload failed", err);
      setUploadError("Upload impossible. Réessayez.");
    } finally {
      setUploading(false);
      setReplaceTargetIndex(null);
    }
  }

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

      <div className="mt-4">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={variant.available ?? true}
            onChange={(e) => onChange({ ...variant, available: e.target.checked })}
          />
          <span className="text-sm font-semibold text-zinc-900">Couleur disponible</span>
        </label>
      </div>

      <div className="mt-5">
        <div className="text-sm font-semibold text-zinc-900">Médias (photos + vidéos)</div>
        <div className="mt-2 rounded-3xl border border-zinc-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-semibold text-zinc-600">
              Ordre recommandé : 1 = cover • 2 = angle • 3 = intérieur • 4 = détails • 5 = lifestyle • vidéo optionnelle
            </div>
            <div className="flex items-center gap-2">
              <input
                id={photoInputId}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onPickPhoto}
              />
              <label
                htmlFor={photoInputId}
                className={[
                  "inline-flex cursor-pointer items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
                  uploading
                    ? "bg-zinc-100 text-zinc-400"
                    : "bg-zinc-900 text-white hover:bg-zinc-800",
                ].join(" ")}
              >
                {uploading
                  ? uploadProgress
                    ? `Upload ${uploadProgress.current}/${uploadProgress.total}...`
                    : "Upload..."
                  : "Ajouter une photo"}
              </label>

              <input
                id={videoInputId}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,.mov"
                className="hidden"
                onChange={onPickVideo}
              />
              <label
                htmlFor={videoInputId}
                className={[
                  "inline-flex cursor-pointer items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
                  uploading
                    ? "bg-zinc-100 text-zinc-400"
                    : "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50",
                ].join(" ")}
              >
                Ajouter une vidéo
              </label>

              <input
                id={posterInputId}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickPoster}
              />

              <input
                id={`${variant.id}_replace_image`}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickReplace}
              />
              <input
                id={`${variant.id}_replace_video`}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,.mov"
                className="hidden"
                onChange={onPickReplace}
              />
            </div>
          </div>

          {uploadError ? (
            <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
              {uploadError}
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {media.map((item, idx) => {
              const isMain = idx === 0;
              return (
                <div
                  key={`${item.type}_${item.url}_${idx}`}
                  className={[
                    "group relative overflow-hidden rounded-3xl border bg-zinc-50",
                    isMain ? "border-zinc-900" : "border-zinc-200",
                  ].join(" ")}
                  draggable
                  onDragStart={() => setDragIndex(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIndex == null) return;
                    moveItem(dragIndex, idx);
                    setDragIndex(null);
                  }}
                  aria-label="Media"
                >
                  <div className="relative h-28 w-full">
                    {item.type === "video" ? (
                      <>
                        <VideoThumb url={item.url} posterUrl={item.posterUrl} />
                        <div className="absolute left-2 top-2 rounded-full bg-black/75 px-2 py-1 text-[10px] font-semibold text-white">
                          Vidéo
                        </div>
                      </>
                    ) : (
                      <img
                        src={item.url}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 h-full w-full object-contain p-4"
                        onError={(e) => {
                          const img = e.currentTarget;
                          img.onerror = null;
                          img.src = "/products/valise-cabine.svg";
                        }}
                      />
                    )}
                  </div>

                  {isMain ? (
                    <div className="absolute left-2 top-2 rounded-full bg-black/75 px-2 py-1 text-[10px] font-semibold text-white">
                      Principal
                    </div>
                  ) : null}

                  {/* Replace / delete controls (keep UI minimal) */}
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setReplaceTargetIndex(idx);
                        setReplaceTargetType(item.type);
                        const inputId =
                          item.type === "video"
                            ? `${variant.id}_replace_video`
                            : `${variant.id}_replace_image`;
                        const el = document.getElementById(inputId) as HTMLInputElement | null;
                        el?.click();
                      }}
                      className="rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-zinc-900 ring-1 ring-zinc-200 backdrop-blur hover:bg-white"
                      aria-label="Remplacer"
                      title="Remplacer"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!confirm("Supprimer ce média ?")) return;
                        removeItem(idx);
                      }}
                      className="rounded-full bg-rose-50/95 px-2 py-1 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-200 backdrop-blur hover:bg-rose-100"
                      aria-label="Supprimer"
                      title="Supprimer"
                    >
                      🗑
                    </button>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-white/90 p-2 opacity-100 backdrop-blur sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => setMainItem(idx)}
                      className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-900 hover:bg-zinc-50"
                    >
                      Main
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveItem(idx, Math.max(0, idx - 1))}
                        className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-900 hover:bg-zinc-50"
                        aria-label="Monter"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(idx, Math.min(media.length - 1, idx + 1))}
                        className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-900 hover:bg-zinc-50"
                        aria-label="Descendre"
                      >
                        →
                      </button>
                      {item.type === "video" ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPosterTargetIndex(idx);
                            // open hidden input
                            const el = document.getElementById(posterInputId) as HTMLInputElement | null;
                            el?.click();
                          }}
                          className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-900 hover:bg-zinc-50"
                          aria-label="Choisir cover"
                        >
                          Cover
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 text-xs text-zinc-600">
            Glissez-déposez pour réordonner sur desktop. Sur mobile, utilisez ← / →. Recommandé : 5 photos + vidéo optionnelle.
          </div>
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

function VideoThumb({ url, posterUrl }: { url: string; posterUrl?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="absolute inset-0">
      <video
        src={url}
        className="absolute inset-0 h-full w-full object-contain p-4"
        controls
        muted
        playsInline
        preload="metadata"
        poster={posterUrl}
        onError={() => setFailed(true)}
      />
      {failed ? (
        <div className="absolute inset-0 grid place-items-center px-2 text-center text-[11px] font-semibold text-zinc-500">
          Vidéo non disponible
        </div>
      ) : null}
    </div>
  );
}

function createEmptyVariant(): ProductVariant {
  return {
    id: `var_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`,
    colorName: "Noir",
    colorHex: "#0A0A0A",
    media: [],
    images: [],
    available: true,
  };
}
