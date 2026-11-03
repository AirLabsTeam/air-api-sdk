import { encodePath, type AirBase, type PagePromise, type QueryParam } from "@air/api-core";
import type {
  CustomField,
  CustomFieldCreateParams,
  CustomFieldListParams,
  CustomFieldUpdateParams,
  CustomFieldValue,
  CustomFieldValueCreateParams,
  CustomFieldValueUpdateParams,
} from "../types/custom-fields";

export class CustomFields {
  constructor(private client: AirBase) {}

  list(params: CustomFieldListParams = {}): PagePromise<CustomField> {
    return this.client.requestCursorPage<CustomField>(
      {
        method: "GET",
        path: "/customfields",
        query: params as Record<string, QueryParam>,
      },
      params as Record<string, QueryParam>,
    );
  }

  async get(customFieldId: string): Promise<CustomField> {
    return this.client.request<CustomField>({
      method: "GET",
      path: encodePath`/customfields/${customFieldId}`,
    });
  }

  async create(params: CustomFieldCreateParams): Promise<CustomField> {
    return this.client.request<CustomField>({
      method: "POST",
      path: "/customfields",
      body: params,
    });
  }

  async update(customFieldId: string, params: CustomFieldUpdateParams): Promise<void> {
    return this.client.request<void>({
      method: "PATCH",
      path: encodePath`/customfields/${customFieldId}`,
      body: params,
    });
  }

  async delete(customFieldId: string): Promise<void> {
    return this.client.request<void>({
      method: "DELETE",
      path: encodePath`/customfields/${customFieldId}`,
    });
  }

  async createValue(
    customFieldId: string,
    params: CustomFieldValueCreateParams,
  ): Promise<CustomFieldValue> {
    return this.client.request<CustomFieldValue>({
      method: "POST",
      path: encodePath`/customfields/${customFieldId}/values`,
      body: params,
    });
  }

  async updateValue(
    customFieldId: string,
    valueId: string,
    params: CustomFieldValueUpdateParams,
  ): Promise<void> {
    return this.client.request<void>({
      method: "PATCH",
      path: encodePath`/customfields/${customFieldId}/values/${valueId}`,
      body: params,
    });
  }

  async deleteValue(customFieldId: string, valueId: string): Promise<void> {
    return this.client.request<void>({
      method: "DELETE",
      path: encodePath`/customfields/${customFieldId}/values/${valueId}`,
    });
  }
}
