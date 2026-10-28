import { describe, expect, test } from "vitest";
import { AirApi } from "../../src/api";
import { createMockFetch, createClientOptions } from "../helpers/mock-fetch";
import { makePaginatedResponse, makeShareLink, makeShowcase } from "../helpers/fixtures";

describe("Showcases", () => {
  test("list returns paginated showcases", async () => {
    const showcase = makeShowcase();
    const mockFetch = createMockFetch({ body: makePaginatedResponse([showcase]) });
    const client = new AirApi(createClientOptions(mockFetch));

    const page = await client.showcases.list();
    expect(page.data).toEqual([showcase]);
    expect(page.total).toBe(1);
    const url = new URL(mockFetch.calls[0].url);
    expect(url.pathname).toBe("/v1/showcases");
    expect(url.search).toBe("");
  });

  test("list forwards search, status, and limit", async () => {
    const mockFetch = createMockFetch({ body: makePaginatedResponse([]) });
    const client = new AirApi(createClientOptions(mockFetch));

    await client.showcases.list({ search: "campaign", status: "expired", limit: 12 });

    const url = new URL(mockFetch.calls[0].url);
    expect(url.searchParams.get("search")).toBe("campaign");
    expect(url.searchParams.get("status")).toBe("expired");
    expect(url.searchParams.get("limit")).toBe("12");
  });

  test("list omits a null pagination cursor", async () => {
    const mockFetch = createMockFetch({ body: makePaginatedResponse([makeShowcase()]) });
    const client = new AirApi(createClientOptions(mockFetch));

    const page = await client.showcases.list();
    await client.showcases.list({ cursor: page.pagination.cursor, limit: 10 });

    const url = new URL(mockFetch.calls[1].url);
    expect(page.pagination.cursor).toBeNull();
    expect(url.searchParams.has("cursor")).toBe(false);
    expect(url.searchParams.get("limit")).toBe("10");
  });

  test("get returns a showcase and its share link", async () => {
    const showcase = makeShowcase();
    const mockFetch = createMockFetch({ body: showcase });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.showcases.get("showcase-1");

    expect(result).toEqual(showcase);
    expect(mockFetch.calls[0].init?.method).toBe("GET");
    const url = new URL(mockFetch.calls[0].url);
    expect(url.pathname).toBe("/v1/showcases/showcase-1");
  });

  test("get returns a null share link", async () => {
    const showcase = makeShowcase({ shareLink: null });
    const mockFetch = createMockFetch({ body: showcase });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.showcases.get("showcase-1");

    expect(result.shareLink).toBeNull();
  });

  test("create sends the showcase and its share link settings", async () => {
    const showcase = makeShowcase({
      shareLink: makeShareLink({ allowDownload: false, comments: "read_only" }),
    });
    const mockFetch = createMockFetch({ status: 201, body: showcase });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.showcases.create({
      name: "Fall campaign",
      description: "Selects for the retail team",
      shareLink: { allowDownload: false, comments: "read_only" },
    });

    expect(result).toEqual(showcase);
    expect(result.shareLink?.allowDownload).toBe(false);
    expect(mockFetch.calls[0].init?.method).toBe("POST");
    const url = new URL(mockFetch.calls[0].url);
    expect(url.pathname).toBe("/v1/showcases");
    expect(JSON.parse(mockFetch.calls[0].init?.body as string)).toEqual({
      name: "Fall campaign",
      description: "Selects for the retail team",
      shareLink: { allowDownload: false, comments: "read_only" },
    });
  });

  test("create sends only the name when settings are omitted", async () => {
    const showcase = makeShowcase();
    const mockFetch = createMockFetch({ status: 201, body: showcase });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.showcases.create({ name: "Fall campaign" });

    expect(result).toEqual(showcase);
    expect(JSON.parse(mockFetch.calls[0].init?.body as string)).toEqual({
      name: "Fall campaign",
    });
  });

  test("update sends PATCH and returns void", async () => {
    const mockFetch = createMockFetch({ status: 204 });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.showcases.update("showcase-1", {
      name: "Fall campaign, final selects",
      description: null,
    });

    expect(result).toBeUndefined();
    expect(mockFetch.calls[0].init?.method).toBe("PATCH");
    const url = new URL(mockFetch.calls[0].url);
    expect(url.pathname).toBe("/v1/showcases/showcase-1");
    expect(JSON.parse(mockFetch.calls[0].init?.body as string)).toEqual({
      name: "Fall campaign, final selects",
      description: null,
    });
  });

  test("updateShareLink sends paid settings and null clears", async () => {
    const mockFetch = createMockFetch({ status: 204 });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.showcases.updateShareLink("showcase-1", "c4d5e6f7a", {
      active: false,
      password: null,
      expiresAt: null,
      requireAccount: true,
      comments: "hidden",
      customFields: "editable",
    });

    expect(result).toBeUndefined();
    expect(mockFetch.calls[0].init?.method).toBe("PATCH");
    const url = new URL(mockFetch.calls[0].url);
    expect(url.pathname).toBe("/v1/showcases/showcase-1/share-links/c4d5e6f7a");
    expect(JSON.parse(mockFetch.calls[0].init?.body as string)).toEqual({
      active: false,
      password: null,
      expiresAt: null,
      requireAccount: true,
      comments: "hidden",
      customFields: "editable",
    });
  });

  test("addAssets sends POST with assetIds and returns void", async () => {
    const mockFetch = createMockFetch({ status: 204 });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.showcases.addAssets("showcase-1", { assetIds: ["a1", "a2"] });

    expect(result).toBeUndefined();
    expect(mockFetch.calls[0].init?.method).toBe("POST");
    const url = new URL(mockFetch.calls[0].url);
    expect(url.pathname).toBe("/v1/showcases/showcase-1/assets");
    expect(JSON.parse(mockFetch.calls[0].init?.body as string)).toEqual({
      assetIds: ["a1", "a2"],
    });
  });

  test("removeAsset sends DELETE and returns void", async () => {
    const mockFetch = createMockFetch({ status: 204 });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.showcases.removeAsset("showcase-1", "asset-1");

    expect(result).toBeUndefined();
    expect(mockFetch.calls[0].init?.method).toBe("DELETE");
    const url = new URL(mockFetch.calls[0].url);
    expect(url.pathname).toBe("/v1/showcases/showcase-1/assets/asset-1");
  });

  test("addBoards sends POST with boardIds and returns void", async () => {
    const mockFetch = createMockFetch({ status: 204 });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.showcases.addBoards("showcase-1", { boardIds: ["b1"] });

    expect(result).toBeUndefined();
    expect(mockFetch.calls[0].init?.method).toBe("POST");
    const url = new URL(mockFetch.calls[0].url);
    expect(url.pathname).toBe("/v1/showcases/showcase-1/boards");
    expect(JSON.parse(mockFetch.calls[0].init?.body as string)).toEqual({
      boardIds: ["b1"],
    });
  });

  test("removeBoard sends DELETE and returns void", async () => {
    const mockFetch = createMockFetch({ status: 204 });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.showcases.removeBoard("showcase-1", "board-1");

    expect(result).toBeUndefined();
    expect(mockFetch.calls[0].init?.method).toBe("DELETE");
    const url = new URL(mockFetch.calls[0].url);
    expect(url.pathname).toBe("/v1/showcases/showcase-1/boards/board-1");
  });
});
