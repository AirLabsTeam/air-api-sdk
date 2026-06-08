---
"@air/api-sdk": patch
---

Bundle @air/api-core and @air/api-rest directly into the package output. These sub-packages are now internal implementation details and are no longer required as separate npm dependencies. This fixes the broken 0.2.0 release where those packages could not be published.
