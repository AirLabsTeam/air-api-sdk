---
"@air/api-core": minor
"@air/api-rest": minor
"@air/api-sdk": minor
---

Add `workspaces.list()` for the new `GET /v1/workspaces` discovery endpoint, and add first-class OAuth bearer token support via a new `accessToken` option (also readable from `AIR_ACCESS_TOKEN`). `workspaceId` is now optional when authenticating with `accessToken`, since discovery endpoints are called before a workspace is known. API key auth is unchanged.
