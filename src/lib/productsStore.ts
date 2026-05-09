import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ProductStore } from "@/lib/productTypes";
import { seedStoreIfEmpty } from "@/lib/seedProducts";

const STORE_PATH = path.join(process.cwd(), "storage", "products.json");

export async function readStore(): Promise<ProductStore> {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as ProductStore;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.products)) {
      return seedStoreIfEmpty({ version: 1, products: [] });
    }
    return seedStoreIfEmpty(parsed);
  } catch {
    return seedStoreIfEmpty({ version: 1, products: [] });
  }
}

export async function writeStore(store: ProductStore) {
  const dir = path.dirname(STORE_PATH);
  await mkdir(dir, { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2) + "\n", "utf8");
}
