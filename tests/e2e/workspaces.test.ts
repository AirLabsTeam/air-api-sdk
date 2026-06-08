import { describe, test, expect } from "vitest";
import { getAuthMode, getClient } from "./helpers/setup";

const oauthOnly = getAuthMode() === "oauth" ? describe : describe.skip;

oauthOnly("Workspaces (oauth-only)", () => {
  const client = getClient();

  test("list returns workspaces with id+name", async () => {
    const workspaces = await client.workspaces.list();
    expect(Array.isArray(workspaces)).toBe(true);
    expect(workspaces.length).toBeGreaterThan(0);
    for (const ws of workspaces) {
      expect(typeof ws.id).toBe("string");
      expect(ws.id.length).toBeGreaterThan(0);
      expect(typeof ws.name).toBe("string");
    }
  });

  test("configured AIR_WORKSPACE_ID appears in the list", async () => {
    const configured = process.env.AIR_WORKSPACE_ID!;
    const workspaces = await client.workspaces.list();
    expect(workspaces.some((w) => w.id === configured)).toBe(true);
  });
});
