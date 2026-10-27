import { describe, expect, test } from "vitest";
import { serializeAssetCustomFieldFilter } from "../../src/resources/serialize-asset-custom-field-filter";

describe("serializeAssetCustomFieldFilter", () => {
  test("passes a preformatted operator string through", () => {
    expect(serializeAssetCustomFieldFilter("field-1:text:hello: world")).toBe(
      "field-1:text:hello: world",
    );
    expect(serializeAssetCustomFieldFilter("field-1:dateLte:2026-06-10T00:00:00+02:00")).toBe(
      "field-1:dateLte:2026-06-10T00:00:00+02:00",
    );
  });

  test("serializes select and operator objects", () => {
    expect(serializeAssetCustomFieldFilter({ id: "field-1", valueId: "option-1" })).toBe(
      "field-1:option-1",
    );
    expect(
      serializeAssetCustomFieldFilter({
        id: "field-2",
        operator: "textNot",
        value: " archive ",
      }),
    ).toBe("field-2:textNot: archive ");
    expect(
      serializeAssetCustomFieldFilter({
        id: "field-3",
        operator: "dateGte",
        value: "2026-06-01",
      }),
    ).toBe("field-3:dateGte:2026-06-01");
  });

  test("throws when the object is not a select or operator filter", () => {
    expect(() => serializeAssetCustomFieldFilter({} as never)).toThrow(/must be a select/);
    expect(() => serializeAssetCustomFieldFilter({ id: "field-1" } as never)).toThrow(
      /must be a select/,
    );
    expect(() =>
      serializeAssetCustomFieldFilter({ id: "field-1", operator: "text" } as never),
    ).toThrow(/must be a select/);
  });
});
