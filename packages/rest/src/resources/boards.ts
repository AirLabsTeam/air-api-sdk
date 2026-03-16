import type { AirBase, PagePromise } from '@air/api-core';
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
} from '../types/boards';

export class Boards {
  constructor(private client: AirBase) {}

  list(params: BoardListParams = {}): PagePromise<Board> {
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
      { method: 'GET', path: '/boards', query },
      query,
    );
  }

  async get(boardId: string): Promise<Board> {
    return this.client.request<Board>({
      method: 'GET',
      path: `/boards/${boardId}`,
    });
  }

  async create(params: BoardCreateParams): Promise<Board> {
    return this.client.request<Board>({
      method: 'POST',
      path: '/boards',
      body: params,
    });
  }

  async update(boardId: string, params: BoardUpdateParams): Promise<void> {
    return this.client.request<void>({
      method: 'PATCH',
      path: `/boards/${boardId}`,
      body: params,
    });
  }

  async delete(boardId: string): Promise<void> {
    return this.client.request<void>({
      method: 'DELETE',
      path: `/boards/${boardId}`,
    });
  }

  async addAssets(boardId: string, params: AddBoardAssetsParams): Promise<void> {
    return this.client.request<void>({
      method: 'POST',
      path: `/boards/${boardId}/assets`,
      body: params,
    });
  }

  async removeAsset(boardId: string, assetId: string): Promise<void> {
    return this.client.request<void>({
      method: 'DELETE',
      path: `/boards/${boardId}/assets/${assetId}`,
    });
  }

  async setCustomField(boardId: string, customFieldId: string, params: SetBoardCustomFieldParams): Promise<void> {
    return this.client.request<void>({
      method: 'PUT',
      path: `/boards/${boardId}/customFields/${customFieldId}`,
      body: params,
    });
  }

  async addGuest(boardId: string, params: AddGuestParams): Promise<Guest> {
    return this.client.request<Guest>({
      method: 'POST',
      path: `/boards/${boardId}/guests`,
      body: params,
    });
  }

  async listGuests(boardId: string, params: GuestListParams = {}): Promise<Guest[]> {
    const response = await this.client.request<GuestListResponse>({
      method: 'GET',
      path: `/boards/${boardId}/guests`,
      query: params.email ? { email: params.email } : undefined,
    });
    return response.data;
  }

  async updateGuest(boardId: string, guestId: string, params: UpdateGuestParams): Promise<void> {
    return this.client.request<void>({
      method: 'PATCH',
      path: `/boards/${boardId}/guests/${guestId}`,
      body: params,
    });
  }

  async removeGuest(boardId: string, guestId: string): Promise<void> {
    return this.client.request<void>({
      method: 'DELETE',
      path: `/boards/${boardId}/guests/${guestId}`,
    });
  }
}
