import { NextResponse } from "next/server";
import { computeAdminSessionValue, getAdminCookieName } from "@/lib/adminSession";

export async function POST(request: Request) {
  const adminPassword = process.env.ADMIN_PASSWORD || "";
  if (!adminPassword) {
    return NextResponse.json(
      { ok: false, error: "admin_password_not_configured" },
      { status: 500 }
    );
  }

  let body: { password?: string } | null = null;
  try {
    body = (await request.json()) as { password?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const got = (body?.password || "").trim();
  if (!got || got !== adminPassword) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  const value = computeAdminSessionValue(adminPassword);
  res.cookies.set({
    name: getAdminCookieName(),
    value,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

