import { z } from "zod";
import type { AirApi } from "@air/api-rest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WorkspaceSession } from "../workspace.js";
import { handleToolError } from "../utils/errors.js";
import { buildAssetUrl, getAssetUrl } from "../utils/urls.js";
export function registerImportTools(server: McpServer, client: AirApi, session: WorkspaceSession) {
  server.registerTool(
    "create_import",
    {
      description:
        "Import an asset into Air from a source URL. Returns an import task ID, asset ID, version ID, and a canonical `url` for the asset in the Air webapp. Use get_import_status to poll for completion. Always use the returned `url` field \u2014 never construct Air URLs manually.",
      inputSchema: {
        sourceUrl: z.string().describe("The URL to import the asset from"),
        fileName: z.string().optional().describe("Desired file name without extension"),
        ext: z.string().optional().describe("File extension without the dot, e.g. mp4"),
        recordedAt: z.string().optional().describe("ISO 8601 date string"),
        parentBoardId: z.string().optional().describe("UUID of the board to place the asset in"),
        assetId: z
          .string()
          .optional()
          .describe("Existing asset UUID to add this import as a new version"),
        description: z.string().optional().describe("Asset description"),
        title: z.string().optional().describe("Asset title"),
        customFields: z
          .array(
            z.object({
              id: z.string(),
              value: z.string().nullable().optional(),
              values: z
                .array(z.object({ id: z.string() }))
                .nullable()
                .optional(),
            }),
          )
          .nullable()
          .optional()
          .describe("Custom field values to set on the asset"),
        tags: z
          .array(z.object({ id: z.string() }))
          .nullable()
          .optional()
          .describe("Tags to apply to the asset"),
      },
    },
    async (
      {
        sourceUrl,
        fileName,
        ext,
        recordedAt,
        parentBoardId,
        assetId,
        description,
        title,
        customFields,
        tags,
      },
      _extra,
    ) => {
      try {
        const result = await client.imports.create(
          {
            sourceUrl,
            fileName,
            ext,
            recordedAt,
            parentBoardId,
            assetId,
            description,
            title,
            customFields,
            tags,
          },
          session.context(),
        );
        let url;
        if (parentBoardId) {
          const boards = await client.boards.get(parentBoardId, session.context());
          url = buildAssetUrl(result.versionId, { id: boards.id, title: boards.title });
        } else {
          url = await getAssetUrl(client, session, result.assetId, result.versionId);
        }
        return {
          content: [{ type: "text", text: JSON.stringify({ ...result, url }, null, 2) }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
  server.registerTool(
    "get_import_status",
    {
      description:
        "Check the status of an import task. Status will be one of: pending, inProgress, succeeded, failed. If failed, an error object with type and message is included.",
      inputSchema: {
        importId: z.string().describe("The import task ID returned by create_import"),
      },
    },
    async ({ importId }, _extra) => {
      try {
        const result = await client.imports.getStatus(importId, session.context());
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
}
