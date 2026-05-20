import { describe, expect, test } from "vitest";
import { AirBase } from "../src/base-client";
import { createMockFetch, createBaseOptions } from "./helpers/mock-fetch";

describe("RequestContext workspaceId override", () => {
  test("per-request workspaceId overrides client default", async () => {
    const mockFetch = createMockFetch({ body: { ok: true } });
    const client = new AirBase(createBaseOptions(mockFetch));

    await client.request({
      method: "GET",
      path: "/test",
      workspaceId: "override-workspace-id",
    });

    const headers = mockFetch.calls[0].init?.headers as Record<string, string>;
    expect(headers["x-air-workspace-id"]).toBe("override-workspace-id");
  });

  test("uses client workspaceId when per-request workspaceId is omitted", async () => {
    const mockFetch = createMockFetch({ body: { ok: true } });
    const client = new AirBase(createBaseOptions(mockFetch));

    await client.request({ method: "GET", path: "/test" });

    const headers = mockFetch.calls[0].init?.headers as Record<string, string>;
    expect(headers["x-air-workspace-id"]).toBe("test-workspace-id");
  });
});
