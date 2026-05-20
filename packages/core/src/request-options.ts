export interface RequestOptions {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  query?: Record<string, string | string[] | number | boolean | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  /** Overrides the client default and AIR_WORKSPACE_ID env var when set. */
  workspaceId?: string;
  timeout?: number;
  signal?: AbortSignal;
}
