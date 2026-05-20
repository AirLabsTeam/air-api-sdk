import { z } from "zod";
import type { AirApi } from "@air/api-rest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WorkspaceSession } from "../workspace.js";
import { handleToolError } from "../utils/errors.js";
import { getAssetUrl } from "../utils/urls.js";
const IMGIX_PARAMS = {
  thumbnail: "w=200&auto=compress,format",
  preview: "w=800&auto=compress,format",
};
function isAllowedImageUrl(url) {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname.endsWith(".imgix.net") || parsed.hostname.endsWith(".air.inc"))
    );
  } catch {
    return false;
  }
}
function withImgixResize(url, size) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${IMGIX_PARAMS[size]}`;
}
async function fetchThumbnail(client: AirApi, session: WorkspaceSession, assetId, size) {
  try {
    const asset = await client.assets.get(assetId, session.context());
    const urls = asset.coverVersion?.urls;
    const resolvedSize = size ?? "thumbnail";
    const preferred = resolvedSize === "preview" ? "preview" : "thumbnail";
    const fallback = preferred === "thumbnail" ? "preview" : "thumbnail";
    const rawUrl = urls?.[preferred] ?? urls?.[fallback];
    if (!rawUrl) return null;
    const imageUrl = withImgixResize(rawUrl, resolvedSize);
    if (!isAllowedImageUrl(imageUrl)) return null;
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type");
    let mimeType = contentType?.split(";")[0]?.trim() ?? "image/jpeg";
    if (!mimeType.startsWith("image/")) {
      const ext = imageUrl.split(".").pop()?.split("?")[0]?.toLowerCase();
      const extMap = {
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        gif: "image/gif",
        webp: "image/webp",
        svg: "image/svg+xml",
      };
      mimeType = extMap[ext ?? ""] ?? "image/jpeg";
    }
    const arrayBuffer = await response.arrayBuffer();
    const data = Buffer.from(arrayBuffer).toString("base64");
    return { assetId, data, mimeType };
  } catch (err) {
    console.error(`[air-mcp] fetchThumbnail failed for asset ${assetId}:`, err);
    return null;
  }
}
export function registerAssetTools(server: McpServer, client: AirApi, session: WorkspaceSession) {
  server.registerTool(
    "list_assets",
    {
      description:
        "List assets in the workspace, optionally filtered by board, tags, search query, or date range. IMPORTANT: Never construct Air webapp URLs from asset IDs. To get a link to an asset, use the get_asset tool which returns a canonical `url` field.",
      inputSchema: {
        parentBoardId: z.string().optional().describe("Filter by parent board ID"),
        includeNestedAssets: z
          .boolean()
          .optional()
          .describe("Include assets from nested sub-boards"),
        tag: z
          .union([z.string(), z.array(z.string())])
          .optional()
          .describe("Filter by tag name(s)"),
        customField: z
          .union([z.string(), z.array(z.string())])
          .optional()
          .describe("Filter by custom field value(s)"),
        search: z.string().optional().describe("Search query to filter assets"),
        limit: z.number().optional().describe("Max results per page (default 50)"),
        cursor: z.string().optional().describe("Pagination cursor from a previous response"),
        includeThumbnails: z
          .boolean()
          .optional()
          .describe(
            "Include inline thumbnail images as image content blocks in the response (max 10). Images render inline in supported MCP clients.",
          ),
      },
    },
    async ({
      parentBoardId,
      includeNestedAssets,
      tag,
      customField,
      search,
      limit,
      cursor,
      includeThumbnails,
    }) => {
      try {
        const page = await client.assets.list(
          {
            parentBoardId,
            includeNestedAssets,
            tag,
            customField,
            search,
            limit,
            cursor,
          },
          session.context(),
        );
        const content = [
          {
            type: "text",
            text: JSON.stringify(
              { data: page.data, pagination: page.pagination, total: page.total },
              null,
              2,
            ),
          },
        ];
        if (includeThumbnails && page.data.length > 0) {
          const assetsToFetch = page.data.slice(0, 10);
          const thumbnails = await Promise.all(
            assetsToFetch.map((asset) => fetchThumbnail(client, session, asset.id)),
          );
          for (const thumb of thumbnails) {
            if (thumb) {
              content.push(
                { type: "text", text: `Thumbnail for asset ${thumb.assetId}:` },
                { type: "image", data: thumb.data, mimeType: thumb.mimeType },
              );
            }
          }
        }
        return { content };
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
  server.registerTool(
    "list_nested_assets",
    {
      description:
        "List all assets within a board and all of its nested sub-boards. IMPORTANT: Never construct Air webapp URLs from asset IDs. To get a link to an asset, use the get_asset tool which returns a canonical `url` field.",
      inputSchema: {
        boardId: z
          .string()
          .describe("The board ID to list assets from (includes all nested sub-boards)"),
        limit: z.number().optional().describe("Max results per page (default 50)"),
        cursor: z.string().optional().describe("Pagination cursor from a previous response"),
        includeThumbnails: z
          .boolean()
          .optional()
          .describe(
            "Include inline thumbnail images as image content blocks in the response (max 10). Images render inline in supported MCP clients.",
          ),
      },
    },
    async ({ boardId, limit, cursor, includeThumbnails }) => {
      try {
        const page = await client.assets.list(
          {
            parentBoardId: boardId,
            includeNestedAssets: true,
            limit,
            cursor,
          },
          session.context(),
        );
        const content = [
          {
            type: "text",
            text: JSON.stringify(
              { data: page.data, pagination: page.pagination, total: page.total },
              null,
              2,
            ),
          },
        ];
        if (includeThumbnails && page.data.length > 0) {
          const assetsToFetch = page.data.slice(0, 10);
          const thumbnails = await Promise.all(
            assetsToFetch.map((asset) => fetchThumbnail(client, session, asset.id)),
          );
          for (const thumb of thumbnails) {
            if (thumb) {
              content.push(
                { type: "text", text: `Thumbnail for asset ${thumb.assetId}:` },
                { type: "image", data: thumb.data, mimeType: thumb.mimeType },
              );
            }
          }
        }
        return { content };
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
  server.registerTool(
    "get_asset",
    {
      description:
        "Get detailed information about a specific asset including its cover version, custom fields, and metadata. The response includes a `url` field with the canonical Air webapp link \u2014 always use this instead of constructing URLs manually.",
      inputSchema: {
        assetId: z.string().describe("The asset ID"),
      },
    },
    async ({ assetId }) => {
      try {
        const asset = await client.assets.get(assetId, session.context());
        const url = await getAssetUrl(client, session, asset.id, asset.coverVersion.id);
        return {
          content: [{ type: "text", text: JSON.stringify({ ...asset, url }, null, 2) }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
  server.registerTool(
    "get_asset_download_url",
    {
      description:
        "Get a temporary download URL for a specific asset version. If versionId is not provided, uses the cover version.",
      inputSchema: {
        assetId: z.string().describe("The asset ID"),
        versionId: z.string().optional().describe("The version ID (defaults to cover version)"),
      },
    },
    async ({ assetId, versionId }) => {
      try {
        if (!versionId) {
          const asset = await client.assets.get(assetId, session.context());
          versionId = asset.coverVersion.id;
        }
        const result = await client.assets.getVersionDownloadUrl(
          assetId,
          versionId,
          session.context(),
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
  server.registerTool(
    "get_asset_boards",
    {
      description: "List all boards that contain a specific asset",
      inputSchema: {
        assetId: z.string().describe("The asset ID"),
        limit: z.number().optional().describe("Max results per page"),
        cursor: z.string().optional().describe("Pagination cursor"),
      },
    },
    async ({ assetId, limit, cursor }) => {
      try {
        const page = await client.assets.listBoards(assetId, { limit, cursor }, session.context());
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { data: page.data, pagination: page.pagination, total: page.total },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
  server.registerTool(
    "rename_asset",
    {
      description:
        "Rename an asset by updating its display title only. To update description as well, use update_asset instead. Optionally provide a versionId to target a specific version.",
      inputSchema: {
        assetId: z.string().describe("The asset ID"),
        title: z.string().describe("The new title for the asset"),
        versionId: z.string().optional().describe("The version ID (defaults to cover version)"),
      },
    },
    async ({ assetId, title, versionId }) => {
      try {
        if (!versionId) {
          const asset = await client.assets.get(assetId, session.context());
          versionId = asset.coverVersion.id;
        }
        await client.assets.updateVersion(assetId, versionId, { title }, session.context());
        return {
          content: [{ type: "text", text: `Asset renamed to "${title}"` }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
  server.registerTool(
    "update_asset",
    {
      description:
        "Update mutable fields on an asset's cover version: display title and/or description. Note: only the display title is updated \u2014 the underlying fileName is not changed. Optionally provide a versionId to target a specific version.",
      inputSchema: {
        assetId: z.string().describe("The asset ID"),
        title: z.string().optional().describe("New display title"),
        description: z.string().optional().describe("New description"),
        versionId: z.string().optional().describe("Version ID (defaults to cover version)"),
      },
    },
    async ({ assetId, title, description, versionId }) => {
      try {
        if (!versionId) {
          const asset = await client.assets.get(assetId, session.context());
          versionId = asset.coverVersion.id;
        }
        await client.assets.updateVersion(
          assetId,
          versionId,
          { title, description },
          session.context(),
        );
        return {
          content: [{ type: "text", text: `Asset updated` }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
  server.registerTool(
    "add_tag_to_asset",
    {
      description:
        "Add a tag to an asset version. If versionId is not provided, uses the cover version.",
      inputSchema: {
        assetId: z.string().describe("The asset ID"),
        tagId: z.string().describe("The tag ID to add"),
        versionId: z.string().optional().describe("The version ID (defaults to cover version)"),
      },
    },
    async ({ assetId, tagId, versionId }) => {
      try {
        if (!versionId) {
          const asset = await client.assets.get(assetId, session.context());
          versionId = asset.coverVersion.id;
        }
        await client.assets.addVersionTag(assetId, versionId, { id: tagId }, session.context());
        return {
          content: [{ type: "text", text: `Tag added to asset` }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
  server.registerTool(
    "remove_tag_from_asset",
    {
      description:
        "Remove a tag from an asset version. If versionId is not provided, uses the cover version.",
      inputSchema: {
        assetId: z.string().describe("The asset ID"),
        tagId: z.string().describe("The tag ID to remove"),
        versionId: z.string().optional().describe("The version ID (defaults to cover version)"),
      },
    },
    async ({ assetId, tagId, versionId }) => {
      try {
        if (!versionId) {
          const asset = await client.assets.get(assetId, session.context());
          versionId = asset.coverVersion.id;
        }
        await client.assets.removeVersionTag(assetId, versionId, tagId, session.context());
        return {
          content: [{ type: "text", text: `Tag removed from asset` }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
  server.registerTool(
    "get_asset_image",
    {
      description:
        "Get an inline image preview of an asset. Returns the image as base64-encoded image content that MCP clients can render directly.",
      inputSchema: {
        assetId: z.string().describe("The asset ID"),
        size: z
          .enum(["thumbnail", "preview"])
          .optional()
          .describe(
            'Image size: "thumbnail" (small) or "preview" (larger). Defaults to "thumbnail".',
          ),
      },
    },
    async ({ assetId, size }) => {
      try {
        const asset = await client.assets.get(assetId, session.context());
        const urls = asset.coverVersion?.urls;
        const resolvedSize = size ?? "thumbnail";
        const preferred = resolvedSize === "preview" ? "preview" : "thumbnail";
        const fallback = preferred === "thumbnail" ? "preview" : "thumbnail";
        const rawUrl = urls?.[preferred] ?? urls?.[fallback] ?? null;
        const imageUrl = rawUrl ? withImgixResize(rawUrl, resolvedSize) : null;
        const metadata = `Asset: ${asset.coverVersion?.title ?? asset.id} (${asset.id})`;
        if (!imageUrl) {
          return {
            content: [
              {
                type: "text",
                text: `${metadata}
No image URL available for this asset.`,
              },
            ],
          };
        }
        if (!isAllowedImageUrl(imageUrl)) {
          return {
            content: [
              {
                type: "text",
                text: `${metadata}
Image URL is not from a trusted domain.`,
              },
            ],
          };
        }
        try {
          const response = await fetch(imageUrl);
          if (!response.ok) {
            return {
              content: [
                {
                  type: "text",
                  text: `${metadata}
Failed to fetch image: HTTP ${response.status}`,
                },
              ],
            };
          }
          const contentType = response.headers.get("content-type");
          let mimeType = contentType?.split(";")[0]?.trim() ?? "image/jpeg";
          if (!mimeType.startsWith("image/")) {
            const ext = imageUrl.split(".").pop()?.split("?")[0]?.toLowerCase();
            const extMap = {
              png: "image/png",
              jpg: "image/jpeg",
              jpeg: "image/jpeg",
              gif: "image/gif",
              webp: "image/webp",
              svg: "image/svg+xml",
            };
            mimeType = extMap[ext ?? ""] ?? "image/jpeg";
          }
          const arrayBuffer = await response.arrayBuffer();
          const data = Buffer.from(arrayBuffer).toString("base64");
          return {
            content: [
              { type: "image", data, mimeType },
              { type: "text", text: metadata },
            ],
          };
        } catch (fetchError) {
          return {
            content: [
              {
                type: "text",
                text: `${metadata}
Failed to fetch image: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`,
              },
            ],
          };
        }
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
  server.registerTool(
    "update_asset_custom_field",
    {
      description:
        "Set a custom field value on an asset. For plain-text and date fields use `value`. For single-select and multi-select fields use `values` (array of option ID objects) \u2014 or pass the option ID via `value` and the field type will be auto-detected and converted.",
      inputSchema: {
        assetId: z.string().describe("The asset ID"),
        customFieldId: z.string().describe("The custom field ID"),
        value: z
          .string()
          .nullable()
          .optional()
          .describe(
            "Value for plain-text or date fields. For select fields, can pass the option ID here and it will be auto-converted.",
          ),
        values: z.preprocess(
          (v) => {
            if (typeof v === "string") {
              try {
                return JSON.parse(v);
              } catch {
                return v;
              }
            }
            return v;
          },
          z
            .array(z.object({ id: z.string().uuid("Expected option ID UUID") }))
            .nullable()
            .optional()
            .describe(
              "Option IDs for single-select or multi-select fields (array of {id} objects). Auto-detected from `value` if not provided.",
            ),
        ),
      },
    },
    async ({ assetId, customFieldId, value, values }) => {
      try {
        if (value !== void 0 && values !== void 0) {
          return {
            isError: true,
            content: [{ type: "text", text: "Provide either `value` or `values`, not both." }],
          };
        }
        const field = await client.customFields.get(customFieldId, session.context());
        if (field.type === "plain-text" || field.type === "date") {
          if (values !== void 0) {
            return {
              isError: true,
              content: [
                {
                  type: "text",
                  text: `Field type "${field.type}" requires \`value\`, not \`values\`.`,
                },
              ],
            };
          }
        }
        if (field.type === "single-select" || field.type === "multi-select") {
          if (values === void 0) {
            if (value === null) {
              values = null;
            } else if (value !== void 0) {
              if (Array.isArray(field.values)) {
                const validOption = field.values.find((v) => v.id === value);
                if (!validOption) {
                  const hint =
                    field.values.length > 0
                      ? field.values.map((v) => `${v.name} (${v.id})`).join(", ")
                      : "none";
                  return {
                    isError: true,
                    content: [
                      {
                        type: "text",
                        text: `Invalid option ID "${value}". Valid options: ${hint}`,
                      },
                    ],
                  };
                }
              }
              values = [{ id: value }];
            }
            value = void 0;
          }
        }
        await client.assets.setCustomField(
          assetId,
          customFieldId,
          { value, values },
          session.context(),
        );
        return {
          content: [{ type: "text", text: `Custom field updated` }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
}
