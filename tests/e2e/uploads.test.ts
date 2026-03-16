import { describe, test, expect, afterAll } from 'bun:test';
import { getClient, resourceName } from './helpers/setup';
import { findOrCreateBoard } from './helpers/test-data';

const client = getClient();
const cleanup: (() => Promise<void>)[] = [];

afterAll(async () => {
  for (const fn of cleanup) {
    try { await fn(); } catch {}
  }
});

// 1x1 red PNG
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

describe('Uploads', () => {
  test('low-level: create upload → PUT to presigned URL → delete asset', async () => {
    const board = await findOrCreateBoard(client, 'uploads-board');
    cleanup.push(() => client.boards.delete(board.id));

    const upload = await client.uploads.create({
      fileName: resourceName('low-level'),
      ext: 'png',
      size: TINY_PNG.byteLength,
      mime: 'image/png',
      parentBoardId: board.id,
    });

    expect(upload.assetId).toBeDefined();
    expect(upload.versionId).toBeDefined();

    // Upload is a SmallUploadResponse if < 5GB
    if ('uploadUrl' in upload) {
      const response = await fetch(upload.uploadUrl, {
        method: 'PUT',
        body: TINY_PNG,
      });
      expect(response.ok).toBe(true);
    }

    // Clean up
    cleanup.push(() => client.assets.delete(upload.assetId));
  });

  test('high-level: uploadFile with buffer + progress → delete asset', async () => {
    const board = await findOrCreateBoard(client, 'uploads-board');

    const progress: number[] = [];
    const result = await client.uploads.uploadFile(
      {
        buffer: TINY_PNG,
        fileName: resourceName('high-level'),
        ext: 'png',
        mime: 'image/png',
      },
      {
        parentBoardId: board.id,
        onProgress: (p) => progress.push(p.percentage),
      },
    );

    expect(result.assetId).toBeDefined();
    expect(result.versionId).toBeDefined();
    expect(progress.length).toBeGreaterThan(0);
    expect(progress[progress.length - 1]).toBe(100);

    // Verify asset exists
    const asset = await client.assets.get(result.assetId);
    expect(asset.id).toBe(result.assetId);

    // Clean up
    await client.assets.delete(result.assetId);
  });
});
