import type { CursorPageParams } from "@air/api-core";

export interface DiscussionListParams extends CursorPageParams {
  /** Discussions on this asset. Required unless `boardId` is set. */
  assetId?: string;
  /** Limit an asset list to this version. Requires `assetId`. */
  assetVersionId?: string;
  /** Discussions on assets currently on this board. Required unless `assetId` is set. */
  boardId?: string;
  /** When set, only discussions in that resolved state. */
  resolved?: boolean;
  /**
   * `lastCommentedAt` is the default and moves when someone replies.
   * `createdAt` is the first comment and stays put.
   */
  sortBy?: "lastCommentedAt" | "createdAt";
  /** `desc` is the default. */
  sortDirection?: "asc" | "desc";
}

export interface DiscussionCommentListParams extends CursorPageParams {}

export interface Discussion {
  id: string;
  resolved: boolean;
  /** When the first comment was created. */
  createdAt: string | null;
  /** When the latest comment was created. A reply moves this. */
  lastCommentedAt: string | null;
  asset: { id: string };
  assetVersion: {
    /** Asset version id. This is `assetVersionId` on create. */
    id: string;
    version: number;
  };
  /**
   * Present only when the stored board is active and the caller can view it.
   * Otherwise the field is omitted.
   */
  boardId?: string;
  annotations: DiscussionAnnotation[];
  /** The first 10 comments, oldest first. */
  comments: DiscussionCommentPage;
}

export interface DiscussionCommentPage {
  data: DiscussionComment[];
  pagination: {
    hasMore: boolean;
    cursor: string | null;
  };
  total: number;
}

export interface DiscussionComment {
  id: string;
  discussionId: string;
  /** Plain text with mentions rendered as `@Display Name`. */
  body: string;
  createdAt: string;
  /**
   * Equal to `createdAt` until the first edit. An edit is
   * `updatedAt !== createdAt`.
   */
  updatedAt: string;
  author: DiscussionAuthor;
  mentions: DiscussionMention[];
}

export type DiscussionAuthor =
  | {
      type: "workspace_account";
      /** Account id. The same id as `members.list` `id`. */
      id: string;
      displayName: string | null;
    }
  | {
      type: "anonymous";
      displayName: string | null;
    };

/** A mention on a comment. `id` is the account id. */
export interface DiscussionMention {
  id: string;
  displayName: string | null;
}

/** A mention sent on create or edit. `accountId` is `DiscussionMention.id`. */
export interface DiscussionMentionInput {
  accountId: string;
}

export type DiscussionAnnotation = BoxAnnotation | PencilAnnotation;

export interface BoxAnnotation {
  type: "box";
  /** Seconds into a video. Omit for a still image. */
  timestamp?: number;
  /** Requires `timestamp`, and must be greater than or equal to it. */
  endTimestamp?: number;
  coordinates: { x: number; y: number };
  /** Width and height as fractions of the frame. The box must fit in the frame. */
  dimensions: { width: number; height: number };
  /** `#RRGGBB`. */
  color: string;
  /** Document page. Omit for an image or video. */
  pageNumber?: number;
}

export interface PencilAnnotation {
  type: "pencil";
  timestamp?: number;
  endTimestamp?: number;
  lines: PencilLine[];
}

export interface PencilLine {
  coordinates: { x: number; y: number }[];
  lineWidth: number;
  color: string;
  pageNumber?: number;
}

export interface DiscussionCreateParams {
  assetId: string;
  /** Required. There is no default to the current version. */
  assetVersionId: string;
  body: string;
  mentions?: DiscussionMentionInput[];
  annotations?: DiscussionAnnotation[];
}

export interface DiscussionCommentCreateParams {
  body: string;
  mentions?: DiscussionMentionInput[];
}

export interface DiscussionCommentUpdateParams {
  body: string;
  /**
   * Required when the stored comment has mentions. Send the mentions again to
   * keep them, or `[]` to remove them. Omitting this field on a comment that
   * has mentions is 409.
   */
  mentions?: DiscussionMentionInput[];
}

export interface DiscussionUpdateParams {
  /** `true` resolves the discussion. `false` reopens it. */
  resolved: boolean;
}
