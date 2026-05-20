import type { RequestOptions } from "./request-options";

/** Per-request options that can override client defaults (e.g. workspace ID from env). */
export interface RequestContext {
  workspaceId?: string;
  timeout?: number;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

export function withRequestContext(
  options: Omit<RequestOptions, keyof RequestContext>,
  context?: RequestContext,
): RequestOptions {
  if (!context) {
    return options;
  }

  const { workspaceId, timeout, signal, headers } = context;
  return {
    ...options,
    ...(workspaceId !== undefined && { workspaceId }),
    ...(timeout !== undefined && { timeout }),
    ...(signal !== undefined && { signal }),
    ...(headers !== undefined && { headers }),
  };
}
