import { describe, expect, test } from 'vitest';
import { CursorPage } from '../src/pagination';

describe('CursorPage', () => {
  test('hasNextPage returns true when there are more pages', () => {
    const page = new CursorPage(
      { data: [1, 2], pagination: { hasMore: true, cursor: 'abc' }, total: 10 },
      async () => new CursorPage({ data: [], pagination: { hasMore: false, cursor: null } }, null),
    );
    expect(page.hasNextPage()).toBe(true);
  });

  test('hasNextPage returns false when no more pages', () => {
    const page = new CursorPage(
      { data: [1, 2], pagination: { hasMore: false, cursor: null } },
      null,
    );
    expect(page.hasNextPage()).toBe(false);
  });

  test('getNextPage fetches next page', async () => {
    const page2Data = { data: [3, 4], pagination: { hasMore: false, cursor: null } };
    const page1 = new CursorPage(
      { data: [1, 2], pagination: { hasMore: true, cursor: 'cursor-1' } },
      async (cursor) => {
        expect(cursor).toBe('cursor-1');
        return new CursorPage(page2Data, null);
      },
    );

    const page2 = await page1.getNextPage();
    expect(page2.data).toEqual([3, 4]);
    expect(page2.hasNextPage()).toBe(false);
  });

  test('getNextPage throws when no more pages', async () => {
    const page = new CursorPage(
      { data: [1], pagination: { hasMore: false, cursor: null } },
      null,
    );
    await expect(page.getNextPage()).rejects.toThrow('No more pages available');
  });

  test('async iterator yields all items across pages', async () => {
    const page2 = new CursorPage(
      { data: [3, 4], pagination: { hasMore: false, cursor: null } },
      null,
    );

    const page1 = new CursorPage(
      { data: [1, 2], pagination: { hasMore: true, cursor: 'c1' } },
      async () => page2,
    );

    const items: number[] = [];
    for await (const item of page1) {
      items.push(item);
    }
    expect(items).toEqual([1, 2, 3, 4]);
  });

  test('total is passed through', () => {
    const page = new CursorPage(
      { data: [1], pagination: { hasMore: false, cursor: null }, total: 42 },
      null,
    );
    expect(page.total).toBe(42);
  });
});
