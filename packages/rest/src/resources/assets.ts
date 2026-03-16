import type { AirBase, PagePromise } from '@air/api-core';
import type { Board } from '../types/boards';
import type {
  AddVersionTagParams,
  Asset,
  AssetBoardListParams,
  AssetListParams,
  AssetVersion,
  AssetVersionDownloadUrl,
  AssetVersionListResponse,
  AssetVersionUpdateParams,
  SetCustomFieldParams,
} from '../types/assets';

export class Assets {
  constructor(private client: AirBase) {}

  list(params: AssetListParams = {}): PagePromise<Asset> {
    const query: Record<string, string | string[] | number | boolean | undefined> = {
      limit: params.limit,
      cursor: params.cursor,
      parentBoardId: params.parentBoardId,
      search: params.search,
    };

    if (params.includeNestedAssets !== undefined) {
      query.includeNestedAssets = params.includeNestedAssets;
    }
    if (params.tag) {
      query.tag = params.tag;
    }
    if (params.customField) {
      query.customField = params.customField;
    }
    if (params['createdAt[gte]']) {
      query['createdAt[gte]'] = params['createdAt[gte]'];
    }
    if (params['createdAt[lte]']) {
      query['createdAt[lte]'] = params['createdAt[lte]'];
    }

    return this.client.requestCursorPage<Asset>(
      { method: 'GET', path: '/assets', query },
      query,
    );
  }

  async get(assetId: string): Promise<Asset> {
    return this.client.request<Asset>({
      method: 'GET',
      path: `/assets/${assetId}`,
    });
  }

  async delete(assetId: string): Promise<void> {
    return this.client.request<void>({
      method: 'DELETE',
      path: `/assets/${assetId}`,
    });
  }

  async setCustomField(assetId: string, customFieldId: string, params: SetCustomFieldParams): Promise<void> {
    return this.client.request<void>({
      method: 'PUT',
      path: `/assets/${assetId}/customfields/${customFieldId}`,
      body: params,
    });
  }

  async listVersions(assetId: string): Promise<AssetVersionListResponse> {
    return this.client.request<AssetVersionListResponse>({
      method: 'GET',
      path: `/assets/${assetId}/versions`,
    });
  }

  async getVersion(assetId: string, versionId: string): Promise<AssetVersion> {
    return this.client.request<AssetVersion>({
      method: 'GET',
      path: `/assets/${assetId}/versions/${versionId}`,
    });
  }

  async updateVersion(assetId: string, versionId: string, params: AssetVersionUpdateParams): Promise<void> {
    return this.client.request<void>({
      method: 'PATCH',
      path: `/assets/${assetId}/versions/${versionId}`,
      body: params,
    });
  }

  async getVersionDownloadUrl(assetId: string, versionId: string): Promise<AssetVersionDownloadUrl> {
    return this.client.request<AssetVersionDownloadUrl>({
      method: 'GET',
      path: `/assets/${assetId}/versions/${versionId}/download`,
    });
  }

  async addVersionTag(assetId: string, versionId: string, params: AddVersionTagParams): Promise<AssetVersion> {
    return this.client.request<AssetVersion>({
      method: 'POST',
      path: `/assets/${assetId}/versions/${versionId}/tags`,
      body: params,
    });
  }

  async removeVersionTag(assetId: string, versionId: string, tagId: string): Promise<void> {
    return this.client.request<void>({
      method: 'DELETE',
      path: `/assets/${assetId}/versions/${versionId}/tags/${tagId}`,
    });
  }

  listBoards(assetId: string, params: AssetBoardListParams = {}): PagePromise<Board> {
    const query: Record<string, string | number | boolean | undefined> = {
      limit: params.limit,
      cursor: params.cursor,
    };

    if (params.includeCustomFields !== undefined) {
      query.includeCustomFields = params.includeCustomFields;
    }

    return this.client.requestCursorPage<Board>(
      { method: 'GET', path: `/assets/${assetId}/boards`, query },
      query,
    );
  }
}
