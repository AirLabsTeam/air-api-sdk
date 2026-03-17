import type { AirBase, PagePromise } from "@air/api-core";
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
        query: params as Record<string, string | number | undefined>,
      },
      params as Record<string, string | number | undefined>,
    );
  }

  async get(customFieldId: string): Promise<CustomField> {
    return this.client.request<CustomField>({
      method: "GET",
      path: `/customfields/${customFieldId}`,
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
      path: `/customfields/${customFieldId}`,
      body: params,
    });
  }

  async delete(customFieldId: string): Promise<void> {
    return this.client.request<void>({
      method: "DELETE",
      path: `/customfields/${customFieldId}`,
    });
  }

  async createValue(
    customFieldId: string,
    params: CustomFieldValueCreateParams,
  ): Promise<CustomFieldValue> {
    return this.client.request<CustomFieldValue>({
      method: "POST",
      path: `/customfields/${customFieldId}/values`,
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
      path: `/customfields/${customFieldId}/values/${valueId}`,
      body: params,
    });
  }

  async deleteValue(customFieldId: string, valueId: string): Promise<void> {
    return this.client.request<void>({
      method: "DELETE",
      path: `/customfields/${customFieldId}/values/${valueId}`,
    });
  }
}
