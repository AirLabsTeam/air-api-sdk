import { describe, expect, test } from "vitest";
import { AirApi } from "../../src/api";
import { makeMember, makePaginatedResponse } from "../helpers/fixtures";
import { createClientOptions, createMockFetch } from "../helpers/mock-fetch";

describe("Members", () => {
  test("list does not invent a type filter", async () => {
    const member = makeMember();
    const mockFetch = createMockFetch({ body: makePaginatedResponse([member]) });
    const client = new AirApi(createClientOptions(mockFetch));

    const page = await client.members.list();
    expect(page.data).toEqual([member]);
    expect(page.hasNextPage()).toBe(false);
    expect(mockFetch.calls[0].url).toContain("/members");
    expect(mockFetch.calls[0].url).not.toContain("type=");
    expect(mockFetch.calls[0].url).not.toContain("email=");
    expect(mockFetch.calls[0].url).not.toContain("search=");
  });

  test("list passes type, search, and page size", async () => {
    const mockFetch = createMockFetch({ body: makePaginatedResponse([]) });
    const client = new AirApi(createClientOptions(mockFetch));

    await client.members.list({
      type: "libraryMember",
      search: "ada",
      limit: 50,
      cursor: "member-cursor",
    });

    const url = mockFetch.calls[0].url;
    expect(url).toContain("type=libraryMember");
    expect(url).toContain("search=ada");
    expect(url).toContain("limit=50");
    expect(url).toContain("cursor=member-cursor");
  });

  test("email lookup omits type so every member type is searched", async () => {
    const guest = makeMember({ type: "guest", email: "guest@example.com" });
    const mockFetch = createMockFetch({ body: makePaginatedResponse([guest]) });
    const client = new AirApi(createClientOptions(mockFetch));

    const page = await client.members.list({ email: "guest@example.com" });
    expect(page.data).toEqual([guest]);
    expect(mockFetch.calls[0].url).toContain("email=guest%40example.com");
    expect(mockFetch.calls[0].url).not.toContain("type=");
  });
});
