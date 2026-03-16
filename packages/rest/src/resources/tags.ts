import type { AirBase, PagePromise } from '@air/api-core';
import type { Tag, TagCreateParams, TagListParams, TagUpdateParams } from '../types/tags';

export class Tags {
  constructor(private client: AirBase) {}

  list(params: TagListParams = {}): PagePromise<Tag> {
    return this.client.requestCursorPage<Tag>(
      {
        method: 'GET',
        path: '/tags',
        query: params as Record<string, string | number | undefined>,
      },
      params as Record<string, string | number | undefined>,
    );
  }

  async get(tagId: string): Promise<Tag> {
    return this.client.request<Tag>({
      method: 'GET',
      path: `/tags/${tagId}`,
    });
  }

  async create(params: TagCreateParams): Promise<Tag> {
    return this.client.request<Tag>({
      method: 'POST',
      path: '/tags',
      body: params,
    });
  }

  async update(tagId: string, params: TagUpdateParams): Promise<void> {
    return this.client.request<void>({
      method: 'PATCH',
      path: `/tags/${tagId}`,
      body: params,
    });
  }

  async delete(tagId: string): Promise<void> {
    return this.client.request<void>({
      method: 'DELETE',
      path: `/tags/${tagId}`,
    });
  }
}
