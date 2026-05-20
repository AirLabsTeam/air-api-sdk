import { z } from "zod";
import type { AirApi } from "@air/api-rest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WorkspaceSession } from "../workspace.js";
import { handleToolError } from "../utils/errors.js";
export function registerTagTools(server: McpServer, client: AirApi, session: WorkspaceSession) {
  server.registerTool(
    "list_tags",
    {
      description: "List tags in the workspace, optionally filtered by name",
      inputSchema: {
        name: z.string().optional().describe("Filter tags by name"),
        limit: z.number().optional().describe("Max results per page"),
        cursor: z.string().optional().describe("Pagination cursor"),
      },
    },
    async ({ name, limit, cursor }, _extra) => {
      try {
        const page = await client.tags.list({ name, limit, cursor }, session.context());
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
    "create_tag",
    {
      description: "Create a new tag in the workspace",
      inputSchema: {
        name: z.string().describe("The tag name"),
      },
    },
    async ({ name }, _extra) => {
      try {
        const tag = await client.tags.create({ name }, session.context());
        return {
          content: [{ type: "text", text: JSON.stringify(tag, null, 2) }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
}
