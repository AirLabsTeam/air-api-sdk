import { describe, test, expect } from "vitest";
import { getClient } from "./helpers/setup";

describe("Members", () => {
  const client = getClient();

  test("list returns workspace members", async () => {
    const page = await client.members.list({ limit: 5 });
    expect(page.data.length).toBeGreaterThan(0);
    expect(page.data.length).toBeLessThanOrEqual(5);
    for (const member of page.data) {
      expect(typeof member.id).toBe("string");
      expect(member.type).toBe("member");
      expect(typeof member.email).toBe("string");
      expect(typeof member.firstJoinedAt).toBe("string");
    }
  });

  test("email finds the same member", async () => {
    const page = await client.members.list({ limit: 1 });
    const [first] = page.data;

    const byEmail = await client.members.list({ email: first.email.toUpperCase() });
    expect(byEmail.data.map((member) => member.id)).toContain(first.id);
  });

  test("an unknown email returns an empty page", async () => {
    const page = await client.members.list({ email: "nobody-e2e@example.invalid" });
    expect(page.data).toEqual([]);
  });
});
