import { createRequire } from "module";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer as createHttpServer } from "http";
import { randomUUID } from "crypto";
import { AirApi } from "@air/api-rest";
import { createServer } from "./server.js";
import { loadProjectEnv, resolveWorkspaceId, WorkspaceSession } from "./workspace.js";

const [major] = process.versions.node.split(".").map(Number);
if (major < 18) {
  console.error(
    `Error: @air/mcp requires Node.js >= 18 (current: ${process.version}). Please update Node.js or ensure your MCP client is configured to use a supported version.`,
  );
  process.exit(1);
}

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

const args = process.argv.slice(2);
const httpMode = args.includes("--http");

// Workspace-aware: load project .env before resolving workspace (STDIO / Cursor project roots).
if (!httpMode) {
  loadProjectEnv();
}

const apiKey = process.env.AIR_API_KEY;
const apiUrl = process.env.AIR_API_URL;
const workspaceId = resolveWorkspaceId();

if (!apiKey) {
  console.error("Error: AIR_API_KEY environment variable is required");
  process.exit(1);
}

if (httpMode && !workspaceId) {
  console.error(
    "Error: AIR_WORKSPACE_ID is required for HTTP mode. Set it in the environment or project .env file.",
  );
  process.exit(1);
}

const defaultHeaders = {
  "user-agent": `air-mcp/${version}`,
  "x-air-client-source": "mcp",
};

const session = new WorkspaceSession(workspaceId);
const client = new AirApi({
  apiKey,
  workspaceId,
  baseURL: apiUrl,
  defaultHeaders,
});

const portIndex = args.indexOf("--port");
const port = portIndex !== -1 ? parseInt(args[portIndex + 1], 10) : 3000;

if (httpMode) {
  const sessions = new Map<string, StreamableHTTPServerTransport>();
  const debug = args.includes("--debug");
  const httpServer = createHttpServer(async (req, res) => {
    if (req.url !== "/mcp") {
      res
        .writeHead(404, { "Content-Type": "application/json" })
        .end(JSON.stringify({ error: "Not found" }));
      return;
    }
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    let parsedBody: unknown;
    if (debug) {
      const bodyBuffer = await new Promise<Buffer>((resolve) => {
        const chunks: Buffer[] = [];
        req.on("data", (chunk: Buffer) => chunks.push(chunk));
        req.on("end", () => resolve(Buffer.concat(chunks)));
      });
      const bodyStr = bodyBuffer.toString();
      try {
        parsedBody = JSON.parse(bodyStr);
        console.error(`\n← ${req.method} /mcp [session: ${sessionId ?? "new"}]`);
        console.error(JSON.stringify(parsedBody, null, 2));
      } catch {
        console.error(`\n← ${req.method} /mcp [session: ${sessionId ?? "new"}] (non-JSON body)`);
      }
    }
    if (sessionId && sessions.has(sessionId)) {
      const transport = sessions.get(sessionId)!;
      await transport.handleRequest(req, res, parsedBody);
      return;
    }
    if (sessionId && !sessions.has(sessionId)) {
      res.writeHead(404).end("Session not found");
      return;
    }
    if (req.method === "POST" && !sessionId) {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
      });
      transport.onclose = () => {
        if (transport.sessionId) sessions.delete(transport.sessionId);
      };
      const server = createServer(client, session);
      await server.connect(transport);
      await transport.handleRequest(req, res, parsedBody);
      if (transport.sessionId) sessions.set(transport.sessionId, transport);
      return;
    }
    res.writeHead(405).end("Method not allowed");
  });
  const maxRetries = 10;
  let currentPort = port;
  httpServer.on("listening", () => {
    console.error(`Air MCP server listening on http://localhost:${currentPort}/mcp`);
  });
  httpServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE" && currentPort - port < maxRetries) {
      console.error(`Port ${currentPort} in use, trying ${currentPort + 1}...`);
      currentPort++;
      httpServer.listen(currentPort, "127.0.0.1");
    } else {
      console.error(`Failed to start server: ${err.message}`);
      process.exit(1);
    }
  });
  httpServer.listen(currentPort, "127.0.0.1");
  const shutdown = () => {
    httpServer.closeAllConnections();
    httpServer.close(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
} else {
  if (workspaceId) {
    console.error("Starting Air MCP server with STDIO transport for workspace", workspaceId);
  } else {
    console.error(
      "Starting Air MCP server with STDIO transport (no default workspace; use set_workspace or add AIR_WORKSPACE_ID to project .env)",
    );
  }
  const server = createServer(client, session);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Air MCP server started");
}
