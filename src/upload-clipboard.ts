import { Clipboard, showHUD, showToast, Toast } from "@raycast/api";
import { resolveClipboardImage } from "./lib/clipboard-image";
import { formatOutput, labelFor } from "./lib/format";
import { loadPreferences, createR2Client } from "./lib/r2";
import { uploadFile } from "./lib/upload";

export default async function UploadClipboard() {
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

  const image = await resolveClipboardImage();
  if (!image) {
    await showToast({
      style: Toast.Style.Failure,
      title: "No Image on Clipboard",
      message: "Copy an image or a screenshot first.",
    });
    return;
  }

  await showToast({ style: Toast.Style.Animated, title: "Uploading…" });
  try {
    const client = createR2Client(preferences);
    const result = await uploadFile(client, preferences, image.path);
    // This overwrites the image that was just uploaded with its link —
    // that's the point: copy an image, run this, paste the link.
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
    await image.cleanup();
  }
}
