import { useState } from "react";
import { Action, ActionPanel, Clipboard, Form, showHUD, showToast, Toast } from "@raycast/api";
import { formatOutput, type OutputFormat } from "./lib/format";
import { loadPreferences, createR2Client, type Preferences } from "./lib/r2";
import { uploadFile } from "./lib/upload";

type FormValues = { files: string[]; format: OutputFormat; slug: string };

export default function UploadImage() {
  const [isLoading, setIsLoading] = useState(false);
  let preferences: Preferences | undefined;
  let preferencesError: string | undefined;
  try {
    preferences = loadPreferences();
  } catch (error) {
    preferencesError = error instanceof Error ? error.message : String(error);
  }

  async function handleSubmit(values: FormValues) {
    if (!preferences) return;
    if (!values.files.length) {
      await showToast({ style: Toast.Style.Failure, title: "Choose at Least One Image" });
      return;
    }
    setIsLoading(true);
    try {
      const client = createR2Client(preferences);
      const links: string[] = [];
      const failures: string[] = [];
      // A slug only makes sense for a single file; with multiple files each
      // keeps its own name so links stay distinguishable.
      const slug = values.files.length === 1 ? values.slug.trim() || undefined : undefined;
      for (const path of values.files) {
        try {
          const result = await uploadFile(client, preferences, path, slug);
          links.push(formatOutput(values.format, result.url, result.filename));
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
    } finally {
      setIsLoading(false);
    }
  }

  if (preferencesError) {
    return (
      <Form>
        <Form.Description title="R2 Not Configured" text={preferencesError} />
      </Form>
    );
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Upload" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.FilePicker id="files" title="Files" allowMultipleSelection canChooseDirectories={false} canChooseFiles />
      <Form.Dropdown id="format" title="Output Format" defaultValue={preferences?.defaultFormat}>
        <Form.Dropdown.Item value="url" title="URL" />
        <Form.Dropdown.Item value="markdown" title="Markdown" />
        <Form.Dropdown.Item value="html" title="HTML" />
        <Form.Dropdown.Item value="markdown-filename" title="Markdown with Filename" />
      </Form.Dropdown>
      <Form.TextField id="slug" title="Name" placeholder="auto (only used for a single file)" />
    </Form>
  );
}
