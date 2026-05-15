import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getUploadsDir, safeUploadsFilename } from "@/lib/uploads";

function guessMime(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".mp4") return "video/mp4";
  if (ext === ".webm") return "video/webm";
  if (ext === ".mov") return "video/quicktime";
  return "application/octet-stream";
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const filename = safeUploadsFilename(name || "");
  if (!filename) {
    return NextResponse.json({ error: "missing_name" }, { status: 400 });
  }

  const uploadsDir = getUploadsDir();
  const filePath = path.join(uploadsDir, filename);
  try {
    const bytes = await readFile(filePath);
    const mime = guessMime(filename);
    // Debug logging for production issues.
    console.log("[uploads] serve", { filename, filePath, mime });
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "content-type": mime,
        // Cache on CDN/browser; filenames are content-addressed-ish.
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    // Backward-compatible fallback: older deployments saved under /public/uploads.
    const legacyPath = path.join(process.cwd(), "public", "uploads", filename);
    try {
      const bytes = await readFile(legacyPath);
      const mime = guessMime(filename);
      console.log("[uploads] serve legacy", { filename, legacyPath, mime });
      return new NextResponse(bytes, {
        status: 200,
        headers: {
          "content-type": mime,
          "cache-control": "public, max-age=31536000, immutable",
        },
      });
    } catch (err2) {
      console.error("[uploads] missing file", { filename, filePath, legacyPath, err, err2 });
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
  }
}
