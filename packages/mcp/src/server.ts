import { createRequire } from "module";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AirApi } from "@air/api-rest";
import { registerAllTools } from "./tools/index.js";
import { registerWorkspaceTools } from "./workspace-tools.js";
import type { WorkspaceSession } from "./workspace.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

export function createServer(client: AirApi, session: WorkspaceSession): McpServer {
  const server = new McpServer({
    name: "air",
    version,
  });

  registerWorkspaceTools(server, session);
  registerAllTools(server, client, session);

  return server;
}
