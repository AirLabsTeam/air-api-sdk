import type { AirBase, PagePromise } from "@air/api-core";
import type { AuditLog, AuditLogListParams } from "../types/audit-logs";

export class AuditLogs {
  constructor(private client: AirBase) {}

  list(params: AuditLogListParams): PagePromise<AuditLog> {
    const query: Record<string, string | number | undefined> = {
      startDate: params.startDate,
      endDate: params.endDate,
      actor: params.actor,
      limit: params.limit,
      cursor: params.cursor,
    };

    return this.client.requestCursorPage<AuditLog>(
      { method: "GET", path: "/auditLogs", query },
      query,
    );
  }
}
