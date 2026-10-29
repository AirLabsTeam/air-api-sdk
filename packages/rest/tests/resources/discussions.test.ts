import { describe, expect, test } from "vitest";
import { AirApi } from "../../src/api";
import { makeDiscussion, makeDiscussionComment, makePaginatedResponse } from "../helpers/fixtures";
import { createClientOptions, createMockFetch } from "../helpers/mock-fetch";

describe("Discussions", () => {
  test("list requires the caller filters and does not send the other parent", async () => {
    const discussion = makeDiscussion();
    const mockFetch = createMockFetch({ body: makePaginatedResponse([discussion]) });
    const client = new AirApi(createClientOptions(mockFetch));

    const page = await client.discussions.list({
      assetId: "asset-1",
      assetVersionId: "version-1",
      resolved: true,
      sortBy: "createdAt",
      sortDirection: "asc",
      limit: 12,
    });

    expect(page.data).toEqual([discussion]);
    const url = mockFetch.calls[0].url;
    expect(url).toContain("/discussions");
    expect(url).toContain("assetId=asset-1");
    expect(url).toContain("assetVersionId=version-1");
    expect(url).toContain("resolved=true");
    expect(url).toContain("sortBy=createdAt");
    expect(url).toContain("sortDirection=asc");
    expect(url).toContain("limit=12");
    expect(url).not.toContain("boardId");
  });

  test("list rejects a missing, doubled, or version-only filter at compile time", () => {
    const client = new AirApi(
      createClientOptions(createMockFetch({ body: makePaginatedResponse([]) })),
    );
    // Never called. `npm run typecheck` checks these lines and fails on any
    // expected error that stops occurring, so the union cannot loosen quietly.
    const typeOnly = () => {
      // @ts-expect-error one of assetId or boardId is required
      void client.discussions.list();
      // @ts-expect-error one of assetId or boardId is required
      void client.discussions.list({});
      // @ts-expect-error assetId and boardId cannot be combined
      void client.discussions.list({ assetId: "asset-1", boardId: "board-1" });
      // @ts-expect-error assetVersionId requires assetId
      void client.discussions.list({ boardId: "board-1", assetVersionId: "version-1" });
    };
    expect(typeOnly).toBeTypeOf("function");
  });

  test("get returns one discussion", async () => {
    const discussion = makeDiscussion();
    const mockFetch = createMockFetch({ body: discussion });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.discussions.get("discussion-1");
    expect(result).toEqual(discussion);
    expect(mockFetch.calls[0].url).toContain("/discussions/discussion-1");
    expect(mockFetch.calls[0].url).not.toContain("/comments");
  });

  test("listComments passes the embedded cursor", async () => {
    const comment = makeDiscussionComment();
    const mockFetch = createMockFetch({
      body: makePaginatedResponse([comment], true, "comment-cursor"),
    });
    const client = new AirApi(createClientOptions(mockFetch));

    const page = await client.discussions.listComments("discussion-1", {
      cursor: "comment-cursor",
      limit: 100,
    });

    expect(page.data).toEqual([comment]);
    expect(page.hasNextPage()).toBe(true);
    expect(mockFetch.calls[0].url).toContain("/discussions/discussion-1/comments");
    expect(mockFetch.calls[0].url).toContain("cursor=comment-cursor");
    expect(mockFetch.calls[0].url).toContain("limit=100");
  });

  test("create posts the version and mentions and returns the discussion", async () => {
    const discussion = makeDiscussion();
    const mockFetch = createMockFetch({ status: 201, body: discussion });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.discussions.create({
      assetId: "asset-1",
      assetVersionId: "version-1",
      body: "Please review {{mention:0}}",
      mentions: [{ accountId: "account-1" }],
    });

    expect(result).toEqual(discussion);
    expect(mockFetch.calls[0].init?.method).toBe("POST");
    expect(mockFetch.calls[0].url).toContain("/discussions");
    const body = JSON.parse(mockFetch.calls[0].init?.body as string);
    expect(body).toEqual({
      assetId: "asset-1",
      assetVersionId: "version-1",
      body: "Please review {{mention:0}}",
      mentions: [{ accountId: "account-1" }],
    });
    expect(body.boardId).toBeUndefined();
  });

  test("createComment posts to the discussion", async () => {
    const comment = makeDiscussionComment({ id: "comment-2" });
    const mockFetch = createMockFetch({ status: 201, body: comment });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.discussions.createComment("discussion-1", {
      body: "Looks good",
    });

    expect(result).toEqual(comment);
    expect(mockFetch.calls[0].init?.method).toBe("POST");
    expect(mockFetch.calls[0].url).toContain("/discussions/discussion-1/comments");
    const body = JSON.parse(mockFetch.calls[0].init?.body as string);
    expect(body).toEqual({ body: "Looks good" });
  });

  test("update sends resolved and accepts an empty response", async () => {
    const mockFetch = createMockFetch({ status: 204 });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.discussions.update("discussion-1", { resolved: true });
    expect(result).toBeUndefined();
    expect(mockFetch.calls[0].init?.method).toBe("PATCH");
    expect(mockFetch.calls[0].url).toContain("/discussions/discussion-1");
    expect(mockFetch.calls[0].url).not.toContain("/comments");
    const body = JSON.parse(mockFetch.calls[0].init?.body as string);
    expect(body).toEqual({ resolved: true });
  });

  test("updateComment can clear mentions", async () => {
    const mockFetch = createMockFetch({ status: 204 });
    const client = new AirApi(createClientOptions(mockFetch));

    await client.discussions.updateComment("discussion-1", "comment-1", {
      body: "Updated",
      mentions: [],
    });

    expect(mockFetch.calls[0].init?.method).toBe("PATCH");
    expect(mockFetch.calls[0].url).toContain("/discussions/discussion-1/comments/comment-1");
    const body = JSON.parse(mockFetch.calls[0].init?.body as string);
    expect(body).toEqual({ body: "Updated", mentions: [] });
  });

  test("deleteComment sends DELETE", async () => {
    const mockFetch = createMockFetch({ status: 204 });
    const client = new AirApi(createClientOptions(mockFetch));

    await client.discussions.deleteComment("discussion-1", "comment-1");
    expect(mockFetch.calls[0].init?.method).toBe("DELETE");
    expect(mockFetch.calls[0].url).toContain("/discussions/discussion-1/comments/comment-1");
    expect(mockFetch.calls[0].init?.body).toBeUndefined();
  });
});
