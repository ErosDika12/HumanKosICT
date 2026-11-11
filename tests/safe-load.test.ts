import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { safeLoad } from "@/lib/safe-load";

describe("safeLoad (regression: optional data must not take a page down)", () => {
  it("returns data when the loader succeeds", async () => {
    const res = await safeLoad("ok", async () => [1, 2, 3], []);
    assert.deepEqual(res, { ok: true, data: [1, 2, 3] });
  });

  it("returns the fallback instead of throwing when the database is unreachable", async () => {
    const dbDown = Object.assign(new Error("(ENOTFOUND) tenant/user app_user.example not found"), {
      name: "PrismaClientKnownRequestError",
      code: "P2039",
    });
    const original = console.error;
    const logged: string[] = [];
    console.error = (...args: unknown[]) => void logged.push(args.join(" "));
    try {
      const res = await safeLoad("activities", async () => Promise.reject(dbDown), [] as number[]);
      assert.deepEqual(res, { ok: false, data: [] });
    } finally {
      console.error = original;
    }
    // Only the error class/code is logged — never the message (it can carry host or user names).
    assert.equal(logged.length, 1);
    assert.match(logged[0], /P2039/);
    assert.doesNotMatch(logged[0], /app_user|ENOTFOUND/);
  });
});
