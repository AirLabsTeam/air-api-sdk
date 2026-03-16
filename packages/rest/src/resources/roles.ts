import type { AirBase } from '@air/api-core';
import type { Role, RoleListParams, RoleListResponse } from '../types/roles';

export class Roles {
  constructor(private client: AirBase) {}

  async list(params: RoleListParams = { type: 'guest' }): Promise<Role[]> {
    const response = await this.client.request<RoleListResponse>({
      method: 'GET',
      path: '/roles',
      query: { type: params.type },
    });
    return response.data;
  }
}
