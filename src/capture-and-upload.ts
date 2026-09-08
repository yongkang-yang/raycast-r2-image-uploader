import { execFile } from "child_process";
import { randomBytes } from "crypto";
import { access, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { promisify } from "util";
import { Clipboard, showHUD, showToast, Toast } from "@raycast/api";
import { formatOutput } from "./lib/format";
import { loadPreferences, createR2Client } from "./lib/r2";
import { uploadFile } from "./lib/upload";

const execFileAsync = promisify(execFile);

export default async function CaptureAndUpload() {
  // Fail fast on missing preferences before opening the screenshot crosshair.
  let preferences;
  try {
    preferences = loadPreferences();
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "R2 Not Configured",
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  const tmpPath = join(tmpdir(), `r2-upload-${randomBytes(4).toString("hex")}.png`);
  // -i: interactive region/window selection, matching the native macOS shortcut.
  await execFileAsync("/usr/sbin/screencapture", ["-i", tmpPath]);

  const captured = await access(tmpPath)
    .then(() => true)
    .catch(() => false);
  if (!captured) return; // User pressed Escape; nothing to do.

  await showToast({ style: Toast.Style.Animated, title: "Uploading…" });
  try {
    const client = createR2Client(preferences);
    const result = await uploadFile(client, preferences, tmpPath);
    const text = formatOutput(preferences.defaultFormat, result.url, result.filename);
    await Clipboard.copy(text);
    await showHUD(`Copied ${labelFor(preferences.defaultFormat)} link`);
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Upload Failed",
      message: error instanceof Error ? error.message : String(error),
    });
  } finally {
    await unlink(tmpPath).catch(() => undefined);
  }
}

function labelFor(format: string): string {
  switch (format) {
    case "markdown":
    case "markdown-filename":
      return "Markdown";
    case "html":
      return "HTML";
    default:
      return "URL";
  }
}
