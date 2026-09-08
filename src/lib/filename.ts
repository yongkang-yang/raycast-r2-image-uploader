import { randomBytes } from "crypto";

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/heic": "heic",
  "image/tiff": "tiff",
  "image/bmp": "bmp",
};

export function contentTypeForExtension(extension: string): string {
  const ext = extension.replace(/^\./, "").toLowerCase();
  const entry = Object.entries(EXTENSION_BY_MIME).find(([, value]) => value === ext);
  if (entry) return entry[0];
  if (ext === "jpeg") return "image/jpeg";
  return "application/octet-stream";
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// Builds an R2 object key like "2026/09/survey2-team-list-a8f31c.png". The
// trailing hash keeps re-uploads and repeated slugs from colliding.
export function buildKey(originalName: string, slug?: string): string {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const extMatch = originalName.match(/\.([a-zA-Z0-9]+)$/);
  const extension = (extMatch?.[1] ?? "png").toLowerCase();
  const hash = randomBytes(3).toString("hex");
  const base = slug ? slugify(slug) : slugify(originalName.replace(/\.[^.]+$/, ""));
  const name = base ? `${base}-${hash}` : hash;
  return `${year}/${month}/${name}.${extension}`;
}
