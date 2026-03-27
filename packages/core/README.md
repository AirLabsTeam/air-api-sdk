# @air/api-core

Core HTTP engine for the [Air API SDK](https://github.com/AirLabsTeam/air-api-sdk).

This package provides the low-level HTTP client, pagination, error classes, and retry logic used by `@air/api-rest` and `@air/api-sdk`.

## Installation

Most users should install `@air/api-sdk` instead, which includes this package:

```bash
npm install @air/api-sdk
```

If you only need the core HTTP primitives:

```bash
npm install @air/api-core
```

## What's included

- `AirClient` — HTTP client with automatic retries, timeouts, and header management
- `PagePromise` / `CursorPage` — async-iterable pagination
- Error classes — `APIError`, `BadRequestError`, `AuthenticationError`, `NotFoundError`, `RateLimitError`, `ConnectionError`, `TimeoutError`, etc.
- Retry logic with exponential backoff for transient failures

## Documentation

- [Air Developer Docs](https://developer.air.inc/) — API reference and guides
- [GitHub Repository](https://github.com/AirLabsTeam/air-api-sdk) — source code and examples

## License

MIT
