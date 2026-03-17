import { describe, expect, test } from "vitest";
import { AirApi } from "../../src/api";
import { createMockFetch, createClientOptions } from "../helpers/mock-fetch";
import { makeAsset, makeAssetVersion, makePaginatedResponse } from "../helpers/fixtures";

describe("Assets", () => {
  test("list returns paginated assets", async () => {
    const asset = makeAsset();
    const mockFetch = createMockFetch({ body: makePaginatedResponse([asset]) });
    const client = new AirApi(createClientOptions(mockFetch));

    const page = await client.assets.list();
    expect(page.data).toEqual([asset]);
  });

  test("list passes filter params", async () => {
    const mockFetch = createMockFetch({ body: makePaginatedResponse([]) });
    const client = new AirApi(createClientOptions(mockFetch));

    await client.assets.list({
      parentBoardId: "board-1",
      search: "photo",
      "createdAt[gte]": "2024-01-01",
    });
    const url = mockFetch.calls[0].url;
    expect(url).toContain("parentBoardId=board-1");
    expect(url).toContain("search=photo");
    expect(url).toContain("createdAt%5Bgte%5D=2024-01-01");
  });

  test("get returns an asset", async () => {
    const asset = makeAsset({ id: "asset-123" });
    const mockFetch = createMockFetch({ body: asset });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.assets.get("asset-123");
    expect(result).toEqual(asset);
  });

  test("delete sends DELETE", async () => {
    const mockFetch = createMockFetch({ status: 204 });
    const client = new AirApi(createClientOptions(mockFetch));

    await client.assets.delete("asset-1");
    expect(mockFetch.calls[0].init?.method).toBe("DELETE");
  });

  test("listVersions returns versions", async () => {
    const version = makeAssetVersion();
    const mockFetch = createMockFetch({ body: { data: [version], total: 1 } });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.assets.listVersions("asset-1");
    expect(result.data).toEqual([version]);
    expect(result.total).toBe(1);
  });

  test("getVersion returns a version", async () => {
    const version = makeAssetVersion({ id: "v1" });
    const mockFetch = createMockFetch({ body: version });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.assets.getVersion("asset-1", "v1");
    expect(result).toEqual(version);
    expect(mockFetch.calls[0].url).toContain("/assets/asset-1/versions/v1");
  });

  test("updateVersion sends PATCH", async () => {
    const mockFetch = createMockFetch({ status: 204 });
    const client = new AirApi(createClientOptions(mockFetch));

    await client.assets.updateVersion("asset-1", "v1", { title: "New Title" });
    expect(mockFetch.calls[0].init?.method).toBe("PATCH");
  });

  test("getVersionDownloadUrl returns url", async () => {
    const mockFetch = createMockFetch({ body: { url: "https://example.com/download" } });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.assets.getVersionDownloadUrl("asset-1", "v1");
    expect(result.url).toBe("https://example.com/download");
  });

  test("setCustomField sends PUT", async () => {
    const mockFetch = createMockFetch({ status: 204 });
    const client = new AirApi(createClientOptions(mockFetch));

    await client.assets.setCustomField("asset-1", "cf-1", { value: "hello" });
    expect(mockFetch.calls[0].init?.method).toBe("PUT");
    expect(mockFetch.calls[0].url).toContain("/assets/asset-1/customfields/cf-1");
  });

  test("addVersionTag sends POST and returns version", async () => {
    const version = makeAssetVersion();
    const mockFetch = createMockFetch({ body: version });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.assets.addVersionTag("asset-1", "v1", { id: "tag-1" });
    expect(result).toEqual(version);
    expect(mockFetch.calls[0].url).toContain("/assets/asset-1/versions/v1/tags");
  });

  test("removeVersionTag sends DELETE", async () => {
    const mockFetch = createMockFetch({ status: 204 });
    const client = new AirApi(createClientOptions(mockFetch));

    await client.assets.removeVersionTag("asset-1", "v1", "tag-1");
    expect(mockFetch.calls[0].url).toContain("/assets/asset-1/versions/v1/tags/tag-1");
    expect(mockFetch.calls[0].init?.method).toBe("DELETE");
  });
});
