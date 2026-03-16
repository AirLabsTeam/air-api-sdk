export interface CursorPageParams {
  limit?: number;
  cursor?: string;
}

export interface CursorPageResponse<T> {
  data: T[];
  pagination: {
    hasMore: boolean;
    cursor: string | null;
  };
  total?: number;
}
