---
"@air/mcp": minor
"@air/api-core": patch
---

Make STDIO MCP workspace-aware: load `AIR_WORKSPACE_ID` from project `.env`, allow omitting it from MCP env config, and add `get_workspace` / `set_workspace` tools. Allow constructing the API client without a default workspace when using per-request workspace context.
