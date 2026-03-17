import { describe, expect, test } from "vitest";
import { AirApi } from "../../src/api";
import { createMockFetch, createClientOptions } from "../helpers/mock-fetch";
import { makeBoard, makePaginatedResponse } from "../helpers/fixtures";

describe("Boards", () => {
  test("list returns paginated boards", async () => {
    const board = makeBoard();
    const mockFetch = createMockFetch({ body: makePaginatedResponse([board]) });
    const client = new AirApi(createClientOptions(mockFetch));

    const page = await client.boards.list();
    expect(page.data).toEqual([board]);
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
