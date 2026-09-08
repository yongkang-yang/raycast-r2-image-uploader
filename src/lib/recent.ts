import { LocalStorage } from "@raycast/api";
import type { UploadResult } from "./upload";

const storageKey = "last-upload";

export type LastUpload = UploadResult & { uploadedAt: string };

export async function saveLastUpload(result: UploadResult): Promise<void> {
  const record: LastUpload = { ...result, uploadedAt: new Date().toISOString() };
  await LocalStorage.setItem(storageKey, JSON.stringify(record));
}

export async function loadLastUpload(): Promise<LastUpload | undefined> {
  const raw = await LocalStorage.getItem<string>(storageKey);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as LastUpload;
  } catch {
    return undefined;
  }
}
