import { withRequestContext, type RequestContext } from "@air/api-core";
import type { AirBase } from "@air/api-core";
import type {
  ImportCreateParams,
  ImportCreateResponse,
  ImportStatusResponse,
} from "../types/imports";

export class Imports {
  constructor(private client: AirBase) {}

  async create(
    params: ImportCreateParams,
    context?: RequestContext,
  ): Promise<ImportCreateResponse> {
    return this.client.request<ImportCreateResponse>(
      withRequestContext({ method: "POST", path: "/imports", body: params }, context),
    );
  }

  async getStatus(importId: string, context?: RequestContext): Promise<ImportStatusResponse> {
    return this.client.request<ImportStatusResponse>(
      withRequestContext({ method: "GET", path: `/imports/${importId}/status` }, context),
    );
  }
}
