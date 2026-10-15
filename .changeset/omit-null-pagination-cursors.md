---
"@air/api-core": patch
"@air/api-rest": patch
"@air/api-sdk": patch
---

Omit null pagination cursors from list query strings so a `pagination.cursor` of `null` requests the first page instead of sending `?cursor=null`.
