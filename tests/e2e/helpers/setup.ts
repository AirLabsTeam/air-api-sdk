import { AirApi } from "@air/api-sdk";

export const RUN_ID = `e2e-${Date.now()}`;

/** Timeout for tests that set up fixtures (uploads, board creation, etc.) */
export const SETUP_TIMEOUT = 30_000;

/** Timeout for tests that poll for eventual consistency */
export const POLL_TIMEOUT = 60_000;

export type AuthMode = "apikey" | "oauth";

export function getAuthMode(): AuthMode {
  const mode = process.env.AIR_E2E_AUTH_MODE ?? "apikey";
  if (mode !== "apikey" && mode !== "oauth") {
    throw new Error(`Invalid AIR_E2E_AUTH_MODE: ${mode}. Expected "apikey" or "oauth".`);
  }
  return mode;
}

export function getClient(): AirApi {
  const workspaceId = process.env.AIR_WORKSPACE_ID;
  const baseURL = process.env.AIR_API_BASE_URL;

  if (!workspaceId) {
    throw new Error(
      "Missing AIR_WORKSPACE_ID. Copy .env.example to .env.test and fill in credentials.",
    );
  }

  if (getAuthMode() === "oauth") {
    const accessToken = process.env._AIR_E2E_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error(
        "Missing _AIR_E2E_ACCESS_TOKEN. The global setup should have populated this when AIR_E2E_AUTH_MODE=oauth.",
      );
    }
    return new AirApi({ accessToken, workspaceId, baseURL });
  }

  const apiKey = process.env.AIR_API_KEY;
  if (!apiKey) {
    throw new Error("Missing AIR_API_KEY. Copy .env.example to .env.test and fill in credentials.");
  }
  return new AirApi({ apiKey, workspaceId, baseURL });
}

export function resourceName(suffix: string): string {
  return `${RUN_ID}-${suffix}`;
}
