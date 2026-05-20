import {
  withRequestContext,
  type AirBase,
  type PagePromise,
  type RequestContext,
} from "@air/api-core";
import type { Board } from "../types/boards";
import type {
  AddVersionTagParams,
  Asset,
  AssetBoardListParams,
  AssetCdnLink,
  AssetListParams,
  AssetVersion,
  AssetVersionCdnLink,
  AssetVersionDownloadUrl,
  AssetVersionListResponse,
  AssetVersionUpdateParams,
  SetCustomFieldParams,
} from "../types/assets";

export class Assets {
  constructor(private client: AirBase) {}

  list(params: AssetListParams = {}, context?: RequestContext): PagePromise<Asset> {
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

    if (params["createdAt[gte]"]) {
      query["createdAt[gte]"] = params["createdAt[gte]"];
    }

    if (params["createdAt[lte]"]) {
      query["createdAt[lte]"] = params["createdAt[lte]"];
    }

    return this.client.requestCursorPage<Asset>(
      withRequestContext({ method: "GET", path: "/assets", query }, context),
      query,
    );
  }

  async get(assetId: string, context?: RequestContext): Promise<Asset> {
    return this.client.request<Asset>(
      withRequestContext({ method: "GET", path: `/assets/${assetId}` }, context),
    );
  }

  async delete(assetId: string, context?: RequestContext): Promise<void> {
    return this.client.request<void>(
      withRequestContext({ method: "DELETE", path: `/assets/${assetId}` }, context),
    );
  }

  async setCustomField(
    assetId: string,
    customFieldId: string,
    params: SetCustomFieldParams,
    context?: RequestContext,
  ): Promise<void> {
    return this.client.request<void>(
      withRequestContext(
        {
          method: "PUT",
          path: `/assets/${assetId}/customfields/${customFieldId}`,
          body: params,
        },
        context,
      ),
    );
  }

  async listVersions(assetId: string, context?: RequestContext): Promise<AssetVersionListResponse> {
    return this.client.request<AssetVersionListResponse>(
      withRequestContext({ method: "GET", path: `/assets/${assetId}/versions` }, context),
    );
  }

  async getVersion(
    assetId: string,
    versionId: string,
    context?: RequestContext,
  ): Promise<AssetVersion> {
    return this.client.request<AssetVersion>(
      withRequestContext(
        { method: "GET", path: `/assets/${assetId}/versions/${versionId}` },
        context,
      ),
    );
  }

  async updateVersion(
    assetId: string,
    versionId: string,
    params: AssetVersionUpdateParams,
    context?: RequestContext,
  ): Promise<void> {
    return this.client.request<void>(
      withRequestContext(
        {
          method: "PATCH",
          path: `/assets/${assetId}/versions/${versionId}`,
          body: params,
        },
        context,
      ),
    );
  }

  async getVersionDownloadUrl(
    assetId: string,
    versionId: string,
    context?: RequestContext,
  ): Promise<AssetVersionDownloadUrl> {
    return this.client.request<AssetVersionDownloadUrl>(
      withRequestContext(
        { method: "GET", path: `/assets/${assetId}/versions/${versionId}/download` },
        context,
      ),
    );
  }

  async addVersionTag(
    assetId: string,
    versionId: string,
    params: AddVersionTagParams,
    context?: RequestContext,
  ): Promise<AssetVersion> {
    return this.client.request<AssetVersion>(
      withRequestContext(
        {
          method: "POST",
          path: `/assets/${assetId}/versions/${versionId}/tags`,
          body: params,
        },
        context,
      ),
    );
  }

  async removeVersionTag(
    assetId: string,
    versionId: string,
    tagId: string,
    context?: RequestContext,
  ): Promise<void> {
    return this.client.request<void>(
      withRequestContext(
        {
          method: "DELETE",
          path: `/assets/${assetId}/versions/${versionId}/tags/${tagId}`,
        },
        context,
      ),
    );
  }

  async createCdnLink(assetId: string, context?: RequestContext): Promise<AssetCdnLink> {
    return this.client.request<AssetCdnLink>(
      withRequestContext({ method: "POST", path: `/assets/${assetId}/cdnLink` }, context),
    );
  }

  async createVersionCdnLink(
    assetId: string,
    versionId: string,
    context?: RequestContext,
  ): Promise<AssetVersionCdnLink> {
    return this.client.request<AssetVersionCdnLink>(
      withRequestContext(
        { method: "POST", path: `/assets/${assetId}/versions/${versionId}/cdnLink` },
        context,
      ),
    );
  }

  listBoards(
    assetId: string,
    params: AssetBoardListParams = {},
    context?: RequestContext,
  ): PagePromise<Board> {
    const query: Record<string, string | number | boolean | undefined> = {
      limit: params.limit,
      cursor: params.cursor,
    };

    if (params.includeCustomFields !== undefined) {
      query.includeCustomFields = params.includeCustomFields;
    }

    return this.client.requestCursorPage<Board>(
      withRequestContext({ method: "GET", path: `/assets/${assetId}/boards`, query }, context),
      query,
    );
  }
}
