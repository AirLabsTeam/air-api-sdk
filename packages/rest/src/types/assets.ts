import type { CursorPageParams } from "@air/api-core";
import type { Tag } from "./tags";

export interface SmartTag {
  name: string;
}

export interface AssetCustomFieldValue {
  id: string;
  name: string;
  type: string;
  value: string | null;
  values: { id: string; name: string }[] | null;
}

export interface AssetVersionUrls {
  thumbnail: string | null;
  preview: string | null;
}

export interface AssetVersion {
  id: string;
  fileName: string;
  ext: string;
  title: string;
  description: string | null;
  summary: string | null;
  type: string;
  createdAt: string;
  updatedAt: string;
  fileCreatedAt: string | null;
  width: number | null;
  height: number | null;
  duration: number | undefined;
  size: number;
  smartTags: SmartTag[];
  tags: Tag[] | undefined;
  urls: AssetVersionUrls;
}

export interface Asset {
  id: string;
  customFields: AssetCustomFieldValue[] | undefined;
  coverVersion: AssetVersion;
}

export type AssetCustomFieldTextOperator = "text" | "textPrefix" | "textNot";

export type AssetCustomFieldDateOperator = "dateGte" | "dateLte";

export interface AssetCustomFieldSelectFilter {
  id: string;
  valueId: string;
}

export interface AssetCustomFieldTextFilter {
  id: string;
  operator: AssetCustomFieldTextOperator;
  value: string;
}

export interface AssetCustomFieldDateFilter {
  id: string;
  operator: AssetCustomFieldDateOperator;
  value: string;
}

/**
 * One `customField` query value for `assets.list`.
 *
 * A string is sent unchanged (`fieldId:valueId`, or an operator string the
 * caller already formatted). A structured filter is serialized to that same
 * query value. Repeats become repeated query params.
 */
export type AssetCustomFieldFilter =
  | string
  | AssetCustomFieldSelectFilter
  | AssetCustomFieldTextFilter
  | AssetCustomFieldDateFilter;

export interface AssetListParams extends CursorPageParams {
  parentBoardId?: string;
  /**
   * Only return assets added to this showcase. With `includeNestedAssets`,
   * also returns the assets inside the boards added to it. Items on the
   * showcase's sub-pages are not returned. Combining with `parentBoardId`
   * or `semantic: true` is rejected with 400. An unknown showcase is 404;
   * one the caller cannot view is 403.
   */
  showcaseId?: string;
  /**
   * With `parentBoardId`, return assets from nested sub-boards. With
   * `showcaseId`, also return assets inside the boards added to the
   * showcase. Requires one of those filters.
   */
  includeNestedAssets?: boolean;
  tag?: string | string[];
  /**
   * Filter by custom field. Select filters are `{ id, valueId }` (or the
   * `fieldId:valueId` string). Repeats of one field are OR, and different
   * fields are AND.
   *
   * Plain text is `{ id, operator: "text" | "textPrefix" | "textNot", value }`.
   * `text` repeats are OR, `textPrefix` is one prefix, and `textNot` excludes.
   * The value keeps colons and surrounding spaces. Empty text, more than 256
   * characters, and more than 20 values are rejected with 400.
   *
   * Dates are `{ id, operator: "dateGte" | "dateLte", value }`. `dateGte` is an
   * inclusive start and `dateLte` is an inclusive end, one of each per field.
   * A `YYYY-MM-DD` value is that UTC day (`dateGte` at `T00:00:00.000Z`,
   * `dateLte` at `T23:59:59.999Z`). The app stores a picked date as the
   * viewer's local midnight converted to UTC, so match that shown day with an
   * ISO-8601 instant (`T` and `Z` or `±HH:MM`). A start after the end is 400.
   *
   * One field accepts one operator kind. A mix of select, `text`, `textPrefix`,
   * `textNot`, and date bounds on that field is 400. `boards.list` accepts
   * select strings only. `semantic: true` rejects `customField`.
   */
  customField?: AssetCustomFieldFilter | AssetCustomFieldFilter[];
  search?: string;
  /**
   * When true, `search` is used for semantic search via AI embeddings.
   * Requires a non-blank `search` value and Semantic Search enabled on the workspace.
   * Returns a single page of results ordered by relevance. Combining with `tag`,
   * `customField`, `createdAt`, `cursor`, or `showcaseId` is rejected by the API with 400.
   */
  semantic?: boolean;
  "createdAt[gte]"?: string;
  "createdAt[lte]"?: string;
}

export interface AssetVersionUpdateParams {
  title?: string;
  description?: string;
}

export interface SetCustomFieldParams {
  value?: string | null;
  values?: { id: string }[] | null;
}

export interface AddVersionTagParams {
  id: string;
}

export interface AssetVersionDownloadUrl {
  url: string;
}

interface CdnLinkBase {
  id: string;
  url: string;
  assetId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CdnLink =
  | (CdnLinkBase & { followsDefaultVersion: true; versionId?: never })
  | (CdnLinkBase & { followsDefaultVersion: false; versionId: string });

export type AssetCdnLinkCreateParams =
  | { followsDefaultVersion: true; versionId?: never }
  | { versionId: string; followsDefaultVersion?: never };

export interface AssetCdnLinkUpdateParams {
  active: boolean;
}

export interface AssetCdnLinkListResponse {
  data: CdnLink[];
}

export interface AssetBoardListParams extends CursorPageParams {
  includeCustomFields?: boolean;
}

export interface AssetVersionListResponse {
  data: AssetVersion[];
  total: number;
}
