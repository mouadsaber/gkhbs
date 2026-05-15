import { NextResponse } from "next/server";
import type { Product } from "@/lib/productTypes";
import type { ProductVariant } from "@/lib/productTypes";
import { getAdminCookieName, isValidAdminSessionCookie, parseCookieHeader } from "@/lib/adminSession";
import { isDbConfigured } from "@/lib/db";
import { deleteProductDb, getAllProductsDb, getProductByIdDb, upsertProductDb } from "@/lib/productsDb";

function nowIso() {
  return new Date().toISOString();
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function validateProductPayload(body: Partial<Product>) {
  const name = (body.name || "").trim();
  const reference = (body.reference || "").trim();
  const category = (body.category || "").trim();

  if (!name) return "missing_name";
  if (!reference) return "missing_reference";
  if (!category) return "missing_category";

  const variants = Array.isArray(body.variants) ? body.variants : [];
  // Variants can be empty while drafting; API will auto-create a default variant on save.

  const sizes = (body as any).sizes as Product["sizes"] | undefined;
  if (!sizes) return "missing_sizes";
  for (const key of ["20", "24", "28", "pack3"] as const) {
    const s = (sizes as any)[key];
    if (!s) return "missing_size";
    if (typeof s.price !== "number" || !Number.isFinite(s.price)) return "invalid_price";
    if (typeof s.inStock !== "boolean") return "invalid_stock";
  }

  for (const v of variants) {
    if (!String(v.colorName || "").trim()) return "missing_color_name";
    if (!String(v.colorHex || "").trim()) return "missing_color_hex";
    const media = Array.isArray((v as any).media) ? (v as any).media : null;
    const imagesFromMedia = Array.isArray(media)
      ? media.filter((m: any) => (m?.type === "image" || !m?.type) && m?.url).map((m: any) => String(m.url))
      : [];
    const images = Array.isArray((v as any).images) ? (v as any).images.filter(Boolean) : [];
    if (!(imagesFromMedia.length || images.length)) return "missing_images";
    // Variant does not carry sizes anymore (global sizes are on product).
  }

  return null;
}

function ensureAtLeastOneVariant(input: Partial<Product>): ProductVariant[] {
  const variants = Array.isArray(input.variants) ? (input.variants as ProductVariant[]) : [];
  if (variants.length) return variants;
  return [
    {
      id: uid("var"),
      colorName: "Default",
      colorHex: "#0A0A0A",
      available: true,
      media: [{ type: "image", url: "/products/valise-cabine.svg" }],
      images: ["/products/valise-cabine.svg"],
    } as ProductVariant,
  ];
}

function normalizeError(err: unknown) {
  const e = err as { message?: string; code?: string; errno?: number; sqlState?: string };
  return {
    message: typeof e?.message === "string" ? e.message : "Unknown error",
    code: typeof e?.code === "string" ? e.code : undefined,
    errno: typeof e?.errno === "number" ? e.errno : undefined,
    sqlState: typeof e?.sqlState === "string" ? e.sqlState : undefined,
  };
}

export async function GET(request: Request) {
  try {
    const auth = requireAdmin(request);
    if (auth) return auth;
    if (!isDbConfigured()) {
      return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 500 });
    }
    const products = await getAllProductsDb();
    return NextResponse.json({ ok: true, store: { version: 1, products } });
  } catch (err) {
    const info = normalizeError(err);
    console.error("[admin/products] GET failed:", info);
    return NextResponse.json(
      { ok: false, error: "internal_error", details: info },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = requireAdmin(request);
    if (auth) return auth;
    if (!isDbConfigured()) {
      return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 500 });
    }

    let body: Partial<Product> | null = null;
    try {
      body = (await request.json()) as Partial<Product>;
    } catch {
      return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
    }

    const normalizedVariants = body ? ensureAtLeastOneVariant(body) : [];
    const normalizedBody = body ? ({ ...body, variants: normalizedVariants } as Partial<Product>) : null;

    const validationError = normalizedBody ? validateProductPayload(normalizedBody) : "missing_fields";
    if (validationError) {
      return NextResponse.json({ ok: false, error: validationError }, { status: 400 });
    }

    const createdAt = nowIso();
    const product: Product = {
      id: body.id && body.id.length ? body.id : uid("prod"),
      slug:
        body.slug && body.slug.length
          ? body.slug
          : slugify(String(body.name || "produit")),
      name: String(body.name || "Produit"),
      reference: String(body.reference || ""),
      description: body.description || "",
      category: body.category as Product["category"],
      bestSeller: Boolean(body.bestSeller),
      available: body.available == null ? true : Boolean(body.available),
      stockText: body.stockText || "Stock limité",
      variants: normalizedVariants,
      landing: body.landing || undefined,
      details: body.details || undefined,
      sizes: (body as any).sizes as Product["sizes"],
      createdAt,
      updatedAt: createdAt,
    };

    await upsertProductDb(product);
    return NextResponse.json({ ok: true, product });
  } catch (err) {
    const info = normalizeError(err);
    console.error("[admin/products] POST failed:", info);
    return NextResponse.json(
      { ok: false, error: "internal_error", details: info },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const auth = requireAdmin(request);
    if (auth) return auth;
    if (!isDbConfigured()) {
      return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 500 });
    }

    let body: Partial<Product> | null = null;
    try {
      body = (await request.json()) as Partial<Product>;
    } catch {
      return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
    }

    if (!body?.id) {
      return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
    }
    const normalizedVariants = ensureAtLeastOneVariant(body);
    const normalizedBody = { ...body, variants: normalizedVariants } as Partial<Product>;
    const validationError = validateProductPayload(normalizedBody);
    if (validationError) {
      return NextResponse.json({ ok: false, error: validationError }, { status: 400 });
    }

    const existing = await getProductByIdDb(body.id);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    const next: Product = {
      ...existing,
      ...normalizedBody,
      slug: body.slug && body.slug.length ? body.slug : existing.slug,
      updatedAt: nowIso(),
    } as Product;

    await upsertProductDb(next);
    return NextResponse.json({ ok: true, product: next });
  } catch (err) {
    const info = normalizeError(err);
    console.error("[admin/products] PUT failed:", info);
    return NextResponse.json(
      { ok: false, error: "internal_error", details: info },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = requireAdmin(request);
    if (auth) return auth;
    if (!isDbConfigured()) {
      return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 500 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
    }

    await deleteProductDb(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const info = normalizeError(err);
    console.error("[admin/products] DELETE failed:", info);
    return NextResponse.json(
      { ok: false, error: "internal_error", details: info },
      { status: 500 }
    );
  }
}

function requireAdmin(request: Request) {
  const cookieHeader = request.headers.get("cookie");
  const cookies = parseCookieHeader(cookieHeader);
  const cookieValue = cookies[getAdminCookieName()];
  const valid = isValidAdminSessionCookie(cookieValue);
  if (valid.ok) return null;
  return NextResponse.json(
    { ok: false, error: valid.reason || "unauthorized" },
    { status: valid.reason === "admin_password_not_configured" ? 500 : 401 }
  );
}
