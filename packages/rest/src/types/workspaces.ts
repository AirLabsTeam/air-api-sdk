export interface Workspace {
  id: string;
  name: string;
}

export interface WorkspaceListResponse {
  data: Workspace[];
}
