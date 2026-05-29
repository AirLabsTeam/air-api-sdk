import { createHash } from "node:crypto";
import { describe, expect, test } from "vitest";
import { generatePKCEChallenge } from "../src/pkce";

const BASE64URL = /^[A-Za-z0-9_-]+$/;

describe("generatePKCEChallenge", () => {
  test("produces base64url-safe verifier and challenge of the right shape", () => {
    const { codeVerifier, codeChallenge, codeChallengeMethod } = generatePKCEChallenge();

    expect(codeVerifier).toMatch(BASE64URL);
    expect(codeChallenge).toMatch(BASE64URL);
    expect(codeChallengeMethod).toBe("S256");

    // 32 random bytes → 43 base64url chars (no padding).
    expect(codeVerifier.length).toBe(43);
    // SHA-256 → 32 bytes → 43 base64url chars.
    expect(codeChallenge.length).toBe(43);
  });

  test("challenge is SHA-256(verifier) base64url-encoded", () => {
    const { codeVerifier, codeChallenge } = generatePKCEChallenge();
    const expected = createHash("sha256")
      .update(codeVerifier)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(codeChallenge).toBe(expected);
  });

  test("produces a different verifier each call", () => {
    const a = generatePKCEChallenge();
    const b = generatePKCEChallenge();
    expect(a.codeVerifier).not.toBe(b.codeVerifier);
    expect(a.codeChallenge).not.toBe(b.codeChallenge);
  });
});
