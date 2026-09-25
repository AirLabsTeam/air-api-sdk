import { describe, expect, test } from "vitest";
import { isRetryableError, getRetryDelay, retryWithBackoff } from "../src/retry";
import {
  APIError,
  BadRequestError,
  AuthenticationError,
  ConnectionError,
  NotFoundError,
  RateLimitError,
  InternalServerError,
  TimeoutError,
} from "../src/errors";

describe("isRetryableError", () => {
  test("retries on 429", () => {
    const err = new RateLimitError(429, {}, "rate limited", new Headers());
    expect(isRetryableError(err)).toBe(true);
  });

  test("retries on 500", () => {
    const err = new InternalServerError(500, {}, "server error", new Headers());
    expect(isRetryableError(err)).toBe(true);
  });

  test("retries on 502", () => {
    const err = new APIError(502, {}, "bad gateway", new Headers());
    expect(isRetryableError(err)).toBe(true);
  });

  test("does not retry on 400", () => {
    const err = new BadRequestError(400, {}, "bad request", new Headers());
    expect(isRetryableError(err)).toBe(false);
  });

  test("does not retry on 401", () => {
    const err = new AuthenticationError(401, {}, "unauthorized", new Headers());
    expect(isRetryableError(err)).toBe(false);
  });

  test("does not retry on 404", () => {
    const err = new NotFoundError(404, {}, "not found", new Headers());
    expect(isRetryableError(err)).toBe(false);
  });

  test("retries on ConnectionError", () => {
    expect(isRetryableError(new ConnectionError("fetch failed"))).toBe(true);
  });

  test("retries on TimeoutError", () => {
    expect(isRetryableError(new TimeoutError())).toBe(true);
  });

  test("does not retry on TypeError", () => {
    expect(isRetryableError(new TypeError("fetch failed"))).toBe(false);
  });

  test("does not retry POST on 500", () => {
    const err = new InternalServerError(500, {}, "server error", new Headers());
    expect(isRetryableError(err, "POST")).toBe(false);
  });

  test("does not retry POST on 502", () => {
    const err = new APIError(502, {}, "bad gateway", new Headers());
    expect(isRetryableError(err, "POST")).toBe(false);
  });

  test("does not retry POST on 503", () => {
    const err = new APIError(503, {}, "service unavailable", new Headers());
    expect(isRetryableError(err, "POST")).toBe(false);
  });

  test("does not retry POST on 504", () => {
    const err = new APIError(504, {}, "gateway timeout", new Headers());
    expect(isRetryableError(err, "POST")).toBe(false);
  });

  test("retries POST on 429", () => {
    const err = new RateLimitError(429, {}, "rate limited", new Headers());
    expect(isRetryableError(err, "POST")).toBe(true);
  });

  test("retries POST on 408", () => {
    const err = new APIError(408, {}, "request timeout", new Headers());
    expect(isRetryableError(err, "POST")).toBe(true);
  });

  test("retries GET on 500", () => {
    const err = new InternalServerError(500, {}, "server error", new Headers());
    expect(isRetryableError(err, "GET")).toBe(true);
  });
});

describe("retryWithBackoff", () => {
  test("returns immediately on success", async () => {
    let calls = 0;
    const result = await retryWithBackoff(async () => {
      calls++;
      return "ok";
    }, 3);
    expect(result).toBe("ok");
    expect(calls).toBe(1);
  });

  test("retries retryable errors", async () => {
    let calls = 0;
    const result = await retryWithBackoff(async () => {
      calls++;
      if (calls < 3) {
        throw new InternalServerError(500, {}, "fail", new Headers());
      }
      return "ok";
    }, 3);
    expect(result).toBe("ok");
    expect(calls).toBe(3);
  });

  test("does not retry non-retryable errors", async () => {
    let calls = 0;
    try {
      await retryWithBackoff(async () => {
        calls++;
        throw new NotFoundError(404, {}, "not found", new Headers());
      }, 3);
    } catch (e) {
      expect(e).toBeInstanceOf(NotFoundError);
    }
    expect(calls).toBe(1);
  });

  test("throws after max retries", async () => {
    let calls = 0;
    try {
      await retryWithBackoff(async () => {
        calls++;
        throw new InternalServerError(500, {}, "fail", new Headers());
      }, 2);
    } catch (e) {
      expect(e).toBeInstanceOf(InternalServerError);
    }
    expect(calls).toBe(3); // initial + 2 retries
  });

  test("retries ConnectionError", async () => {
    let calls = 0;
    const result = await retryWithBackoff(async () => {
      calls++;
      if (calls < 3) {
        throw new ConnectionError("fetch failed");
      }
      return "ok";
    }, 3);
    expect(result).toBe("ok");
    expect(calls).toBe(3);
  });

  test("retries TimeoutError", async () => {
    let calls = 0;
    const result = await retryWithBackoff(async () => {
      calls++;
      if (calls < 2) {
        throw new TimeoutError();
      }
      return "ok";
    }, 3);
    expect(result).toBe("ok");
    expect(calls).toBe(2);
  });

  test("waits for an HTTP-date Retry-After before retrying", async () => {
    const headers = new Headers({ "retry-after": new Date(Date.now() + 1000).toUTCString() });
    let calls = 0;
    const started = Date.now();
    const result = await retryWithBackoff(async () => {
      calls++;
      if (calls < 2) {
        throw new RateLimitError(429, {}, "rate limited", headers);
      }
      return "ok";
    }, 1);
    expect(result).toBe("ok");
    expect(calls).toBe(2);
    expect(Date.now() - started).toBeGreaterThanOrEqual(900);
  });

  test("does not retry POST on 5xx errors", async () => {
    let calls = 0;
    try {
      await retryWithBackoff(
        async () => {
          calls++;
          throw new InternalServerError(500, {}, "fail", new Headers());
        },
        3,
        "POST",
      );
    } catch (e) {
      expect(e).toBeInstanceOf(InternalServerError);
    }
    expect(calls).toBe(1);
  });
});

describe("getRetryDelay", () => {
  test("adds jitter to Retry-After header value", () => {
    const headers = new Headers({ "retry-after": "2" });
    const err = new RateLimitError(429, {}, "rate limited", headers);
    const delay = getRetryDelay(err, 0);
    // retryAfter is 2s = 2000ms, jitter adds up to 20% = 400ms
    expect(delay).toBeGreaterThanOrEqual(2000);
    expect(delay).toBeLessThanOrEqual(2400);
  });

  test("honors an HTTP-date Retry-After header value", () => {
    const headers = new Headers({ "retry-after": new Date(Date.now() + 2000).toUTCString() });
    const err = new RateLimitError(429, {}, "rate limited", headers);
    const delay = getRetryDelay(err, 0);
    // ~2s from the header, jitter adds up to 20%
    expect(delay).toBeGreaterThanOrEqual(1000);
    expect(delay).toBeLessThanOrEqual(2400);
  });

  test("falls back to exponential backoff for an unparseable Retry-After", () => {
    const headers = new Headers({ "retry-after": "later" });
    const err = new RateLimitError(429, {}, "rate limited", headers);
    const delay = getRetryDelay(err, 1);
    // 500ms base * 2^1 = 1000ms, jitter adds up to 20%
    expect(delay).toBeGreaterThanOrEqual(1000);
    expect(delay).toBeLessThanOrEqual(1200);
  });
});
