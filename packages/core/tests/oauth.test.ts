import { describe, expect, test } from "vitest";
import { buildAuthorizationUrl, exchangeAuthorizationCode } from "../src/oauth";
import { AuthenticationError } from "../src/errors";
import { createMockFetch } from "./helpers/mock-fetch";

const TOKEN_URL = "https://auth.example.com/oauth2/token";
const AUTHORIZE_URL = "https://auth.example.com/oauth2/authorize";
const REDIRECT_URI = "http://localhost:3000/oauth/callback";

function rawToken(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    access_token: "the-access-token",
    token_type: "Bearer",
    expires_in: 3600,
    ...overrides,
  };
}

describe("buildAuthorizationUrl", () => {
  test("constructs a URL with all required PKCE params and joined scope", () => {
    const url = new URL(
      buildAuthorizationUrl({
        authorizeUrl: AUTHORIZE_URL,
        clientId: "cid",
        redirectUri: REDIRECT_URI,
        codeChallenge: "ch1",
        state: "st1",
        scopes: ["public-api/assets.read", "public-api/boards.read"],
      }),
    );

    expect(url.origin + url.pathname).toBe(AUTHORIZE_URL);
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("client_id")).toBe("cid");
    expect(url.searchParams.get("redirect_uri")).toBe(REDIRECT_URI);
    expect(url.searchParams.get("state")).toBe("st1");
    expect(url.searchParams.get("code_challenge")).toBe("ch1");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("scope")).toBe("public-api/assets.read public-api/boards.read");
  });

  test("omits scope when not provided", () => {
    const url = new URL(
      buildAuthorizationUrl({
        authorizeUrl: AUTHORIZE_URL,
        clientId: "cid",
        redirectUri: REDIRECT_URI,
        codeChallenge: "ch1",
        state: "st1",
      }),
    );
    expect(url.searchParams.has("scope")).toBe(false);
  });
});

describe("exchangeAuthorizationCode", () => {
  test("confidential client defaults to Basic auth", async () => {
    const mockFetch = createMockFetch({ body: rawToken() });
    await exchangeAuthorizationCode({
      tokenUrl: TOKEN_URL,
      clientId: "cid",
      clientSecret: "csecret",
      code: "auth-code",
      codeVerifier: "verifier",
      redirectUri: REDIRECT_URI,
      fetch: mockFetch as unknown as typeof globalThis.fetch,
    });

    const call = mockFetch.calls[0];
    const headers = call.init?.headers as Record<string, string>;
    expect(headers["authorization"]).toBe(`Basic ${Buffer.from("cid:csecret").toString("base64")}`);
    const body = new URLSearchParams(call.init?.body as string);
    expect(body.get("grant_type")).toBe("authorization_code");
    expect(body.get("code")).toBe("auth-code");
    expect(body.get("code_verifier")).toBe("verifier");
    expect(body.get("redirect_uri")).toBe(REDIRECT_URI);
    expect(body.has("client_id")).toBe(false);
    expect(body.has("client_secret")).toBe(false);
  });

  test("confidential client with body method puts credentials in the body", async () => {
    const mockFetch = createMockFetch({ body: rawToken() });
    await exchangeAuthorizationCode({
      tokenUrl: TOKEN_URL,
      clientId: "cid",
      clientSecret: "csecret",
      code: "auth-code",
      codeVerifier: "verifier",
      redirectUri: REDIRECT_URI,
      clientAuthMethod: "body",
      fetch: mockFetch as unknown as typeof globalThis.fetch,
    });

    const call = mockFetch.calls[0];
    const headers = call.init?.headers as Record<string, string>;
    expect(headers["authorization"]).toBeUndefined();
    const body = new URLSearchParams(call.init?.body as string);
    expect(body.get("client_id")).toBe("cid");
    expect(body.get("client_secret")).toBe("csecret");
  });

  test("public client always sends client_id in body and never Authorization", async () => {
    const mockFetch = createMockFetch({ body: rawToken() });
    await exchangeAuthorizationCode({
      tokenUrl: TOKEN_URL,
      clientId: "cid",
      code: "auth-code",
      codeVerifier: "verifier",
      redirectUri: REDIRECT_URI,
      fetch: mockFetch as unknown as typeof globalThis.fetch,
    });

    const call = mockFetch.calls[0];
    const headers = call.init?.headers as Record<string, string>;
    expect(headers["authorization"]).toBeUndefined();
    const body = new URLSearchParams(call.init?.body as string);
    expect(body.get("client_id")).toBe("cid");
    expect(body.has("client_secret")).toBe(false);
  });

  test("surfaces refresh_token when the server returns one", async () => {
    const mockFetch = createMockFetch({
      body: rawToken({ refresh_token: "the-refresh-token", scope: "public-api/assets.read" }),
    });
    const token = await exchangeAuthorizationCode({
      tokenUrl: TOKEN_URL,
      clientId: "cid",
      clientSecret: "csecret",
      code: "auth-code",
      codeVerifier: "verifier",
      redirectUri: REDIRECT_URI,
      fetch: mockFetch as unknown as typeof globalThis.fetch,
    });

    expect(token).toEqual({
      accessToken: "the-access-token",
      tokenType: "Bearer",
      expiresIn: 3600,
      scope: "public-api/assets.read",
      refreshToken: "the-refresh-token",
    });
  });

  test("refreshToken is undefined when the server omits it", async () => {
    const mockFetch = createMockFetch({ body: rawToken() });
    const token = await exchangeAuthorizationCode({
      tokenUrl: TOKEN_URL,
      clientId: "cid",
      clientSecret: "csecret",
      code: "auth-code",
      codeVerifier: "verifier",
      redirectUri: REDIRECT_URI,
      fetch: mockFetch as unknown as typeof globalThis.fetch,
    });
    expect(token.refreshToken).toBeUndefined();
  });

  test("throws APIError on non-2xx", async () => {
    const mockFetch = createMockFetch({ status: 401, body: { message: "bad code" } });
    await expect(
      exchangeAuthorizationCode({
        tokenUrl: TOKEN_URL,
        clientId: "cid",
        clientSecret: "csecret",
        code: "bad",
        codeVerifier: "v",
        redirectUri: REDIRECT_URI,
        fetch: mockFetch as unknown as typeof globalThis.fetch,
      }),
    ).rejects.toBeInstanceOf(AuthenticationError);
  });
});
