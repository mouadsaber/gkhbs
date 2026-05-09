import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { getAdminCookieName, isValidAdminSessionCookie, parseCookieHeader } from "@/lib/adminSession";

export async function POST(request: Request) {
  const auth = requireAdmin(request);
  if (auth) return auth;

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { ok: false, error: "expected_multipart" },
      { status: 400 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "missing_file" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = guessExt(file.type, file.name);
  const name = `upl_${crypto.randomBytes(8).toString("hex")}${ext}`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, name), bytes);

  return NextResponse.json({ ok: true, url: `/uploads/${name}` });
}

function guessExt(mime: string, filename: string) {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png")) return ".png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return ".jpg";
  if (lower.endsWith(".webp")) return ".webp";
  if (lower.endsWith(".svg")) return ".svg";
  if (mime === "image/png") return ".png";
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/svg+xml") return ".svg";
  return "";
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
