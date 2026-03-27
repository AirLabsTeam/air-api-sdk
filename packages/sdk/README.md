# @air/api-sdk

Typed JavaScript/TypeScript SDK for the [Air](https://air.inc) API.

This is the main package you should install. It re-exports everything from `@air/api-core` and `@air/api-rest`.

## Installation

```bash
npm install @air/api-sdk
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

## Resources

- Boards: `air.boards.*` (list, get, create, update, delete, guests, custom fields)
- Assets: `air.assets.*` (list, get, delete, versions, custom fields, tags)
- Tags: `air.tags.*` (list, get, create, update, delete)
- Custom fields: `air.customFields.*` (list, create, update, delete, values)
- Roles: `air.roles.*` (list)
- Uploads: `air.uploads.*` (uploadFile with progress tracking, multipart for large files)
- Imports: `air.imports.*` (create, getStatus)

## Pagination

List methods return a `PagePromise` that supports auto-pagination:

```ts
for await (const asset of air.assets.list({ limit: 50 })) {
  console.log(asset.id);
}
```

Or manual pagination:

```ts
const page = await air.assets.list({ limit: 50 });
console.log(page.data);
if (page.hasNextPage()) {
  const next = await page.getNextPage();
}
```

## Error handling

All API errors extend `APIError`. Specific error classes are thrown based on HTTP status (400 `BadRequestError`, 401 `AuthenticationError`, 403 `PermissionError`, 404 `NotFoundError`, 429 `RateLimitError`, 500+ `InternalServerError`). Retryable errors are automatically retried with exponential backoff.

## Documentation

- [Air Developer Docs](https://developer.air.inc/) — API reference and guides
- [GitHub Repository](https://github.com/AirLabsTeam/air-api-sdk) — source code and examples

## License

MIT
