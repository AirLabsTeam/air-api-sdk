import type { Asset, AssetVersion, CdnLink } from "../../src/types/assets";
import type { Board } from "../../src/types/boards";
import type { Tag } from "../../src/types/tags";
import type { CustomField } from "../../src/types/custom-fields";
import type { Workspace } from "../../src/types/workspaces";

export function makeTag(overrides: Partial<Tag> = {}): Tag {
  return {
    id: "tag-1",
    name: "Test Tag",
    ...overrides,
  };
}

export function makeBoard(overrides: Partial<Board> = {}): Board {
  return {
    id: "board-1",
    parentBoardId: null,
    title: "Test Board",
    description: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    customFields: undefined,
    ...overrides,
  };
}

export function makeAssetVersion(overrides: Partial<AssetVersion> = {}): AssetVersion {
  return {
    id: "version-1",
    fileName: "test-file",
    ext: "png",
    title: "Test File",
    description: null,
    summary: null,
    type: "image",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    fileCreatedAt: null,
    width: 1920,
    height: 1080,
    duration: undefined,
    size: 1024,
    smartTags: [],
    tags: [],
    urls: { thumbnail: null, preview: null },
    ...overrides,
  };
}

export function makeAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: "asset-1",
    customFields: undefined,
    coverVersion: makeAssetVersion(),
    ...overrides,
  };
}

export function makeCdnLink(overrides: Partial<CdnLink> = {}): CdnLink {
  return {
    id: "cdn-link-1",
    url: "https://cdn.example.com/cdn-link-1",
    assetId: "asset-1",
    followsDefaultVersion: true,
    active: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeCustomField(overrides: Partial<CustomField> = {}): CustomField {
  return {
    id: "cf-1",
    name: "Test Field",
    description: null,
    type: "plain-text",
    values: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeWorkspace(overrides: Partial<Workspace> = {}): Workspace {
  return {
    id: "workspace-1",
    name: "Test Workspace",
    ...overrides,
  };
}

export function makePaginatedResponse<T>(data: T[], hasMore = false, cursor: string | null = null) {
  return {
    data,
    pagination: { hasMore, cursor },
    total: data.length,
  };
}
