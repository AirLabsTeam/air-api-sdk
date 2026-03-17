import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import type { Asset, Board } from '@air/api-sdk';
import { getClient, resourceName, SETUP_TIMEOUT, POLL_TIMEOUT } from './helpers/setup';
import { findOrCreateBoard, ensureTestAsset, waitFor } from './helpers/test-data';

const client = getClient();
let sourceBoard: Board;
let asset: Asset;
const cleanup: (() => Promise<void>)[] = [];

beforeAll(async () => {
  sourceBoard = await findOrCreateBoard(client, 'board-assets-source');
  cleanup.push(() => client.boards.delete(sourceBoard.id));
  asset = await ensureTestAsset(client, sourceBoard.id);
}, SETUP_TIMEOUT);

afterAll(async () => {
  for (const fn of cleanup) {
    try { await fn(); } catch {}
  }
});

describe('Board Assets', () => {
  test('create temp board → addAssets → removeAsset → delete board', async () => {
    const tempBoard = await client.boards.create({ title: resourceName('temp-assoc') });
    cleanup.push(() => client.boards.delete(tempBoard.id));

    // Add asset to temp board
    await client.boards.addAssets(tempBoard.id, { assetIds: [asset.id] });

    // Poll until asset appears (eventual consistency)
    const page = await waitFor(
      () => client.assets.list({ parentBoardId: tempBoard.id }),
      (p) => p.data.some((a) => a.id === asset.id),
      { retries: 15, delayMs: 2000 },
    );
    expect(page.data.some((a) => a.id === asset.id)).toBe(true);

    // Remove asset from temp board
    await client.boards.removeAsset(tempBoard.id, asset.id);

    // Poll until removed
    const afterRemove = await waitFor(
      () => client.assets.list({ parentBoardId: tempBoard.id }),
      (p) => !p.data.some((a) => a.id === asset.id),
      { retries: 15, delayMs: 2000 },
    );
    expect(afterRemove.data.some((a) => a.id === asset.id)).toBe(false);

    await client.boards.delete(tempBoard.id);
    cleanup.pop();
  }, POLL_TIMEOUT);
});
