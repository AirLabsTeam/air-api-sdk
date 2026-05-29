import { createHash, randomBytes } from "node:crypto";

export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: "S256";
}

/**
 * Generates a PKCE code verifier and matching S256 challenge per RFC 7636.
 *
 * The verifier is 43 base64url characters (32 random bytes encoded). The
 * challenge is the base64url-encoded SHA-256 hash of the verifier. Use the
 * challenge in the authorization request and the verifier when exchanging
 * the resulting code for a token.
 */
export function generatePKCEChallenge(): PKCEChallenge {
  const codeVerifier = base64UrlEncode(randomBytes(32));
  const codeChallenge = base64UrlEncode(createHash("sha256").update(codeVerifier).digest());
  return { codeVerifier, codeChallenge, codeChallengeMethod: "S256" };
}

function base64UrlEncode(input: Buffer): string {
  return input.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
