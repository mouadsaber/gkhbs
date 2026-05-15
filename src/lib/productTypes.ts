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
  "20": { label: '20" Cabine', details: "Voyage léger" },
  "24": { label: '24" Moyen', details: "Le plus demandé" },
  "28": { label: '28" Grand', details: "Max rangement" },
  pack3: { label: "Pack 3 pièces", details: "Prix avantageux" },
};

export type VariantSize = {
  price: number; // MAD
  inStock: boolean;
};

export type MediaType = "image" | "video";

export type VariantMediaItem = {
  type: MediaType;
  url: string;
  posterUrl?: string; // used for video cover thumbnail
};

export type LandingContent = {
  heroHook?: string; // short selling hook under title
  heroBullets?: string[]; // short trust/selling bullets
  pointsForts?: Array<{ title: string; text: string }>;
  faq?: Array<{ q: string; a: string }>;
  reviews?: Array<{ name: string; city: string; text: string; rtl?: boolean }>;
};

export type ProductVariant = {
  id: string;
  colorName: string;
  colorHex: string;
  media: VariantMediaItem[]; // ordered; first = cover
  images: string[]; // derived images (type=image), kept for legacy components
  available?: boolean;
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
  available: boolean; // product availability (stock status)
  stockText: string; // e.g. "Stock limité"
  landing?: LandingContent;
  sizes: Record<SizeKey, VariantSize>;
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
