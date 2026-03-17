export interface MockResponse {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
}

export function createMockFetch(responses: MockResponse | MockResponse[]) {
  const queue = Array.isArray(responses) ? [...responses] : [responses];
  let callIndex = 0;

  const mockFetch = async (
    _url: string | URL | Request,
    _init?: RequestInit,
  ): Promise<Response> => {
    const response = queue.length > 1 ? queue[callIndex] : queue[0];
    callIndex++;

    if (!response) {
      throw new Error(`No mock response for call ${callIndex}`);
    }

    const status = response.status ?? 200;
    const headers = new Headers(response.headers);

    if (response.body !== undefined && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    return new Response(response.body !== undefined ? JSON.stringify(response.body) : null, {
      status,
      headers,
    });
  };

  const calls: { url: string; init?: RequestInit }[] = [];
  const trackedFetch = async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: url.toString(), init });
    return mockFetch(url, init);
  };

  trackedFetch.calls = calls;
  return trackedFetch;
}

export function createBaseOptions(mockFetch: ReturnType<typeof createMockFetch>) {
  return {
    apiKey: "test-api-key",
    workspaceId: "test-workspace-id",
    baseURL: "https://api.air.inc/v1",
    fetch: mockFetch as unknown as typeof globalThis.fetch,
    maxRetries: 0,
  };
}
