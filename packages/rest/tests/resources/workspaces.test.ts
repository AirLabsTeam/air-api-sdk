import { describe, expect, test } from "vitest";
import { AirApi } from "../../src/api";
import { createMockFetch, createClientOptions } from "../helpers/mock-fetch";
import { makeWorkspace } from "../helpers/fixtures";

describe("Workspaces", () => {
  test("list returns unwrapped workspace array", async () => {
    const workspaces = [makeWorkspace({ id: "w1" }), makeWorkspace({ id: "w2", name: "Other" })];
    const mockFetch = createMockFetch({ body: { data: workspaces } });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.workspaces.list();
    expect(result).toEqual(workspaces);
    expect(mockFetch.calls[0].init?.method).toBe("GET");
    expect(mockFetch.calls[0].url).toContain("/workspaces");
  });

  test("list works under bearer auth without a workspaceId", async () => {
    const workspaces = [makeWorkspace()];
    const mockFetch = createMockFetch({ body: { data: workspaces } });
    const client = new AirApi({
      accessToken: "test-oauth-token",
      baseURL: "https://api.air.inc/v1",
      fetch: mockFetch as unknown as typeof globalThis.fetch,
      maxRetries: 0,
    });

    const result = await client.workspaces.list();
    expect(result).toEqual(workspaces);

    const headers = mockFetch.calls[0].init?.headers as Record<string, string>;
    expect(headers["authorization"]).toBe("Bearer test-oauth-token");
    expect(headers["x-api-key"]).toBeUndefined();
    expect(headers["x-air-workspace-id"]).toBeUndefined();
  });
});
