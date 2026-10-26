---
"@air/api-rest": minor
"@air/api-sdk": minor
---

`assets.list` accepts plain-text (`text`, `textPrefix`, `textNot`) and date (`dateGte`, `dateLte`) custom field filters, plus structured select filters. Strings such as `fieldId:valueId` still pass through. `boards.list` stays select-only.
