import { Clipboard, getSelectedFinderItems, showHUD, showToast, Toast } from "@raycast/api";
import { formatOutput } from "./lib/format";
import { loadPreferences, createR2Client } from "./lib/r2";
import { uploadFile } from "./lib/upload";

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "heic", "tiff", "bmp"]);

export default async function UploadFinderSelection() {
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

  let items;
  try {
    items = await getSelectedFinderItems();
  } catch {
    await showToast({
      style: Toast.Style.Failure,
      title: "No Finder Selection",
      message: "Select images in Finder first.",
    });
    return;
  }
  const paths = items
    .map((item) => item.path)
    .filter((path) => IMAGE_EXTENSIONS.has((path.match(/\.([a-zA-Z0-9]+)$/)?.[1] ?? "").toLowerCase()));
  if (!paths.length) {
    await showToast({
      style: Toast.Style.Failure,
      title: "No Images Selected",
      message: "Select one or more image files in Finder.",
    });
    return;
  }

  await showToast({
    style: Toast.Style.Animated,
    title: `Uploading ${paths.length} image${paths.length > 1 ? "s" : ""}…`,
  });
  const client = createR2Client(preferences);
  const links: string[] = [];
  const failures: string[] = [];
  for (const path of paths) {
    try {
      const result = await uploadFile(client, preferences, path);
      links.push(formatOutput(preferences.defaultFormat, result.url, result.filename));
    } catch (error) {
      failures.push(`${path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (links.length) await Clipboard.copy(links.join("\n"));
  if (failures.length) {
    await showToast({
      style: Toast.Style.Failure,
      title: links.length ? `Uploaded ${links.length}, ${failures.length} Failed` : "Upload Failed",
      message: failures[0],
    });
    return;
  }
  await showHUD(`Copied ${links.length} link${links.length > 1 ? "s" : ""}`);
}
