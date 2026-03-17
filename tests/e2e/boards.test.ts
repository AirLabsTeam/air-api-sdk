import { describe, test, expect, afterAll } from 'vitest';
import { getClient, resourceName } from './helpers/setup';

const client = getClient();
const cleanup: (() => Promise<void>)[] = [];

afterAll(async () => {
  for (const fn of cleanup) {
    try { await fn(); } catch {}
  }
});

describe('Boards', () => {
  test('list boards with limit', async () => {
    const page = await client.boards.list({ limit: 2 });
    expect(page.data).toBeInstanceOf(Array);
    expect(page.data.length).toBeLessThanOrEqual(2);
    expect(page.pagination).toBeDefined();
  });

  test('create → get → sub-board → update → list children → delete', async () => {
    // Create parent board
    const parentName = resourceName('parent-board');
    const parent = await client.boards.create({ title: parentName });
    cleanup.push(() => client.boards.delete(parent.id));

    expect(parent.id).toBeDefined();
    expect(parent.title).toBe(parentName);

    // Get
    const fetched = await client.boards.get(parent.id);
    expect(fetched.id).toBe(parent.id);
    expect(fetched.title).toBe(parentName);

    // Create sub-board
    const childName = resourceName('child-board');
    const child = await client.boards.create({
      title: childName,
      parentBoardId: parent.id,
    });
    cleanup.unshift(() => client.boards.delete(child.id));

    expect(child.parentBoardId).toBe(parent.id);

    // Update sub-board
    const newDesc = 'Updated description';
    await client.boards.update(child.id, { description: newDesc });
    const updatedChild = await client.boards.get(child.id);
    expect(updatedChild.description).toBe(newDesc);

    // List by parentBoardId
    const children = await client.boards.list({ parentBoardId: parent.id });
    expect(children.data.length).toBeGreaterThanOrEqual(1);
    expect(children.data.some((b) => b.id === child.id)).toBe(true);

    // Delete sub-board
    await client.boards.delete(child.id);
    cleanup.shift(); // already deleted

    // Clean up parent
    await client.boards.delete(parent.id);
    cleanup.length = 0;
  });

  test('board custom fields', async () => {
    const board = await client.boards.create({ title: resourceName('cf-board') });
    cleanup.push(() => client.boards.delete(board.id));

    const cf = await client.customFields.create({
      name: resourceName('board-cf'),
      type: 'plain-text',
    });
    cleanup.push(() => client.customFields.delete(cf.id));

    // Set custom field on board
    await client.boards.setCustomField(board.id, cf.id, { value: 'hello' });

    // Clear custom field
    await client.boards.setCustomField(board.id, cf.id, { value: null });

    // Cleanup
    await client.customFields.delete(cf.id);
    await client.boards.delete(board.id);
    cleanup.length = 0;
  });
});
