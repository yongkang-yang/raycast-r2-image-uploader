# R2 Image Uploader

Raycast extension that uploads screenshots and images straight to a
Cloudflare R2 bucket and copies the link back to your clipboard.

## Commands

- **Capture & Upload** — runs the native macOS interactive screenshot
  (`screencapture -i`), uploads the result to R2, and copies the link.
  Bind it to a hotkey (e.g. `⌥⇧4`) for a screenshot → clipboard-link flow
  with no browser in between.
- **Upload Image** — a form to pick one or more local image files, choose
  the output format, and optionally name the upload.
- **Upload Finder Selection** — uploads whatever image files are currently
  selected in Finder.

## Setup

1. Create an R2 bucket and an S3 API token (Access Key ID + Secret Access
   Key) with write access to it, in the Cloudflare dashboard.
2. Bind a custom domain to the bucket (recommended over the `r2.dev` URL)
   and use it as the **Public Base URL** preference.
3. Fill in the extension preferences: Account ID, Bucket, Access Key ID,
   Secret Access Key, Public Base URL, and your default copy format
   (URL / Markdown / HTML / Markdown with filename).

Credentials are stored locally by Raycast and only used to talk to the R2
S3-compatible API directly — no intermediary server.

## Object keys

Uploads are stored as `yyyy/mm/<slug-or-name>-<hash>.<ext>`, e.g.
`2026/09/survey2-team-list-a8f31c.png`. The trailing hash avoids name
collisions; the slug is optional and only applies to single-file uploads.
