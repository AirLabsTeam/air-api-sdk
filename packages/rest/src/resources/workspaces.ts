import type { AirBase } from "@air/api-core";
import type { Workspace, WorkspaceListResponse } from "../types/workspaces";

export class Workspaces {
  constructor(private client: AirBase) {}

  async list(): Promise<Workspace[]> {
    const response = await this.client.request<WorkspaceListResponse>({
      method: "GET",
      path: "/workspaces",
    });
    return response.data;
  }
}
