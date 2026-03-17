import { describe, test, expect, afterAll } from 'vitest';
import { NotFoundError } from '@air/api-sdk';
import { getClient, resourceName } from './helpers/setup';

const client = getClient();
const cleanup: (() => Promise<void>)[] = [];

afterAll(async () => {
  for (const fn of cleanup) {
    try { await fn(); } catch {}
  }
});

describe('Tags', () => {
  test('list tags returns paginated response', async () => {
    const page = await client.tags.list();
    expect(page.data).toBeInstanceOf(Array);
    expect(page.pagination).toBeDefined();
    expect(typeof page.pagination.hasMore).toBe('boolean');
  });

  test('create → get → update → delete lifecycle', async () => {
    const name = resourceName('tag');
    const tag = await client.tags.create({ name });
    cleanup.push(() => client.tags.delete(tag.id));

    expect(tag.id).toBeDefined();
    expect(tag.name).toBe(name);

    // Get
    const fetched = await client.tags.get(tag.id);
    expect(fetched.id).toBe(tag.id);
    expect(fetched.name).toBe(name);

    // Update
    const updatedName = `${name}-updated`;
    await client.tags.update(tag.id, { name: updatedName });
    const afterUpdate = await client.tags.get(tag.id);
    expect(afterUpdate.name).toBe(updatedName);

    // Delete
    await client.tags.delete(tag.id);
    cleanup.length = 0; // already deleted

    // Verify gone
    try {
      await client.tags.get(tag.id);
      throw new Error('Expected NotFoundError');
    } catch (err) {
      expect(err).toBeInstanceOf(NotFoundError);
    }
  });
});
