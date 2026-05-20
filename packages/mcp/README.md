# @air/mcp

MCP server for the [Air](https://air.inc) platform.

## Workspace configuration (STDIO)

For STDIO transport (Claude Desktop, Cursor, Windsurf, etc.), `AIR_WORKSPACE_ID` is **optional**:

1. Set `AIR_WORKSPACE_ID` in your MCP server `env` (e.g. `.cursor/mcp.json`), or
2. Add `AIR_WORKSPACE_ID` to a `.env` / `.env.local` file in your project — the server loads these from the current working directory upward when Cursor starts the process in your repo.

If no workspace is configured at startup, use the `set_workspace` tool (or `get_workspace` to inspect the active ID) before calling other tools.

HTTP mode (`--http`) still requires a workspace at startup.

## Cursor example (API key only in MCP config)

```json
{
  "mcpServers": {
    "air": {
      "command": "npx",
      "args": ["-y", "@air/mcp"],
      "env": {
        "AIR_API_KEY": "your-api-key"
      }
    }
  }
}
```

Project `.env`:

```
AIR_WORKSPACE_ID=your-workspace-id
```

## Development

From the monorepo root:

```bash
npm run -w packages/mcp build
npm run -w packages/mcp test
npm run -w packages/mcp dev
```
