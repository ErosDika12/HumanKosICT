import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import { validateRegistration } from "@/lib/auth/registration-rules";
import { registerUser } from "@/lib/auth/register";
import { verifyPassword } from "@/lib/auth/password";
import { deleteOwnAccount } from "@/lib/data/account";
import { isDemoLoginEnabled } from "@/lib/data/demo-session";
import { errorCodeFor } from "@/lib/i18n/errors";
import { CATALOG } from "@/lib/i18n/catalog";

const good = { name: "Arta K", email: "Arta.Test@Example.com", password: "long-enough-pass", isAdult: true, acceptsRules: true };
const tag = `acct-${Date.now()}`;
const emails: string[] = [];

after(async () => {
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
});

describe("registration rules", () => {
  it("normalizes name and email", () => {
    const v = validateRegistration({ ...good, name: "  Arta   K " });
    assert.equal(v.name, "Arta K");
    assert.equal(v.email, "arta.test@example.com");
  });
  it("rejects weak password, bad email, minors and missing rules", () => {
    assert.throws(() => validateRegistration({ ...good, password: "short" }), /Password must be/);
    assert.throws(() => validateRegistration({ ...good, email: "nope" }), /valid email/);
    assert.throws(() => validateRegistration({ ...good, isAdult: false }), /18 or older/);
    assert.throws(() => validateRegistration({ ...good, acceptsRules: false }), /community rules/);
  });
  it("every rejection maps to a translated error code", () => {
    for (const msg of ["Password must be at least 10 characters.", "Enter a valid email address.", "You must confirm you are 18 or older.", "You must accept the community rules.", "Could not create this account."]) {
      const code = errorCodeFor(msg);
      assert.notEqual(code, "generic", msg);
      assert.ok(`err.${code}` in CATALOG, `missing err.${code}`);
    }
  });
});

describe("registerUser", () => {
  it("creates an ordinary private MEMBER with a hashed password and no demo flags", async () => {
    const email = `${tag}-a@example.com`;
    emails.push(email);
    const { id, role } = await registerUser({ ...good, email });
    assert.equal(role, "MEMBER");
    const u = await prisma.user.findUniqueOrThrow({ where: { id } });
    assert.equal(u.role, "MEMBER");
    assert.equal(u.isDiscoverable, false);
    assert.equal(u.isDemoVisitor, false);
    assert.equal(u.isDemoPersona, false);
    assert.notEqual(u.passwordHash, good.password);
    assert.ok(await verifyPassword(good.password, u.passwordHash));
  });
  it("refuses a duplicate email without saying which part failed", async () => {
    const email = `${tag}-b@example.com`;
    emails.push(email);
    await registerUser({ ...good, email });
    await assert.rejects(() => registerUser({ ...good, email: email.toUpperCase() }), /Could not create this account/);
  });
});

describe("account deletion", () => {
  it("requires the exact confirmation and removes the account", async () => {
    const email = `${tag}-c@example.com`;
    emails.push(email);
    const { id } = await registerUser({ ...good, email });
    await assert.rejects(() => deleteOwnAccount(id, "delete me"), /Type DELETE/);
    await deleteOwnAccount(id, "DELETE");
    assert.equal(await prisma.user.findUnique({ where: { id } }), null);
  });
  it("does not let staff accounts delete themselves here", async () => {
    const email = `${tag}-d@example.com`;
    emails.push(email);
    const { id } = await registerUser({ ...good, email });
    await prisma.user.update({ where: { id }, data: { role: "MODERATOR" } });
    await assert.rejects(() => deleteOwnAccount(id, "DELETE"), /cannot delete/);
  });
});

describe("demo shortcut", () => {
  it("is unavailable in production", () => {
    const env = process.env as Record<string, string | undefined>;
    const prev = env.NODE_ENV;
    env.NODE_ENV = "production";
    try {
      assert.equal(isDemoLoginEnabled(), false);
    } finally {
      env.NODE_ENV = prev;
    }
  });
});
