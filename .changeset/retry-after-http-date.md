---
"@air/api-core": patch
"@air/api-rest": patch
"@air/api-sdk": patch
---

Parse `Retry-After` response headers in both forms RFC 9110 §10.2.3 allows. A rate-limit response carrying an HTTP-date (rather than delay-seconds) previously produced `retryAfter: NaN`, which collapsed the backoff to no delay and retried the request immediately. HTTP-dates are now normalized to seconds from now, values in the past and negative delay-seconds clamp to `0`, and an unparseable header yields `null` so the exponential backoff applies.
