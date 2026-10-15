export interface CursorPageParams {
  limit?: number;
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
