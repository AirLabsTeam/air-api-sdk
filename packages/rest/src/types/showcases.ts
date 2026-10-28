import type { CursorPageParams } from "@air/api-core";
import type { ShareLink, ShareLinkWriteSettings } from "./share-links";

/**
 * Filter for the state of a showcase's share link.
 * `active`: the link is enabled. `inactive`: the link is disabled.
 * `expired`: the link's expiration date has passed.
 */
export type ShowcaseShareLinkStatus = "active" | "inactive" | "expired";

/** How many items the showcase holds. */
export interface ShowcaseStats {
  assetCount: number;
  fileCount: number;
  boardCount: number;
}

/**
 * Showcase share link. A showcase has at most one, and it uses the same
 * fields as a board share link.
 */
export type ShowcaseShareLink = ShareLink;

/**
 * A showcase and its share link.
 *
 * `shareLink` is null when the showcase has no link. `get` returns those
 * showcases. `list` omits them. Every showcase created through `create`
 * has a link.
 *
 * Sub-pages are not part of this object. A showcase that has them still
 * comes back as one showcase, and item lists return only its top-level items.
 */
export interface Showcase {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  stats: ShowcaseStats;
  shareLink: ShowcaseShareLink | null;
}

/**
 * Query for `GET /showcases`.
 * The API defaults `limit` to 12 and treats values above 200 as 200.
 * An empty `search`, an unknown `status`, a `limit` that is not a positive
 * integer, or a cursor this endpoint did not issue is 400.
 */
export interface ShowcaseListParams extends CursorPageParams {
  /** Only return showcases whose name contains this text. */
  search?: string;
  /** Filter by the state of the showcase's share link. */
  status?: ShowcaseShareLinkStatus;
}

/**
 * Body for `POST /showcases`.
 * Creates the showcase and its share link together. It does not take items;
 * add them with `addAssets` and `addBoards`. Omitted `shareLink` settings
 * follow the workspace Share Link Defaults. The same paid settings as a
 * board link apply, including `422` `ADDON_DISABLED` when the plan does not
 * include one that the request turns on. If the link cannot be created, the
 * showcase is not created either.
 */
export interface ShowcaseCreateParams {
  name: string;
  /** Empty string is rejected. Omit the field to leave the description unset. */
  description?: string;
  shareLink?: ShareLinkWriteSettings;
}

/**
 * Body for `PATCH /showcases/:showcaseId`.
 * Only the fields you send change. `null` removes the description. An empty
 * or null `name` is rejected. An empty body changes nothing.
 */
export interface ShowcaseUpdateParams {
  name?: string;
  description?: string | null;
}

/** Body for `POST /showcases/:showcaseId/assets`. `assetIds` must be non-empty. */
export interface AddShowcaseAssetsParams {
  assetIds: string[];
}

/** Body for `POST /showcases/:showcaseId/boards`. `boardIds` must be non-empty. */
export interface AddShowcaseBoardsParams {
  boardIds: string[];
}

/**
 * Body for `PATCH /showcases/:showcaseId/share-links/:shareLinkId`.
 * Same settings as a board share link.
 */
export type ShowcaseShareLinkUpdateParams = ShareLinkWriteSettings;
