import { APIError, ConnectionError, TimeoutError } from "./errors";
import { CursorPage, PagePromise } from "./pagination";
import type { RequestOptions } from "./request-options";
import { retryWithBackoff } from "./retry";
import type { CursorPageResponse } from "./types";
import { VERSION } from "./version";

export interface AirBaseOptions {
  apiKey?: string;
  workspaceId?: string;
  baseURL?: string;
  maxRetries?: number;
  timeout?: number;
  fetch?: typeof globalThis.fetch;
  defaultHeaders?: Record<string, string>;
}

export class AirBase {
  readonly apiKey: string;
  /** Empty when unset; required on each request unless overridden per-request. */
  workspaceId: string;
  readonly baseURL: string;
  readonly maxRetries: number;
  readonly timeout: number;
  private _fetch: typeof globalThis.fetch;
  private _defaultHeaders: Record<string, string>;

  constructor(options: AirBaseOptions = {}) {
    const apiKey = options.apiKey ?? process.env.AIR_API_KEY;
    if (!apiKey) {
      throw new Error(
        "API key is required. Pass it as `apiKey` option or set the AIR_API_KEY environment variable.",
      );
    }

    const workspaceId = options.workspaceId ?? process.env.AIR_WORKSPACE_ID;

    this.apiKey = apiKey;
    this.workspaceId = workspaceId ?? "";
    this.baseURL = (options.baseURL ?? "https://api.air.inc/v1").replace(/\/$/, "");
    this.maxRetries = options.maxRetries ?? 3;
    this.timeout = options.timeout ?? 60_000;
    this._fetch = options.fetch ?? globalThis.fetch;
    this._defaultHeaders = options.defaultHeaders ?? {};
  }

  get fetchFn(): typeof globalThis.fetch {
    return this._fetch;
  }

  async request<T>(options: RequestOptions): Promise<T> {
    return retryWithBackoff(
      () => this._executeRequest<T>(options),
      this.maxRetries,
      options.method,
    );
  }

  requestCursorPage<T>(
    options: RequestOptions,
    query?: Record<string, string | string[] | number | boolean | undefined>,
  ): PagePromise<T> {
    return new PagePromise<T>((resolve, reject) => {
      this.request<CursorPageResponse<T>>(options)
        .then((response) => {
          resolve(
            new CursorPage<T>(response, (cursor: string) =>
              this.requestCursorPage<T>(
                {
                  ...options,
                  query: { ...query, ...options.query, cursor },
                },
                query,
              ),
            ),
          );
        })
        .catch(reject);
    });
  }

  private async _executeRequest<T>(options: RequestOptions): Promise<T> {
    const url = this._buildURL(options.path, options.query);

    const workspaceId = options.workspaceId ?? this.workspaceId;
    if (!workspaceId) {
      throw new Error(
        "Workspace ID is required. Pass it as `workspaceId` on the client, per-request in context, or set the AIR_WORKSPACE_ID environment variable.",
      );
    }

    const headers: Record<string, string> = {
      "x-api-key": this.apiKey,
      "x-air-workspace-id": workspaceId,
      "user-agent": `air-api-sdk/${VERSION}`,
      ...this._defaultHeaders,
      ...options.headers,
    };

    if (options.body !== undefined) {
      headers["content-type"] = "application/json";
    }

    const timeout = options.timeout ?? this.timeout;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Combine with user-provided signal
    if (options.signal) {
      options.signal.addEventListener("abort", () => controller.abort());
    }

    let response: Response;
    try {
      response = await this._fetch(url, {
        method: options.method,
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new TimeoutError();
      }
      throw new ConnectionError(error instanceof Error ? error.message : "Connection failed");
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw await APIError.fromResponse(response);
    }

    // 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  private _buildURL(
    path: string,
    query?: Record<string, string | string[] | number | boolean | undefined>,
  ): string {
    const url = new URL(`${this.baseURL}${path}`);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined) continue;
        if (Array.isArray(value)) {
          for (const v of value) {
            url.searchParams.append(key, v);
          }
        } else {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url.toString();
  }
}
