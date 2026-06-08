import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const CACHE_PATH = resolve(process.cwd(), ".oauth-token-cache.json");

interface CachedToken {
  accessToken: string;
  tokenType: string;
  expiresAt: number;
  scope?: string;
}

export default async function setup(): Promise<void> {
  const mode = process.env.AIR_E2E_AUTH_MODE ?? "apikey";
  if (mode !== "oauth") return;

  let cached: CachedToken;
  try {
    cached = JSON.parse(await readFile(CACHE_PATH, "utf-8")) as CachedToken;
  } catch {
    throw new Error(
      `AIR_E2E_AUTH_MODE=oauth but no token cache found at ${CACHE_PATH}. Run \`npm run e2e:get-token\` to acquire one via the PKCE flow.`,
    );
  }

  if (cached.expiresAt <= Date.now()) {
    throw new Error(
      `OAuth token at ${CACHE_PATH} is expired. Run \`npm run e2e:get-token\` to refresh.`,
    );
  }

  process.env._AIR_E2E_ACCESS_TOKEN = cached.accessToken;

  const minutesLeft = Math.round((cached.expiresAt - Date.now()) / 60_000);
  console.log(
    `[e2e] Authenticating via OAuth bearer token (expires in ${minutesLeft}m${cached.scope ? `, scope: ${cached.scope}` : ""})`,
  );
}
