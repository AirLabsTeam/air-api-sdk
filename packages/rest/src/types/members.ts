import type { CursorPageParams } from "@air/api-core";

export type MemberType = "member" | "guest" | "libraryMember";

export interface MemberListParams extends CursorPageParams {
  /**
   * Defaults to `member`. With `email` and no `type`, every type is searched,
   * so omit it to look up an email across member, guest, and libraryMember.
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
  /**
   * The first time this person joined. A rejoin does not change it.
   *
   * The stored Postgres timestamp text, not ISO 8601 like the other
   * timestamps: for example `2024-03-01 12:00:00.123456+00`. It has up to 6
   * fraction digits with trailing zeros dropped (`12:00:00.12+00`,
   * `12:00:00+00`), and a UTC offset (currently `+00`). Don't parse a fixed
   * width.
   */
  firstJoinedAt: string;
  /** Present when the person has an avatar URL. */
  avatar?: string;
}
