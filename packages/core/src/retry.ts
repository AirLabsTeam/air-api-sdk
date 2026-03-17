import { APIError, RateLimitError } from "./errors";

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);
const SERVER_ERROR_CODES = new Set([500, 502, 503, 504]);

export function isRetryableError(error: unknown, method?: string): boolean {
  if (error instanceof APIError) {
    if (method === "POST" && SERVER_ERROR_CODES.has(error.status)) {
      return false;
    }
    return RETRYABLE_STATUS_CODES.has(error.status);
  }
  // Retry on network errors (fetch failures)
  if (error instanceof TypeError) {
    return true;
  }
  return false;
}

export function getRetryDelay(error: unknown, attempt: number, baseDelay = 500): number {
  // Respect Retry-After header for rate limit errors
  if (error instanceof RateLimitError && error.retryAfter !== null) {
    const retryAfterMs = error.retryAfter * 1000;
    const jitter = retryAfterMs * 0.2 * Math.random();
    return retryAfterMs + jitter;
  }

  // Exponential backoff with jitter
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = exponentialDelay * 0.2 * Math.random();
  return exponentialDelay + jitter;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  method?: string,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries || !isRetryableError(error, method)) {
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
