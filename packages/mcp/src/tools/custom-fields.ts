import { z } from "zod";
import type { AirApi } from "@air/api-rest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WorkspaceSession } from "../workspace.js";
import { handleToolError } from "../utils/errors.js";
export function registerCustomFieldTools(
  server: McpServer,
  client: AirApi,
  session: WorkspaceSession,
) {
  server.registerTool(
    "list_custom_fields",
    {
      description: "List custom fields defined in the workspace",
      inputSchema: {
        limit: z.number().optional().describe("Max results per page"),
        cursor: z.string().optional().describe("Pagination cursor"),
      },
    },
    async ({ limit, cursor }, _extra) => {
      try {
        const page = await client.customFields.list({ limit, cursor }, session.context());
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
    "get_custom_field",
    {
      description:
        "Get detailed information about a specific custom field, including its type and possible values",
      inputSchema: {
        customFieldId: z.string().describe("The custom field ID"),
      },
    },
    async ({ customFieldId }, _extra) => {
      try {
        const customField = await client.customFields.get(customFieldId, session.context());
        return {
          content: [{ type: "text", text: JSON.stringify(customField, null, 2) }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
}
