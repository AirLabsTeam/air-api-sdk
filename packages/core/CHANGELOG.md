# @air/api-core

## 0.13.0

## 0.12.0

### Minor Changes

- c311ce0: Encode each id in a request path as one segment, so an id with `/`, `?` or `#` stays inside it. A request whose path would reach another route now rejects with `InvalidRequestPathError` before anything is sent: an empty or missing id, or an id that is `.` or `..` (also written as `%2e`). The error message says which rule failed. `encodePath` and `InvalidRequestPathError` are exported from `@air/api-core` and `@air/api-rest`. `encodePath` stringifies a number or other value the way a template literal does.

  `AirBase.request` applies the same segment rules to a raw path, but it cannot tell where an id ends, so an id with `/` in a raw path still splits into two segments. Build raw paths with `encodePath`. It percent-encodes characters in the path part that are not URL-safe, including `|`, `[`, `]` and `^`, which `new URL` sent raw, and rejects a path that is not a string, does not start with `/`, contains `#`, or has an empty segment, including a trailing slash or the root path `/`. An id with a tab, newline or trailing space used to be stripped by `new URL` and is now sent encoded. A query written into the path is sent as before. The error message shows the path without its query or fragment.

## 0.11.0

## 0.10.0

## 0.9.0

## 0.8.0

## 0.7.0

## 0.6.0

## 0.5.1

### Patch Changes

- 3a24cb8: Omit null pagination cursors from list query strings so a `pagination.cursor` of `null` requests the first page instead of sending `?cursor=null`.

## 0.5.0

## 0.4.0

## 0.3.0

## 0.2.0

### Minor Changes

- 1f11443: Add OAuth 2.0 helpers for the authorization_code + PKCE flow:
  - `generatePKCEChallenge()` — produces a verifier + S256 challenge per RFC 7636.
  - `buildAuthorizationUrl({ authorizeUrl, clientId, redirectUri, codeChallenge, state, scopes? })` — constructs the URL the user is sent to.
  - `exchangeAuthorizationCode({ tokenUrl, clientId, clientSecret?, code, codeVerifier, redirectUri })` — exchanges the resulting authorization code for an access token.

  Returns `{ accessToken, tokenType, expiresIn, scope?, refreshToken? }` suitable for passing to `new AirApi({ accessToken })`. Confidential clients (those with a `clientSecret`) default to HTTP Basic client authentication per RFC 6749 §2.3.1; pass `clientAuthMethod: "body"` to send `client_id`/`client_secret` in the form body instead. Public clients always send `client_id` in the body. Errors surface as the existing `APIError` subclasses / `ConnectionError`.

- 61c97a0: Add `workspaces.list()` for the new `GET /v1/workspaces` discovery endpoint, and add first-class OAuth bearer token support via a new `accessToken` option (also readable from `AIR_ACCESS_TOKEN`). `workspaceId` is now optional when authenticating with `accessToken`, since discovery endpoints are called before a workspace is known. API key auth is unchanged.

## 0.1.2

### Patch Changes

- d17bd72: Add package READMEs, set license to MIT, and link developer docs

## 0.1.1

### Patch Changes

- c6cb263: Initial publish
