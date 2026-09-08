import { execFile } from "child_process";
import { randomBytes } from "crypto";
import { access, unlink } from "fs/promises";
import { tmpdir } from "os";
import { basename, join } from "path";
import { promisify } from "util";
import { fileURLToPath } from "url";
import { Clipboard } from "@raycast/api";

const execFileAsync = promisify(execFile);
const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "heic", "tiff", "bmp"]);

export type ClipboardImage = { path: string; originalName: string; cleanup: () => Promise<void> };

// Resolves whatever image is currently on the clipboard to a local file path.
// Two cases:
// 1. A copied file (e.g. Cmd+C on a Finder item) — Raycast's Clipboard API
//    exposes that directly as a file path.
// 2. Raw image data with no backing file — a screenshot copied to the
//    clipboard, or an image copied from a browser/app. Raycast's Clipboard
//    API doesn't expose raw pasteboard bytes, so this falls back to asking
//    the system pasteboard for a PNG/TIFF representation via AppleScript,
//    the same trick tools like pngpaste use.
export async function resolveClipboardImage(): Promise<ClipboardImage | null> {
  const { file } = await Clipboard.read();
  if (file) {
    const path = file.startsWith("file://") ? fileURLToPath(file) : file;
    const extension = path.match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase();
    const exists = await access(path)
      .then(() => true)
      .catch(() => false);
    if (extension && IMAGE_EXTENSIONS.has(extension) && exists) {
      return { path, originalName: basename(path), cleanup: async () => undefined };
    }
  }
  return readRawClipboardImage();
}

async function readRawClipboardImage(): Promise<ClipboardImage | null> {
  const tmpPath = join(tmpdir(), `r2-clip-${randomBytes(4).toString("hex")}`);
  const script = `
    set tmpFile to POSIX file "${tmpPath}"
    try
      set imgData to the clipboard as «class PNGf»
      set fmt to "png"
    on error
      try
        set imgData to the clipboard as «class TIFF»
        set fmt to "tiff"
      on error
        return "NONE"
      end try
    end try
    set fileRef to open for access tmpFile with write permission
    set eof fileRef to 0
    write imgData to fileRef
    close access fileRef
    return fmt
  `;
  const { stdout } = await execFileAsync("/usr/bin/osascript", ["-e", script]);
  const format = stdout.trim();
  if (format === "png") {
    return { path: tmpPath, originalName: "clipboard.png", cleanup: () => unlink(tmpPath).catch(() => undefined) };
  }
  if (format === "tiff") {
    const pngPath = `${tmpPath}.png`;
    await execFileAsync("/usr/bin/sips", ["-s", "format", "png", tmpPath, "--out", pngPath]);
    await unlink(tmpPath).catch(() => undefined);
    return { path: pngPath, originalName: "clipboard.png", cleanup: () => unlink(pngPath).catch(() => undefined) };
  }
  return null; // Clipboard has no image (text, nothing copied, etc.).
}
