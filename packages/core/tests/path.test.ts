import { describe, expect, test } from "vitest";
import { encodePath } from "../src/path";

describe("encodePath", () => {
  test("keeps the template and a plain id unchanged", () => {
    const assetId = "0b6c3a52-5f3e-4c1a-9d2e-7f8a9b0c1d2e";
    expect(encodePath`/assets/${assetId}/versions`).toBe(`/assets/${assetId}/versions`);
  });

  test("encodes each value as one segment", () => {
    expect(encodePath`/discussions/${"d1"}/comments/${"../../../assets/A1"}`).toBe(
      "/discussions/d1/comments/..%2F..%2F..%2Fassets%2FA1",
    );
  });

  test("encodes a query or fragment delimiter in a value", () => {
    expect(encodePath`/tags/${"t1?force=true"}`).toBe("/tags/t1%3Fforce%3Dtrue");
    expect(encodePath`/tags/${"t1#x"}`).toBe("/tags/t1%23x");
  });

  test("encodes a percent sign so a value cannot carry a pre-encoded dot segment", () => {
    expect(encodePath`/tags/${"%2e%2e"}`).toBe("/tags/%252e%252e");
  });

  test("encodes a backslash, tab and newline", () => {
    expect(encodePath`/tags/${"a\\..\t\n"}`).toBe("/tags/a%5C..%09%0A");
  });

  test("turns a missing value into an empty segment, which a request rejects", () => {
    expect(encodePath`/assets/${undefined as unknown as string}`).toBe("/assets/");
    expect(encodePath`/assets/${null as unknown as string}/versions`).toBe("/assets//versions");
  });

  test("turns a value that cannot be stringified into an empty segment instead of throwing", () => {
    const bare = Object.create(null) as unknown as string;
    expect(encodePath`/assets/${bare}`).toBe("/assets/");
    expect(encodePath`/assets/${Symbol("x") as unknown as string}`).toBe("/assets/");
  });

  test("stringifies any other value, as a template literal does", () => {
    const id = { toString: () => "a 1" };
    expect(encodePath`/assets/${123}/versions`).toBe("/assets/123/versions");
    expect(encodePath`/assets/${10n as unknown as string}`).toBe("/assets/10");
    expect(encodePath`/assets/${new String("abc") as unknown as string}`).toBe("/assets/abc");
    expect(encodePath`/assets/${id as unknown as string}`).toBe("/assets/a%201");
  });

  test("replaces a lone surrogate instead of throwing, as `new URL` did", () => {
    expect(encodePath`/tags/${"a\uD800"}`).toBe("/tags/a%EF%BF%BD");
    expect(encodePath`/tags/${"\uDC00b"}`).toBe("/tags/%EF%BF%BDb");
    expect(encodePath`/tags/${"😀"}`).toBe("/tags/%F0%9F%98%80");
  });
});
