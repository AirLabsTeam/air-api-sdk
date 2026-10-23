import { describe, expect, test } from "vitest";
import { AirApi } from "../../src/api";
import { createMockFetch, createClientOptions } from "../helpers/mock-fetch";
import { makeMember, makePaginatedResponse } from "../helpers/fixtures";

describe("Members", () => {
  test("list returns paginated members", async () => {
    const member = makeMember();
    const mockFetch = createMockFetch({ body: makePaginatedResponse([member]) });
    const client = new AirApi(createClientOptions(mockFetch));

    const page = await client.members.list();
    expect(page.data).toEqual([member]);
    expect(page.total).toBe(1);
    const url = new URL(mockFetch.calls[0].url);
    expect(url.pathname).toMatch(/\/members$/);
    expect(mockFetch.calls[0].init?.method).toBe("GET");
    expect([...url.searchParams.keys()]).toEqual([]);
  });

  test("list forwards type, search, limit, and cursor", async () => {
    const mockFetch = createMockFetch({ body: makePaginatedResponse([]) });
    const client = new AirApi(createClientOptions(mockFetch));

    await client.members.list({ type: "guest", search: "ada", limit: 10, cursor: "abc" });
    const url = new URL(mockFetch.calls[0].url);
    expect(url.searchParams.get("type")).toBe("guest");
    expect(url.searchParams.get("search")).toBe("ada");
    expect(url.searchParams.get("limit")).toBe("10");
    expect(url.searchParams.get("cursor")).toBe("abc");
    expect(url.searchParams.has("email")).toBe(false);
  });

  test("list forwards email without a default type", async () => {
    const mockFetch = createMockFetch({ body: makePaginatedResponse([]) });
    const client = new AirApi(createClientOptions(mockFetch));

    await client.members.list({ email: "ada@example.com" });
    const url = new URL(mockFetch.calls[0].url);
    expect(url.searchParams.get("email")).toBe("ada@example.com");
    expect(url.searchParams.has("type")).toBe(false);
    expect(url.searchParams.has("search")).toBe(false);
  });

  test("getNextPage keeps the filters and sends the next cursor", async () => {
    const mockFetch = createMockFetch([
      { body: makePaginatedResponse([makeMember()], true, "next-cursor") },
      { body: makePaginatedResponse([makeMember({ id: "account-2" })]) },
    ]);
    const client = new AirApi(createClientOptions(mockFetch));

    const page = await client.members.list({ type: "libraryMember", search: "ada" });
    const next = await page.getNextPage();
    expect(next.data[0].id).toBe("account-2");
    const url = new URL(mockFetch.calls[1].url);
    expect(url.searchParams.get("type")).toBe("libraryMember");
    expect(url.searchParams.get("search")).toBe("ada");
    expect(url.searchParams.get("cursor")).toBe("next-cursor");
  });
});
