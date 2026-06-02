#!/usr/bin/env -S node --import tsx
// Acquires an OAuth bearer token via the authorization_code + PKCE flow and
// writes it to .oauth-token-cache.json for the e2e suite to pick up.
//
// The user is sent to Air's /oauth/consent page (NOT directly to the
// authorization server). Air's consent flow records the per-account grant
// and then completes the OAuth handoff. A token acquired by bypassing this
// step validates upstream but is rejected by the Air gateway with
// permission_denied / grant_revoked.
//
// Usage:
//   npm run e2e:get-token
//
// Reads from .env.test:
//   AIR_OAUTH_CLIENT_ID       (required)
//   AIR_OAUTH_CLIENT_SECRET   (required for confidential clients)
//   AIR_OAUTH_TOKEN_URL       (required, e.g. https://auth.air.inc/oauth2/token)
//   AIR_OAUTH_AUTHORIZE_URL   (required — Air's consent URL, e.g. https://app.air.inc/oauth/consent)
//   AIR_OAUTH_REDIRECT_URI    (optional, defaults to http://localhost:3000/oauth/callback)
//   AIR_OAUTH_SCOPES          (optional, space/newline separated bare scopes)

import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { randomBytes } from "node:crypto";
import { chmod, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import {
  buildAuthorizationUrl,
  exchangeAuthorizationCode,
  generatePKCEChallenge,
} from "@air/api-sdk";

loadEnv({ path: ".env.test" });

const DEFAULT_REDIRECT_URI = "http://localhost:3000/oauth/callback";
const DEFAULT_SCOPES: readonly string[] = [
  "assets.read",
  "assets.write",
  "boards.read",
  "boards.write",
  "custom_fields.read",
  "custom_fields.write",
  "tags.read",
  "tags.write",
  "workspace.read",
  "workspace_security.manage",
];
const CACHE_PATH = resolve(process.cwd(), ".oauth-token-cache.json");

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return v;
}

function requiredAuthorizeUrl(): string {
  const v = process.env.AIR_OAUTH_AUTHORIZE_URL;
  if (!v) {
    console.error(
      "Missing required env var: AIR_OAUTH_AUTHORIZE_URL\n" +
        "  This must be Air's consent URL (NOT the authorization server's /authorize endpoint).\n" +
        "  Example: AIR_OAUTH_AUTHORIZE_URL=https://app.air.inc/oauth/consent",
    );
    process.exit(1);
  }
  return v;
}

async function main(): Promise<void> {
  const clientId = required("AIR_OAUTH_CLIENT_ID");
  const clientSecret = process.env.AIR_OAUTH_CLIENT_SECRET;
  const tokenUrl = required("AIR_OAUTH_TOKEN_URL");
  const authorizeUrl = requiredAuthorizeUrl();
  const redirectUri = process.env.AIR_OAUTH_REDIRECT_URI ?? DEFAULT_REDIRECT_URI;

  // Air's /oauth/consent expects bare scope names; it manages the
  // `public-api/` resource-server prefix internally. We do NOT prepend
  // it here. (Direct authorization-server calls would need the prefix.)
  const scopeOverride = process.env.AIR_OAUTH_SCOPES;
  const scopes = scopeOverride
    ? scopeOverride.split(/\s+/).filter(Boolean)
    : [...DEFAULT_SCOPES];

  const redirect = new URL(redirectUri);
  const port = Number(redirect.port || (redirect.protocol === "https:" ? 443 : 80));
  const expectedPath = redirect.pathname;

  const { codeVerifier, codeChallenge } = generatePKCEChallenge();
  const state = randomBytes(16).toString("hex");

  const server = await listenOrFail(port, redirectUri);

  const authUrl = buildAuthorizationUrl({
    authorizeUrl,
    clientId,
    redirectUri,
    codeChallenge,
    state,
    scopes,
  });

  const code = await captureRedirectCode({
    server,
    expectedPath,
    expectedState: state,
    authUrl,
    port,
  });

  console.log("\nGot authorization code. Exchanging for token…");
  const token = await exchangeAuthorizationCode({
    tokenUrl,
    clientId,
    clientSecret,
    code,
    codeVerifier,
    redirectUri,
  });

  const expiresAt = Date.now() + token.expiresIn * 1000;
  // The cache holds a live bearer (and possibly refresh) token. writeFile's
  // `mode` only applies on creation, so chmod after to also tighten existing
  // files from prior runs.
  await writeFile(
    CACHE_PATH,
    JSON.stringify(
      {
        accessToken: token.accessToken,
        tokenType: token.tokenType,
        expiresAt,
        scope: token.scope,
        refreshToken: token.refreshToken,
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  await chmod(CACHE_PATH, 0o600);

  console.log(`\n✓ Token cached to ${CACHE_PATH}`);
  console.log(`  Expires in ~${Math.round(token.expiresIn / 60)} minutes.`);
  if (token.scope) {
    console.log(`  Scopes granted: ${token.scope}`);
  }
  console.log("\nYou can now run: npm run test:e2e");
}

function listenOrFail(port: number, redirectUri: string): Promise<Server> {
  return new Promise((resolvePromise, rejectPromise) => {
    const server = createServer();

    const onError = (err: NodeJS.ErrnoException) => {
      server.removeListener("listening", onListening);
      if (err.code === "EADDRINUSE") {
        rejectPromise(
          new Error(
            `Port ${port} is already in use, so the OAuth callback server can't bind to ${redirectUri}.\n` +
              `  Free the port (find the process with \`lsof -nP -iTCP:${port} -sTCP:LISTEN\` and kill it) and re-run.\n` +
              `  Or set AIR_OAUTH_REDIRECT_URI to a different host/port that's registered as a redirect URI for the OAuth client.`,
          ),
        );
      } else {
        rejectPromise(err);
      }
    };

    const onListening = () => {
      server.removeListener("error", onError);
      resolvePromise(server);
    };

    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port);
  });
}

interface CaptureRedirectCodeOptions {
  server: Server;
  port: number;
  expectedPath: string;
  expectedState: string;
  authUrl: string;
}

function captureRedirectCode({
  server,
  port,
  expectedPath,
  expectedState,
  authUrl,
}: CaptureRedirectCodeOptions): Promise<string> {
  return new Promise((resolvePromise, rejectPromise) => {
    server.on("request", (req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url ?? "/", `http://localhost:${port}`);
      if (url.pathname !== expectedPath) {
        res.writeHead(404).end("Not found");
        return;
      }

      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const error = url.searchParams.get("error");
      const errorDescription = url.searchParams.get("error_description");

      if (error) {
        respond(
          res,
          400,
          `OAuth error: ${error}${errorDescription ? ` — ${errorDescription}` : ""}`,
        );
        server.close();
        rejectPromise(
          new Error(`OAuth error: ${error}${errorDescription ? ` (${errorDescription})` : ""}`),
        );
        return;
      }

      if (!code) {
        respond(res, 400, "Missing `code` parameter.");
        server.close();
        rejectPromise(new Error("Callback did not include a code parameter."));
        return;
      }

      if (state !== expectedState) {
        respond(res, 400, "State mismatch — possible CSRF. Aborting.");
        server.close();
        rejectPromise(new Error("State mismatch in OAuth callback."));
        return;
      }

      respond(
        res,
        200,
        "Authorization complete. You can close this tab and return to the terminal.",
      );
      server.close();
      resolvePromise(code);
    });

    server.on("error", (err) => {
      rejectPromise(err);
    });

    console.log(`Listening on http://localhost:${port} for the OAuth callback.`);
    console.log("\nOpen this URL in your browser to authorize:\n");
    console.log(authUrl);
    console.log("");
  });
}

function respond(res: ServerResponse, status: number, message: string): void {
  res.writeHead(status, { "content-type": "text/html; charset=utf-8" });
  res.end(
    `<!doctype html><meta charset="utf-8"><title>OAuth</title><body style="font-family: system-ui; padding: 2rem"><p>${escapeHtml(message)}</p></body>`,
  );
}

function escapeHtml(s: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return s.replace(/[&<>"']/g, (c) => map[c] ?? c);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error("\n✗ Failed to acquire token:", message);
  process.exit(1);
});
