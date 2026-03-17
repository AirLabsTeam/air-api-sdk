export interface RequestOptions {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  query?: Record<string, string | string[] | number | boolean | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
}
