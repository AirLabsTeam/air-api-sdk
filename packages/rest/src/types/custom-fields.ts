import type { CursorPageParams } from "@air/api-core";

export type CustomFieldType = "single-select" | "multi-select" | "plain-text" | "date";

export interface CustomFieldValue {
  id: string;
  name: string;
}

export interface CustomField {
  id: string;
  name: string;
  description: string | null;
  type: CustomFieldType;
  values: CustomFieldValue[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomFieldListParams extends CursorPageParams {}

export interface CustomFieldCreateParams {
  name: string;
  description?: string;
  type: CustomFieldType;
  values?: { name: string }[];
}

export interface CustomFieldUpdateParams {
  name?: string;
  description?: string;
}

export interface CustomFieldValueCreateParams {
  name: string;
}

export interface CustomFieldValueUpdateParams {
  name?: string;
}
