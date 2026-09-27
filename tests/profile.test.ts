import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import { toPublicProfile, updateOwnProfile, ProfileAuthorizationError } from "@/lib/data/profile";

describe("profile projections and authorization", () => {
  it("only exposes discoverable users in the public projection, and never email", async () => {
    const arta = await prisma.user.findUniqueOrThrow({ where: { id: "user-arta" } });
    const blerta = await prisma.user.findUniqueOrThrow({ where: { id: "user-blerta" } });

    const artaPublic = toPublicProfile(arta);
    assert.ok(artaPublic);
    assert.equal("email" in artaPublic, false);
    assert.equal("passwordHash" in artaPublic, false);

    // Blerta opted out of discoverability in the seed — the public
    // projection must be null, not a redacted object.
    assert.equal(toPublicProfile(blerta), null);
  });

  it("member A cannot edit member B's profile", async () => {
    await assert.rejects(
      () => updateOwnProfile("user-blerta", "user-arta", { bio: "hijacked" }),
      ProfileAuthorizationError
    );

    const artaAfter = await prisma.user.findUniqueOrThrow({ where: { id: "user-arta" } });
    assert.notEqual(artaAfter.bio, "hijacked");
  });

  it("a member can edit their own profile", async () => {
    const updated = await updateOwnProfile("user-blerta", "user-blerta", { bio: "Updated bio" });
    assert.equal(updated.bio, "Updated bio");
  });
});
