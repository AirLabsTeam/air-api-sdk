---
"@air/api-core": minor
"@air/api-rest": minor
"@air/api-sdk": minor
---

Add OAuth 2.0 helpers for both client_credentials and authorization_code + PKCE flows:

- `getOAuthAccessToken({ clientId, clientSecret, tokenUrl, scopes? })` — client_credentials (machine-to-machine).
- `generatePKCEChallenge()` — produces a verifier + S256 challenge per RFC 7636.
- `buildAuthorizationUrl({ authorizeUrl, clientId, redirectUri, codeChallenge, state, scopes? })` — constructs the URL the user is sent to.
- `exchangeAuthorizationCode({ tokenUrl, clientId, clientSecret?, code, codeVerifier, redirectUri })` — exchanges the resulting authorization code for an access token.

All return `{ accessToken, tokenType, expiresIn, scope? }` suitable for passing to `new AirApi({ accessToken })`. Confidential clients (those with a `clientSecret`) default to HTTP Basic client authentication per RFC 6749 §2.3.1; pass `clientAuthMethod: "body"` to send `client_id`/`client_secret` in the form body instead. Public clients always send `client_id` in the body. Errors surface as the existing `APIError` subclasses / `ConnectionError`.
