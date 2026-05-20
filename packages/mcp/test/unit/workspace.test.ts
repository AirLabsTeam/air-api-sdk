import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
  loadProjectEnv,
  resolveWorkspaceId,
  WorkspaceSession,
  WorkspaceRequiredError,
} from "../../src/workspace.js";

describe("resolveWorkspaceId", () => {
  test("returns AIR_WORKSPACE_ID when set", () => {
    expect(resolveWorkspaceId({ AIR_WORKSPACE_ID: "ws-123" } as NodeJS.ProcessEnv)).toBe("ws-123");
  });

  test("returns undefined when unset", () => {
    expect(resolveWorkspaceId({} as NodeJS.ProcessEnv)).toBeUndefined();
  });
});

describe("loadProjectEnv", () => {
  let dir: string;

  beforeEach(() => {
    dir = join(tmpdir(), `air-mcp-test-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  test("loads AIR_WORKSPACE_ID from project .env", () => {
    writeFileSync(join(dir, ".env"), "AIR_WORKSPACE_ID=from-dotenv\n");
    const prev = process.env.AIR_WORKSPACE_ID;
    delete process.env.AIR_WORKSPACE_ID;
    loadProjectEnv(dir);
    expect(process.env.AIR_WORKSPACE_ID).toBe("from-dotenv");
    if (prev === undefined) delete process.env.AIR_WORKSPACE_ID;
    else process.env.AIR_WORKSPACE_ID = prev;
  });

  test("does not override existing env vars", () => {
    writeFileSync(join(dir, ".env"), "AIR_WORKSPACE_ID=from-dotenv\n");
    process.env.AIR_WORKSPACE_ID = "explicit";
    loadProjectEnv(dir);
    expect(process.env.AIR_WORKSPACE_ID).toBe("explicit");
    delete process.env.AIR_WORKSPACE_ID;
  });
});

describe("WorkspaceSession", () => {
  test("requireWorkspaceId throws when unset", () => {
    const session = new WorkspaceSession();
    expect(() => session.requireWorkspaceId()).toThrow(WorkspaceRequiredError);
  });

  test("context returns active workspace", () => {
    const session = new WorkspaceSession("ws-a");
    expect(session.context()).toEqual({ workspaceId: "ws-a" });
  });

  test("setActiveWorkspaceId updates context", () => {
    const session = new WorkspaceSession();
    session.setActiveWorkspaceId("ws-b");
    expect(session.context()).toEqual({ workspaceId: "ws-b" });
  });
});
