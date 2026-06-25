import { describe, expect, test } from "vitest";
import { AirApi } from "../../src/api";
import { createMockFetch, createClientOptions } from "../helpers/mock-fetch";
import { makeLibrary, makePaginatedResponse } from "../helpers/fixtures";

describe("Libraries", () => {
  test("list returns paginated libraries", async () => {
    const library = makeLibrary();
    const mockFetch = createMockFetch({ body: makePaginatedResponse([library]) });
    const client = new AirApi(createClientOptions(mockFetch));

    const page = await client.libraries.list();
    expect(page.data).toEqual([library]);
  });

  test("list forwards the search param", async () => {
    const mockFetch = createMockFetch({ body: makePaginatedResponse([]) });
    const client = new AirApi(createClientOptions(mockFetch));

    await client.libraries.list({ search: "brand" });
    expect(mockFetch.calls[0].url).toContain("search=brand");
  });

  test("get returns a library", async () => {
    const library = makeLibrary({ id: "library-123" });
    const mockFetch = createMockFetch({ body: library });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.libraries.get("library-123");
    expect(result).toEqual(library);
    expect(mockFetch.calls[0].url).toContain("/libraries/library-123");
  });

  test("create sends POST and returns the library", async () => {
    const library = makeLibrary();
    const mockFetch = createMockFetch({ status: 201, body: library });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.libraries.create({ title: "New Library" });
    expect(result).toEqual(library);
    expect(mockFetch.calls[0].init?.method).toBe("POST");
    const body = JSON.parse(mockFetch.calls[0].init?.body as string);
    expect(body.title).toBe("New Library");
  });

  test("update sends PATCH", async () => {
    const mockFetch = createMockFetch({ status: 204 });
    const client = new AirApi(createClientOptions(mockFetch));

    await client.libraries.update("library-1", { title: "Renamed" });
    expect(mockFetch.calls[0].init?.method).toBe("PATCH");
    expect(mockFetch.calls[0].url).toContain("/libraries/library-1");
    const body = JSON.parse(mockFetch.calls[0].init?.body as string);
    expect(body.title).toBe("Renamed");
  });

  test("update forwards a null description to clear the field", async () => {
    const mockFetch = createMockFetch({ status: 204 });
    const client = new AirApi(createClientOptions(mockFetch));

    await client.libraries.update("library-1", { description: null });
    const body = JSON.parse(mockFetch.calls[0].init?.body as string);
    expect(body.description).toBeNull();
  });

  test("delete sends DELETE", async () => {
    const mockFetch = createMockFetch({ status: 204 });
    const client = new AirApi(createClientOptions(mockFetch));

    await client.libraries.delete("library-1");
    expect(mockFetch.calls[0].init?.method).toBe("DELETE");
    expect(mockFetch.calls[0].url).toContain("/libraries/library-1");
  });
});
