import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WorkspaceSession } from "./workspace.js";
import { WorkspaceRequiredError } from "./workspace.js";

export function registerWorkspaceTools(server: McpServer, session: WorkspaceSession): void {
  server.registerTool(
    "get_workspace",
    {
      description:
        "Return the active Air workspace ID for this MCP session. The workspace may come from AIR_WORKSPACE_ID (env or project .env) or from set_workspace.",
      inputSchema: {},
    },
    async () => {
      try {
        const workspaceId = session.requireWorkspaceId();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ workspaceId }, null, 2),
            },
          ],
        };
      } catch (error) {
        if (error instanceof WorkspaceRequiredError) {
          return {
            isError: true,
            content: [{ type: "text", text: error.message }],
          };
        }
        throw error;
      }
    },
  );

  server.registerTool(
    "set_workspace",
    {
      description:
        "Set the active Air workspace ID for subsequent tool calls in this MCP session. Use when AIR_WORKSPACE_ID is not configured or when switching workspaces.",
      inputSchema: {
        workspaceId: z.string().describe("The Air workspace ID (UUID)"),
      },
    },
    async ({ workspaceId }) => {
      session.setActiveWorkspaceId(workspaceId);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ workspaceId, message: "Active workspace updated." }, null, 2),
          },
        ],
      };
    },
  );
}
