---
"@air/api-core": minor
"@air/api-rest": minor
"@air/api-sdk": minor
---

Encode each id in a request path as one segment, so an id with `/`, `?` or `#` stays inside it. A request whose path would reach another route now rejects with `InvalidRequestPathError` before anything is sent: an empty or missing id, or an id that is `.` or `..` (also written as `%2e`). The error message says which rule failed. `encodePath` and `InvalidRequestPathError` are exported from `@air/api-core` and `@air/api-rest`. `encodePath` stringifies a number or other value the way a template literal does.

`AirBase.request` applies the same segment rules to a raw path, but it cannot tell where an id ends, so an id with `/` in a raw path still splits into two segments. Build raw paths with `encodePath`. It percent-encodes characters in the path part that are not URL-safe, including `|`, `[`, `]` and `^`, which `new URL` sent raw, and rejects a path that is not a string, does not start with `/`, contains `#`, or has an empty segment, including a trailing slash or the root path `/`. An id with a tab, newline or trailing space used to be stripped by `new URL` and is now sent encoded. A query written into the path is sent as before. The error message shows the path without its query or fragment.
