import { describe, expect, test } from 'bun:test';
import { isRetryableError, retryWithBackoff } from '../src/retry';
import {
  APIError,
  BadRequestError,
  AuthenticationError,
  NotFoundError,
  RateLimitError,
  InternalServerError,
} from '../src/errors';

describe('isRetryableError', () => {
  test('retries on 429', () => {
    const err = new RateLimitError(429, {}, 'rate limited', new Headers());
    expect(isRetryableError(err)).toBe(true);
  });

  test('retries on 500', () => {
    const err = new InternalServerError(500, {}, 'server error', new Headers());
    expect(isRetryableError(err)).toBe(true);
  });

  test('retries on 502', () => {
    const err = new APIError(502, {}, 'bad gateway', new Headers());
    expect(isRetryableError(err)).toBe(true);
  });

  test('does not retry on 400', () => {
    const err = new BadRequestError(400, {}, 'bad request', new Headers());
    expect(isRetryableError(err)).toBe(false);
  });

  test('does not retry on 401', () => {
    const err = new AuthenticationError(401, {}, 'unauthorized', new Headers());
    expect(isRetryableError(err)).toBe(false);
  });

  test('does not retry on 404', () => {
    const err = new NotFoundError(404, {}, 'not found', new Headers());
    expect(isRetryableError(err)).toBe(false);
  });

  test('retries on TypeError (network error)', () => {
    expect(isRetryableError(new TypeError('fetch failed'))).toBe(true);
  });
});

describe('retryWithBackoff', () => {
  test('returns immediately on success', async () => {
    let calls = 0;
    const result = await retryWithBackoff(async () => {
      calls++;
      return 'ok';
    }, 3);
    expect(result).toBe('ok');
    expect(calls).toBe(1);
  });

  test('retries retryable errors', async () => {
    let calls = 0;
    const result = await retryWithBackoff(async () => {
      calls++;
      if (calls < 3) {
        throw new InternalServerError(500, {}, 'fail', new Headers());
      }
      return 'ok';
    }, 3);
    expect(result).toBe('ok');
    expect(calls).toBe(3);
  });

  test('does not retry non-retryable errors', async () => {
    let calls = 0;
    try {
      await retryWithBackoff(async () => {
        calls++;
        throw new NotFoundError(404, {}, 'not found', new Headers());
      }, 3);
    } catch (e) {
      expect(e).toBeInstanceOf(NotFoundError);
    }
    expect(calls).toBe(1);
  });

  test('throws after max retries', async () => {
    let calls = 0;
    try {
      await retryWithBackoff(async () => {
        calls++;
        throw new InternalServerError(500, {}, 'fail', new Headers());
      }, 2);
    } catch (e) {
      expect(e).toBeInstanceOf(InternalServerError);
    }
    expect(calls).toBe(3); // initial + 2 retries
  });
});
