import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminCookieName, isValidAdminSessionCookie } from "@/lib/adminSessionEdge";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (!isAdminPage && !isAdminApi) return NextResponse.next();
  if (pathname === "/admin/login") return NextResponse.next();
  if (pathname === "/api/admin/login") return NextResponse.next();

  const cookie = request.cookies.get(getAdminCookieName())?.value;
  const valid = await isValidAdminSessionCookie(cookie);
  if (valid.ok) return NextResponse.next();

  if (isAdminApi) {
    return NextResponse.json({ ok: false, error: valid.reason || "unauthorized" }, { status: valid.reason === "admin_password_not_configured" ? 500 : 401 });
  }

  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
