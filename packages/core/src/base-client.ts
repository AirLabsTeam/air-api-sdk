import { APIError, ConnectionError, TimeoutError } from "./errors";
import { CursorPage, PagePromise } from "./pagination";
import type { RequestOptions } from "./request-options";
import { retryWithBackoff } from "./retry";
import type { CursorPageResponse } from "./types";
import { VERSION } from "./version";

export interface AirBaseOptions {
  apiKey?: string;
  accessToken?: string;
  workspaceId?: string;
  baseURL?: string;
  maxRetries?: number;
  timeout?: number;
  fetch?: typeof globalThis.fetch;
  defaultHeaders?: Record<string, string>;
}

export class AirBase {
  readonly apiKey: string | undefined;
  readonly accessToken: string | undefined;
  workspaceId: string | undefined;
  readonly baseURL: string;
  readonly maxRetries: number;
  readonly timeout: number;
  private _fetch: typeof globalThis.fetch;
  private _defaultHeaders: Record<string, string>;

  constructor(options: AirBaseOptions = {}) {
    // Explicit options select the auth mode. Env vars are only consulted if
    // neither auth option is provided explicitly, so an unrelated env var
    // (e.g. AIR_ACCESS_TOKEN sitting in .env.test) doesn't conflict with an
    // explicit `apiKey` constructor argument.
    let apiKey: string | undefined;
    let accessToken: string | undefined;

    if (options.apiKey !== undefined && options.accessToken !== undefined) {
      throw new Error(
        "Provide either `apiKey` or `accessToken`, not both. API key auth and OAuth bearer auth are mutually exclusive.",
      );
    }

    if (options.apiKey !== undefined) {
      apiKey = options.apiKey;
    } else if (options.accessToken !== undefined) {
      accessToken = options.accessToken;
    } else {
      const envApiKey = process.env.AIR_API_KEY;
      const envAccessToken = process.env.AIR_ACCESS_TOKEN;
      if (envApiKey && envAccessToken) {
        throw new Error(
          "Both AIR_API_KEY and AIR_ACCESS_TOKEN are set. Set only one, or pass `apiKey`/`accessToken` explicitly to choose.",
        );
      }
      apiKey = envApiKey;
      accessToken = envAccessToken;
    }

    if (!apiKey && !accessToken) {
      throw new Error(
        "Authentication is required. Pass `apiKey` (or set AIR_API_KEY) for API key auth, or `accessToken` (or set AIR_ACCESS_TOKEN) for OAuth bearer auth.",
      );
    }

    const workspaceId = options.workspaceId ?? process.env.AIR_WORKSPACE_ID;
    if (apiKey && !workspaceId) {
      throw new Error(
        "Workspace ID is required when using API key authentication. Pass it as `workspaceId` option or set the AIR_WORKSPACE_ID environment variable.",
      );
    }

    this.apiKey = apiKey;
    this.accessToken = accessToken;
    this.workspaceId = workspaceId;
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

    const headers: Record<string, string> = {
      "user-agent": `air-api-sdk/${VERSION}`,
    };

    if (this.apiKey) {
      headers["x-api-key"] = this.apiKey;
    } else if (this.accessToken) {
      headers["authorization"] = `Bearer ${this.accessToken}`;
    }

    if (this.workspaceId) {
      headers["x-air-workspace-id"] = this.workspaceId;
    }

    Object.assign(headers, this._defaultHeaders, options.headers);

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
