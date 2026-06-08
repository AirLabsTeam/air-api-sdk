---
"@air/api-rest": patch
"@air/api-sdk": patch
---

Bundle `@air/api-core` into `@air/api-rest` so `@air/api-rest` can be published and consumed independently without requiring a separate `@air/api-core` publish.

`@air/api-sdk` now aggregates published packages and depends on `@air/api-rest` instead of internal `@air/api-core`, keeping package boundaries aligned with the intended architecture.
