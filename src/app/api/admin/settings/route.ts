import { NextResponse } from "next/server";
import { getAdminCookieName, isValidAdminSessionCookie, parseCookieHeader } from "@/lib/adminSession";
import { readStore, writeStore } from "@/lib/productsStore";
import type { ProductStore } from "@/lib/productTypes";

export async function GET(request: Request) {
  const auth = requireAdmin(request);
  if (auth) return auth;
  const store = await readStore();
  return NextResponse.json({ ok: true, settings: store.settings || {} });
}

export async function PUT(request: Request) {
  const auth = requireAdmin(request);
  if (auth) return auth;

  let body: Partial<ProductStore["settings"]> | null = null;
  try {
    body = (await request.json()) as Partial<ProductStore["settings"]>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const store = await readStore();
  const next: ProductStore = {
    ...store,
    settings: {
      ...(store.settings || {}),
      ...(body || {}),
    },
  };
  await writeStore(next);
  return NextResponse.json({ ok: true, settings: next.settings || {} });
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

