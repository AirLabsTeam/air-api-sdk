import type { AirApi } from "@air/api-rest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WorkspaceSession } from "../workspace.js";
import { registerAssetTools } from "./assets.js";
import { registerBoardTools } from "./boards.js";
import { registerCustomFieldTools } from "./custom-fields.js";
import { registerImportTools } from "./imports.js";
import { registerTagTools } from "./tags.js";
import { registerUploadTools } from "./uploads.js";

export function registerAllTools(
  server: McpServer,
  client: AirApi,
  session: WorkspaceSession,
): void {
  registerAssetTools(server, client, session);
  registerBoardTools(server, client, session);
  registerTagTools(server, client, session);
  registerCustomFieldTools(server, client, session);
  registerImportTools(server, client, session);
  registerUploadTools(server, client, session);
}
