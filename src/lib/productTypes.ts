export type ProductCategory =
  | "Valises"
  | "Valises (cabine)"
  | "Valises (soute)"
  | "Packs"
  | "Enfant"
  | "Autres";

export type SizeKey = "20" | "24" | "28" | "pack3";

export type SizeConfig = {
  label: string;
  details: string;
};

export const SIZE_CONFIG: Record<SizeKey, SizeConfig> = {
  "20": { label: '20" Cabine', details: "Court voyage" },
  "24": { label: '24" Moyen', details: "1 semaine" },
  "28": { label: '28" Grand', details: "Famille / long voyage" },
  pack3: { label: "Pack 3 pièces", details: "S/M/L complet" },
};

export type VariantSize = {
  price: number; // MAD
  inStock: boolean;
};

export type ProductVariant = {
  id: string;
  colorName: string;
  colorHex: string;
  images: string[]; // first = main, others = thumbnails
  sizes: Record<SizeKey, VariantSize>;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  reference: string;
  description: string;
  detailedDescription?: string;
  category: ProductCategory;
  bestSeller: boolean;
  stockText: string; // e.g. "Stock limité"
  details?: {
    material?: string;
    dimensions?: string;
    weight?: string;
    wheels?: string;
    lock?: string;
    handle?: string;
    warranty?: string;
    shipping?: string;
  };
  variants: ProductVariant[];
  updatedAt: string;
  createdAt: string;
};

export type ProductStore = {
  version: 1;
  settings?: {
    homepageCover?: {
      desktopUrl?: string;
      mobileUrl?: string;
      linkUrl?: string;
      linkedProductSlug?: string;
      alt?: string;
    };
  };
  products: Product[];
};
