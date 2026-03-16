import type { CursorPageParams } from '@air/api-core';
import type { Tag } from './tags';

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

export interface AssetListParams extends CursorPageParams {
  parentBoardId?: string;
  includeNestedAssets?: boolean;
  tag?: string | string[];
  customField?: string | string[];
  search?: string;
  'createdAt[gte]'?: string;
  'createdAt[lte]'?: string;
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

export interface AssetBoardListParams extends CursorPageParams {
  includeCustomFields?: boolean;
}

export interface AssetVersionListResponse {
  data: AssetVersion[];
  total: number;
}
