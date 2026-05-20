import { withRequestContext, type RequestContext } from "@air/api-core";
import type { AirBase, PagePromise } from "@air/api-core";
import type { Tag, TagCreateParams, TagListParams, TagUpdateParams } from "../types/tags";

export class Tags {
  constructor(private client: AirBase) {}

  list(params: TagListParams = {}, context?: RequestContext): PagePromise<Tag> {
    return this.client.requestCursorPage<Tag>(
      withRequestContext(
        {
          method: "GET",
          path: "/tags",
          query: params as Record<string, string | number | undefined>,
        },
        context,
      ),
      params as Record<string, string | number | undefined>,
    );
  }

  async get(tagId: string, context?: RequestContext): Promise<Tag> {
    return this.client.request<Tag>(
      withRequestContext({ method: "GET", path: `/tags/${tagId}` }, context),
    );
  }

  async create(params: TagCreateParams, context?: RequestContext): Promise<Tag> {
    return this.client.request<Tag>(
      withRequestContext({ method: "POST", path: "/tags", body: params }, context),
    );
  }

  async update(tagId: string, params: TagUpdateParams, context?: RequestContext): Promise<void> {
    return this.client.request<void>(
      withRequestContext({ method: "PATCH", path: `/tags/${tagId}`, body: params }, context),
    );
  }

  async delete(tagId: string, context?: RequestContext): Promise<void> {
    return this.client.request<void>(
      withRequestContext({ method: "DELETE", path: `/tags/${tagId}` }, context),
    );
  }
}
