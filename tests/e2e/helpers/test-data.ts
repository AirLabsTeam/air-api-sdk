import type { AirApi } from '@air/api-sdk';
import { resourceName } from './setup';

/**
 * Poll until a condition is true, with retries and delay between attempts.
 */
export async function waitFor<T>(
  fn: () => Promise<T>,
  predicate: (result: T) => boolean,
  { retries = 10, delayMs = 1000 } = {},
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    const result = await fn();
    if (predicate(result)) return result;
    if (i < retries - 1) await new Promise((r) => setTimeout(r, delayMs));
  }
  return fn();
}

export async function findOrCreateBoard(client: AirApi, name: string) {
  const fullName = resourceName(name);
  const page = await client.boards.list({ name: fullName });
  if (page.data.length > 0) {
    return page.data[0];
  }
  return client.boards.create({ title: fullName });
}

export async function ensureTestAsset(client: AirApi, boardId: string) {
  const page = await client.assets.list({ parentBoardId: boardId });
  if (page.data.length > 0) {
    return page.data[0];
  }

  // Upload a tiny PNG (1x1 pixel) into the board
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
    'base64',
  );

  const result = await client.uploads.uploadFile(
    { buffer: png, fileName: resourceName('test-asset'), ext: 'png', mime: 'image/png' },
    { parentBoardId: boardId },
  );

  return client.assets.get(result.assetId);
}

export async function cleanupResources(client: AirApi, runId: string) {
  // Clean up boards
  try {
    const boards = await client.boards.list({ name: runId });
    for (const board of boards.data) {
      try { await client.boards.delete(board.id); } catch {}
    }
  } catch {}

  // Clean up tags
  try {
    const tags = await client.tags.list({ name: runId });
    for (const tag of tags.data) {
      try { await client.tags.delete(tag.id); } catch {}
    }
  } catch {}

  // Clean up custom fields
  try {
    for await (const cf of client.customFields.list()) {
      if (cf.name.startsWith(runId)) {
        try { await client.customFields.delete(cf.id); } catch {}
      }
    }
  } catch {}
}
