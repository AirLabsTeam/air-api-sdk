export interface Role {
  id: string;
  name: string;
  description: string;
  billable: boolean;
  type: string;
}

export interface RoleListParams {
  type: 'guest';
}

export interface RoleListResponse {
  data: Role[];
}
