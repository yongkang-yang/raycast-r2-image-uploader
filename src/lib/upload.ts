import { readFile } from "fs/promises";
import { basename } from "path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { buildKey, contentTypeForExtension } from "./filename";
import { publicUrlFor, type Preferences } from "./r2";
import { saveLastUpload } from "./recent";

export type UploadResult = { key: string; url: string; filename: string };

// Uploads one local file to R2 and returns its public URL. `slug` becomes
// part of the object key when provided; otherwise the original filename is
// slugified. Every successful upload, from any command, is recorded as the
// "last upload" for the menu bar's quick-copy item.
export async function uploadFile(
  client: S3Client,
  preferences: Preferences,
  filePath: string,
  slug?: string,
): Promise<UploadResult> {
  const filename = basename(filePath);
  const body = await readFile(filePath);
  const key = buildKey(filename, slug);
  const extension = key.match(/\.([a-zA-Z0-9]+)$/)?.[1] ?? "png";
  await client.send(
    new PutObjectCommand({
      Bucket: preferences.bucket.trim(),
      Key: key,
      Body: body,
      ContentType: contentTypeForExtension(extension),
    }),
  );
  const result = { key, url: publicUrlFor(preferences, key), filename };
  await saveLastUpload(result).catch(() => undefined);
  return result;
}
