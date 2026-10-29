import type { AirBase, PagePromise, QueryParam } from "@air/api-core";
import type {
  Discussion,
  DiscussionComment,
  DiscussionCommentCreateParams,
  DiscussionCommentListParams,
  DiscussionCommentUpdateParams,
  DiscussionCreateParams,
  DiscussionListParams,
  DiscussionUpdateParams,
} from "../types/discussions";

export class Discussions {
  constructor(private client: AirBase) {}

  /**
   * List discussions on an asset or on the assets currently in a board.
   * One of `assetId` or `boardId` is required. They cannot be combined.
   *
   * The next page repeats the discussion the cursor points at, so
   * de-duplicate by `id`. For an export, use `sortBy: "createdAt"` and
   * `sortDirection: "asc"`. `lastCommentedAt` moves when someone replies.
   */
  list(params: DiscussionListParams = {}): PagePromise<Discussion> {
    const query: Record<string, QueryParam> = {
      assetId: params.assetId,
      assetVersionId: params.assetVersionId,
      boardId: params.boardId,
      resolved: params.resolved,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
      limit: params.limit,
      cursor: params.cursor,
    };

    return this.client.requestCursorPage<Discussion>(
      { method: "GET", path: "/discussions", query },
      query,
    );
  }

  /** Get one discussion, including its first 10 comments. A discussion you cannot view is 404. */
  async get(discussionId: string): Promise<Discussion> {
    return this.client.request<Discussion>({
      method: "GET",
      path: `/discussions/${discussionId}`,
    });
  }

  /**
   * List every comment on a discussion, oldest first.
   * `discussion.comments.pagination.cursor` is accepted as `cursor`.
   */
  listComments(
    discussionId: string,
    params: DiscussionCommentListParams = {},
  ): PagePromise<DiscussionComment> {
    const query: Record<string, QueryParam> = {
      limit: params.limit,
      cursor: params.cursor,
    };

    return this.client.requestCursorPage<DiscussionComment>(
      { method: "GET", path: `/discussions/${discussionId}/comments`, query },
      query,
    );
  }

  /**
   * Start a discussion on an asset version. `assetVersionId` is required.
   * Mention someone with `{{mention:N}}` and a `mentions` entry at that index.
   * On a document or PDF, every annotation needs a `pageNumber`.
   *
   * The body has no board. In a workspace that scopes comments to boards, a
   * discussion with no board needs `asset.canManageDiscussions` at the
   * workspace level, so a board guest gets 403 even when they can comment in
   * their board. A timeout can create a duplicate: list before retrying.
   */
  async create(params: DiscussionCreateParams): Promise<Discussion> {
    return this.client.request<Discussion>({
      method: "POST",
      path: "/discussions",
      body: params,
    });
  }

  /** Add a comment. The body and mention rules match `create`. */
  async createComment(
    discussionId: string,
    params: DiscussionCommentCreateParams,
  ): Promise<DiscussionComment> {
    return this.client.request<DiscussionComment>({
      method: "POST",
      path: `/discussions/${discussionId}/comments`,
      body: params,
    });
  }

  /**
   * Resolve or reopen a discussion. The response is empty, including when the
   * discussion was already in the requested state.
   */
  async update(discussionId: string, params: DiscussionUpdateParams): Promise<void> {
    return this.client.request<void>({
      method: "PATCH",
      path: `/discussions/${discussionId}`,
      body: params,
    });
  }

  /**
   * Replace a comment's text and mentions. Only the author can edit.
   * The response is empty, and the edit notifies no one. Omitting `mentions`,
   * or sending `null`, when the comment has them is 409. `[]` removes them.
   */
  async updateComment(
    discussionId: string,
    commentId: string,
    params: DiscussionCommentUpdateParams,
  ): Promise<void> {
    return this.client.request<void>({
      method: "PATCH",
      path: `/discussions/${discussionId}/comments/${commentId}`,
      body: params,
    });
  }

  /**
   * Delete a comment. Only the author can delete. The response is empty.
   * Deleting the last comment deletes the discussion.
   */
  async deleteComment(discussionId: string, commentId: string): Promise<void> {
    return this.client.request<void>({
      method: "DELETE",
      path: `/discussions/${discussionId}/comments/${commentId}`,
    });
  }
}
