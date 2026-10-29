import type { Asset, AssetVersion, CdnLink } from "../../src/types/assets";
import type { Board } from "../../src/types/boards";
import type { Showcase } from "../../src/types/showcases";
import type { AssetShareLink, ShareLink } from "../../src/types/share-links";
import type { Library } from "../../src/types/libraries";
import type { Discussion, DiscussionComment } from "../../src/types/discussions";
import type { Member } from "../../src/types/members";
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

export function makeLibrary(overrides: Partial<Library> = {}): Library {
  return {
    id: "library-1",
    title: "Test Library",
    accessibility: "private",
    visibility: "workspaceMembers",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
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

export function makeShowcase(overrides: Partial<Showcase> = {}): Showcase {
  return {
    id: "showcase-1",
    name: "Fall campaign",
    description: "Selects for the retail team",
    createdAt: "2026-10-27T15:00:00.000Z",
    updatedAt: "2026-10-27T15:00:00.000Z",
    stats: { assetCount: 0, fileCount: 0, boardCount: 0 },
    shareLink: makeShareLink({ id: "c4d5e6f7a", url: "https://app.air.inc/a/c4d5e6f7a" }),
    ...overrides,
  };
}

export function makeShareLink(overrides: Partial<ShareLink> = {}): ShareLink {
  return {
    id: "a1b2c3d4e",
    url: "https://app.air.inc/a/a1b2c3d4e",
    active: true,
    hasPassword: false,
    expiresAt: null,
    requireAccount: false,
    allowDownload: true,
    comments: "hidden",
    customFields: "hidden",
    createdAt: "2026-10-12T15:00:00.000Z",
    ...overrides,
  };
}

type CurrentVersionShareLink = Extract<AssetShareLink, { followsDefaultVersion: true }>;
type PinnedShareLink = Extract<AssetShareLink, { followsDefaultVersion: false }>;

export function makeCurrentVersionShareLink(
  overrides: Partial<CurrentVersionShareLink> = {},
): CurrentVersionShareLink {
  return {
    ...makeShareLink(),
    followsDefaultVersion: true,
    showAllVersions: false,
    ...overrides,
  };
}

export function makePinnedShareLink(
  overrides: Partial<Omit<PinnedShareLink, "followsDefaultVersion" | "versionId">> & {
    versionId?: string;
  } = {},
): PinnedShareLink {
  return {
    ...makeShareLink(),
    followsDefaultVersion: false,
    versionId: "version-1",
    showAllVersions: false,
    ...overrides,
  };
}

export function makeCdnLink(overrides: Partial<CdnLink> = {}): CdnLink {
  // A partial spread over the followsDefaultVersion union does not narrow.
  return {
    id: "cdn-link-1",
    url: "https://cdn.example.com/cdn-link-1",
    assetId: "asset-1",
    followsDefaultVersion: true,
    active: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  } as CdnLink;
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

export function makeDiscussionComment(
  overrides: Partial<DiscussionComment> = {},
): DiscussionComment {
  return {
    id: "comment-1",
    discussionId: "discussion-1",
    body: "Please review",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    author: {
      type: "workspace_account",
      id: "account-1",
      displayName: "Ada Lovelace",
    },
    mentions: [],
    ...overrides,
  };
}

export function makeDiscussion(overrides: Partial<Discussion> = {}): Discussion {
  const comment = makeDiscussionComment();
  return {
    id: "discussion-1",
    resolved: false,
    createdAt: "2024-01-01T00:00:00.000Z",
    lastCommentedAt: "2024-01-01T00:00:00.000Z",
    asset: { id: "asset-1" },
    assetVersion: { id: "version-1", version: 2 },
    annotations: [],
    comments: {
      data: [comment],
      pagination: { hasMore: false, cursor: null },
      total: 1,
    },
    ...overrides,
  };
}

export function makeMember(overrides: Partial<Member> = {}): Member {
  return {
    id: "account-1",
    type: "member",
    displayName: "Ada Lovelace",
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    firstJoinedAt: "2024-03-01 12:00:00.123456+00",
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
