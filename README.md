# Air API SDK

Typed JavaScript/TypeScript SDK for the [Air](https://air.inc) API.

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

1. SDK defaults (`x-api-key`, `x-air-workspace-id`, `user-agent: air-api-sdk/<version>`)
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

End-to-end tests (requires API credentials):

```bash
cp .env.example .env.test
# fill in AIR_API_KEY and AIR_WORKSPACE_ID
npm run test:e2e
```

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

## Requirements

- Node.js >= 18
- TypeScript >= 5.7 (if using TypeScript)
