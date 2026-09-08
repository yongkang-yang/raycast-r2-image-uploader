import { S3Client } from "@aws-sdk/client-s3";
import { getPreferenceValues } from "@raycast/api";

export type Preferences = {
  accountId: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl: string;
  defaultFormat: "url" | "markdown" | "html" | "markdown-filename";
};

export function loadPreferences(): Preferences {
  const preferences = getPreferenceValues<Preferences>();
  const missing = (["accountId", "bucket", "accessKeyId", "secretAccessKey", "publicBaseUrl"] as const).filter(
    (key) => !preferences[key]?.trim(),
  );
  if (missing.length)
    throw new Error(`Missing R2 preferences: ${missing.join(", ")}. Configure them in extension preferences.`);
  return preferences;
}

export function createR2Client(preferences: Preferences): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${preferences.accountId.trim()}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: preferences.accessKeyId.trim(),
      secretAccessKey: preferences.secretAccessKey.trim(),
    },
  });
}

export function publicUrlFor(preferences: Preferences, key: string): string {
  return `${preferences.publicBaseUrl.trim().replace(/\/+$/, "")}/${key}`;
}
