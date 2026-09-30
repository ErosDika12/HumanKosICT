import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import {
  regenerateBridgeProposals,
  listBridgeProposals,
  getBridgeProposal,
  saveBridgeProposal,
  declineBridgeProposal,
  acceptBridgeProposal,
  updateBridgeProposal,
} from "@/lib/data/bridge";
import { CommunityAuthorizationError } from "@/lib/data/communities";

describe("BRIDGE proposal generation, authorization, and acceptance", () => {
  it("regenerates the flagship AI klub + environment proposal from real seeded data, ranked highest", async () => {
    await regenerateBridgeProposals();
    const proposals = await listBridgeProposals();
    assert.ok(proposals.length > 0);

    const top = proposals[0];
    const names = [top.communityAName, top.communityBName].sort();
    assert.deepEqual(names, ["Gjelbër për Prishtinën", "Prishtina AI Klub"].sort());
    assert.ok(top.reason.length > 0);
    assert.notEqual(top.reason.toLowerCase(), "ai says 95% match");
  });

  it("only an organizer of one of the two communities can save, edit, decline, or accept", async () => {
    await regenerateBridgeProposals();
    const proposals = await listBridgeProposals();
    const target = proposals.find((p) => p.communityAName === "Prishtina AI Klub" || p.communityBName === "Prishtina AI Klub")!;
    assert.ok(target);

    // user-blerta organizes nothing.
    await assert.rejects(() => saveBridgeProposal("user-blerta", target.id), CommunityAuthorizationError);
    await assert.rejects(
      () => updateBridgeProposal("user-blerta", target.id, { suggestedNextAction: "hijacked" }),
      CommunityAuthorizationError
    );
    await assert.rejects(() => declineBridgeProposal("user-blerta", target.id), CommunityAuthorizationError);
    await assert.rejects(() => acceptBridgeProposal("user-blerta", target.id), CommunityAuthorizationError);

    // user-drin organizes Prishtina AI Klub — one of the two sides.
    await saveBridgeProposal("user-drin", target.id);
    const detail = await getBridgeProposal(target.id, "user-drin");
    assert.equal(detail?.status, "saved");
    assert.equal(detail?.viewerCanDecide, true);

    const blertaView = await getBridgeProposal(target.id, "user-blerta");
    assert.equal(blertaView?.viewerCanDecide, false);
  });

  it("accepting creates a real draft Project and is idempotent on re-accept", async () => {
    await regenerateBridgeProposals();
    const proposals = await listBridgeProposals();
    const target = proposals.find((p) => p.status === "suggested" || p.status === "saved")!;
    assert.ok(target);

    const slug1 = await acceptBridgeProposal("user-drin", target.id);
    const project = await prisma.project.findUnique({ where: { slug: slug1 } });
    assert.ok(project);
    assert.equal(project?.status, "ACTIVE");

    const detail = await getBridgeProposal(target.id);
    assert.equal(detail?.status, "accepted");
    assert.equal(detail?.draftProjectSlug, slug1);

    // Re-accepting an already-accepted proposal returns the same project, not a second one.
    const slug2 = await acceptBridgeProposal("user-drin", target.id);
    assert.equal(slug2, slug1);
    const projectCount = await prisma.project.count({ where: { slug: slug1 } });
    assert.equal(projectCount, 1);

    // Cleanup: remove the draft project + reset the proposal so repeated
    // test runs stay deterministic.
    await prisma.bridgeProposal.update({
      where: { id: target.id },
      data: { status: "SUGGESTED", draftProjectId: null, decidedById: null, decidedAt: null },
    });
    await prisma.project.delete({ where: { slug: slug1 } });
  });

  it("regeneration never overwrites a human decision (accepted/declined/saved)", async () => {
    await regenerateBridgeProposals();
    const proposals = await listBridgeProposals();
    const target = proposals[0];
    await declineBridgeProposal("user-drin", target.id);

    await regenerateBridgeProposals();
    const after = await getBridgeProposal(target.id);
    assert.equal(after?.status, "declined");

    // Reset for other tests.
    await prisma.bridgeProposal.update({
      where: { id: target.id },
      data: { status: "SUGGESTED", decidedById: null, decidedAt: null },
    });
  });

  it("invalidates a SUGGESTED proposal once its driving need resolves, and never shows it in the active list", async () => {
    await regenerateBridgeProposals();
    const before = await listBridgeProposals();
    const target = before.find((p) => p.status === "suggested")!;
    assert.ok(target);

    const need = await prisma.communityNeed.findUniqueOrThrow({ where: { id: target.needId } });
    await prisma.communityNeed.update({ where: { id: need.id }, data: { status: "RESOLVED" } });

    await regenerateBridgeProposals();
    const after = await listBridgeProposals();
    assert.ok(!after.some((p) => p.id === target.id));

    const raw = await prisma.bridgeProposal.findUnique({ where: { id: target.id } });
    assert.equal(raw?.status, "INVALIDATED");

    // Restore for other tests.
    await prisma.communityNeed.update({ where: { id: need.id }, data: { status: need.status } });
    await regenerateBridgeProposals();
  });
});
