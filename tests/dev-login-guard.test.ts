import { describe, it } from "node:test";
import assert from "node:assert/strict";

// NODE_ENV is typed read-only (Next.js's ambient types) — writable at
// runtime, just not through that type. This file exists purely to flip it
// for the guard test below.
const env = process.env as Record<string, string | undefined>;

describe("dev-only persona switcher production guard", () => {
  it("refuses to authorize when NODE_ENV=production", async () => {
    const original = env.NODE_ENV;
    env.NODE_ENV = "production";
    try {
      const { assertNotProduction } = await import("@/lib/auth/dev-guard");
      assert.throws(() => assertNotProduction(), /disabled in production/i);
    } finally {
      env.NODE_ENV = original;
    }
  });

  it("allows it outside production", async () => {
    const original = env.NODE_ENV;
    env.NODE_ENV = "test";
    try {
      const { assertNotProduction } = await import("@/lib/auth/dev-guard");
      assert.doesNotThrow(() => assertNotProduction());
    } finally {
      env.NODE_ENV = original;
    }
  });
});
