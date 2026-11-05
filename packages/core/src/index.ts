export { AirBase, type AirBaseOptions } from "./base-client";

export {
  APIError,
  AuthenticationError,
  BadRequestError,
  ConnectionError,
  InternalServerError,
  InvalidRequestPathError,
  NotFoundError,
  PermissionError,
  RateLimitError,
  TimeoutError,
} from "./errors";

export { CursorPage, PagePromise } from "./pagination";

export { encodePath } from "./path";

export type { QueryParam, RequestOptions } from "./request-options";

export { isRetryableError, getRetryDelay, retryWithBackoff } from "./retry";

export type { CursorPageParams, CursorPageResponse } from "./types";

export { VERSION } from "./version";

export {
  buildAuthorizationUrl,
  exchangeAuthorizationCode,
  type OAuthAccessToken,
  type OAuthClientAuthMethod,
  type BuildAuthorizationUrlOptions,
  type ExchangeAuthorizationCodeOptions,
} from "./oauth";

export { generatePKCEChallenge, type PKCEChallenge } from "./pkce";
