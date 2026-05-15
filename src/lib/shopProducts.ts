import type { Product } from "@/lib/productTypes";
import { isDbConfigured } from "@/lib/db";
import { getAllProductsDb, getProductBySlugDb } from "@/lib/productsDb";
import { getHomepageCoverDb } from "@/lib/settingsDb";

export async function getProducts(): Promise<Product[]> {
  if (!isDbConfigured()) throw new Error("db_not_configured");
  return await getAllProductsDb();
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!isDbConfigured()) throw new Error("db_not_configured");
  return await getProductBySlugDb(slug);
}

export async function getHomepageCover() {
  if (!isDbConfigured()) throw new Error("db_not_configured");
  return await getHomepageCoverDb();
}
