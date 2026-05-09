import { NextResponse } from "next/server";
import type { Product, ProductStore } from "@/lib/productTypes";
import { readStore, writeStore } from "@/lib/productsStore";
import { getAdminCookieName, isValidAdminSessionCookie, parseCookieHeader } from "@/lib/adminSession";

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

export async function GET(request: Request) {
  const auth = requireAdmin(request);
  if (auth) return auth;
  const store = await readStore();
  return NextResponse.json({ ok: true, store });
}

export async function POST(request: Request) {
  const auth = requireAdmin(request);
  if (auth) return auth;

  let body: Partial<Product> | null = null;
  try {
    body = (await request.json()) as Partial<Product>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!body?.name || !body.reference || !body.description || !body.category) {
    return NextResponse.json(
      { ok: false, error: "missing_fields" },
      { status: 400 }
    );
  }

  const store = await readStore();

  const createdAt = nowIso();
  const product: Product = {
    id: uid("prod"),
    slug: body.slug && body.slug.length ? body.slug : slugify(body.name),
    name: body.name,
    reference: body.reference,
    description: body.description,
    category: body.category,
    bestSeller: Boolean(body.bestSeller),
    stockText: body.stockText || "Stock limité",
    variants: Array.isArray(body.variants) ? body.variants : [],
    createdAt,
    updatedAt: createdAt,
  };

  const nextStore: ProductStore = {
    ...store,
    products: [product, ...store.products],
  };
  await writeStore(nextStore);
  return NextResponse.json({ ok: true, product });
}

export async function PUT(request: Request) {
  const auth = requireAdmin(request);
  if (auth) return auth;

  let body: Partial<Product> | null = null;
  try {
    body = (await request.json()) as Partial<Product>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!body?.id) {
    return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
  }

  const store = await readStore();
  const idx = store.products.findIndex((p) => p.id === body!.id);
  if (idx === -1) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const prev = store.products[idx]!;
  const next: Product = {
    ...prev,
    ...body,
    slug: body.slug && body.slug.length ? body.slug : prev.slug,
    updatedAt: nowIso(),
  } as Product;

  const nextStore: ProductStore = {
    ...store,
    products: store.products.map((p) => (p.id === next.id ? next : p)),
  };

  await writeStore(nextStore);
  return NextResponse.json({ ok: true, product: next });
}

export async function DELETE(request: Request) {
  const auth = requireAdmin(request);
  if (auth) return auth;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
  }

  const store = await readStore();
  const next = store.products.filter((p) => p.id !== id);
  if (next.length === store.products.length) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  await writeStore({ ...store, products: next });
  return NextResponse.json({ ok: true });
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
