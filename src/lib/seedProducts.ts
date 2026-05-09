import type { ProductStore, Product, ProductVariant, SizeKey } from "@/lib/productTypes";
import { SIZE_CONFIG } from "@/lib/productTypes";
import { products as legacy } from "@/data/products";

function nowIso() {
  return new Date().toISOString();
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

const SIZE_KEYS: SizeKey[] = ["20", "24", "28", "pack3"];

export function seedStoreIfEmpty(store: ProductStore): ProductStore {
  const baseSettings: ProductStore["settings"] = store.settings || {
    homepageCover: {
      desktopUrl: "/cover/default-desktop.svg",
      mobileUrl: "/cover/default-mobile.svg",
      linkUrl: "",
      linkedProductSlug: "",
      alt: "Couverture boutique valises",
    },
  };

  if (store.products.length) return { ...store, settings: baseSettings };

  const seededProducts: Product[] = legacy.slice(0, 9).map((p, index) => {
    const baseVariant: ProductVariant = {
      id: uid("var"),
      colorName: p.colors[0]?.name || "Noir",
      colorHex: p.colors[0]?.hex || "#0A0A0A",
      images: p.images.length ? p.images : ["/products/valise-cabine.svg"],
      sizes: Object.fromEntries(
        SIZE_KEYS.map((k) => {
          const legacySize = p.sizes.find((s) => s.id === k);
          // pack3: fallback to 0 by default.
          const price = legacySize?.price ?? 0;
          return [k, { price, inStock: price > 0 }];
        })
      ) as ProductVariant["sizes"],
    };

    const createdAt = nowIso();
    return {
      id: uid("prod"),
      slug: p.slug,
      name: p.name,
      reference: p.ref,
      description: p.description,
      detailedDescription: "",
      category: "Valises",
      bestSeller: index < 3,
      stockText: "Stock limité",
      details: {
        material: "",
        dimensions: "",
        weight: "",
        wheels: "",
        lock: "",
        handle: "",
        warranty: "",
        shipping: "24–48h",
      },
      variants: [baseVariant],
      createdAt,
      updatedAt: createdAt,
    };
  });

  // Ensure size labels are referenced at least once (prevents unused warnings in some setups).
  void SIZE_CONFIG;

  return { version: 1, settings: baseSettings, products: seededProducts };
}
