import type { AirBase, PagePromise, QueryParam } from "@air/api-core";
import type { Member, MemberListParams } from "../types/members";

export class Members {
  constructor(private client: AirBase) {}

  /**
   * List people in the workspace. Requires `members.read`.
   * `workspace.read` does not grant it.
   *
   * Sort is fixed: `firstJoinedAt` ascending, then `id`.
   * `email` without `type` searches every type. An unknown email is an empty list.
   */
  list(params: MemberListParams = {}): PagePromise<Member> {
    const query: Record<string, QueryParam> = {
      type: params.type,
      email: params.email,
      search: params.search,
      limit: params.limit,
      cursor: params.cursor,
    };

    return this.client.requestCursorPage<Member>({ method: "GET", path: "/members", query }, query);
  }
}
