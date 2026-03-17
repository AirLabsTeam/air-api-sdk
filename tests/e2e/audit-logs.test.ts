import { describe, test, expect } from "vitest";
import { getClient } from "./helpers/setup";

const client = getClient();

describe("Audit Logs", () => {
  test("list with 7-day date range returns expected shape", async () => {
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const page = await client.auditLogs.list({ startDate, endDate, limit: 5 });
    expect(page.data).toBeInstanceOf(Array);
    expect(page.pagination).toBeDefined();
    expect(typeof page.pagination.hasMore).toBe("boolean");
  });
});
