import type { CursorPageParams, CursorPageResponse } from "@air/api-core";

/** Visitor comment access on a share link. */
export type ShareLinkCommentsAccess = "hidden" | "read_only" | "allowed";

/** Visitor custom field access on a share link. */
export type ShareLinkCustomFieldsAccess = "hidden" | "read_only" | "editable";

/**
 * Public share link fields shared by assets and boards.
 * `url` is the link to give to people. The password is never returned;
 * `hasPassword` says whether one is set. Disabled links are included
 * with `active: false`.
 */
export interface ShareLink {
  id: string;
  url: string;
  active: boolean;
  hasPassword: boolean;
  expiresAt: string | null;
  requireAccount: boolean;
  allowDownload: boolean;
  comments: ShareLinkCommentsAccess;
  customFields: ShareLinkCustomFieldsAccess;
  createdAt: string;
}

/**
 * Asset share link. An asset can have one link that follows the current
 * version and one link per pinned version. `versionId` is present only
 * when the link is pinned to a version.
 */
export type AssetShareLink =
  | (ShareLink & {
      followsDefaultVersion: true;
      versionId?: never;
      showAllVersions: boolean;
    })
  | (ShareLink & {
      followsDefaultVersion: false;
      versionId: string;
      showAllVersions: boolean;
    });

/** Board share link. A board has at most one. */
export type BoardShareLink = ShareLink;

/**
 * Pagination for `GET /assets/:assetId/share-links`.
 * The API defaults `limit` to 12 and caps it at 200.
 */
export type AssetShareLinkListParams = CursorPageParams;

/**
 * Response for `GET /boards/:boardId/share-links`.
 * `data` holds the board's share link, or is empty when the board has none.
 */
export interface BoardShareLinkListResponse extends CursorPageResponse<BoardShareLink> {
  total: number;
}

/**
 * Settings accepted on share-link create and update.
 * Omitted fields follow the workspace Share Link Defaults on create,
 * and stay unchanged on update.
 */
export interface ShareLinkWriteSettings {
  active?: boolean;
  allowDownload?: boolean;
}

/** Asset links also accept `showAllVersions`. */
export interface AssetShareLinkWriteSettings extends ShareLinkWriteSettings {
  showAllVersions?: boolean;
}

/**
 * Body for `POST /assets/:assetId/share-links`.
 * Exactly one of `followsDefaultVersion: true` or `versionId`.
 */
export type AssetShareLinkCreateParams = AssetShareLinkWriteSettings &
  (
    | { followsDefaultVersion: true; versionId?: never }
    | { versionId: string; followsDefaultVersion?: never }
  );

/** Body for `PATCH /assets/:assetId/share-links/:shareLinkId`. */
export type AssetShareLinkUpdateParams = AssetShareLinkWriteSettings;

/** Body for `POST /boards/:boardId/share-links`. */
export type BoardShareLinkCreateParams = ShareLinkWriteSettings;

/** Body for `PATCH /boards/:boardId/share-links/:shareLinkId`. */
export type BoardShareLinkUpdateParams = ShareLinkWriteSettings;
