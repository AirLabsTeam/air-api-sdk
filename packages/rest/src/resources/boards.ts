import { withRequestContext, type RequestContext } from "@air/api-core";
import type { AirBase, PagePromise } from "@air/api-core";
import type {
  AddBoardAssetsParams,
  AddGuestParams,
  Board,
  BoardCreateParams,
  BoardListParams,
  BoardUpdateParams,
  Guest,
  GuestListParams,
  GuestListResponse,
  SetBoardCustomFieldParams,
  UpdateGuestParams,
} from "../types/boards";

export class Boards {
  constructor(private client: AirBase) {}

  list(params: BoardListParams = {}, context?: RequestContext): PagePromise<Board> {
    const query: Record<string, string | string[] | number | boolean | undefined> = {
      limit: params.limit,
      cursor: params.cursor,
      name: params.name,
      parentBoardId: params.parentBoardId,
    };

    if (params.customField) {
      query.customField = params.customField;
    }

    return this.client.requestCursorPage<Board>(
      withRequestContext({ method: "GET", path: "/boards", query }, context),
      query,
    );
  }

  async get(boardId: string, context?: RequestContext): Promise<Board> {
    return this.client.request<Board>(
      withRequestContext({ method: "GET", path: `/boards/${boardId}` }, context),
    );
  }

  async create(params: BoardCreateParams, context?: RequestContext): Promise<Board> {
    return this.client.request<Board>(
      withRequestContext({ method: "POST", path: "/boards", body: params }, context),
    );
  }

  async update(
    boardId: string,
    params: BoardUpdateParams,
    context?: RequestContext,
  ): Promise<void> {
    return this.client.request<void>(
      withRequestContext(
        { method: "PATCH", path: `/boards/${boardId}`, body: params },
        context,
      ),
    );
  }

  async delete(boardId: string, context?: RequestContext): Promise<void> {
    return this.client.request<void>(
      withRequestContext({ method: "DELETE", path: `/boards/${boardId}` }, context),
    );
  }

  async addAssets(
    boardId: string,
    params: AddBoardAssetsParams,
    context?: RequestContext,
  ): Promise<void> {
    return this.client.request<void>(
      withRequestContext(
        { method: "POST", path: `/boards/${boardId}/assets`, body: params },
        context,
      ),
    );
  }

  async removeAsset(boardId: string, assetId: string, context?: RequestContext): Promise<void> {
    return this.client.request<void>(
      withRequestContext(
        { method: "DELETE", path: `/boards/${boardId}/assets/${assetId}` },
        context,
      ),
    );
  }

  async setCustomField(
    boardId: string,
    customFieldId: string,
    params: SetBoardCustomFieldParams,
    context?: RequestContext,
  ): Promise<void> {
    return this.client.request<void>(
      withRequestContext(
        {
          method: "PUT",
          path: `/boards/${boardId}/customFields/${customFieldId}`,
          body: params,
        },
        context,
      ),
    );
  }

  async addGuest(
    boardId: string,
    params: AddGuestParams,
    context?: RequestContext,
  ): Promise<Guest> {
    return this.client.request<Guest>(
      withRequestContext(
        { method: "POST", path: `/boards/${boardId}/guests`, body: params },
        context,
      ),
    );
  }

  async listGuests(
    boardId: string,
    params: GuestListParams = {},
    context?: RequestContext,
  ): Promise<Guest[]> {
    const response = await this.client.request<GuestListResponse>(
      withRequestContext(
        {
          method: "GET",
          path: `/boards/${boardId}/guests`,
          query: params.email ? { email: params.email } : undefined,
        },
        context,
      ),
    );
    return response.data;
  }

  async updateGuest(
    boardId: string,
    guestId: string,
    params: UpdateGuestParams,
    context?: RequestContext,
  ): Promise<void> {
    return this.client.request<void>(
      withRequestContext(
        {
          method: "PATCH",
          path: `/boards/${boardId}/guests/${guestId}`,
          body: params,
        },
        context,
      ),
    );
  }

  async removeGuest(boardId: string, guestId: string, context?: RequestContext): Promise<void> {
    return this.client.request<void>(
      withRequestContext(
        { method: "DELETE", path: `/boards/${boardId}/guests/${guestId}` },
        context,
      ),
    );
  }
}
