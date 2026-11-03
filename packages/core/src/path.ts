import { InvalidRequestPathError } from "./errors";

/** `encodeURIComponent` throws on these. `new URL` replaced them with U+FFFD. */
const LONE_SURROGATE = /\p{Cs}/gu;

/**
 * URL-safe path characters: unreserved, sub-delims, `:`, `@`, `%` and `/`.
 * Anything else is percent-encoded first, so `new URL` cannot strip, trim or
 * split on it: it drops a raw tab anywhere, so `.\t.` would become `..`, and it
 * reads a raw `\` as `/`. Spaces and non-ASCII come out the way `new URL`
 * already encoded them.
 */
const UNSAFE_PATH_CHARACTER = /[^A-Za-z0-9\-._~!$&'()*+,;=:@%/]/gu;

/**
 * A segment `new URL` resolves as `.` or `..`, so the request would reach
 * another route. This is the URL Standard's exact rule: `.` or `%2e`, twice for
 * `..`, in any case. Probes on 2026-11-02 found the server resolves no other
 * form on QA or prod: double-encoded, full-width, overlong, with `;`, a space,
 * or an encoded `/`, `\`, tab or newline. The load balancer rejects an encoded
 * NUL with a 400.
 */
const DOT_SEGMENT = /^(?:\.|%2e){1,2}$/iu;

const wellFormed = (value: string) => value.replace(LONE_SURROGATE, "�");

const percentEncode = (value: string) =>
  wellFormed(value).replace(UNSAFE_PATH_CHARACTER, (character) => encodeURIComponent(character));

/**
 * Builds a request path from a template, encoding each value as one path
 * segment: encodePath`/assets/${assetId}`. A value that is not a string is
 * stringified, as in a template literal. A missing value (`undefined` or
 * `null`), or one that cannot be stringified, becomes an empty segment, which
 * `request` rejects. It does not throw, so a method that returns a
 * `PagePromise` still rejects instead of throwing.
 */
export function encodePath(strings: TemplateStringsArray, ...values: (string | number)[]): string {
  return strings.reduce((path, part, index) => {
    return path + encodeURIComponent(wellFormed(stringify(values[index - 1]))) + part;
  });
}

/** A template literal throws on a symbol, so it counts as missing here. */
const stringify = (value: unknown): string => {
  if (value === undefined || value === null || typeof value === "symbol") return "";
  try {
    return String(value);
  } catch {
    return "";
  }
};

/** Why `segment` would reach another route, if it would. */
const segmentProblem = (segment: string): string | undefined => {
  if (segment === "") return "a segment is empty, for example from a missing id";
  if (DOT_SEGMENT.test(segment)) return 'a segment is "." or ".."';
  return undefined;
};

/** Shows only the path part, so a token in a raw query or fragment never reaches a log. */
const invalidPath = (path: string, reason: string) =>
  new InvalidRequestPathError(
    `Invalid request path ${JSON.stringify(path.split(/[?#]/, 1)[0])}: ${reason}.`,
  );

/**
 * Returns `path` safe to pass to `new URL`, or throws `InvalidRequestPathError`
 * before anything is sent. A `#` is rejected because a fragment is never sent,
 * so everything after it would be dropped. A query is left as it is, since it
 * cannot change the route.
 */
export function toRequestPath(path: string): string {
  if (typeof path !== "string") {
    // Only the type: `JSON.stringify` may not handle a non-string.
    const type = path === null ? "null" : typeof path;
    throw new InvalidRequestPathError(`Invalid request path of type ${type}.`);
  }
  if (path.includes("#")) {
    throw invalidPath(path, 'it contains "#", and a fragment is never sent');
  }
  const queryStart = path.indexOf("?");
  const pathPart = queryStart === -1 ? path : path.slice(0, queryStart);
  const queryPart = queryStart === -1 ? "" : path.slice(queryStart);
  const safePath = percentEncode(pathPart);
  if (!safePath.startsWith("/")) {
    throw invalidPath(path, 'it does not start with "/"');
  }
  for (const segment of safePath.split("/").slice(1)) {
    const problem = segmentProblem(segment);
    if (problem !== undefined) throw invalidPath(path, problem);
  }
  return safePath + queryPart;
}
