const COOKIE_NAME = "admin_session";

export function getAdminCookieName() {
  return COOKIE_NAME;
}

export async function computeAdminSessionValue(adminPassword: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(adminPassword),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode("admin"));
  return base64Url(new Uint8Array(sig));
}

export async function isValidAdminSessionCookie(cookieValue: string | undefined | null) {
  const adminPassword = process.env.ADMIN_PASSWORD || "";
  if (!adminPassword) {
    return { ok: false as const, reason: "admin_password_not_configured" as const };
  }
  const expected = await computeAdminSessionValue(adminPassword);
  return { ok: cookieValue === expected, reason: cookieValue === expected ? null : ("unauthorized" as const) };
}

function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

