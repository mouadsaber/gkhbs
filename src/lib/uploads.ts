import path from "node:path";
import { mkdir, unlink, writeFile } from "node:fs/promises";

export function getUploadsDir() {
  // Use a configurable path for production hosts where the app root is read-only.
  // Defaults:
  // - Production: $UPLOADS_DIR if set, otherwise $HOME/valisemaroc_uploads (persistent across redeploys on most hosts)
  // - Dev: ./uploads
  const env = process.env.UPLOADS_DIR;
  if (env && env.trim().length) return env.trim();
  if (process.env.NODE_ENV === "production") {
    const home = process.env.HOME || "";
    if (home) return path.join(home, "valisemaroc_uploads");
  }
  return path.join(process.cwd(), "uploads");
}

export async function ensureUploadsDir() {
  let dir = getUploadsDir();

  // Prefer a persistent home-directory path in production if UPLOADS_DIR wasn't provided.
  if ((!process.env.UPLOADS_DIR || !process.env.UPLOADS_DIR.trim().length) && process.env.NODE_ENV === "production") {
    const home = process.env.HOME || "";
    if (home) dir = path.join(home, "valisemaroc_uploads");
  }

  await mkdir(dir, { recursive: true });

  // Verify write permissions (helps debug Hostinger deployments).
  const probePath = path.join(dir, ".__write_test");
  try {
    await writeFile(probePath, "ok");
    await unlink(probePath);
  } catch (err) {
    console.error("[uploads] write permission check failed", { dir, err });
    throw err;
  }

  return dir;
}

export function safeUploadsFilename(input: string) {
  // Prevent path traversal and keep filenames simple.
  const base = path.basename(input);
  // Allow only alnum, dash, underscore, dot.
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "");
  return cleaned;
}
