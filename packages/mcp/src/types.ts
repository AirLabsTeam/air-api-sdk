import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

/** MCP tool result content blocks supported by this server. */
export type ToolContentBlock = CallToolResult["content"][number];

export type ImgixSize = keyof typeof IMGIX_PARAMS;

export const IMGIX_PARAMS = {
  thumbnail: "w=200&auto=compress,format",
  preview: "w=800&auto=compress,format",
} as const;

const EXT_TO_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
};

export function mimeTypeFromImageUrl(imageUrl: string, contentType: string | null): string {
  let mimeType = contentType?.split(";")[0]?.trim() ?? "image/jpeg";
  if (!mimeType.startsWith("image/")) {
    const ext = imageUrl.split(".").pop()?.split("?")[0]?.toLowerCase() ?? "";
    mimeType = EXT_TO_MIME[ext] ?? "image/jpeg";
  }
  return mimeType;
}

export function textContent(text: string): ToolContentBlock {
  return { type: "text", text };
}
