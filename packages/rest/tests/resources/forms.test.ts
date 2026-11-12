import { describe, expect, test } from "vitest";
import { AirApi } from "../../src/api";
import type { FormShareLink } from "../../src/types/forms";
import { createMockFetch, createClientOptions } from "../helpers/mock-fetch";
import { makeForm, makePaginatedResponse, makeShareLink } from "../helpers/fixtures";

type HasKey<T, K extends string> = K extends keyof T ? true : false;

type FormShareLinkHasNoAssetFields =
  HasKey<FormShareLink, "followsDefaultVersion"> extends false
    ? HasKey<FormShareLink, "versionId"> extends false
      ? HasKey<FormShareLink, "showAllVersions"> extends false
        ? true
        : never
      : never
    : never;

type FormShareLinkExpiresAt = FormShareLink["expiresAt"] extends string | null
  ? null extends FormShareLink["expiresAt"]
    ? string extends FormShareLink["expiresAt"]
      ? true
      : never
    : never
  : never;

const formShareLinkTypeChecks: [FormShareLinkHasNoAssetFields, FormShareLinkExpiresAt] = [
  true,
  true,
];

function makeFormShareLink(overrides: Partial<FormShareLink> = {}): FormShareLink {
  return makeShareLink({
    id: "f8289271f",
    url: "https://app.air.inc/d/f8289271f",
    expiresAt: null,
    allowDownload: false,
    comments: "hidden",
    customFields: "editable",
    ...overrides,
  });
}

describe("Forms", () => {
  test("a form share link is a board share link with expiresAt", () => {
    const link = makeFormShareLink();
    const expiresAt: string | null = link.expiresAt;

    expect(formShareLinkTypeChecks).toEqual([true, true]);
    expect(expiresAt).toBeNull();
    expect("followsDefaultVersion" in link).toBe(false);
    expect("versionId" in link).toBe(false);
    expect("showAllVersions" in link).toBe(false);
  });

  test("listForms returns the board form", async () => {
    const form = makeForm({ description: "Upload finals by Friday." });
    const mockFetch = createMockFetch({ body: makePaginatedResponse([form]) });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.boards.listForms("board-1");

    expect(result.data).toEqual([form]);
    expect(result.total).toBe(1);
    expect(result.pagination).toEqual({ hasMore: false, cursor: null });
    const url = new URL(mockFetch.calls[0].url);
    expect(url.pathname).toBe("/v1/boards/board-1/forms");
    expect(url.search).toBe("");
    expect(mockFetch.calls[0].init?.method).toBe("GET");
  });

  test("listForms returns an empty list when the board has no form", async () => {
    const mockFetch = createMockFetch({ body: makePaginatedResponse([]) });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.boards.listForms("board-1");

    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  test("createForm sends a customField and returns the form", async () => {
    const form = makeForm({
      fields: [{ type: "customField", customFieldId: "cf-1", required: true }],
    });
    const mockFetch = createMockFetch({ status: 201, body: form });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.boards.createForm("board-1", {
      title: "Spring deliveries",
      description: null,
      fields: [{ type: "customField", customFieldId: "cf-1", required: true }],
    });

    expect(result).toEqual(form);
    expect(mockFetch.calls[0].init?.method).toBe("POST");
    expect(new URL(mockFetch.calls[0].url).pathname).toBe("/v1/boards/board-1/forms");
    expect(JSON.parse(mockFetch.calls[0].init?.body as string)).toEqual({
      title: "Spring deliveries",
      description: null,
      fields: [{ type: "customField", customFieldId: "cf-1", required: true }],
    });
  });

  test("updateForm sends PATCH and leaves fields out when they are omitted", async () => {
    const mockFetch = createMockFetch({ status: 204 });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.boards.updateForm("board-1", "form-1", { autoSubmit: true });

    expect(result).toBeUndefined();
    expect(mockFetch.calls[0].init?.method).toBe("PATCH");
    expect(new URL(mockFetch.calls[0].url).pathname).toBe("/v1/boards/board-1/forms/form-1");
    expect(JSON.parse(mockFetch.calls[0].init?.body as string)).toEqual({ autoSubmit: true });
  });

  test("listFormShareLinks returns the link with expiresAt null", async () => {
    const link = makeFormShareLink();
    const mockFetch = createMockFetch({ body: makePaginatedResponse([link]) });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.boards.listFormShareLinks("board-1", "form-1");

    expect(result.data).toEqual([link]);
    expect(result.data[0].expiresAt).toBeNull();
    expect(result.total).toBe(1);
    const url = new URL(mockFetch.calls[0].url);
    expect(url.pathname).toBe("/v1/boards/board-1/forms/form-1/share-links");
    expect(url.search).toBe("");
  });

  test("createFormShareLink returns expiresAt null", async () => {
    const link = makeFormShareLink();
    const mockFetch = createMockFetch({ status: 201, body: link });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.boards.createFormShareLink("board-1", "form-1", {
      password: "a-secret",
      requireAccount: true,
    });

    expect(result).toEqual(link);
    expect(result.expiresAt).toBeNull();
    expect(result.url).toBe("https://app.air.inc/d/f8289271f");
    expect(JSON.stringify(result)).not.toContain("a-secret");
    expect(JSON.parse(mockFetch.calls[0].init?.body as string)).toEqual({
      password: "a-secret",
      requireAccount: true,
    });
    expect(mockFetch.calls[0].init?.method).toBe("POST");
  });

  test("createFormShareLink sends an empty body when settings are omitted", async () => {
    const link = makeFormShareLink();
    const mockFetch = createMockFetch({ status: 201, body: link });
    const client = new AirApi(createClientOptions(mockFetch));

    await client.boards.createFormShareLink("board-1", "form-1");

    expect(JSON.parse(mockFetch.calls[0].init?.body as string)).toEqual({});
  });

  test("updateFormShareLink sends the share link id and null expiration", async () => {
    const mockFetch = createMockFetch({ status: 204 });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.boards.updateFormShareLink("board-1", "form-1", "f8289271f", {
      expiresAt: null,
      password: null,
      comments: "hidden",
    });

    expect(result).toBeUndefined();
    expect(mockFetch.calls[0].init?.method).toBe("PATCH");
    expect(new URL(mockFetch.calls[0].url).pathname).toBe(
      "/v1/boards/board-1/forms/form-1/share-links/f8289271f",
    );
    expect(JSON.parse(mockFetch.calls[0].init?.body as string)).toEqual({
      expiresAt: null,
      password: null,
      comments: "hidden",
    });
  });

  test("deleteFormShareLink sends DELETE for the share link id", async () => {
    const mockFetch = createMockFetch({ status: 204 });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.boards.deleteFormShareLink("board-1", "form-1", "f8289271f");

    expect(result).toBeUndefined();
    expect(mockFetch.calls[0].init?.method).toBe("DELETE");
    expect(new URL(mockFetch.calls[0].url).pathname).toBe(
      "/v1/boards/board-1/forms/form-1/share-links/f8289271f",
    );
  });
});
