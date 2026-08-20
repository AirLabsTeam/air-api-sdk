export class APIError extends Error {
  readonly status: number;
  readonly headers: Headers;
  readonly body: unknown;

  constructor(status: number, body: unknown, message: string, headers: Headers) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.body = body;
    this.headers = headers;
  }

  static async fromResponse(response: Response): Promise<APIError> {
    const headers = response.headers;
    let body: unknown;
    let message: string;

    try {
      body = await response.json();
      message =
        typeof body === "object" && body !== null && "message" in body
          ? String((body as { message: string }).message)
          : `Request failed with status ${response.status}`;
    } catch {
      body = await response.text().catch(() => "");
      message = `Request failed with status ${response.status}`;
    }

    const status = response.status;

    switch (status) {
      case 400:
        return new BadRequestError(status, body, message, headers);
      case 401:
        return new AuthenticationError(status, body, message, headers);
      case 403:
        return new PermissionError(status, body, message, headers);
      case 404:
        return new NotFoundError(status, body, message, headers);
      case 429:
        return new RateLimitError(status, body, message, headers);
      default:
        if (status >= 500) {
          return new InternalServerError(status, body, message, headers);
        }
        return new APIError(status, body, message, headers);
    }
  }
}

export class BadRequestError extends APIError {
  constructor(status: number, body: unknown, message: string, headers: Headers) {
    super(status, body, message, headers);
    this.name = "BadRequestError";
  }
}

export class AuthenticationError extends APIError {
  constructor(status: number, body: unknown, message: string, headers: Headers) {
    super(status, body, message, headers);
    this.name = "AuthenticationError";
  }
}

export class PermissionError extends APIError {
  constructor(status: number, body: unknown, message: string, headers: Headers) {
    super(status, body, message, headers);
    this.name = "PermissionError";
  }
}

export class NotFoundError extends APIError {
  constructor(status: number, body: unknown, message: string, headers: Headers) {
    super(status, body, message, headers);
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends APIError {
  readonly retryAfter: number | null;

  constructor(status: number, body: unknown, message: string, headers: Headers) {
    super(status, body, message, headers);
    this.name = "RateLimitError";
    this.retryAfter = parseRetryAfter(headers.get("retry-after"));
  }
}

export class InternalServerError extends APIError {
  constructor(status: number, body: unknown, message: string, headers: Headers) {
    super(status, body, message, headers);
    this.name = "InternalServerError";
  }
}

export class ConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConnectionError";
  }
}

export class TimeoutError extends ConnectionError {
  constructor(message = "Request timed out") {
    super(message);
    this.name = "TimeoutError";
  }
}

// RFC 9110 §10.2.3 allows either delay-seconds or an HTTP-date, so both are
// normalized to seconds here; an unparseable value yields null so callers fall
// back to exponential backoff rather than to a NaN delay.
function parseRetryAfter(header: string | null): number | null {
  if (!header) return null;

  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.max(0, seconds);

  const retryAt = Date.parse(header);
  if (Number.isNaN(retryAt)) return null;

  return Math.max(0, Math.ceil((retryAt - Date.now()) / 1000));
}
