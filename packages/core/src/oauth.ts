import { APIError, ConnectionError } from "./errors";

/**
 * How the client authenticates to the OAuth token endpoint.
 *
 * - `"basic"` (default for confidential clients) — HTTP Basic auth header
 *   `Authorization: Basic base64(client_id:client_secret)`. Preferred per
 *   RFC 6749 §2.3.1.
 * - `"body"` — credentials sent as `client_id` (+ `client_secret`) form
 *   fields in the POST body. Useful when an upstream load balancer strips
 *   `Authorization` headers, or for public clients with no secret.
 */
export type OAuthClientAuthMethod = "basic" | "body";

export interface OAuthAccessToken {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  scope?: string;
  refreshToken?: string;
}

interface RawTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
  refresh_token?: string;
}

export interface BuildAuthorizationUrlOptions {
  authorizeUrl: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state: string;
  scopes?: string | readonly string[];
}

/**
 * Builds the OAuth 2.0 authorization URL for the authorization_code + PKCE
 * flow. The user is redirected to this URL in a browser; after login + consent
 * the IdP redirects back to `redirectUri` with a `code` query parameter.
 */
export function buildAuthorizationUrl(options: BuildAuthorizationUrlOptions): string {
  const url = new URL(options.authorizeUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", options.clientId);
  url.searchParams.set("redirect_uri", options.redirectUri);
  url.searchParams.set("state", options.state);
  url.searchParams.set("code_challenge", options.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  if (options.scopes !== undefined) {
    const scope = Array.isArray(options.scopes)
      ? options.scopes.join(" ")
      : (options.scopes as string);
    if (scope.length > 0) {
      url.searchParams.set("scope", scope);
    }
  }
  return url.toString();
}

export interface ExchangeAuthorizationCodeOptions {
  tokenUrl: string;
  clientId: string;
  clientSecret?: string;
  code: string;
  codeVerifier: string;
  redirectUri: string;
  /**
   * Defaults to `"basic"` for confidential clients (those with a
   * `clientSecret`). Public clients always send `client_id` in the body.
   */
  clientAuthMethod?: OAuthClientAuthMethod;
  fetch?: typeof globalThis.fetch;
}

/**
 * Exchanges an authorization code for an access token using PKCE. Confidential
 * clients (`clientSecret` provided) authenticate via the method chosen with
 * `clientAuthMethod`. Public clients always send `client_id` in the body.
 */
export async function exchangeAuthorizationCode(
  options: ExchangeAuthorizationCodeOptions,
): Promise<OAuthAccessToken> {
  const fetchFn = options.fetch ?? globalThis.fetch;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: options.code,
    code_verifier: options.codeVerifier,
    redirect_uri: options.redirectUri,
  });

  const headers: Record<string, string> = {
    "content-type": "application/x-www-form-urlencoded",
  };

  if (options.clientSecret === undefined) {
    body.set("client_id", options.clientId);
  } else {
    applyClientAuth(headers, body, {
      clientId: options.clientId,
      clientSecret: options.clientSecret,
      method: options.clientAuthMethod ?? "basic",
    });
  }

  return executeTokenRequest(fetchFn, options.tokenUrl, headers, body.toString());
}

function applyClientAuth(
  headers: Record<string, string>,
  body: URLSearchParams,
  args: { clientId: string; clientSecret: string; method: OAuthClientAuthMethod },
): void {
  if (args.method === "basic") {
    headers["authorization"] = `Basic ${base64Encode(`${args.clientId}:${args.clientSecret}`)}`;
  } else {
    body.set("client_id", args.clientId);
    body.set("client_secret", args.clientSecret);
  }
}

async function executeTokenRequest(
  fetchFn: typeof globalThis.fetch,
  tokenUrl: string,
  headers: Record<string, string>,
  body: string,
): Promise<OAuthAccessToken> {
  let response: Response;
  try {
    response = await fetchFn(tokenUrl, { method: "POST", headers, body });
  } catch (error) {
    throw new ConnectionError(error instanceof Error ? error.message : "Connection failed");
  }
  if (!response.ok) {
    throw await APIError.fromResponse(response);
  }
  const raw = (await response.json()) as RawTokenResponse;
  return {
    accessToken: raw.access_token,
    tokenType: raw.token_type,
    expiresIn: raw.expires_in,
    scope: raw.scope,
    refreshToken: raw.refresh_token,
  };
}

function base64Encode(input: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(input, "utf-8").toString("base64");
  }
  // Browser fallback
  return btoa(input);
}
