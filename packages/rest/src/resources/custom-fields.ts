import { withRequestContext, type RequestContext } from "@air/api-core";
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

  list(params: CustomFieldListParams = {}, context?: RequestContext): PagePromise<CustomField> {
    return this.client.requestCursorPage<CustomField>(
      withRequestContext(
        {
          method: "GET",
          path: "/customfields",
          query: params as Record<string, string | number | undefined>,
        },
        context,
      ),
      params as Record<string, string | number | undefined>,
    );
  }

  async get(customFieldId: string, context?: RequestContext): Promise<CustomField> {
    return this.client.request<CustomField>(
      withRequestContext({ method: "GET", path: `/customfields/${customFieldId}` }, context),
    );
  }

  async create(params: CustomFieldCreateParams, context?: RequestContext): Promise<CustomField> {
    return this.client.request<CustomField>(
      withRequestContext({ method: "POST", path: "/customfields", body: params }, context),
    );
  }

  async update(
    customFieldId: string,
    params: CustomFieldUpdateParams,
    context?: RequestContext,
  ): Promise<void> {
    return this.client.request<void>(
      withRequestContext(
        { method: "PATCH", path: `/customfields/${customFieldId}`, body: params },
        context,
      ),
    );
  }

  async delete(customFieldId: string, context?: RequestContext): Promise<void> {
    return this.client.request<void>(
      withRequestContext({ method: "DELETE", path: `/customfields/${customFieldId}` }, context),
    );
  }

  async createValue(
    customFieldId: string,
    params: CustomFieldValueCreateParams,
    context?: RequestContext,
  ): Promise<CustomFieldValue> {
    return this.client.request<CustomFieldValue>(
      withRequestContext(
        {
          method: "POST",
          path: `/customfields/${customFieldId}/values`,
          body: params,
        },
        context,
      ),
    );
  }

  async updateValue(
    customFieldId: string,
    valueId: string,
    params: CustomFieldValueUpdateParams,
    context?: RequestContext,
  ): Promise<void> {
    return this.client.request<void>(
      withRequestContext(
        {
          method: "PATCH",
          path: `/customfields/${customFieldId}/values/${valueId}`,
          body: params,
        },
        context,
      ),
    );
  }

  async deleteValue(
    customFieldId: string,
    valueId: string,
    context?: RequestContext,
  ): Promise<void> {
    return this.client.request<void>(
      withRequestContext(
        {
          method: "DELETE",
          path: `/customfields/${customFieldId}/values/${valueId}`,
        },
        context,
      ),
    );
  }
}
