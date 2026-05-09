import crypto from "node:crypto";

const COOKIE_NAME = "admin_session";

export function getAdminCookieName() {
  return COOKIE_NAME;
}

export function computeAdminSessionValue(adminPassword: string) {
  return crypto.createHmac("sha256", adminPassword).update("admin").digest("base64url");
}

export function isValidAdminSessionCookie(cookieValue: string | undefined | null) {
  const adminPassword = process.env.ADMIN_PASSWORD || "";
  if (!adminPassword) return { ok: false as const, reason: "admin_password_not_configured" as const };
  const expected = computeAdminSessionValue(adminPassword);
  return { ok: cookieValue === expected, reason: cookieValue === expected ? null : "unauthorized" as const };
}

export function parseCookieHeader(cookieHeader: string | null) {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  for (const p of parts) {
    const idx = p.indexOf("=");
    if (idx === -1) continue;
    const k = p.slice(0, idx);
    const v = p.slice(idx + 1);
    out[k] = decodeURIComponent(v);
  }
  return out;
}

