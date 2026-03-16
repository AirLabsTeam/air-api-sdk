import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import type { Asset, Board } from '@air/api-sdk';
import { getClient, resourceName, SETUP_TIMEOUT, POLL_TIMEOUT } from './helpers/setup';
import { findOrCreateBoard, ensureTestAsset, waitFor } from './helpers/test-data';

const client = getClient();
let board: Board;
let asset: Asset;
const cleanup: (() => Promise<void>)[] = [];

beforeAll(async () => {
  board = await findOrCreateBoard(client, 'assets-board');
  cleanup.push(() => client.boards.delete(board.id));
  asset = await ensureTestAsset(client, board.id);
}, SETUP_TIMEOUT);

afterAll(async () => {
  for (const fn of cleanup) {
    try { await fn(); } catch {}
  }
});

describe('Assets', () => {
  test('list assets in board', async () => {
    // Poll — upload may not be immediately visible
    const page = await waitFor(
      () => client.assets.list({ parentBoardId: board.id }),
      (p) => p.data.length >= 1,
      { retries: 15, delayMs: 2000 },
    );
    expect(page.data).toBeInstanceOf(Array);
    expect(page.data.length).toBeGreaterThanOrEqual(1);
  }, POLL_TIMEOUT);

  test('get single asset', async () => {
    const fetched = await client.assets.get(asset.id);
    expect(fetched.id).toBe(asset.id);
    expect(fetched.coverVersion).toBeDefined();
    expect(fetched.coverVersion.id).toBeDefined();
  });

  test('listVersions → getVersion → getVersionDownloadUrl', async () => {
    // Poll — version may not be immediately available
    const versions = await waitFor(
      () => client.assets.listVersions(asset.id),
      (v) => v.data.length >= 1,
      { retries: 15, delayMs: 2000 },
    );
    expect(versions.data).toBeInstanceOf(Array);
    expect(versions.data.length).toBeGreaterThanOrEqual(1);
    expect(versions.total).toBeGreaterThanOrEqual(1);

    const version = versions.data[0];
    const fetched = await client.assets.getVersion(asset.id, version.id);
    expect(fetched.id).toBe(version.id);
    expect(typeof fetched.fileName).toBe('string');

    const download = await client.assets.getVersionDownloadUrl(asset.id, version.id);
    expect(download.url).toBeDefined();
    expect(typeof download.url).toBe('string');
  }, POLL_TIMEOUT);

  test('updateVersion title and revert', async () => {
    const versionId = asset.coverVersion.id;
    const original = await client.assets.getVersion(asset.id, versionId);
    const originalTitle = original.title;

    const tempTitle = resourceName('version-title');
    await client.assets.updateVersion(asset.id, versionId, { title: tempTitle });

    const updated = await client.assets.getVersion(asset.id, versionId);
    expect(updated.title).toBe(tempTitle);

    // Revert
    await client.assets.updateVersion(asset.id, versionId, { title: originalTitle });
    const reverted = await client.assets.getVersion(asset.id, versionId);
    expect(reverted.title).toBe(originalTitle);
  });

  test('addVersionTag → removeVersionTag', async () => {
    const tag = await client.tags.create({ name: resourceName('version-tag') });
    cleanup.push(() => client.tags.delete(tag.id));

    const versionId = asset.coverVersion.id;

    // Add tag — response may not include tags, so verify via getVersion
    await client.assets.addVersionTag(asset.id, versionId, { id: tag.id });

    const afterAdd = await client.assets.getVersion(asset.id, versionId);
    const hasTag = afterAdd.tags?.some((t) => t.id === tag.id) ?? false;
    expect(hasTag).toBe(true);

    await client.assets.removeVersionTag(asset.id, versionId, tag.id);

    // Verify removed
    const afterRemove = await client.assets.getVersion(asset.id, versionId);
    const stillHasTag = afterRemove.tags?.some((t) => t.id === tag.id) ?? false;
    expect(stillHasTag).toBe(false);

    await client.tags.delete(tag.id);
    cleanup.pop();
  });

  test('listBoards for asset', async () => {
    const page = await client.assets.listBoards(asset.id);
    expect(page.data).toBeInstanceOf(Array);
    expect(page.data.length).toBeGreaterThanOrEqual(1);
    expect(page.data.some((b) => b.id === board.id)).toBe(true);
  });

  test('setCustomField on asset → clear', async () => {
    const cf = await client.customFields.create({
      name: resourceName('asset-cf'),
      type: 'plain-text',
    });
    cleanup.push(() => client.customFields.delete(cf.id));

    await client.assets.setCustomField(asset.id, cf.id, { value: 'test-value' });

    // Clear
    await client.assets.setCustomField(asset.id, cf.id, { value: null });

    await client.customFields.delete(cf.id);
    cleanup.pop();
  });

  test('auto-pagination with for-await', async () => {
    const items: Asset[] = [];
    let count = 0;
    for await (const a of client.assets.list({ parentBoardId: board.id, limit: 2 })) {
      items.push(a);
      count++;
      if (count >= 5) break; // safety limit
    }
    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(items[0].id).toBeDefined();
  });
});
