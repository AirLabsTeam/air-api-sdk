import type { CursorPageParams } from "@air/api-core";

export type MemberType = "member" | "guest" | "libraryMember";

export interface Member {
  // Account id. Same id as a comment author and a mention.
  id: string;
  type: MemberType;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  // Raw `timestamptz` text, not normalized to ISO 8601.
  firstJoinedAt: string;
  // Omitted from the response when unset.
  avatar?: string;
}

interface MemberListBaseParams extends CursorPageParams {
  // Defaults to `member`. With `email` and no `type`, every type is searched.
  type?: MemberType;
}

// `search` and `email` cannot be combined.
export type MemberListParams = MemberListBaseParams &
  ({ search?: string; email?: never } | { email?: string; search?: never });
