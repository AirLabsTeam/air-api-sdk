import { AirApi } from '@air/api-sdk';

export const RUN_ID = `e2e-${Date.now()}`;

/** Timeout for tests that set up fixtures (uploads, board creation, etc.) */
export const SETUP_TIMEOUT = 30_000;

/** Timeout for tests that poll for eventual consistency */
export const POLL_TIMEOUT = 60_000;

export function getClient(): AirApi {
  const apiKey = process.env.AIR_API_KEY;
  const workspaceId = process.env.AIR_WORKSPACE_ID;

  if (!apiKey || !workspaceId) {
    throw new Error(
      'Missing AIR_API_KEY or AIR_WORKSPACE_ID. Copy .env.example to .env.test and fill in credentials.',
    );
  }

  return new AirApi({ apiKey, workspaceId, baseURL: process.env.AIR_API_BASE_URL });
}

export function resourceName(suffix: string): string {
  return `${RUN_ID}-${suffix}`;
}
