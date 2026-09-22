import { Action, ActionPanel, Detail, getPreferenceValues, Keyboard } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { formatOutput, labelFor, type OutputFormat } from "./lib/format";
import { loadLastUpload } from "./lib/recent";

export default function Command() {
  const preferences = getPreferenceValues<Record<string, string>>();
  const format = (preferences.defaultFormat as OutputFormat) || "markdown";
  const { data: lastUpload, isLoading } = usePromise(loadLastUpload);

  if (!lastUpload) {
    return <Detail isLoading={isLoading} markdown={isLoading ? "" : "No uploads yet."} />;
  }

  return (
    <Detail
      isLoading={isLoading}
      navigationTitle={lastUpload.filename}
      markdown={`![${lastUpload.filename}](${lastUpload.url})`}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Filename" text={lastUpload.filename} />
          <Detail.Metadata.Label title="Key" text={lastUpload.key} />
          <Detail.Metadata.Label title="Uploaded" text={new Date(lastUpload.uploadedAt).toLocaleString()} />
          <Detail.Metadata.Link title="URL" target={lastUpload.url} text={lastUpload.url} />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title={`Copy ${labelFor(format)} Link`}
            content={formatOutput(format, lastUpload.url, lastUpload.filename)}
          />
          <Action.OpenInBrowser url={lastUpload.url} />
          <Action.CopyToClipboard title="Copy URL" content={lastUpload.url} shortcut={Keyboard.Shortcut.Common.Copy} />
        </ActionPanel>
      }
    />
  );
}
