import type { CursorPageParams } from "@air/api-core";

export interface AuditLog {
  [key: string]: unknown;
}

export interface AuditLogListParams extends CursorPageParams {
  startDate: string;
  endDate?: string;
  actor?: string;
}
