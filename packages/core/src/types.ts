export interface CursorPageParams {
  limit?: number;
  /**
   * Cursor from a previous list response. `null` requests the first page and
   * is omitted from the query string, so `pagination.cursor` can be passed
   * through directly.
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
