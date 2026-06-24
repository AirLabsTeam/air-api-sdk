export { AirApi, type AirApiOptions } from "./api";

// Re-export core for convenience
export {
  AirBase,
  type AirBaseOptions,
  APIError,
  AuthenticationError,
  BadRequestError,
  ConnectionError,
  InternalServerError,
  NotFoundError,
  PermissionError,
  RateLimitError,
  TimeoutError,
  CursorPage,
  PagePromise,
  type CursorPageParams,
  type CursorPageResponse,
  type RequestOptions,
  VERSION,
  buildAuthorizationUrl,
  exchangeAuthorizationCode,
  generatePKCEChallenge,
  type OAuthAccessToken,
  type OAuthClientAuthMethod,
  type BuildAuthorizationUrlOptions,
  type ExchangeAuthorizationCodeOptions,
  type PKCEChallenge,
} from "@air/api-core";

// Export resource classes
export { Assets } from "./resources/assets";
export { Boards } from "./resources/boards";
export { Libraries } from "./resources/libraries";
export { Tags } from "./resources/tags";
export { CustomFields } from "./resources/custom-fields";
export { Roles } from "./resources/roles";
export { Imports } from "./resources/imports";
export { Uploads } from "./resources/uploads";
export { Workspaces } from "./resources/workspaces";

// Export all types
export * from "./types/index";
