---
"@air/api-rest": minor
"@air/api-sdk": minor
---

Add Libraries resource (list/get/create/update/delete) and `libraryId` / `inGeneralLibrary` filters on the Boards list method. Supplying both filters returns 400. Library `description` accepts `null` on update to clear the field.
