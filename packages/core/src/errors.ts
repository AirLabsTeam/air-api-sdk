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
    const retryAfterHeader = headers.get("retry-after");
    this.retryAfter = retryAfterHeader ? Number(retryAfterHeader) : null;
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
