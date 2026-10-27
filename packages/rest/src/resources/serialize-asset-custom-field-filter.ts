import type {
  AssetCustomFieldDateFilter,
  AssetCustomFieldFilter,
  AssetCustomFieldSelectFilter,
  AssetCustomFieldTextFilter,
} from "../types/assets";

const INVALID_ASSET_CUSTOM_FIELD_FILTER =
  "Asset custom field filter must be a select { id, valueId } or an operator { id, operator, value }";

const readOwn = (filter: object, key: string): unknown =>
  Object.hasOwn(filter, key) ? (filter as Record<string, unknown>)[key] : undefined;

const isSelectFilter = (
  filter: Exclude<AssetCustomFieldFilter, string>,
): filter is AssetCustomFieldSelectFilter => {
  const valueId = readOwn(filter, "valueId");
  const operator = readOwn(filter, "operator");
  return typeof filter.id === "string" && typeof valueId === "string" && operator === undefined;
};

const isOperatorFilter = (
  filter: Exclude<AssetCustomFieldFilter, string>,
): filter is AssetCustomFieldTextFilter | AssetCustomFieldDateFilter => {
  const valueId = readOwn(filter, "valueId");
  const operator = readOwn(filter, "operator");
  const value = readOwn(filter, "value");
  return (
    typeof filter.id === "string" &&
    valueId === undefined &&
    typeof operator === "string" &&
    typeof value === "string"
  );
};

export const serializeAssetCustomFieldFilter = (filter: AssetCustomFieldFilter): string => {
  if (typeof filter === "string") {
    return filter;
  }
  if (isSelectFilter(filter)) {
    return `${filter.id}:${filter.valueId}`;
  }
  if (isOperatorFilter(filter)) {
    return `${filter.id}:${filter.operator}:${filter.value}`;
  }
  throw new Error(INVALID_ASSET_CUSTOM_FIELD_FILTER);
};
