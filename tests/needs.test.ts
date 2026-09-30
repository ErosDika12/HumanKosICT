import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import { listNeeds, createNeed, findSimilarOpenNeed, toggleNeedSupport } from "@/lib/data/needs";

describe("Community needs — privacy and duplicate prevention", () => {
  it("never exposes who submitted a need in the public list", async () => {
    const needs = await listNeeds();
    for (const need of needs) {
      assert.ok(!("submittedById" in need));
      assert.ok(!("submittedBy" in need));
    }
    assert.ok(needs.length > 0);
  });

  it("finds a similar OPEN need by category+area instead of allowing a silent duplicate", async () => {
    const similar = await findSimilarOpenNeed("environment", "Prishtinë — Dardania");
    assert.ok(similar);
    assert.ok(similar.supportCount >= 1); // seeded with user-arta's support
  });

  it("toggling support is idempotent either direction, never a duplicate row", async () => {
    const needId = await createNeed("user-elmedina", {
      category: "sports",
      areaSq: "Prishtinë — Test",
      description: "Test need for support toggling",
    });

    const first = await toggleNeedSupport("user-blerta", needId);
    assert.equal(first, true);
    const second = await toggleNeedSupport("user-blerta", needId);
    assert.equal(second, false);

    const rows = await prisma.needSupport.findMany({ where: { userId: "user-blerta", needId } });
    assert.equal(rows.length, 0);

    await prisma.communityNeed.delete({ where: { id: needId } });
  });

  it("shows the viewer's own support state without exposing anyone else's", async () => {
    const needId = await createNeed("user-elmedina", {
      category: "sports",
      areaSq: "Prishtinë — Test 2",
      description: "Another test need",
    });
    await toggleNeedSupport("user-arta", needId);

    const asArta = await listNeeds("user-arta");
    const asBlerta = await listNeeds("user-blerta");
    const artaView = asArta.find((n) => n.id === needId);
    const blertaView = asBlerta.find((n) => n.id === needId);
    assert.equal(artaView?.isSupportedByViewer, true);
    assert.equal(blertaView?.isSupportedByViewer, false);
    assert.equal(artaView?.supportCount, 1);
    assert.equal(blertaView?.supportCount, 1);

    await prisma.communityNeed.delete({ where: { id: needId } });
  });
});
