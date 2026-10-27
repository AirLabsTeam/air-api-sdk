import { describe, expect, test } from "vitest";
import { AirApi } from "../../src/api";
import { createMockFetch, createClientOptions } from "../helpers/mock-fetch";
import {
  makeAsset,
  makeAssetVersion,
  makeCdnLink,
  makeCurrentVersionShareLink,
  makePaginatedResponse,
  makePinnedShareLink,
} from "../helpers/fixtures";

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
    expect(url).not.toContain("semantic=");
  });

  test("list serializes plain-text and date custom field filters", async () => {
    const mockFetch = createMockFetch({ body: makePaginatedResponse([]) });
    const client = new AirApi(createClientOptions(mockFetch));

    await client.assets.list({
      customField: [
        { id: "field-1", valueId: "option-1" },
        "field-2:option-2",
        { id: "field-3", operator: "text", value: "Launch: film" },
        { id: "field-5", operator: "textPrefix", value: "Launch" },
        { id: "field-6", operator: "textNot", value: " archive " },
        { id: "field-4", operator: "dateGte", value: "2026-06-10" },
        { id: "field-4", operator: "dateLte", value: "2026-06-10T00:00:00+02:00" },
      ],
    });

    const url = new URL(mockFetch.calls[0].url);
    expect(url.searchParams.getAll("customField")).toEqual([
      "field-1:option-1",
      "field-2:option-2",
      "field-3:text:Launch: film",
      "field-5:textPrefix:Launch",
      "field-6:textNot: archive ",
      "field-4:dateGte:2026-06-10",
      "field-4:dateLte:2026-06-10T00:00:00+02:00",
    ]);
    expect(url.toString()).toContain("%2B02%3A00");
  });

  test("list serializes one select custom field filter", async () => {
    const mockFetch = createMockFetch({ body: makePaginatedResponse([]) });
    const client = new AirApi(createClientOptions(mockFetch));

    await client.assets.list({ customField: { id: "field-1", valueId: "option-1" } });

    const url = new URL(mockFetch.calls[0].url);
    expect(url.searchParams.get("customField")).toBe("field-1:option-1");
  });

  test("list rejects a custom field filter that sets both valueId and operator", async () => {
    const mockFetch = createMockFetch({ body: makePaginatedResponse([]) });
    const client = new AirApi(createClientOptions(mockFetch));

    expect(() =>
      client.assets.list({
        customField: {
          id: "field-1",
          valueId: "option-1",
          operator: "text",
          value: "Launch",
        } as never,
      }),
    ).toThrow(/must be a select \{ id, valueId \} or an operator/);
    expect(mockFetch.calls).toHaveLength(0);
  });

  test("list passes semantic search flag", async () => {
    const mockFetch = createMockFetch({ body: makePaginatedResponse([]) });
    const client = new AirApi(createClientOptions(mockFetch));

    await client.assets.list({ search: "sunset over water", semantic: true });
    const url = mockFetch.calls[0].url;
    expect(url).toContain("search=sunset+over+water");
    expect(url).toContain("semantic=true");
  });

  test("list omits a null pagination cursor", async () => {
    const mockFetch = createMockFetch({ body: makePaginatedResponse([makeAsset()]) });
    const client = new AirApi(createClientOptions(mockFetch));

    const page = await client.assets.list();
    await client.assets.list({ cursor: page.pagination.cursor, limit: 10 });

    const url = new URL(mockFetch.calls[1].url);
    expect(page.pagination.cursor).toBeNull();
    expect(url.searchParams.has("cursor")).toBe(false);
    expect(url.searchParams.get("limit")).toBe("10");
  });

  test("getNextPage forwards the cursor string", async () => {
    const mockFetch = createMockFetch([
      { body: makePaginatedResponse([makeAsset({ id: "asset-1" })], true, "bnVsbA") },
      { body: makePaginatedResponse([makeAsset({ id: "asset-2" })]) },
    ]);
    const client = new AirApi(createClientOptions(mockFetch));

    const page = await client.assets.list({ limit: 10 });
    const next = await page.getNextPage();

    const url = new URL(mockFetch.calls[1].url);
    expect(url.searchParams.get("cursor")).toBe("bnVsbA");
    expect(url.searchParams.get("limit")).toBe("10");
    expect(next.data.map((asset) => asset.id)).toEqual(["asset-2"]);
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

  test("listCdnLinks returns CDN links for an asset", async () => {
    const cdnLink = makeCdnLink();
    const mockFetch = createMockFetch({ body: { data: [cdnLink] } });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.assets.listCdnLinks("asset-1");
    expect(result.data).toEqual([cdnLink]);
    expect(mockFetch.calls[0].init?.method).toBe("GET");
    expect(mockFetch.calls[0].url).toContain("/assets/asset-1/cdnLinks");
  });

  test("createCdnLink creates an evergreen CDN link", async () => {
    const cdnLink = makeCdnLink();
    const mockFetch = createMockFetch({ status: 201, body: cdnLink });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.assets.createCdnLink("asset-1", {
      followsDefaultVersion: true,
    });

    expect(result).toEqual(cdnLink);
    expect(mockFetch.calls[0].init?.method).toBe("POST");
    expect(mockFetch.calls[0].url).toContain("/assets/asset-1/cdnLinks");
    expect(JSON.parse(mockFetch.calls[0].init?.body as string)).toEqual({
      followsDefaultVersion: true,
    });
  });

  test("createCdnLink creates a version-pinned CDN link", async () => {
    const cdnLink = makeCdnLink({
      followsDefaultVersion: false,
      versionId: "version-1",
    });
    const mockFetch = createMockFetch({ status: 201, body: cdnLink });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.assets.createCdnLink("asset-1", {
      versionId: "version-1",
    });

    expect(result).toEqual(cdnLink);
    expect(mockFetch.calls[0].init?.method).toBe("POST");
    expect(mockFetch.calls[0].url).toContain("/assets/asset-1/cdnLinks");
    expect(JSON.parse(mockFetch.calls[0].init?.body as string)).toEqual({
      versionId: "version-1",
    });
  });

  test("updateCdnLink sends PATCH and returns void", async () => {
    const mockFetch = createMockFetch({ status: 204 });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.assets.updateCdnLink("asset-1", "cdn-link-1", {
      active: false,
    });

    expect(result).toBeUndefined();
    expect(mockFetch.calls[0].init?.method).toBe("PATCH");
    expect(mockFetch.calls[0].url).toContain("/assets/asset-1/cdnLinks/cdn-link-1");
    expect(JSON.parse(mockFetch.calls[0].init?.body as string)).toEqual({
      active: false,
    });
  });

  test("createShareLink creates a current-version share link", async () => {
    const link = makeCurrentVersionShareLink({ showAllVersions: true, allowDownload: false });
    const mockFetch = createMockFetch({ status: 201, body: link });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.assets.createShareLink("asset-1", {
      followsDefaultVersion: true,
      allowDownload: false,
      showAllVersions: true,
    });

    expect(result).toEqual(link);
    expect(mockFetch.calls[0].init?.method).toBe("POST");
    const url = new URL(mockFetch.calls[0].url);
    expect(url.pathname).toBe("/v1/assets/asset-1/share-links");
    expect(JSON.parse(mockFetch.calls[0].init?.body as string)).toEqual({
      followsDefaultVersion: true,
      allowDownload: false,
      showAllVersions: true,
    });
  });

  test("createShareLink creates a version-pinned share link", async () => {
    const link = makePinnedShareLink({ versionId: "version-1", showAllVersions: false });
    const mockFetch = createMockFetch({ status: 201, body: link });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.assets.createShareLink("asset-1", {
      versionId: "version-1",
      active: true,
    });

    expect(result).toEqual(link);
    expect(mockFetch.calls[0].init?.method).toBe("POST");
    const url = new URL(mockFetch.calls[0].url);
    expect(url.pathname).toBe("/v1/assets/asset-1/share-links");
    expect(JSON.parse(mockFetch.calls[0].init?.body as string)).toEqual({
      versionId: "version-1",
      active: true,
    });
  });

  test("updateShareLink sends paid settings", async () => {
    const mockFetch = createMockFetch({ status: 204 });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.assets.updateShareLink("asset-1", "a1b2c3d4e", {
      password: "a-secret",
      expiresAt: "2027-01-01T00:00:00.000Z",
      requireAccount: true,
      comments: "allowed",
      customFields: "editable",
      showAllVersions: false,
    });

    expect(result).toBeUndefined();
    expect(JSON.parse(mockFetch.calls[0].init?.body as string)).toEqual({
      password: "a-secret",
      expiresAt: "2027-01-01T00:00:00.000Z",
      requireAccount: true,
      comments: "allowed",
      customFields: "editable",
      showAllVersions: false,
    });
  });

  test("updateShareLink sends PATCH and returns void", async () => {
    const mockFetch = createMockFetch({ status: 204 });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.assets.updateShareLink("asset-1", "a1b2c3d4e", {
      active: false,
      showAllVersions: true,
    });

    expect(result).toBeUndefined();
    expect(mockFetch.calls[0].init?.method).toBe("PATCH");
    const url = new URL(mockFetch.calls[0].url);
    expect(url.pathname).toBe("/v1/assets/asset-1/share-links/a1b2c3d4e");
    expect(JSON.parse(mockFetch.calls[0].init?.body as string)).toEqual({
      active: false,
      showAllVersions: true,
    });
  });

  test("listShareLinks returns paginated asset share links", async () => {
    const current = makeCurrentVersionShareLink();
    const pinned = makePinnedShareLink({ versionId: "version-2", showAllVersions: true });
    const disabled = makeCurrentVersionShareLink({
      id: "b2c3d4e5f",
      url: "https://app.air.inc/a/b2c3d4e5f",
      active: false,
      hasPassword: true,
    });
    const mockFetch = createMockFetch({
      body: makePaginatedResponse([current, pinned, disabled], false, null),
    });
    const client = new AirApi(createClientOptions(mockFetch));

    const page = await client.assets.listShareLinks("asset-1");

    expect(page.data).toEqual([current, pinned, disabled]);
    expect(page.total).toBe(3);
    expect(page.pagination).toEqual({ hasMore: false, cursor: null });
    expect(mockFetch.calls[0].init?.method).toBe("GET");
    expect(mockFetch.calls[0].url).toContain("/assets/asset-1/share-links");
    expect(new URL(mockFetch.calls[0].url).search).toBe("");
  });

  test("listShareLinks passes limit and cursor", async () => {
    const mockFetch = createMockFetch({ body: makePaginatedResponse([]) });
    const client = new AirApi(createClientOptions(mockFetch));

    await client.assets.listShareLinks("asset-1", { limit: 12, cursor: "bnVsbA" });

    const url = new URL(mockFetch.calls[0].url);
    expect(url.pathname).toBe("/v1/assets/asset-1/share-links");
    expect(url.searchParams.get("limit")).toBe("12");
    expect(url.searchParams.get("cursor")).toBe("bnVsbA");
  });

  test("listShareLinks omits a null pagination cursor", async () => {
    const mockFetch = createMockFetch({
      body: makePaginatedResponse([makeCurrentVersionShareLink()]),
    });
    const client = new AirApi(createClientOptions(mockFetch));

    const page = await client.assets.listShareLinks("asset-1");
    await client.assets.listShareLinks("asset-1", { cursor: page.pagination.cursor, limit: 12 });

    const url = new URL(mockFetch.calls[1].url);
    expect(page.pagination.cursor).toBeNull();
    expect(url.searchParams.has("cursor")).toBe(false);
    expect(url.searchParams.get("limit")).toBe("12");
  });

  test("listShareLinks getNextPage forwards the cursor string", async () => {
    const mockFetch = createMockFetch([
      {
        body: makePaginatedResponse(
          [makeCurrentVersionShareLink({ id: "a1b2c3d4e" })],
          true,
          "bnVsbA",
        ),
      },
      { body: makePaginatedResponse([makePinnedShareLink({ id: "c3d4e5f6a" })]) },
    ]);
    const client = new AirApi(createClientOptions(mockFetch));

    const page = await client.assets.listShareLinks("asset-1", { limit: 12 });
    const next = await page.getNextPage();

    const url = new URL(mockFetch.calls[1].url);
    expect(url.pathname).toBe("/v1/assets/asset-1/share-links");
    expect(url.searchParams.get("cursor")).toBe("bnVsbA");
    expect(url.searchParams.get("limit")).toBe("12");
    expect(next.data.map((link) => link.id)).toEqual(["c3d4e5f6a"]);
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
