#!/usr/bin/env node
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
//   AIR_OAUTH_SCOPES          (optional, space/newline separated bare scopes; we prepend public-api/)

import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import {
  buildAuthorizationUrl,
  exchangeAuthorizationCode,
  generatePKCEChallenge,
} from "@air/api-sdk";

loadEnv({ path: ".env.test" });

const DEFAULT_REDIRECT_URI = "http://localhost:3000/oauth/callback";
const DEFAULT_SCOPES = [
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

function required(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return v;
}

function requiredAuthorizeUrl() {
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

async function main() {
  const clientId = required("AIR_OAUTH_CLIENT_ID");
  const clientSecret = process.env.AIR_OAUTH_CLIENT_SECRET;
  const tokenUrl = required("AIR_OAUTH_TOKEN_URL");
  const authorizeUrl = requiredAuthorizeUrl();
  const redirectUri = process.env.AIR_OAUTH_REDIRECT_URI ?? DEFAULT_REDIRECT_URI;

  // Air's /oauth/consent expects bare scope names — it manages the
  // `public-api/` resource-server prefix internally. We do NOT prepend
  // it here. (Direct authorization-server calls would need the prefix.)
  const scopeOverride = process.env.AIR_OAUTH_SCOPES;
  const scopes = scopeOverride ? scopeOverride.split(/\s+/).filter(Boolean) : DEFAULT_SCOPES;

  const redirect = new URL(redirectUri);
  const requestedPort = Number(redirect.port || (redirect.protocol === "https:" ? 443 : 80));
  const expectedPath = redirect.pathname;
  const maxPortAttempts = Number(process.env.AIR_OAUTH_MAX_PORT_ATTEMPTS ?? 10);

  const { codeVerifier, codeChallenge } = generatePKCEChallenge();
  const state = randomBytes(16).toString("hex");

  const { server, port: actualPort } = await listenWithFallback({
    startPort: requestedPort,
    maxAttempts: maxPortAttempts,
  });

  if (actualPort !== requestedPort) {
    redirect.port = String(actualPort);
    console.warn(
      `Port ${requestedPort} was busy; falling back to ${actualPort}. NOTE: the OAuth client must have ${redirect.toString()} registered as a redirect URI, otherwise the authorize request will be rejected.`,
    );
  }
  const effectiveRedirectUri = redirect.toString();

  const authUrl = buildAuthorizationUrl({
    authorizeUrl,
    clientId,
    redirectUri: effectiveRedirectUri,
    codeChallenge,
    state,
    scopes,
  });

  const code = await captureRedirectCode({
    server,
    expectedPath,
    expectedState: state,
    authUrl,
    port: actualPort,
  });

  console.log("\nGot authorization code. Exchanging for token…");
  const token = await exchangeAuthorizationCode({
    tokenUrl,
    clientId,
    clientSecret,
    code,
    codeVerifier,
    redirectUri: effectiveRedirectUri,
  });

  const expiresAt = Date.now() + token.expiresIn * 1000;
  await writeFile(
    CACHE_PATH,
    JSON.stringify(
      {
        accessToken: token.accessToken,
        tokenType: token.tokenType,
        expiresAt,
        scope: token.scope,
      },
      null,
      2,
    ),
  );

  console.log(`\n✓ Token cached to ${CACHE_PATH}`);
  console.log(`  Expires in ~${Math.round(token.expiresIn / 60)} minutes.`);
  if (token.scope) {
    console.log(`  Scopes granted: ${token.scope}`);
  }
  console.log("\nYou can now run: npm run test:e2e");
}

function listenWithFallback({ startPort, maxAttempts }) {
  let port = startPort;
  const attemptedPorts = [];

  return new Promise((resolvePromise, rejectPromise) => {
    const tryNext = () => {
      if (attemptedPorts.length >= maxAttempts) {
        rejectPromise(
          new Error(
            `Could not bind any port in [${startPort}, ${startPort + maxAttempts - 1}]. Tried: ${attemptedPorts.join(", ")}.`,
          ),
        );
        return;
      }

      attemptedPorts.push(port);
      const server = createServer();

      const onError = (err) => {
        server.removeListener("listening", onListening);
        if (err.code === "EADDRINUSE") {
          server.close();
          port += 1;
          tryNext();
        } else {
          rejectPromise(err);
        }
      };

      const onListening = () => {
        server.removeListener("error", onError);
        resolvePromise({ server, port });
      };

      server.once("error", onError);
      server.once("listening", onListening);
      server.listen(port);
    };

    tryNext();
  });
}

function captureRedirectCode({ server, port, expectedPath, expectedState, authUrl }) {
  return new Promise((resolvePromise, rejectPromise) => {
    server.on("request", (req, res) => {
      const url = new URL(req.url, `http://localhost:${port}`);
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

function respond(res, status, message) {
  res.writeHead(status, { "content-type": "text/html; charset=utf-8" });
  res.end(
    `<!doctype html><meta charset="utf-8"><title>OAuth</title><body style="font-family: system-ui; padding: 2rem"><p>${escapeHtml(message)}</p></body>`,
  );
}

function escapeHtml(s) {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}

main().catch((err) => {
  console.error("\n✗ Failed to acquire token:", err.message || err);
  process.exit(1);
});
