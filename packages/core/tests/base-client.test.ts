import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { AirBase } from "../src/base-client";
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
