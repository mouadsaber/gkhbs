import { NextResponse } from "next/server";
import { getAdminCookieName, isValidAdminSessionCookie, parseCookieHeader } from "@/lib/adminSession";
import { isDbConfigured } from "@/lib/db";
import { getHomepageCoverDb, upsertHomepageCoverDb } from "@/lib/settingsDb";

export async function GET(request: Request) {
  try {
    const auth = requireAdmin(request);
    if (auth) return auth;
    if (!isDbConfigured()) {
      return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 500 });
    }
    const cover = await getHomepageCoverDb();
    return NextResponse.json({
      ok: true,
      settings: { homepageCover: cover },
    });
  } catch (err) {
    console.error("[admin/settings] GET failed:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = requireAdmin(request);
    if (auth) return auth;

    let body: { homepageCover?: Parameters<typeof upsertHomepageCoverDb>[0] } | null = null;
    try {
      body = (await request.json()) as { homepageCover?: Parameters<typeof upsertHomepageCoverDb>[0] };
    } catch {
      return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
    }

    if (!isDbConfigured()) {
      return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 500 });
    }
    if (body?.homepageCover) {
      await upsertHomepageCoverDb(body.homepageCover);
    }
    const cover = await getHomepageCoverDb();
    return NextResponse.json({ ok: true, settings: { homepageCover: cover } });
  } catch (err) {
    console.error("[admin/settings] PUT failed:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
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
