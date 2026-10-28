import type { AirBase, PagePromise, QueryParam } from "@air/api-core";
import type {
  AddShowcaseAssetsParams,
  AddShowcaseBoardsParams,
  Showcase,
  ShowcaseCreateParams,
  ShowcaseListParams,
  ShowcaseShareLinkUpdateParams,
  ShowcaseUpdateParams,
} from "../types/showcases";

/**
 * Showcases. A showcase is a collection with one share link.
 *
 * `create` makes the showcase and its share link together. The result
 * includes the link, and the showcase starts empty. Add items with
 * `addAssets` and `addBoards`.
 *
 * Sub-pages are not exposed. Item lists return only a showcase's top-level
 * items, and a sub-page id is not found on these routes.
 *
 * An unknown, trashed, or other-workspace id is 404. An item or showcase
 * the caller cannot view is 403. Adding an item that is already in the
 * showcase, or removing one that is not, succeeds and returns 204.
 */
export class Showcases {
  constructor(private client: AirBase) {}

  /**
   * List the showcases the caller can see.
   *
   * A role that can view every showcase in the workspace sees all of them.
   * Otherwise only the showcases that caller owns are returned. Showcases
   * without a share link are omitted; read those with `get`. Sub-pages are
   * not listed separately.
   *
   * Requires the `showcases.read` and `share_links.read` OAuth scopes.
   */
  list(params: ShowcaseListParams = {}): PagePromise<Showcase> {
    const query: Record<string, QueryParam> = {
      limit: params.limit,
      cursor: params.cursor,
      search: params.search,
      status: params.status,
    };

    return this.client.requestCursorPage<Showcase>(
      { method: "GET", path: "/showcases", query },
      query,
    );
  }

  /**
   * Get a showcase and its share link. `shareLink` is null when the
   * showcase has none.
   *
   * Requires the `showcases.read` and `share_links.read` OAuth scopes.
   */
  async get(showcaseId: string): Promise<Showcase> {
    return this.client.request<Showcase>({
      method: "GET",
      path: `/showcases/${showcaseId}`,
    });
  }

  /**
   * Create a showcase and its share link in one step. The result includes
   * the link. Create does not take items.
   *
   * Requires the `showcases.write` and `share_links.write` OAuth scopes.
   */
  async create(params: ShowcaseCreateParams): Promise<Showcase> {
    return this.client.request<Showcase>({
      method: "POST",
      path: "/showcases",
      body: params,
    });
  }

  /**
   * Rename a showcase or change its description. Only the fields you send
   * change. Returns no body.
   *
   * Requires the `showcases.write` OAuth scope.
   */
  async update(showcaseId: string, params: ShowcaseUpdateParams): Promise<void> {
    return this.client.request<void>({
      method: "PATCH",
      path: `/showcases/${showcaseId}`,
      body: params,
    });
  }

  /**
   * Change the settings of a showcase's share link. Only the settings you
   * send change. Send `password: null` or `expiresAt: null` to remove them.
   * Returns no body.
   *
   * Requires the `share_links.write` and `showcases.read` OAuth scopes.
   */
  async updateShareLink(
    showcaseId: string,
    shareLinkId: string,
    params: ShowcaseShareLinkUpdateParams,
  ): Promise<void> {
    return this.client.request<void>({
      method: "PATCH",
      path: `/showcases/${showcaseId}/share-links/${shareLinkId}`,
      body: params,
    });
  }

  /**
   * Add assets to a showcase. Assets already in it are skipped. Returns no
   * body. List them with `assets.list({ showcaseId })`.
   *
   * Requires the `showcases.write` and `assets.read` OAuth scopes.
   */
  async addAssets(showcaseId: string, params: AddShowcaseAssetsParams): Promise<void> {
    return this.client.request<void>({
      method: "POST",
      path: `/showcases/${showcaseId}/assets`,
      body: params,
    });
  }

  /**
   * Remove an asset from a showcase. The asset itself is not deleted.
   * Removing an asset that is not in the showcase succeeds. Returns no body.
   *
   * Requires the `showcases.write` OAuth scope.
   */
  async removeAsset(showcaseId: string, assetId: string): Promise<void> {
    return this.client.request<void>({
      method: "DELETE",
      path: `/showcases/${showcaseId}/assets/${assetId}`,
    });
  }

  /**
   * Add boards to a showcase. Boards already in it are skipped. Returns no
   * body. List them with `boards.list({ showcaseId })`.
   *
   * Requires the `showcases.write` and `boards.read` OAuth scopes.
   */
  async addBoards(showcaseId: string, params: AddShowcaseBoardsParams): Promise<void> {
    return this.client.request<void>({
      method: "POST",
      path: `/showcases/${showcaseId}/boards`,
      body: params,
    });
  }

  /**
   * Remove a board from a showcase. The board itself is not deleted.
   * Removing a board that is not in the showcase succeeds. Returns no body.
   *
   * Requires the `showcases.write` OAuth scope.
   */
  async removeBoard(showcaseId: string, boardId: string): Promise<void> {
    return this.client.request<void>({
      method: "DELETE",
      path: `/showcases/${showcaseId}/boards/${boardId}`,
    });
  }
}
