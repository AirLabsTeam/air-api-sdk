import { z } from "zod";
import type { AirApi } from "@air/api-rest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WorkspaceSession } from "../workspace.js";
import { handleToolError } from "../utils/errors.js";
import { buildAssetUrl, buildBoardUrl, getAssetUrl } from "../utils/urls.js";
import { z as z2 } from "zod";
export function registerBoardTools(server: McpServer, client: AirApi, session: WorkspaceSession) {
  server.registerTool(
    "list_boards",
    {
      description: "List boards in the workspace, optionally filtered by name or parent board. IMPORTANT: Never construct Air webapp URLs from board IDs. To get a link to a board, use the get_board tool which returns a canonical `url` field.",
      inputSchema: {
        name: z2.string().optional().describe("Filter boards by name"),
        parentBoardId: z2.string().optional().describe("Filter by parent board ID"),
        limit: z2.number().optional().describe("Max results per page"),
        cursor: z2.string().optional().describe("Pagination cursor")
      }
    },
    async ({ name, parentBoardId, limit, cursor }) => {
      try {
        const page = await client.boards.list({ name, parentBoardId, limit, cursor }, session.context());
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { data: page.data, pagination: page.pagination, total: page.total },
                null,
                2
              )
            }
          ]
        };
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
  server.registerTool(
    "get_board",
    {
      description: "Get detailed information about a specific board. The response includes a `url` field with the canonical Air webapp link.",
      inputSchema: {
        boardId: z2.string().describe("The board ID")
      }
    },
    async ({ boardId }) => {
      try {
        const board = await client.boards.get(boardId, session.context());
        const url = buildBoardUrl(board.id, board.title);
        return {
          content: [{ type: "text", text: JSON.stringify({ ...board, url }, null, 2) }]
        };
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
  server.registerTool(
    "create_board",
    {
      description: "Create a new board in the workspace",
      inputSchema: {
        title: z2.string().describe("The board title"),
        description: z2.string().optional().describe("The board description"),
        parentBoardId: z2.string().optional().describe("Parent board ID to create this board under")
      }
    },
    async ({ title, description, parentBoardId }) => {
      try {
        const board = await client.boards.create({ title, description, parentBoardId }, session.context());
        const url = buildBoardUrl(board.id, board.title);
        return {
          content: [{ type: "text", text: JSON.stringify({ ...board, url }, null, 2) }]
        };
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
  server.registerTool(
    "update_board",
    {
      description: "Update mutable fields on a board: title, description, and/or parent board.",
      inputSchema: {
        boardId: z2.string().describe("The board ID"),
        title: z2.string().optional().describe("New board title"),
        description: z2.string().optional().describe("New description"),
        parentBoardId: z2.string().nullable().optional().describe("New parent board ID (pass null to move to root)")
      }
    },
    async ({ boardId, title, description, parentBoardId }) => {
      try {
        await client.boards.update(boardId, { title, description, parentBoardId }, session.context());
        return {
          content: [{ type: "text", text: `Board updated` }]
        };
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
  server.registerTool(
    "add_asset_to_board",
    {
      description: "Add one or more assets to a board",
      inputSchema: {
        boardId: z2.string().describe("The board ID"),
        assetIds: z2.array(z2.string()).describe("Array of asset IDs to add to the board")
      }
    },
    async ({ boardId, assetIds }) => {
      try {
        await client.boards.addAssets(boardId, { assetIds }, session.context());
        return {
          content: [{ type: "text", text: `Added ${assetIds.length} asset(s) to board` }]
        };
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
