import { describe, test, expect, afterAll } from "vitest";
import { getClient, resourceName } from "./helpers/setup";
import { findOrCreateBoard } from "./helpers/test-data";

const client = getClient();
const cleanup: (() => Promise<void>)[] = [];

afterAll(async () => {
  for (const fn of cleanup) {
    try {
      await fn();
    } catch {}
  }
});

describe("Imports", () => {
  test("create import from URL → getStatus → delete asset", async () => {
    const board = await findOrCreateBoard(client, "imports-board");
    cleanup.push(() => client.boards.delete(board.id));

    // Import a small public PNG
    const result = await client.imports.create({
      sourceUrl:
        "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png",
      parentBoardId: board.id,
      title: resourceName("imported"),
    });

    expect(result.id).toBeDefined();
    expect(result.assetId).toBeDefined();
    expect(result.versionId).toBeDefined();

    // Check status
    const status = await client.imports.getStatus(result.id);
    expect(["pending", "inProgress", "succeeded", "failed"]).toContain(status.status);

    // Clean up imported asset
    cleanup.push(() => client.assets.delete(result.assetId));
  });
});
