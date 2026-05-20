import { z } from "zod";
import type { AirApi } from "@air/api-rest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WorkspaceSession } from "../workspace.js";
import { handleToolError } from "../utils/errors.js";
import { buildAssetUrl, getAssetUrl } from "../utils/urls.js";
export function registerUploadTools(server: McpServer, client: AirApi, session: WorkspaceSession) {
  server.registerTool(
    "upload_asset",
    {
      description:
        "Upload a local file to Air. Provide an absolute file path and the SDK handles the rest (detecting file type, choosing upload strategy). Returns an asset ID, version ID, and a canonical `url` for the asset in the Air webapp. Always use the returned `url` field \u2014 never construct Air URLs manually.",
      inputSchema: {
        filePath: z.string().describe("Absolute path to the local file to upload"),
        parentBoardId: z.string().optional().describe("UUID of the board to place the asset in"),
        assetId: z
          .string()
          .optional()
          .describe("Existing asset UUID to add this upload as a new version"),
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
    async ({ filePath, parentBoardId, assetId, customFields, tags }) => {
      try {
        const result = await client.uploads.uploadFile(
          { filePath },
          { parentBoardId, assetId, customFields, tags },
          session.context(),
        );
        let url;
        if (parentBoardId) {
          const board = await client.boards.get(parentBoardId, session.context());
          url = buildAssetUrl(result.versionId, { id: board.id, title: board.title });
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
}
