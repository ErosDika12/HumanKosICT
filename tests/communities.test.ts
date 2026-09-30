import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import {
  joinCommunity,
  leaveCommunity,
  decideMembership,
  listPendingMembers,
  updateCommunity,
  CommunityAuthorizationError,
} from "@/lib/data/communities";

describe("Community membership and organizer authorization", () => {
  it("joining a PUBLIC community is immediate; joining a RESTRICTED one is pending until approved", async () => {
    const aiClub = await prisma.community.findUniqueOrThrow({ where: { slug: "prishtina-ai-klub" } });
    const basketball = await prisma.community.findUniqueOrThrow({
      where: { slug: "rinia-basketboll-lakrishte" },
    });
    assert.equal(basketball.visibility, "RESTRICTED");

    const publicResult = await joinCommunity("user-elmedina", aiClub.id);
    assert.equal(publicResult, "member");
    const publicMembership = await prisma.membership.findUniqueOrThrow({
      where: { userId_communityId: { userId: "user-elmedina", communityId: aiClub.id } },
    });
    assert.equal(publicMembership.status, "ACTIVE");

    const restrictedResult = await joinCommunity("user-elmedina", basketball.id);
    assert.equal(restrictedResult, "pending");
    const restrictedMembership = await prisma.membership.findUniqueOrThrow({
      where: { userId_communityId: { userId: "user-elmedina", communityId: basketball.id } },
    });
    assert.equal(restrictedMembership.status, "PENDING");

    // A pending member must not silently gain access — listPendingMembers
    // requires organizer authority, and a non-organizer is refused.
    await assert.rejects(
      () => listPendingMembers("user-elmedina", basketball.id),
      CommunityAuthorizationError
    );

    const pending = await listPendingMembers("user-njomeza", basketball.id);
    assert.ok(pending.some((p) => p.userId === "user-elmedina"));

    await decideMembership("user-njomeza", restrictedMembership.id, "approve");
    const approved = await prisma.membership.findUniqueOrThrow({ where: { id: restrictedMembership.id } });
    assert.equal(approved.status, "ACTIVE");

    // Cleanup so this test is repeatable.
    await leaveCommunity("user-elmedina", aiClub.id);
    await leaveCommunity("user-elmedina", basketball.id);
  });

  it("joining twice is idempotent — no duplicate membership row", async () => {
    const community = await prisma.community.findUniqueOrThrow({ where: { slug: "prishtina-ai-klub" } });
    await joinCommunity("user-elmedina", community.id);
    await joinCommunity("user-elmedina", community.id);
    const rows = await prisma.membership.findMany({
      where: { userId: "user-elmedina", communityId: community.id },
    });
    assert.equal(rows.length, 1);
    await leaveCommunity("user-elmedina", community.id);
  });

  it("only the community's organizer can edit it", async () => {
    await assert.rejects(
      () => updateCommunity("user-blerta", "prishtina-ai-klub", { rules: "hijacked" }),
      CommunityAuthorizationError
    );
    const community = await prisma.community.findUniqueOrThrow({ where: { slug: "prishtina-ai-klub" } });
    assert.notEqual(community.rules, "hijacked");

    await updateCommunity("user-drin", "prishtina-ai-klub", { rules: "Updated rules for tests" });
    const updated = await prisma.community.findUniqueOrThrow({ where: { slug: "prishtina-ai-klub" } });
    assert.equal(updated.rules, "Updated rules for tests");
  });
});
