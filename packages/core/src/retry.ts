import { APIError, RateLimitError } from './errors';

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

export function isRetryableError(error: unknown): boolean {
  if (error instanceof APIError) {
    return RETRYABLE_STATUS_CODES.has(error.status);
  }
  // Retry on network errors (fetch failures)
  if (error instanceof TypeError) {
    return true;
  }
  return false;
}

export function getRetryDelay(
  error: unknown,
  attempt: number,
  baseDelay = 500,
): number {
  // Respect Retry-After header for rate limit errors
  if (error instanceof RateLimitError && error.retryAfter !== null) {
    return error.retryAfter * 1000;
  }

  // Exponential backoff with jitter
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = exponentialDelay * 0.2 * Math.random();
  return exponentialDelay + jitter;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries || !isRetryableError(error)) {
        throw error;
      }
      const delay = getRetryDelay(error, attempt);
      await sleep(delay);
    }
  }
  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
