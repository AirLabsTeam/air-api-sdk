import { describe, expect, test } from "vitest";
import { AirApi } from "../../src/api";
import { createMockFetch, createClientOptions } from "../helpers/mock-fetch";
import { makeTag, makePaginatedResponse } from "../helpers/fixtures";

describe("Tags", () => {
  test("list returns paginated tags", async () => {
    const tag = makeTag();
    const mockFetch = createMockFetch({ body: makePaginatedResponse([tag]) });
    const client = new AirApi(createClientOptions(mockFetch));

    const page = await client.tags.list();
    expect(page.data).toEqual([tag]);
    expect(page.hasNextPage()).toBe(false);
    expect(mockFetch.calls[0].url).toContain("/tags");
  });

  test("list passes query params", async () => {
    const mockFetch = createMockFetch({ body: makePaginatedResponse([]) });
    const client = new AirApi(createClientOptions(mockFetch));

    await client.tags.list({ name: "test", limit: 10 });
    expect(mockFetch.calls[0].url).toContain("name=test");
    expect(mockFetch.calls[0].url).toContain("limit=10");
  });

  test("get returns a tag", async () => {
    const tag = makeTag({ id: "tag-123" });
    const mockFetch = createMockFetch({ body: tag });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.tags.get("tag-123");
    expect(result).toEqual(tag);
    expect(mockFetch.calls[0].url).toContain("/tags/tag-123");
  });

  test("create sends POST with body", async () => {
    const tag = makeTag();
    const mockFetch = createMockFetch({ status: 201, body: tag });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.tags.create({ name: "New Tag" });
    expect(result).toEqual(tag);
    expect(mockFetch.calls[0].init?.method).toBe("POST");
    const body = JSON.parse(mockFetch.calls[0].init?.body as string);
    expect(body.name).toBe("New Tag");
  });

  test("update sends PATCH", async () => {
    const mockFetch = createMockFetch({ status: 204 });
    const client = new AirApi(createClientOptions(mockFetch));

    await client.tags.update("tag-1", { name: "Updated" });
    expect(mockFetch.calls[0].init?.method).toBe("PATCH");
    expect(mockFetch.calls[0].url).toContain("/tags/tag-1");
  });

  test("delete sends DELETE", async () => {
    const mockFetch = createMockFetch({ status: 204 });
    const client = new AirApi(createClientOptions(mockFetch));

    await client.tags.delete("tag-1");
    expect(mockFetch.calls[0].init?.method).toBe("DELETE");
  });
});
