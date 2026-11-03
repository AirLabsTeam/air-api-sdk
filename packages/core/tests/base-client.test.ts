import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { AirBase } from "../src/base-client";
import { InvalidRequestPathError } from "../src/errors";
import { encodePath } from "../src/path";
import { createMockFetch } from "./helpers/mock-fetch";

describe("AirBase constructor", () => {
  const original = {
    AIR_API_KEY: process.env.AIR_API_KEY,
    AIR_ACCESS_TOKEN: process.env.AIR_ACCESS_TOKEN,
    AIR_WORKSPACE_ID: process.env.AIR_WORKSPACE_ID,
  };

  beforeEach(() => {
    delete process.env.AIR_API_KEY;
    delete process.env.AIR_ACCESS_TOKEN;
    delete process.env.AIR_WORKSPACE_ID;
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(original)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  test("throws when neither apiKey nor accessToken is provided", () => {
    expect(() => new AirBase()).toThrow(/Authentication is required/);
  });

  test("throws when both apiKey and accessToken are provided explicitly", () => {
    expect(() => new AirBase({ apiKey: "k", accessToken: "t", workspaceId: "w" })).toThrow(
      /either `apiKey` or `accessToken`/,
    );
  });

  test("explicit apiKey wins over AIR_ACCESS_TOKEN env var", () => {
    process.env.AIR_ACCESS_TOKEN = "env-token";
    const client = new AirBase({ apiKey: "explicit-key", workspaceId: "w" });
    expect(client.apiKey).toBe("explicit-key");
    expect(client.accessToken).toBeUndefined();
  });

  test("explicit accessToken wins over AIR_API_KEY env var", () => {
    process.env.AIR_API_KEY = "env-key";
    process.env.AIR_WORKSPACE_ID = "env-w";
    const client = new AirBase({ accessToken: "explicit-token" });
    expect(client.accessToken).toBe("explicit-token");
    expect(client.apiKey).toBeUndefined();
  });

  test("throws when both AIR_API_KEY and AIR_ACCESS_TOKEN env vars are set and no option overrides", () => {
    process.env.AIR_API_KEY = "k";
    process.env.AIR_ACCESS_TOKEN = "t";
    process.env.AIR_WORKSPACE_ID = "w";
    expect(() => new AirBase()).toThrow(/Both AIR_API_KEY and AIR_ACCESS_TOKEN/);
  });

  test("throws when apiKey is provided without workspaceId", () => {
    expect(() => new AirBase({ apiKey: "k" })).toThrow(/Workspace ID is required/);
  });

  test("allows accessToken without workspaceId", () => {
    expect(() => new AirBase({ accessToken: "t" })).not.toThrow();
  });

  test("allows apiKey + workspaceId", () => {
    expect(() => new AirBase({ apiKey: "k", workspaceId: "w" })).not.toThrow();
  });

  test("reads AIR_ACCESS_TOKEN from env", () => {
    process.env.AIR_ACCESS_TOKEN = "env-token";
    const client = new AirBase();
    expect(client.accessToken).toBe("env-token");
  });
});

describe("AirBase request headers", () => {
  test("API key mode sends x-api-key and x-air-workspace-id", async () => {
    const mockFetch = createMockFetch({ body: {} });
    const client = new AirBase({
      apiKey: "my-key",
      workspaceId: "my-workspace",
      fetch: mockFetch as unknown as typeof globalThis.fetch,
      maxRetries: 0,
    });

    await client.request({ method: "GET", path: "/anything" });

    const headers = mockFetch.calls[0].init?.headers as Record<string, string>;
    expect(headers["x-api-key"]).toBe("my-key");
    expect(headers["x-air-workspace-id"]).toBe("my-workspace");
    expect(headers["authorization"]).toBeUndefined();
  });

  test("Bearer mode sends authorization and no x-api-key", async () => {
    const mockFetch = createMockFetch({ body: {} });
    const client = new AirBase({
      accessToken: "tok",
      fetch: mockFetch as unknown as typeof globalThis.fetch,
      maxRetries: 0,
    });

    await client.request({ method: "GET", path: "/anything" });

    const headers = mockFetch.calls[0].init?.headers as Record<string, string>;
    expect(headers["authorization"]).toBe("Bearer tok");
    expect(headers["x-api-key"]).toBeUndefined();
    expect(headers["x-air-workspace-id"]).toBeUndefined();
  });

  test("Bearer mode with workspaceId still includes x-air-workspace-id", async () => {
    const mockFetch = createMockFetch({ body: {} });
    const client = new AirBase({
      accessToken: "tok",
      workspaceId: "ws",
      fetch: mockFetch as unknown as typeof globalThis.fetch,
      maxRetries: 0,
    });

    await client.request({ method: "GET", path: "/anything" });

    const headers = mockFetch.calls[0].init?.headers as Record<string, string>;
    expect(headers["authorization"]).toBe("Bearer tok");
    expect(headers["x-air-workspace-id"]).toBe("ws");
  });
});

describe("AirBase request path", () => {
  function createClient() {
    const mockFetch = createMockFetch({ body: {} });
    const client = new AirBase({
      apiKey: "my-key",
      workspaceId: "my-workspace",
      fetch: mockFetch as unknown as typeof globalThis.fetch,
      maxRetries: 0,
    });
    return { client, mockFetch };
  }

  test.each([
    ["..", "/boards/board-1/assets/.."],
    [".", "/boards/board-1/assets/."],
    ["a percent-encoded ..", "/boards/board-1/assets/%2e%2e"],
    ["a percent-encoded .", "/boards/board-1/assets/%2E"],
    ["a mixed-case encoded ..", "/boards/board-1/assets/.%2E"],
    ["a trailing-encoded ..", "/boards/board-1/assets/%2e."],
    ["a .. before a query", "/boards/board-1/assets/..?x=1"],
    ["an empty", "/boards/board-1/assets/"],
    ["an empty middle", "/boards//assets/asset-1"],
    ["a leading ..", "../assets/asset-1"],
    ["a first", "assets/asset-1"],
    ["a fragment after a", "/boards/board-2#/assets/asset-1"],
  ])("rejects %s segment without sending a request", async (_label, path) => {
    const { client, mockFetch } = createClient();

    await expect(client.request({ method: "DELETE", path })).rejects.toBeInstanceOf(
      InvalidRequestPathError,
    );
    expect(mockFetch.calls).toHaveLength(0);
  });

  test.each([
    // Forms the server was probed with on QA and prod and does not resolve, so
    // only `new URL` could move them, and it does not.
    ["a double-encoded ..", "/assets/%252e%252e", "/v1/assets/%252e%252e"],
    ["a full-width ..", "/assets/．．", "/v1/assets/%EF%BC%8E%EF%BC%8E"],
    ["an overlong ..", "/assets/%c0%ae%c0%ae", "/v1/assets/%c0%ae%c0%ae"],
    ["a path parameter on a ..", "/assets/..;x", "/v1/assets/..;x"],
    ["a trailing space after a ..", "/assets/.. ", "/v1/assets/..%20"],
    ["a newline in an id", "/assets/abc\n", "/v1/assets/abc%0A"],
    ["a raw backslash", "/assets\\..\\boards", "/v1/assets%5C..%5Cboards"],
    ["an encoded slash in an id", "/assets/..%2Fboards", "/v1/assets/..%2Fboards"],
    ["a stray percent", "/assets/100%", "/v1/assets/100%"],
    // `new URL` strips a raw tab anywhere, which would turn this into `..`.
    ["a tab inside a ..", "/assets/.\t.", "/v1/assets/.%09."],
  ])("sends %s inside its segment", async (_label, path, pathname) => {
    const { client, mockFetch } = createClient();

    await client.request({ method: "GET", path });

    expect(new URL(mockFetch.calls[0].url).pathname).toBe(pathname);
  });

  test.each([
    ["/../assets/asset-1", 'Invalid request path "/../assets/asset-1": a segment is "." or "..".'],
    ["assets/x", 'Invalid request path "assets/x": it does not start with "/".'],
    [
      "/assets/x#y",
      'Invalid request path "/assets/x": it contains "#", and a fragment is never sent.',
    ],
    [
      "/assets//x",
      'Invalid request path "/assets//x": a segment is empty, for example from a missing id.',
    ],
    ["/assets/..", 'Invalid request path "/assets/..": a segment is "." or "..".'],
    ["/assets/%2E%2e", 'Invalid request path "/assets/%2E%2e": a segment is "." or "..".'],
  ])("says why %s is rejected", async (path, message) => {
    const { client } = createClient();

    await expect(client.request({ method: "GET", path })).rejects.toThrow(message);
  });

  test("says a fragment is the problem even when it follows a query", async () => {
    const { client } = createClient();

    await expect(client.request({ method: "GET", path: "/assets?x=1#y" })).rejects.toThrow(
      'Invalid request path "/assets": it contains "#", and a fragment is never sent.',
    );
  });

  test("names the error class", async () => {
    const { client } = createClient();

    const error = await client
      .request({ method: "GET", path: "/assets/.." })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(InvalidRequestPathError);
    expect((error as Error).name).toBe("InvalidRequestPathError");
  });

  test("sends an id with a literal percent sign that is not an escape", async () => {
    const { client, mockFetch } = createClient();

    await client.request({ method: "GET", path: encodePath`/tags/${"50%"}` });
    await client.request({ method: "GET", path: encodePath`/tags/${"a%41"}` });
    await client.request({ method: "GET", path: encodePath`/tags/${"100%zz"}` });

    expect(new URL(mockFetch.calls[0].url).pathname).toBe("/v1/tags/50%25");
    expect(new URL(mockFetch.calls[1].url).pathname).toBe("/v1/tags/a%2541");
    expect(new URL(mockFetch.calls[2].url).pathname).toBe("/v1/tags/100%25zz");
  });

  test("sends a number id built with encodePath, as a template literal did", async () => {
    const { client, mockFetch } = createClient();

    await client.request({ method: "GET", path: encodePath`/tags/${123}` });

    expect(new URL(mockFetch.calls[0].url).pathname).toBe("/v1/tags/123");
  });

  test("rejects the root path, where a one-segment template with a missing id ends up", async () => {
    const { client, mockFetch } = createClient();

    await expect(client.request({ method: "GET", path: "/" })).rejects.toThrow(
      'Invalid request path "/": a segment is empty, for example from a missing id.',
    );
    await expect(
      client.request({ method: "GET", path: encodePath`/${""}` }),
    ).rejects.toBeInstanceOf(InvalidRequestPathError);
    expect(mockFetch.calls).toHaveLength(0);
  });

  test("rejects a missing id built with encodePath", async () => {
    const { client, mockFetch } = createClient();
    const missing = undefined as unknown as string;

    await expect(
      client.request({ method: "DELETE", path: encodePath`/tags/${missing}` }),
    ).rejects.toThrow(
      'Invalid request path "/tags/": a segment is empty, for example from a missing id.',
    );
    expect(mockFetch.calls).toHaveLength(0);
  });

  test("rejects a .. id built with encodePath", async () => {
    const { client, mockFetch } = createClient();

    await expect(
      client.request({ method: "DELETE", path: encodePath`/tags/${".."}` }),
    ).rejects.toThrow('Invalid request path "/tags/..": a segment is "." or "..".');
    expect(mockFetch.calls).toHaveLength(0);
  });

  test("rejects a path that is not a string", async () => {
    const { client, mockFetch } = createClient();
    const missing = undefined as unknown as string;

    await expect(client.request({ method: "GET", path: missing })).rejects.toThrow(
      /Invalid request path of type undefined/,
    );
    await expect(
      client.request({ method: "GET", path: null as unknown as string }),
    ).rejects.toThrow("Invalid request path of type null.");
    expect(mockFetch.calls).toHaveLength(0);
  });

  test("names the type of a path JSON cannot serialize", async () => {
    const { client } = createClient();
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    await expect(client.request({ method: "GET", path: 1n as unknown as string })).rejects.toThrow(
      "Invalid request path of type bigint.",
    );
    await expect(
      client.request({ method: "GET", path: circular as unknown as string }),
    ).rejects.toThrow("Invalid request path of type object.");
  });

  test("leaves a query out of the error message", async () => {
    const { client } = createClient();

    const error = await client
      .request({ method: "GET", path: "/assets/..?token=secret" })
      .catch((caught: Error) => caught);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('Invalid request path "/assets/..":');
    expect((error as Error).message).not.toContain("secret");
  });

  test("leaves a fragment out of the error message", async () => {
    const { client } = createClient();

    const error = await client
      .request({ method: "GET", path: "/assets/x#access_token=secret" })
      .catch((caught: Error) => caught);

    expect((error as Error).message).toContain('Invalid request path "/assets/x":');
    expect((error as Error).message).not.toContain("secret");
  });

  test("rejects without sending or retrying", async () => {
    const mockFetch = createMockFetch({ body: {} });
    const client = new AirBase({
      apiKey: "my-key",
      workspaceId: "my-workspace",
      fetch: mockFetch as unknown as typeof globalThis.fetch,
      maxRetries: 3,
    });

    await expect(client.request({ method: "GET", path: "/assets/.." })).rejects.toThrow(
      'Invalid request path "/assets/..": a segment is "." or "..".',
    );
    expect(mockFetch.calls).toHaveLength(0);
  });

  test("escapes control characters in the error message", async () => {
    const { client } = createClient();

    await expect(client.request({ method: "GET", path: "/assets//\u0007" })).rejects.toThrow(
      'Invalid request path "/assets//\\u0007"',
    );
  });

  test("sends a raw path that `new URL` only percent-encodes", async () => {
    const { client, mockFetch } = createClient();

    await client.request({ method: "GET", path: "/assets/my asset" });
    await client.request({ method: "GET", path: "/assets/café" });

    expect(new URL(mockFetch.calls[0].url).pathname).toBe("/v1/assets/my%20asset");
    expect(new URL(mockFetch.calls[1].url).pathname).toBe("/v1/assets/caf%C3%A9");
  });

  test("checks only the path, not a query written into it", async () => {
    const { client, mockFetch } = createClient();

    await client.request({ method: "GET", path: "/assets?redirect=/a/../b" });

    const url = new URL(mockFetch.calls[0].url);
    expect(url.pathname).toBe("/v1/assets");
    expect(url.searchParams.get("redirect")).toBe("/a/../b");
  });

  test("leaves a query written into the path to `new URL`, as before", async () => {
    const { client, mockFetch } = createClient();

    await client.request({ method: "GET", path: "/assets?name=x " });

    expect(new URL(mockFetch.calls[0].url).search).toBe("?name=x");
  });

  test("sends the rest of a query written into the path as before", async () => {
    const { client, mockFetch } = createClient();

    await client.request({ method: "GET", path: "/assets?ids[]=1&f|g=^" });

    expect(new URL(mockFetch.calls[0].url).search).toBe("?ids[]=1&f|g=^");
  });

  test("accepts a base URL with no path", async () => {
    const mockFetch = createMockFetch({ body: {} });
    const client = new AirBase({
      apiKey: "my-key",
      workspaceId: "my-workspace",
      baseURL: "http://localhost:3000",
      fetch: mockFetch as unknown as typeof globalThis.fetch,
      maxRetries: 0,
    });

    await client.request({ method: "GET", path: "/assets/asset-1" });

    expect(new URL(mockFetch.calls[0].url).pathname).toBe("/assets/asset-1");
  });
});

describe("AirBase query serialization", () => {
  function createClient() {
    const mockFetch = createMockFetch({ body: {} });
    const client = new AirBase({
      apiKey: "my-key",
      workspaceId: "my-workspace",
      fetch: mockFetch as unknown as typeof globalThis.fetch,
      maxRetries: 0,
    });
    return { client, mockFetch };
  }

  test("omits null and undefined query values", async () => {
    const { client, mockFetch } = createClient();

    await client.request({
      method: "GET",
      path: "/boards",
      query: { cursor: null, name: undefined, limit: 10 },
    });

    const url = new URL(mockFetch.calls[0].url);
    expect(url.searchParams.has("cursor")).toBe(false);
    expect(url.searchParams.has("name")).toBe(false);
    expect(url.searchParams.get("limit")).toBe("10");
  });

  test("sends a cursor string unchanged", async () => {
    const { client, mockFetch } = createClient();

    await client.request({
      method: "GET",
      path: "/boards",
      query: { cursor: "bnVsbA" },
    });

    const url = new URL(mockFetch.calls[0].url);
    expect(url.searchParams.get("cursor")).toBe("bnVsbA");
  });
});
