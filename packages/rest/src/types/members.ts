import type { CursorPageParams } from "@air/api-core";

export type MemberType = "member" | "guest" | "libraryMember";

export interface MemberListParams extends CursorPageParams {
  /**
   * `member` is the server default when this is omitted and `email` is not
   * set. Omit it when looking up an email across every type.
   */
  type?: MemberType;
  /** Exact email. Cannot be combined with `search`. An unknown email is an empty list. */
  email?: string;
  /** Name or email search, 1 to 100 characters. Cannot be combined with `email`. */
  search?: string;
}

export interface Member {
  /** Account id. The same id as a comment mention `id` and `accountId`. */
  id: string;
  type: MemberType;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  /** The first time this person joined. A rejoin does not change it. */
  firstJoinedAt: string;
  /** Present when the person has an avatar URL. */
  avatar?: string;
}
