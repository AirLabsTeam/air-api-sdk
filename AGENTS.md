# AGENTS.md

## Cursor Cloud specific instructions

This is a **library/SDK monorepo** (npm workspaces) — there are no servers, databases, or Docker services to run.

### Quick reference

| Action | Command |
|--------|---------|
| Install deps | `npm install` |
| Build all packages | `npm run build` (must run in dependency order: core → rest → sdk) |
| Unit tests | `npm test` (uses vitest with mock fetch — fully offline, no credentials needed) |
| E2E tests | `npm run test:e2e` (requires `AIR_API_KEY` + `AIR_WORKSPACE_ID` in `.env.test`) |
| Lint | `npm run lint` |
| Typecheck | `npm run typecheck` |
| Format check | `npm run format:check` |

### Non-obvious notes

- **Node.js 24** is required (see `.nvmrc`). Run `nvm use` or `nvm install 24` before any npm commands.
- **Build before typecheck**: `npm run typecheck` uses TypeScript project references. If `dist/` folders are missing in workspace packages, typecheck may fail. Run `npm run build` first after a fresh install.
- **Unit tests are fully self-contained**: They mock `fetch` internally — no network access or API credentials needed.
- **E2E tests hit the live Air API**: They require real credentials. Copy `.env.example` to `.env.test` and fill in `AIR_API_KEY` and `AIR_WORKSPACE_ID`.
- **Package dependency order**: `@air/api-core` → `@air/api-rest` → `@air/api-sdk`. The build script already handles this ordering.
