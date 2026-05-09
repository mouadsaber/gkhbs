export type ProductColor = {
  name: string;
  hex: string;
};

export type ProductSize = {
  id: string;
  label: string;
  details: string;
  price: number; // MAD
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  ref: string;
  tagline: string;
  description: string;
  highlights: string[];
  images: string[];
  colors: ProductColor[];
  sizes: ProductSize[];
};

export const products: Product[] = [
  {
    id: "aero-abs",
    slug: "aero-abs",
    name: "Aéro ABS — Coque rigide",
    ref: "GK-AERO-ABS",
    tagline: "Légère, silencieuse, pensée pour voyager souvent.",
    description:
      "Coque rigide en ABS premium avec finition mate, roues 360° fluides et poignée télescopique stable. Une valise moderne pour un usage régulier, en cabine comme en soute.",
    highlights: ["4 roues 360° silencieuses", "Serrure à code intégrée", "Intérieur compartimenté"],
    images: [
      "/products/suitcase-aero-1.svg",
      "/products/suitcase-aero-2.svg",
      "/products/suitcase-aero-3.svg",
    ],
    colors: [
      { name: "Noir", hex: "#0A0A0A" },
      { name: "Gris", hex: "#8A8F98" },
      { name: "Bleu nuit", hex: "#111C2E" },
    ],
    sizes: [
      { id: "20", label: 'Cabine 20"', details: "55×35×22 cm", price: 449 },
      { id: "24", label: 'Moyenne 24"', details: "65×42×26 cm", price: 549 },
      { id: "28", label: 'Grande 28"', details: "75×48×30 cm", price: 649 },
    ],
  },
  {
    id: "terra-pc",
    slug: "terra-polycarbonate",
    name: "Terra PC — Polycarbonate",
    ref: "GK-TERRA-PC",
    tagline: "Anti-chocs, finition premium, stabilité parfaite.",
    description:
      "Polycarbonate flexible et résistant aux impacts, idéal pour la soute. Le design nervuré protège des chocs tout en gardant une silhouette élégante.",
    highlights: ["Polycarbonate anti-chocs", "Fermeture zippée renforcée", "Poignée haut/bas"],
    images: [
      "/products/suitcase-terra-1.svg",
      "/products/suitcase-terra-2.svg",
      "/products/suitcase-terra-3.svg",
    ],
    colors: [
      { name: "Noir", hex: "#0A0A0A" },
      { name: "Champagne", hex: "#D7C7A7" },
      { name: "Vert olive", hex: "#2F3E2C" },
    ],
    sizes: [
      { id: "20", label: 'Cabine 20"', details: "55×35×22 cm", price: 529 },
      { id: "24", label: 'Moyenne 24"', details: "65×42×26 cm", price: 629 },
      { id: "28", label: 'Grande 28"', details: "75×48×30 cm", price: 729 },
    ],
  },
  {
    id: "nova-aluminium",
    slug: "nova-aluminium",
    name: "Nova — Aluminium (édition)",
    ref: "GK-NOVA-AL",
    tagline: "Look iconique, angles protégés, présence haut de gamme.",
    description:
      "Une valise au style premium, inspirée des éditions aluminium. Angles renforcés, structure stable et détails minimalistes pour un rendu luxueux.",
    highlights: ["Angles renforcés", "Détails minimalistes", "Roues haute précision"],
    images: [
      "/products/suitcase-nova-1.svg",
      "/products/suitcase-nova-2.svg",
      "/products/suitcase-nova-3.svg",
    ],
    colors: [
      { name: "Alu", hex: "#B9C0C7" },
      { name: "Noir", hex: "#111111" },
    ],
    sizes: [
      { id: "20", label: 'Cabine 20"', details: "55×35×22 cm", price: 799 },
      { id: "24", label: 'Moyenne 24"', details: "65×42×26 cm", price: 899 },
    ],
  },
  {
    id: "silk-soft",
    slug: "silk-softshell",
    name: "Silk — Softshell extensible",
    ref: "GK-SILK-SOFT",
    tagline: "Ultra pratique, poche frontale, extension zip.",
    description:
      "Softshell texturé avec poche frontale et zip extensible pour gagner de la place. Parfait pour les voyages où la flexibilité compte.",
    highlights: ["Zip extensible", "Poche frontale pratique", "Intérieur optimisé"],
    images: [
      "/products/suitcase-silk-1.svg",
      "/products/suitcase-silk-2.svg",
      "/products/suitcase-silk-3.svg",
    ],
    colors: [
      { name: "Noir", hex: "#0A0A0A" },
      { name: "Bordeaux", hex: "#4A0E18" },
      { name: "Sable", hex: "#C9B9A2" },
    ],
    sizes: [
      { id: "20", label: 'Cabine 20"', details: "55×35×22 cm", price: 479 },
      { id: "24", label: 'Moyenne 24"', details: "65×42×26 cm", price: 579 },
      { id: "28", label: 'Grande 28"', details: "75×48×30 cm", price: 679 },
    ],
  },
  {
    id: "orbit-zip",
    slug: "orbit-zipperless",
    name: "Orbit — Fermeture sécurisée",
    ref: "GK-ORBIT-SEC",
    tagline: "Fermeture sécurisée, lignes nettes, usage intensif.",
    description:
      "Structure stable et fermeture sécurisée pour voyager sereinement. Une option robuste avec un design premium et discret.",
    highlights: ["Fermeture sécurisée", "Roues silencieuses", "Poignées renforcées"],
    images: [
      "/products/suitcase-orbit-1.svg",
      "/products/suitcase-orbit-2.svg",
      "/products/suitcase-orbit-3.svg",
    ],
    colors: [
      { name: "Noir", hex: "#0A0A0A" },
      { name: "Gris", hex: "#8A8F98" },
      { name: "Kaki", hex: "#4A5A3F" },
    ],
    sizes: [
      { id: "20", label: 'Cabine 20"', details: "55×35×22 cm", price: 569 },
      { id: "24", label: 'Moyenne 24"', details: "65×42×26 cm", price: 669 },
      { id: "28", label: 'Grande 28"', details: "75×48×30 cm", price: 769 },
    ],
  },
  {
    id: "set-trio",
    slug: "set-trio",
    name: "Set Trio — 3 tailles",
    ref: "GK-SET-TRIO",
    tagline: "Le pack complet, prêt pour toute l’année.",
    description:
      "Un trio harmonieux pour couvrir tous vos besoins: cabine, moyenne et grande. Empilables et faciles à ranger, avec un look premium.",
    highlights: ["3 tailles incluses", "Gain de place", "Style uniforme"],
    images: ["/products/valise-pack.svg", "/products/suitcase-set-2.svg", "/products/suitcase-set-3.svg"],
    colors: [
      { name: "Noir", hex: "#0A0A0A" },
      { name: "Champagne", hex: "#D7C7A7" },
    ],
    sizes: [
      { id: "set", label: "Pack S/M/L", details: "Cabine + Moyenne + Grande", price: 1199 },
    ],
  },
  {
    id: "carry-pro",
    slug: "carry-pro",
    name: "Carry Pro — Business cabine",
    ref: "GK-CARRY-PRO",
    tagline: "Cabine business, organisation clean, look premium.",
    description:
      "Pensée pour le quotidien pro: intérieur optimisé, équilibre parfait et design sobre. Une cabine qui fait sérieux, partout.",
    highlights: ["Organisation intérieure clean", "Roues ultra-fluides", "Finition mate premium"],
    images: [
      "/products/suitcase-carry-1.svg",
      "/products/suitcase-carry-2.svg",
      "/products/suitcase-carry-3.svg",
    ],
    colors: [
      { name: "Noir", hex: "#0A0A0A" },
      { name: "Bleu nuit", hex: "#111C2E" },
    ],
    sizes: [{ id: "20", label: 'Cabine 20"', details: "55×35×22 cm", price: 599 }],
  },
  {
    id: "cloud-kids",
    slug: "cloud-kids",
    name: "Cloud Kids — Valise cabine enfant",
    ref: "GK-CLOUD-KID",
    tagline: "Ultra légère, adorable, facile à rouler.",
    description:
      "Une cabine enfant facile à manœuvrer: légère, stable et pensée pour les petits voyages. Style premium avec une touche fun, sans être trop chargée.",
    highlights: ["Très légère", "Roues faciles", "Format cabine"],
    images: [
      "/products/suitcase-cloud-1.svg",
      "/products/suitcase-cloud-2.svg",
      "/products/suitcase-cloud-3.svg",
    ],
    colors: [
      { name: "Bleu", hex: "#2463EB" },
      { name: "Rose", hex: "#F472B6" },
      { name: "Noir", hex: "#0A0A0A" },
    ],
    sizes: [{ id: "18", label: 'Cabine 18"', details: "50×33×20 cm", price: 399 }],
  },
];

export function getProductBySlug(slug: string) {
  return products.find((p) => p.slug === slug) ?? null;
}
