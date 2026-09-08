export type OutputFormat = "url" | "markdown" | "html" | "markdown-filename";

export function formatOutput(format: OutputFormat, url: string, filename: string): string {
  switch (format) {
    case "markdown":
      return `![](${url})`;
    case "html":
      return `<img src="${url}">`;
    case "markdown-filename":
      return `![${filename.replace(/\.[^.]+$/, "")}](${url})`;
    case "url":
    default:
      return url;
  }
}

export function labelFor(format: string): string {
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
