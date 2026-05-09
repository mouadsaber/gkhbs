import type { Product } from "@/lib/productTypes";
import { readStore } from "@/lib/productsStore";

export async function getProducts(): Promise<Product[]> {
  const store = await readStore();
  return store.products;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const store = await readStore();
  return store.products.find((p) => p.slug === slug) ?? null;
}

export async function getHomepageCover() {
  const store = await readStore();
  const c = store.settings?.homepageCover;
  return {
    desktopUrl: c?.desktopUrl || "/cover/default-desktop.svg",
    mobileUrl: c?.mobileUrl || "/cover/default-mobile.svg",
    linkUrl: c?.linkUrl || "",
    linkedProductSlug: c?.linkedProductSlug || "",
    alt: c?.alt || "Couverture boutique valises",
  };
}
