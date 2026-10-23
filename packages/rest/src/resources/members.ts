import type { AirBase, PagePromise, QueryParam } from "@air/api-core";
import type { Member, MemberListParams } from "../types/members";

export class Members {
  constructor(private client: AirBase) {}

  list(params: MemberListParams = {}): PagePromise<Member> {
    const query: Record<string, QueryParam> = {
      type: params.type,
      search: params.search,
      email: params.email,
      limit: params.limit,
      cursor: params.cursor,
    };

    return this.client.requestCursorPage<Member>({ method: "GET", path: "/members", query }, query);
  }
}
