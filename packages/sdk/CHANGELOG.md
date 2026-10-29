# @air/api-sdk

## 0.11.0

### Patch Changes

- Updated dependencies [79a1596]
  - @air/api-rest@0.11.0
  - @air/api-core@0.11.0

## 0.10.0

### Minor Changes

- 5025d0c: Add a `showcases` resource (`list`, `get`, `create`, `update`, `updateShareLink`, `addAssets`, `removeAsset`, `addBoards`, `removeBoard`) and a `showcaseId` filter on `assets.list` and `boards.list`.

### Patch Changes

- Updated dependencies [5025d0c]
  - @air/api-rest@0.10.0
  - @air/api-core@0.10.0

## 0.9.0

### Minor Changes

- 066afd9: Share link create and update accept `password`, `expiresAt`, `requireAccount`, `comments`, and `customFields`. `null` clears `password` and `expiresAt`. The password is write only.

### Patch Changes

- Updated dependencies [066afd9]
  - @air/api-rest@0.9.0
  - @air/api-core@0.9.0

## 0.8.0

### Minor Changes

- 3caed68: `assets.list` accepts plain-text (`text`, `textPrefix`, `textNot`) and date (`dateGte`, `dateLte`) custom field filters, plus structured select filters. Strings such as `fieldId:valueId` still pass through. `boards.list` stays select-only.

### Patch Changes

- Updated dependencies [3caed68]
  - @air/api-rest@0.8.0
  - @air/api-core@0.8.0

## 0.7.0

### Minor Changes

- 4e10b7c: Add `createShareLink` and `updateShareLink` on assets and boards for public share links (`POST /assets/{assetId}/share-links`, `PATCH /assets/{assetId}/share-links/{shareLinkId}`, and the same pair on `/boards/{boardId}/share-links`).

### Patch Changes

- Updated dependencies [4e10b7c]
  - @air/api-rest@0.7.0
  - @air/api-core@0.7.0

## 0.6.0

### Minor Changes

- 5ab0241: Add `assets.listShareLinks` and `boards.listShareLinks` for reading public share links (`GET /assets/{assetId}/share-links`, `GET /boards/{boardId}/share-links`).

### Patch Changes

- Updated dependencies [5ab0241]
  - @air/api-rest@0.6.0
  - @air/api-core@0.6.0

## 0.5.1

### Patch Changes

- 3a24cb8: Omit null pagination cursors from list query strings so a `pagination.cursor` of `null` requests the first page instead of sending `?cursor=null`.
- Updated dependencies [3a24cb8]
  - @air/api-core@0.5.1
  - @air/api-rest@0.5.1

## 0.5.0

### Minor Changes

- 5a9b6ce: Add typed asset CDN link lifecycle helpers: `listCdnLinks`, `createCdnLink`, and `updateCdnLink`.

### Patch Changes

- Updated dependencies [5a9b6ce]
  - @air/api-rest@0.5.0
  - @air/api-core@0.5.0

## 0.4.0

### Minor Changes

- df6ba99: Expose the `semantic` query flag on `assets.list()` so `GET /assets` can run semantic search when `search` is provided.

### Patch Changes

- Updated dependencies [df6ba99]
  - @air/api-rest@0.4.0
  - @air/api-core@0.4.0

## 0.3.0

### Minor Changes

- 105cc08: Add Libraries resource (list/get/create/update/delete) and `libraryId` / `inGeneralLibrary` filters on the Boards list method. Supplying both filters returns 400. Library `description` accepts `null` on update to clear the field.

### Patch Changes

- Updated dependencies [105cc08]
  - @air/api-rest@0.3.0
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
  - @air/api-rest@0.2.0

## 0.1.3

### Patch Changes

- Updated dependencies [9281049]
  - @air/api-rest@0.1.3

## 0.1.2

### Patch Changes

- d17bd72: Add package READMEs, set license to MIT, and link developer docs
- Updated dependencies [d17bd72]
  - @air/api-core@0.1.2
  - @air/api-rest@0.1.2

## 0.1.1

### Patch Changes

- c6cb263: Initial publish
- Updated dependencies [c6cb263]
  - @air/api-core@0.1.1
  - @air/api-rest@0.1.1
