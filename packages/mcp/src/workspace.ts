import { existsSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import type { RequestContext } from "@air/api-rest";

const ENV_KEY = "AIR_WORKSPACE_ID";

/** Load `.env` / `.env.local` from cwd upward without overriding existing env vars. */
export function loadProjectEnv(startDir = process.cwd()): void {
  let dir = startDir;
  while (true) {
    for (const filename of [".env", ".env.local"]) {
      const filePath = resolve(dir, filename);
      if (!existsSync(filePath)) continue;
      parseEnvFile(filePath);
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
}

function parseEnvFile(filePath: string): void {
  const content = readFileSync(filePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (process.env[key] !== undefined) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

/**
 * Resolve workspace ID for STDIO MCP: explicit env (mcp.json) wins, then project `.env`.
 */
export function resolveWorkspaceId(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const fromEnv = env[ENV_KEY]?.trim();
  return fromEnv || undefined;
}

export class WorkspaceRequiredError extends Error {
  constructor() {
    super(
      "No Air workspace is configured. Set AIR_WORKSPACE_ID in your MCP env or project .env file, or call the set_workspace tool with a workspace ID.",
    );
    this.name = "WorkspaceRequiredError";
  }
}

export class WorkspaceSession {
  private activeWorkspaceId?: string;

  constructor(initialWorkspaceId?: string) {
    this.activeWorkspaceId = initialWorkspaceId;
  }

  getActiveWorkspaceId(): string | undefined {
    return this.activeWorkspaceId;
  }

  setActiveWorkspaceId(workspaceId: string): void {
    this.activeWorkspaceId = workspaceId;
  }

  requireWorkspaceId(): string {
    const id = this.activeWorkspaceId;
    if (!id) throw new WorkspaceRequiredError();
    return id;
  }

  context(overrideWorkspaceId?: string): RequestContext {
    const workspaceId = overrideWorkspaceId ?? this.requireWorkspaceId();
    return { workspaceId };
  }
}
