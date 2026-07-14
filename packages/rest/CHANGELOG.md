# @air/api-rest

## 0.3.0

### Minor Changes

- 105cc08: Add Libraries resource (list/get/create/update/delete) and `libraryId` / `inGeneralLibrary` filters on the Boards list method. Supplying both filters returns 400. Library `description` accepts `null` on update to clear the field.

### Patch Changes

- @air/api-core@0.3.0

## 0.2.0

### Minor Changes

- 1f11443: Add OAuth 2.0 helpers for the authorization_code + PKCE flow:
  - `generatePKCEChallenge()` — produces a verifier + S256 challenge per RFC 7636.
  - `buildAuthorizationUrl({ authorizeUrl, clientId, redirectUri, codeChallenge, state, scopes? })` — constructs the URL the user is sent to.
  - `exchangeAuthorizationCode({ tokenUrl, clientId, clientSecret?, code, codeVerifier, redirectUri })` — exchanges the resulting authorization code for an access token.

  Returns `{ accessToken, tokenType, expiresIn, scope?, refreshToken? }` suitable for passing to `new AirApi({ accessToken })`. Confidential clients (those with a `clientSecret`) default to HTTP Basic client authentication per RFC 6749 §2.3.1; pass `clientAuthMethod: "body"` to send `client_id`/`client_secret` in the form body instead. Public clients always send `client_id` in the body. Errors surface as the existing `APIError` subclasses / `ConnectionError`.

- 61c97a0: Add `workspaces.list()` for the new `GET /v1/workspaces` discovery endpoint, and add first-class OAuth bearer token support via a new `accessToken` option (also readable from `AIR_ACCESS_TOKEN`). `workspaceId` is now optional when authenticating with `accessToken`, since discovery endpoints are called before a workspace is known. API key auth is unchanged.

### Patch Changes

- Updated dependencies [1f11443]
- Updated dependencies [61c97a0]
  - @air/api-core@0.2.0

## 0.1.3

### Patch Changes

- 9281049: Handle short reads from fs.readSync in streaming uploads

## 0.1.2

### Patch Changes

- d17bd72: Add package READMEs, set license to MIT, and link developer docs
- Updated dependencies [d17bd72]
  - @air/api-core@0.1.2

## 0.1.1

### Patch Changes

- c6cb263: Initial publish
- Updated dependencies [c6cb263]
  - @air/api-core@0.1.1
