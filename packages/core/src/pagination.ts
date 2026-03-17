import type { CursorPageResponse } from "./types";

export class CursorPage<T> implements AsyncIterable<T> {
  readonly data: T[];
  readonly pagination: { hasMore: boolean; cursor: string | null };
  readonly total: number | undefined;

  private _fetchNextPage: ((cursor: string) => Promise<CursorPage<T>>) | null;

  constructor(
    response: CursorPageResponse<T>,
    fetchNextPage: ((cursor: string) => Promise<CursorPage<T>>) | null,
  ) {
    this.data = response.data;
    this.pagination = response.pagination;
    this.total = response.total;
    this._fetchNextPage = fetchNextPage;
  }

  hasNextPage(): boolean {
    return this.pagination.hasMore && this.pagination.cursor !== null;
  }

  async getNextPage(): Promise<CursorPage<T>> {
    if (!this.hasNextPage() || !this._fetchNextPage) {
      throw new Error("No more pages available");
    }
    return this._fetchNextPage(this.pagination.cursor!);
  }

  async *[Symbol.asyncIterator](): AsyncIterator<T> {
    let page: CursorPage<T> = this;
    while (true) {
      for (const item of page.data) {
        yield item;
      }
      if (!page.hasNextPage()) break;
      page = await page.getNextPage();
    }
  }
}

/**
 * A Promise that resolves to a CursorPage, but is also directly async-iterable.
 * This allows both patterns:
 *   - `for await (const item of client.assets.list())` (auto-paginate)
 *   - `const page = await client.assets.list()` (manual pagination)
 */
export class PagePromise<T> extends Promise<CursorPage<T>> implements AsyncIterable<T> {
  async *[Symbol.asyncIterator](): AsyncIterator<T> {
    const page = await this;
    yield* page;
  }
}
