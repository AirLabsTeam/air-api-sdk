import type { AirBase } from "@air/api-core";
import type {
  ImportCreateParams,
  ImportCreateResponse,
  ImportStatusResponse,
} from "../types/imports";

export class Imports {
  constructor(private client: AirBase) {}

  async create(params: ImportCreateParams): Promise<ImportCreateResponse> {
    return this.client.request<ImportCreateResponse>({
      method: "POST",
      path: "/imports",
      body: params,
    });
  }

  async getStatus(importId: string): Promise<ImportStatusResponse> {
    return this.client.request<ImportStatusResponse>({
      method: "GET",
      path: `/imports/${importId}/status`,
    });
  }
}
