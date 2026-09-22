import { useEffect, useState } from "react";
import {
  Clipboard,
  getPreferenceValues,
  Icon,
  launchCommand,
  LaunchType,
  MenuBarExtra,
  openExtensionPreferences,
  showHUD,
} from "@raycast/api";
import { formatOutput, labelFor, type OutputFormat } from "./lib/format";
import { loadLastUpload, type LastUpload } from "./lib/recent";

const COMMANDS = [
  { name: "capture-and-upload", title: "Capture & Upload", icon: Icon.Camera },
  { name: "upload-clipboard", title: "Upload Clipboard Image", icon: Icon.Clipboard },
  { name: "upload-image", title: "Upload Image…", icon: Icon.Image },
  { name: "upload-finder-selection", title: "Upload Finder Selection", icon: Icon.Finder },
] as const;

export default function Command() {
  const preferences = getPreferenceValues<Record<string, string>>();
  const configured = Boolean(
    preferences.accountId &&
    preferences.bucket &&
    preferences.accessKeyId &&
    preferences.secretAccessKey &&
    preferences.publicBaseUrl,
  );
  const format = (preferences.defaultFormat as OutputFormat) || "markdown";
  const [lastUpload, setLastUpload] = useState<LastUpload>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    loadLastUpload()
      .then((value) => {
        if (active) setLastUpload(value);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function copyLastLink() {
    if (!lastUpload) return;
    await Clipboard.copy(formatOutput(format, lastUpload.url, lastUpload.filename));
    await showHUD(`Copied ${labelFor(format)} link`);
  }

  async function runCommand(name: string) {
    try {
      await launchCommand({ name, type: LaunchType.UserInitiated });
    } catch {
      await showHUD("Unable to open command");
    }
  }

  return (
    <MenuBarExtra
      icon={{ source: { light: "cloudflare-icon-dark.png", dark: "cloudflare-icon-light.png" } }}
      tooltip="R2 Image Uploader"
      isLoading={loading}
    >
      {!configured && (
        <MenuBarExtra.Section>
          <MenuBarExtra.Item
            title="Configure R2 Preferences…"
            icon={Icon.ExclamationMark}
            onAction={openExtensionPreferences}
          />
        </MenuBarExtra.Section>
      )}
      <MenuBarExtra.Section title="Last Upload">
        {lastUpload ? (
          <MenuBarExtra.Item
            title={lastUpload.filename}
            subtitle={`Copy ${labelFor(format)} Link`}
            icon={{ source: lastUpload.url, fallback: Icon.Image }}
            onAction={copyLastLink}
          />
        ) : (
          <MenuBarExtra.Item title="No Uploads Yet" />
        )}
        {lastUpload && (
          <MenuBarExtra.Item
            title="Preview Last Upload"
            icon={Icon.Eye}
            onAction={() => runCommand("show-last-upload")}
          />
        )}
      </MenuBarExtra.Section>
      <MenuBarExtra.Section title="Upload">
        {COMMANDS.map((command) => (
          <MenuBarExtra.Item
            key={command.name}
            title={command.title}
            icon={command.icon}
            onAction={() => runCommand(command.name)}
          />
        ))}
      </MenuBarExtra.Section>
      <MenuBarExtra.Section>
        <MenuBarExtra.Item title="Configure Preferences…" icon={Icon.Gear} onAction={openExtensionPreferences} />
      </MenuBarExtra.Section>
    </MenuBarExtra>
  );
}
