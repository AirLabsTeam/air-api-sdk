export interface CursorPageParams {
  limit?: number;
  /**
   * Cursor from a previous list response. `null` requests the first page and
   * is omitted from the query string.
   * When `pagination.cursor` is `null` there are no more pages. Stop, or use
   * `hasNextPage()` / `for await`. Passing that `null` back in starts over
   * at page 1.
   */
  cursor?: string | null;
}

export interface CursorPageResponse<T> {
  data: T[];
  pagination: {
    hasMore: boolean;
    cursor: string | null;
  };
  total?: number;
}
