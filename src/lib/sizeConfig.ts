import type { Product, SizeConfig, SizeKey } from "@/lib/productTypes";
import { SIZE_CONFIG } from "@/lib/productTypes";

export function getSizeConfig(product: Pick<Product, "reference">, key: SizeKey): SizeConfig {
  // Product-specific overrides (do not affect other products).
  if (key === "20" && /gb-p215/i.test(product.reference || "")) {
    return { ...SIZE_CONFIG[key], label: '18" Cabine Business' };
  }
  return SIZE_CONFIG[key];
}

