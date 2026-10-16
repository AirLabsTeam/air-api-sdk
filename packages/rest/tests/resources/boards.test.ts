import { describe, expect, test } from "vitest";
import { AirApi } from "../../src/api";
import { createMockFetch, createClientOptions } from "../helpers/mock-fetch";
import { makeBoard, makePaginatedResponse, makeShareLink } from "../helpers/fixtures";

describe("Boards", () => {
  test("list returns paginated boards", async () => {
    const board = makeBoard();
    const mockFetch = createMockFetch({ body: makePaginatedResponse([board]) });
    const client = new AirApi(createClientOptions(mockFetch));

    const page = await client.boards.list();
    expect(page.data).toEqual([board]);
  });

  test("list forwards the libraryId filter", async () => {
    const mockFetch = createMockFetch({ body: makePaginatedResponse([]) });
    const client = new AirApi(createClientOptions(mockFetch));

    await client.boards.list({ libraryId: "lib-1" });
    expect(mockFetch.calls[0].url).toContain("libraryId=lib-1");
  });

  test("list forwards the inGeneralLibrary filter", async () => {
    const mockFetch = createMockFetch({ body: makePaginatedResponse([]) });
    const client = new AirApi(createClientOptions(mockFetch));

    await client.boards.list({ inGeneralLibrary: true });
    expect(mockFetch.calls[0].url).toContain("inGeneralLibrary=true");
  });

  test("list omits a null pagination cursor", async () => {
    const mockFetch = createMockFetch({ body: makePaginatedResponse([makeBoard()]) });
    const client = new AirApi(createClientOptions(mockFetch));

    const page = await client.boards.list();
    await client.boards.list({ cursor: page.pagination.cursor, limit: 10 });

    const url = new URL(mockFetch.calls[1].url);
    expect(page.pagination.cursor).toBeNull();
    expect(url.searchParams.has("cursor")).toBe(false);
    expect(url.searchParams.get("limit")).toBe("10");
  });

  test("getNextPage forwards the cursor string", async () => {
    const mockFetch = createMockFetch([
      { body: makePaginatedResponse([makeBoard({ id: "board-1" })], true, "bnVsbA") },
      { body: makePaginatedResponse([makeBoard({ id: "board-2" })]) },
    ]);
    const client = new AirApi(createClientOptions(mockFetch));

    const page = await client.boards.list({ limit: 10 });
    const next = await page.getNextPage();

    const url = new URL(mockFetch.calls[1].url);
    expect(url.searchParams.get("cursor")).toBe("bnVsbA");
    expect(url.searchParams.get("limit")).toBe("10");
    expect(next.data.map((board) => board.id)).toEqual(["board-2"]);
  });

  test("get returns a board", async () => {
    const board = makeBoard({ id: "board-123" });
    const mockFetch = createMockFetch({ body: board });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.boards.get("board-123");
    expect(result).toEqual(board);
  });

  test("create sends POST", async () => {
    const board = makeBoard();
    const mockFetch = createMockFetch({ status: 201, body: board });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.boards.create({ title: "New Board" });
    expect(result).toEqual(board);
    expect(mockFetch.calls[0].init?.method).toBe("POST");
  });

  test("delete sends DELETE", async () => {
    const mockFetch = createMockFetch({ status: 204 });
    const client = new AirApi(createClientOptions(mockFetch));

    await client.boards.delete("board-1");
    expect(mockFetch.calls[0].init?.method).toBe("DELETE");
    expect(mockFetch.calls[0].url).toContain("/boards/board-1");
  });

  test("addAssets sends POST with assetIds", async () => {
    const mockFetch = createMockFetch({ status: 204 });
    const client = new AirApi(createClientOptions(mockFetch));

    await client.boards.addAssets("board-1", { assetIds: ["a1", "a2"] });
    expect(mockFetch.calls[0].init?.method).toBe("POST");
    expect(mockFetch.calls[0].url).toContain("/boards/board-1/assets");
    const body = JSON.parse(mockFetch.calls[0].init?.body as string);
    expect(body.assetIds).toEqual(["a1", "a2"]);
  });

  test("removeAsset sends DELETE", async () => {
    const mockFetch = createMockFetch({ status: 204 });
    const client = new AirApi(createClientOptions(mockFetch));

    await client.boards.removeAsset("board-1", "asset-1");
    expect(mockFetch.calls[0].url).toContain("/boards/board-1/assets/asset-1");
    expect(mockFetch.calls[0].init?.method).toBe("DELETE");
  });

  test("listShareLinks returns the board share link", async () => {
    const link = makeShareLink({ hasPassword: true, expiresAt: "2026-12-31T00:00:00.000Z" });
    const mockFetch = createMockFetch({ body: makePaginatedResponse([link]) });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.boards.listShareLinks("board-1");

    expect(result.data).toEqual([link]);
    expect(result.total).toBe(1);
    expect(result.pagination).toEqual({ hasMore: false, cursor: null });
    expect(mockFetch.calls[0].init?.method).toBe("GET");
    const url = new URL(mockFetch.calls[0].url);
    expect(url.pathname).toBe("/v1/boards/board-1/share-links");
    expect(url.search).toBe("");
  });

  test("listShareLinks returns an empty list when the board has no link", async () => {
    const mockFetch = createMockFetch({ body: makePaginatedResponse([]) });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.boards.listShareLinks("board-1");

    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  test("addGuest sends POST", async () => {
    const guest = { id: "g1", email: "test@test.com", roleId: "r1", boardId: "board-1" };
    const mockFetch = createMockFetch({ body: guest });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.boards.addGuest("board-1", {
      email: "test@test.com",
      roleId: "r1",
    });
    expect(result).toEqual(guest);
  });

  test("listGuests returns guest array", async () => {
    const guests = [{ id: "g1", email: "test@test.com", roleId: "r1", boardId: "board-1" }];
    const mockFetch = createMockFetch({ body: { data: guests } });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.boards.listGuests("board-1");
    expect(result).toEqual(guests);
  });
});
