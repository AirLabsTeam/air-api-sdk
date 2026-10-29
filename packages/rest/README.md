# @air/api-rest

Typed REST client for the [Air API SDK](https://github.com/AirLabsTeam/air-api-sdk).

This package provides the resource classes (boards, showcases, assets, tags, custom fields, discussions, members, uploads, imports, roles) and their TypeScript types. It builds on `@air/api-core` for HTTP transport.

## Installation

Most users should install `@air/api-sdk` instead, which includes this package:

```bash
npm install @air/api-sdk
```

If you only need the REST resource layer:

```bash
npm install @air/api-rest
```

## What's included

- Resource classes: `Boards`, `Showcases`, `Assets`, `Tags`, `CustomFields`, `Discussions`, `Members`, `Uploads`, `Imports`, `Roles`
- Discussions: `list`, `get`, `listComments`, `create`, `createComment`, `update`, `updateComment`, `deleteComment`
- Members: `list`
- Showcases: `list`, `get`, `create`, `update`, `updateShareLink`, `addAssets`, `removeAsset`, `addBoards`, `removeBoard`, plus a `showcaseId` filter on `assets.list` and `boards.list`
- Asset CDN link helpers: `listCdnLinks`, `createCdnLink`, and `updateCdnLink`
- Share links: `listShareLinks`, `createShareLink`, and `updateShareLink` on assets and boards
- Full TypeScript types for all API request/response shapes
- `AirApi` client class that composes all resources

## Documentation

- [Air Developer Docs](https://developer.air.inc/) — API reference and guides
- [GitHub Repository](https://github.com/AirLabsTeam/air-api-sdk) — source code and examples

## License

MIT
