# Air API SDK

Typed JavaScript/TypeScript SDK for the [Air](https://air.inc) API. See the [developer docs](https://developer.air.inc/) for API reference and guides.

## Installation

```bash
npm install @air/api-sdk
# or
yarn add @air/api-sdk
# or
bun add @air/api-sdk
```

## Quick start

```ts
import { AirApi } from "@air/api-sdk";

const air = new AirApi({
  apiKey: "your-api-key",
  workspaceId: "your-workspace-id",
});

// List boards
const page = await air.boards.list();
console.log(page.data);
```

### Environment variables

Instead of passing options directly, you can set environment variables:

```bash
export AIR_API_KEY=your-api-key
export AIR_WORKSPACE_ID=your-workspace-id
```

```ts
const air = new AirApi(); // reads from env
```

## Configuration

```ts
const air = new AirApi({
  apiKey: "your-api-key", // or AIR_API_KEY env var
  accessToken: "your-oauth-token", // or AIR_ACCESS_TOKEN env var (mutually exclusive with apiKey)
  workspaceId: "your-workspace-id", // or AIR_WORKSPACE_ID env var
  baseURL: "https://api.air.inc/v1", // default
  maxRetries: 3, // default, with exponential backoff
  timeout: 60_000, // default, in milliseconds
  defaultHeaders: {
    // optional, sent with every request
    "user-agent": "my-app/1.0",
    "x-custom-header": "value",
  },
});
```

## Authentication

The SDK supports two authentication modes; choose exactly one per client.

### API key (workspace-scoped)

The classic mode. The key is tied to a single workspace, so `workspaceId` is required.

```ts
const air = new AirApi({ apiKey: "...", workspaceId: "..." });
```

The SDK sends `x-api-key` and `x-air-workspace-id` on every request.

### OAuth 2.0 bearer token

For integrations that need cross-workspace access or for endpoints that don't accept API keys (notably the discovery endpoint `GET /v1/workspaces`):

```ts
const air = new AirApi({ accessToken: "..." });

// workspaceId is optional in bearer mode — required only for workspace-scoped calls
const air = new AirApi({ accessToken: "...", workspaceId: "..." });
```

When `accessToken` is set the SDK sends `Authorization: Bearer …` and only includes `x-air-workspace-id` if a `workspaceId` is configured. Explicit constructor options always win over env vars, so an unrelated `AIR_ACCESS_TOKEN` in your shell won't conflict with an `apiKey` you pass directly.

See [OAuth helpers](#oauth-helpers) below for acquiring tokens.

### Custom headers

Use `defaultHeaders` to attach headers to every request. This is useful for overriding the default `user-agent` (`air-api-sdk/<version>`) or passing tracking headers so the backend can identify your integration:

```ts
const air = new AirApi({
  apiKey: "your-api-key",
  workspaceId: "your-workspace-id",
  defaultHeaders: {
    "user-agent": "my-app/1.0",
    "x-air-client-source": "my-integration",
  },
});
```

Headers are merged in order of precedence (last wins):

1. SDK defaults (`x-api-key` or `Authorization: Bearer …`, plus `x-air-workspace-id` when configured, and `user-agent: air-api-sdk/<version>`)
2. `defaultHeaders` from the constructor
3. Per-request `headers` on individual API calls

## Resources

### Boards

```ts
// List boards
const page = await air.boards.list({ limit: 10 });

// Filter by name or parent
const filtered = await air.boards.list({ name: "My Board", parentBoardId: "board-id" });

// CRUD
const board = await air.boards.create({ title: "New Board", description: "Optional" });
const fetched = await air.boards.get(board.id);
await air.boards.update(board.id, { title: "Renamed" });
await air.boards.delete(board.id);

// Sub-boards
const child = await air.boards.create({ title: "Child", parentBoardId: board.id });

// Board assets
await air.boards.addAssets(board.id, { assetIds: ["asset-id-1", "asset-id-2"] });
await air.boards.removeAsset(board.id, "asset-id-1");

// Board custom fields
await air.boards.setCustomField(board.id, "custom-field-id", { value: "hello" });
await air.boards.setCustomField(board.id, "custom-field-id", { value: null }); // clear

// Guest management
const guest = await air.boards.addGuest(board.id, {
  email: "guest@example.com",
  roleId: "role-id",
});
const guests = await air.boards.listGuests(board.id);
const filtered = await air.boards.listGuests(board.id, { email: "guest@example.com" });
await air.boards.updateGuest(board.id, guest.id, { roleId: "new-role-id" });
await air.boards.removeGuest(board.id, guest.id);
```

### Assets

```ts
// List assets (supports filtering by board, tags, custom fields, search, date range)
const page = await air.assets.list({ parentBoardId: "board-id", limit: 20 });
const searched = await air.assets.list({ search: "logo" });

// Get and delete
const asset = await air.assets.get("asset-id");
await air.assets.delete("asset-id");

// Custom fields on assets
await air.assets.setCustomField("asset-id", "cf-id", { value: "text value" });
await air.assets.setCustomField("asset-id", "cf-id", { values: [{ id: "value-id" }] }); // select fields

// List boards an asset belongs to
const boards = await air.assets.listBoards("asset-id");

// CDN links
const { data: cdnLinks } = await air.assets.listCdnLinks("asset-id");

const evergreenLink = await air.assets.createCdnLink("asset-id", {
  followsDefaultVersion: true,
});

const versionPinnedLink = await air.assets.createCdnLink("asset-id", {
  versionId: "version-id",
});

await air.assets.updateCdnLink("asset-id", evergreenLink.id, { active: false });
await air.assets.updateCdnLink("asset-id", evergreenLink.id, { active: true });

// If create returns a 409 Conflict, list existing CDN links to recover the URL.
const existingLink = cdnLinks.find((link) => link.followsDefaultVersion);
```

### Asset versions

```ts
const { data: versions } = await air.assets.listVersions("asset-id");
const version = await air.assets.getVersion("asset-id", "version-id");
await air.assets.updateVersion("asset-id", "version-id", { title: "New title" });

// Download URL
const { url } = await air.assets.getVersionDownloadUrl("asset-id", "version-id");

// Version tags
await air.assets.addVersionTag("asset-id", "version-id", { id: "tag-id" });
await air.assets.removeVersionTag("asset-id", "version-id", "tag-id");
```

### Tags

```ts
const page = await air.tags.list();
const tag = await air.tags.create({ name: "My Tag" });
const fetched = await air.tags.get(tag.id);
await air.tags.update(tag.id, { name: "Renamed Tag" });
await air.tags.delete(tag.id);
```

### Custom fields

```ts
// List and CRUD
const page = await air.customFields.list();
const cf = await air.customFields.create({
  name: "Status",
  type: "single-select", // 'single-select' | 'multi-select' | 'plain-text' | 'date'
  values: [{ name: "Active" }, { name: "Archived" }],
});
await air.customFields.update(cf.id, { name: "Project Status" });
await air.customFields.delete(cf.id);

// Manage select field values
const value = await air.customFields.createValue(cf.id, { name: "In Review" });
await air.customFields.updateValue(cf.id, value.id, { name: "Under Review" });
await air.customFields.deleteValue(cf.id, value.id);
```

### Roles

```ts
const roles = await air.roles.list({ type: "guest" });
// Returns: [{ id, name, description, billable, type }]
```

### Uploads

```ts
// High-level upload — from file path
const result = await air.uploads.uploadFile(
  { filePath: "./photo.png" },
  { parentBoardId: "board-id" },
);
console.log(result.assetId, result.versionId);

// From buffer
const result = await air.uploads.uploadFile(
  { buffer: myBuffer, fileName: "photo", ext: "png", mime: "image/png" },
  { parentBoardId: "board-id" },
);

// With progress tracking
await air.uploads.uploadFile(
  { filePath: "./video.mp4" },
  {
    parentBoardId: "board-id",
    onProgress: ({ percentage, uploadedBytes, totalBytes }) => {
      console.log(`${percentage}% (${uploadedBytes}/${totalBytes})`);
    },
  },
);

// With tags and custom fields
await air.uploads.uploadFile(
  { filePath: "./doc.pdf" },
  {
    parentBoardId: "board-id",
    tags: [{ id: "tag-id" }],
    customFields: [{ id: "cf-id", value: "some value" }],
  },
);
```

Files over 5 GB are automatically uploaded using multipart upload.

For low-level control, use `air.uploads.create()` directly to get a presigned URL.

### Imports

```ts
// Import from URL
const imp = await air.imports.create({
  sourceUrl: "https://example.com/image.png",
  parentBoardId: "board-id",
  title: "Imported Image",
});
console.log(imp.id, imp.assetId);

// Check import status
const status = await air.imports.getStatus(imp.id);
console.log(status.status); // 'pending' | 'inProgress' | 'succeeded' | 'failed'
```

### Workspaces

Discovery endpoint that lists the workspaces the authenticated principal can access. **Requires OAuth bearer auth** — API keys are bound to a single workspace and so cannot be used here. The `x-air-workspace-id` header must not be sent for this call, which is why the client supports being constructed without a `workspaceId` when using `accessToken`.

```ts
const air = new AirApi({ accessToken: "..." });
const workspaces = await air.workspaces.list();
// [{ id, name }, ...]
```

Requires the `workspace.read` OAuth scope.

## OAuth helpers

The SDK exposes helpers for the authorization_code + PKCE flow so consumers don't need a separate library. They return `{ accessToken, tokenType, expiresIn, scope?, refreshToken? }` suitable for passing into `new AirApi({ accessToken })`.

### Authorization code + PKCE (user-facing)

The Air Public API uses authorization_code + PKCE for both user-facing tools (CLIs, desktop apps) and confidential server integrations. The three pieces compose:

```ts
import {
  generatePKCEChallenge,
  buildAuthorizationUrl,
  exchangeAuthorizationCode,
} from "@air/api-sdk";

// 1. Generate the PKCE pair and keep the verifier around.
const { codeVerifier, codeChallenge } = generatePKCEChallenge();
const state = crypto.randomBytes(16).toString("hex");

// 2. Send the user to Air's consent URL (NOT directly to the authorization
//    server — the Air consent flow records the per-account scope grant and
//    then completes the OAuth handoff).
const url = buildAuthorizationUrl({
  authorizeUrl: "https://app.air.inc/oauth/consent",
  clientId: "...",
  redirectUri: "https://example.com/oauth/air/callback",
  codeChallenge,
  state,
  scopes: ["assets.read", "boards.read"], // bare names; Air adds the prefix
});

// 3. After the redirect arrives at your callback URL, exchange the code:
const { accessToken } = await exchangeAuthorizationCode({
  tokenUrl: "https://auth.air.inc/oauth2/token",
  clientId: "...",
  clientSecret: "...", // omit for public clients
  code, // from the callback query string
  codeVerifier,
  redirectUri: "https://example.com/oauth/air/callback",
});
```

Scope handling differs by entry point: Air's `/oauth/consent` page expects bare names (`assets.read`) and applies the resource-server prefix itself; the authorization server's `/oauth2/authorize` (and `/oauth2/token`) expect the fully-qualified form (`public-api/assets.read`).

### Client authentication

For confidential clients (those with a `clientSecret`), `exchangeAuthorizationCode` accepts a `clientAuthMethod` option:

| Value               | Behavior                                                                                                                |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"basic"` (default) | Sends `Authorization: Basic base64(client_id:client_secret)`. Preferred per RFC 6749 §2.3.1.                            |
| `"body"`            | Sends `client_id` and `client_secret` in the form body. Use this when an upstream proxy strips `Authorization` headers. |

Public clients (no `clientSecret`) always send `client_id` in the body and never set an `Authorization` header.

```ts
await exchangeAuthorizationCode({
  tokenUrl: "https://auth.air.inc/oauth2/token",
  clientId: "...",
  clientSecret: "...",
  code,
  codeVerifier,
  redirectUri: "https://example.com/oauth/air/callback",
  clientAuthMethod: "body", // override the default
});
```

Errors from these helpers surface as the standard `APIError` subclasses (`AuthenticationError`, `BadRequestError`, etc.) and `ConnectionError` on network failures.

## Pagination

List methods return a `PagePromise` that supports two patterns:

### Auto-pagination

```ts
for await (const asset of air.assets.list({ limit: 50 })) {
  console.log(asset.id);
  // automatically fetches subsequent pages
}
```

### Manual pagination

```ts
const page = await air.assets.list({ limit: 50 });
console.log(page.data); // current page items
console.log(page.total); // total count (when available)
console.log(page.pagination); // { hasMore: boolean, cursor: string | null }

if (page.hasNextPage()) {
  const next = await page.getNextPage();
}
```

## Error handling

All API errors extend `APIError` with `status`, `body`, and `headers` properties. Specific error classes are thrown based on HTTP status:

| Status | Error class           |
| ------ | --------------------- |
| 400    | `BadRequestError`     |
| 401    | `AuthenticationError` |
| 403    | `PermissionError`     |
| 404    | `NotFoundError`       |
| 429    | `RateLimitError`      |
| 500+   | `InternalServerError` |

Network failures throw `ConnectionError`, and timeouts throw `TimeoutError`.

```ts
import { NotFoundError, RateLimitError, APIError } from "@air/api-sdk";

try {
  await air.assets.get("non-existent-id");
} catch (err) {
  if (err instanceof NotFoundError) {
    console.log("Asset not found");
  } else if (err instanceof RateLimitError) {
    console.log(`Rate limited, retry after ${err.retryAfter}s`);
  } else if (err instanceof APIError) {
    console.log(err.status, err.message);
  }
}
```

Retryable errors (408, 429, 500, 502, 503, 504) are automatically retried with exponential backoff up to `maxRetries` times.

## Development

### Prerequisites

- Node.js >= 18 (or Bun, or any npm-compatible package manager)

### Setup

```bash
npm install
# or: yarn install / bun install
```

### Build

```bash
npm run build
# or: yarn build / bun run build
```

### Tests

Unit tests:

```bash
npm test
# or: yarn test / bun run test
```

End-to-end tests (requires real API credentials in `.env.test`):

```bash
cp .env.example .env.test
# fill in credentials, then:
npm run test:e2e
```

The suite can run against either auth mode, selected via `AIR_E2E_AUTH_MODE`:

| Mode               | Required env vars                                   | What it exercises                                                                                  |
| ------------------ | --------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `apikey` (default) | `AIR_API_KEY`, `AIR_WORKSPACE_ID`                   | All existing resources via `x-api-key`. `tests/e2e/workspaces.test.ts` is skipped.                 |
| `oauth`            | `AIR_WORKSPACE_ID`, plus a cached token (see below) | Same resources via `Authorization: Bearer …`, **plus** the discovery test in `workspaces.test.ts`. |

CI typically runs both passes to catch divergence between the two auth paths.

#### Acquiring a token for `oauth` mode

`tests/e2e/helpers/global-setup.ts` reads a pre-acquired token from `.oauth-token-cache.json` (gitignored). Run the helper script to populate that file via the authorization_code + PKCE flow:

```bash
npm run e2e:get-token
```

The script reads OAuth config from `.env.test`:

| Env var                   | Required                  | Notes                                                                                                                                                       |
| ------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AIR_OAUTH_CLIENT_ID`     | yes                       | OAuth client ID provisioned by Air                                                                                                                          |
| `AIR_OAUTH_CLIENT_SECRET` | yes (confidential client) | OAuth client secret                                                                                                                                         |
| `AIR_OAUTH_TOKEN_URL`     | yes                       | e.g. `https://auth.air.inc/oauth2/token` (use your environment's value)                                                                                     |
| `AIR_OAUTH_AUTHORIZE_URL` | yes                       | Air's consent URL, e.g. `https://app.air.inc/oauth/consent` — **not** the authorization server's `/authorize` (see [OAuth helpers](#oauth-helpers) for why) |
| `AIR_OAUTH_REDIRECT_URI`  | no                        | Defaults to `http://localhost:3000/oauth/callback`; must be registered for the OAuth client                                                                 |
| `AIR_OAUTH_SCOPES`        | no                        | Space- or newline-separated bare scope names; defaults to the full set the SDK exercises                                                                    |

The script binds a local HTTP server to the redirect_uri's port, prints the URL to open in a browser, and writes the resulting token (and expiry) to `.oauth-token-cache.json`. If the port is already in use the script fails fast with instructions for finding and killing the offending process; it does not silently fall back to a different port because the OAuth client would reject the resulting redirect_uri. Tokens typically expire after ~60 minutes — re-run the script when expired.

### Type checking

```bash
npm run typecheck
```

### Packages

| Package         | Description                                  |
| --------------- | -------------------------------------------- |
| `@air/api-core` | HTTP client, pagination, errors, retry logic |
| `@air/api-rest` | Resource classes and types                   |
| `@air/api-sdk`  | Unified entry point (re-exports core + rest) |

## Releasing

This project uses [Changesets](https://github.com/changesets/changesets) to manage versioning and publishing.

### 1. Add a changeset

When you make a change that should be published, add a changeset describing it:

```bash
npm run changeset:add
```

This launches an interactive prompt where you select the affected packages and bump type (`patch`, `minor`, or `major`), then write a short summary. It creates a markdown file in `.changeset/` — commit this with your PR.

### 2. Merge to main

When your PR (with the changeset file) merges to `main`, the CI workflow automatically creates or updates a **"chore: version packages"** PR that bumps versions and updates changelogs.

### 3. Publish

Merge the "chore: version packages" PR. CI will publish the new versions to npm and create GitHub releases.

### Scripts

| Script                  | Description                                                           |
| ----------------------- | --------------------------------------------------------------------- |
| `npm run changeset:add` | Add a new changeset (interactive)                                     |
| `npm run version`       | Apply changesets — bump versions and update changelogs (CI does this) |
| `npm run release`       | Publish packages to npm (CI does this)                                |

## Requirements

- Node.js >= 18
- TypeScript >= 5.7 (if using TypeScript)
