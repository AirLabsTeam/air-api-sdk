import { describe, expect, test } from "vitest";
import { AirApi } from "../../src/api";
import { encodePath, InvalidRequestPathError } from "../../src/index";
import { createClientOptions, createMockFetch } from "../helpers/mock-fetch";

const params = {} as never;

/** Every id slot of every method that builds a path from ids. */
const slots: [string, (client: AirApi, id: string) => Promise<unknown>][] = [
  ["assets.get", (c, id) => c.assets.get(id)],
  ["assets.delete", (c, id) => c.assets.delete(id)],
  ["assets.listCdnLinks", (c, id) => c.assets.listCdnLinks(id)],
  ["assets.createCdnLink", (c, id) => c.assets.createCdnLink(id, params)],
  ["assets.updateCdnLink asset", (c, id) => c.assets.updateCdnLink(id, "l1", params)],
  ["assets.updateCdnLink link", (c, id) => c.assets.updateCdnLink("a1", id, params)],
  ["assets.setCustomField asset", (c, id) => c.assets.setCustomField(id, "cf1", params)],
  ["assets.setCustomField field", (c, id) => c.assets.setCustomField("a1", id, params)],
  ["assets.listVersions", (c, id) => c.assets.listVersions(id)],
  ["assets.getVersion asset", (c, id) => c.assets.getVersion(id, "v1")],
  ["assets.getVersion version", (c, id) => c.assets.getVersion("a1", id)],
  ["assets.updateVersion asset", (c, id) => c.assets.updateVersion(id, "v1", params)],
  ["assets.updateVersion version", (c, id) => c.assets.updateVersion("a1", id, params)],
  ["assets.getVersionDownloadUrl asset", (c, id) => c.assets.getVersionDownloadUrl(id, "v1")],
  ["assets.getVersionDownloadUrl version", (c, id) => c.assets.getVersionDownloadUrl("a1", id)],
  ["assets.addVersionTag asset", (c, id) => c.assets.addVersionTag(id, "v1", params)],
  ["assets.addVersionTag version", (c, id) => c.assets.addVersionTag("a1", id, params)],
  ["assets.removeVersionTag asset", (c, id) => c.assets.removeVersionTag(id, "v1", "t1")],
  ["assets.removeVersionTag version", (c, id) => c.assets.removeVersionTag("a1", id, "t1")],
  ["assets.removeVersionTag tag", (c, id) => c.assets.removeVersionTag("a1", "v1", id)],
  ["assets.listShareLinks", (c, id) => c.assets.listShareLinks(id)],
  ["assets.createShareLink", (c, id) => c.assets.createShareLink(id, params)],
  ["assets.updateShareLink asset", (c, id) => c.assets.updateShareLink(id, "s1", params)],
  ["assets.updateShareLink link", (c, id) => c.assets.updateShareLink("a1", id, params)],
  ["assets.listBoards", (c, id) => c.assets.listBoards(id)],
  ["boards.get", (c, id) => c.boards.get(id)],
  ["boards.update", (c, id) => c.boards.update(id, params)],
  ["boards.delete", (c, id) => c.boards.delete(id)],
  ["boards.addAssets", (c, id) => c.boards.addAssets(id, params)],
  ["boards.removeAsset board", (c, id) => c.boards.removeAsset(id, "a1")],
  ["boards.removeAsset asset", (c, id) => c.boards.removeAsset("b1", id)],
  ["boards.setCustomField board", (c, id) => c.boards.setCustomField(id, "cf1", params)],
  ["boards.setCustomField field", (c, id) => c.boards.setCustomField("b1", id, params)],
  ["boards.listShareLinks", (c, id) => c.boards.listShareLinks(id)],
  ["boards.createShareLink", (c, id) => c.boards.createShareLink(id)],
  ["boards.updateShareLink board", (c, id) => c.boards.updateShareLink(id, "s1", params)],
  ["boards.updateShareLink link", (c, id) => c.boards.updateShareLink("b1", id, params)],
  ["boards.listForms", (c, id) => c.boards.listForms(id)],
  ["boards.createForm", (c, id) => c.boards.createForm(id, params)],
  ["boards.updateForm board", (c, id) => c.boards.updateForm(id, "f1", params)],
  ["boards.updateForm form", (c, id) => c.boards.updateForm("b1", id, params)],
  ["boards.listFormShareLinks board", (c, id) => c.boards.listFormShareLinks(id, "f1")],
  ["boards.listFormShareLinks form", (c, id) => c.boards.listFormShareLinks("b1", id)],
  ["boards.createFormShareLink board", (c, id) => c.boards.createFormShareLink(id, "f1")],
  ["boards.createFormShareLink form", (c, id) => c.boards.createFormShareLink("b1", id)],
  [
    "boards.updateFormShareLink board",
    (c, id) => c.boards.updateFormShareLink(id, "f1", "s1", params),
  ],
  [
    "boards.updateFormShareLink form",
    (c, id) => c.boards.updateFormShareLink("b1", id, "s1", params),
  ],
  [
    "boards.updateFormShareLink link",
    (c, id) => c.boards.updateFormShareLink("b1", "f1", id, params),
  ],
  ["boards.deleteFormShareLink board", (c, id) => c.boards.deleteFormShareLink(id, "f1", "s1")],
  ["boards.deleteFormShareLink form", (c, id) => c.boards.deleteFormShareLink("b1", id, "s1")],
  ["boards.deleteFormShareLink link", (c, id) => c.boards.deleteFormShareLink("b1", "f1", id)],
  ["boards.addGuest", (c, id) => c.boards.addGuest(id, params)],
  ["boards.listGuests", (c, id) => c.boards.listGuests(id)],
  ["boards.updateGuest board", (c, id) => c.boards.updateGuest(id, "g1", params)],
  ["boards.updateGuest guest", (c, id) => c.boards.updateGuest("b1", id, params)],
  ["boards.removeGuest board", (c, id) => c.boards.removeGuest(id, "g1")],
  ["boards.removeGuest guest", (c, id) => c.boards.removeGuest("b1", id)],
  ["customFields.get", (c, id) => c.customFields.get(id)],
  ["customFields.update", (c, id) => c.customFields.update(id, params)],
  ["customFields.delete", (c, id) => c.customFields.delete(id)],
  ["customFields.createValue", (c, id) => c.customFields.createValue(id, params)],
  ["customFields.updateValue field", (c, id) => c.customFields.updateValue(id, "v1", params)],
  ["customFields.updateValue value", (c, id) => c.customFields.updateValue("cf1", id, params)],
  ["customFields.deleteValue field", (c, id) => c.customFields.deleteValue(id, "v1")],
  ["customFields.deleteValue value", (c, id) => c.customFields.deleteValue("cf1", id)],
  ["discussions.get", (c, id) => c.discussions.get(id)],
  ["discussions.listComments", (c, id) => c.discussions.listComments(id)],
  ["discussions.createComment", (c, id) => c.discussions.createComment(id, params)],
  ["discussions.update", (c, id) => c.discussions.update(id, params)],
  [
    "discussions.updateComment discussion",
    (c, id) => c.discussions.updateComment(id, "c1", params),
  ],
  ["discussions.updateComment comment", (c, id) => c.discussions.updateComment("d1", id, params)],
  ["discussions.deleteComment discussion", (c, id) => c.discussions.deleteComment(id, "c1")],
  ["discussions.deleteComment comment", (c, id) => c.discussions.deleteComment("d1", id)],
  ["imports.getStatus", (c, id) => c.imports.getStatus(id)],
  ["libraries.get", (c, id) => c.libraries.get(id)],
  ["libraries.update", (c, id) => c.libraries.update(id, params)],
  ["libraries.delete", (c, id) => c.libraries.delete(id)],
  ["showcases.get", (c, id) => c.showcases.get(id)],
  ["showcases.update", (c, id) => c.showcases.update(id, params)],
  ["showcases.updateShareLink showcase", (c, id) => c.showcases.updateShareLink(id, "s1", params)],
  ["showcases.updateShareLink link", (c, id) => c.showcases.updateShareLink("s1", id, params)],
  ["showcases.addAssets", (c, id) => c.showcases.addAssets(id, params)],
  ["showcases.removeAsset showcase", (c, id) => c.showcases.removeAsset(id, "a1")],
  ["showcases.removeAsset asset", (c, id) => c.showcases.removeAsset("s1", id)],
  ["showcases.addBoards", (c, id) => c.showcases.addBoards(id, params)],
  ["showcases.removeBoard showcase", (c, id) => c.showcases.removeBoard(id, "b1")],
  ["showcases.removeBoard board", (c, id) => c.showcases.removeBoard("s1", id)],
  ["tags.get", (c, id) => c.tags.get(id)],
  ["tags.update", (c, id) => c.tags.update(id, params)],
  ["tags.delete", (c, id) => c.tags.delete(id)],
];

describe("path encoding", () => {
  test.each(slots)("%s rejects a .. id without sending a request", async (_name, call) => {
    const mockFetch = createMockFetch({ status: 204 });
    const client = new AirApi(createClientOptions(mockFetch));

    await expect(call(client, "..")).rejects.toBeInstanceOf(InvalidRequestPathError);
    expect(mockFetch.calls).toHaveLength(0);
  });

  test.each(slots)("%s sends a / or ? in an id inside its segment", async (_name, call) => {
    const mockFetch = createMockFetch({ status: 204 });
    const client = new AirApi(createClientOptions(mockFetch));

    await call(client, "x/y?z").catch(() => undefined);

    expect(mockFetch.calls).toHaveLength(1);
    expect(new URL(mockFetch.calls[0].url).pathname.split("/")).toContain("x%2Fy%3Fz");
  });

  test("keeps a ../ id in one segment instead of reaching another route", async () => {
    const mockFetch = createMockFetch({ status: 204 });
    const client = new AirApi(createClientOptions(mockFetch));

    await client.discussions.deleteComment("d1", "../../../assets/A1");

    expect(new URL(mockFetch.calls[0].url).pathname).toBe(
      "/v1/discussions/d1/comments/..%2F..%2F..%2Fassets%2FA1",
    );
  });

  test("keeps a query or fragment character in an id inside its segment", async () => {
    const mockFetch = createMockFetch({ status: 204 });
    const client = new AirApi(createClientOptions(mockFetch));

    await client.boards.removeAsset("b1?x=1#y", "a1");

    const url = new URL(mockFetch.calls[0].url);
    expect(url.pathname).toBe("/v1/boards/b1%3Fx%3D1%23y/assets/a1");
    expect(url.search).toBe("");
  });

  test("re-exports encodePath for callers of request", async () => {
    const mockFetch = createMockFetch({ status: 204 });
    const client = new AirApi(createClientOptions(mockFetch));

    await client.request({ method: "DELETE", path: encodePath`/tags/${"t1#x"}` });

    expect(new URL(mockFetch.calls[0].url).pathname).toBe("/v1/tags/t1%23x");
  });
});
