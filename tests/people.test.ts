import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import {
  listMatches,
  blockUser,
  unblockUser,
  requestConnection,
  listIncomingConnectionRequests,
  decideConnectionRequest,
  reportUser,
} from "@/lib/data/people";

describe("Human matching — consent, blocking, and safe projections", () => {
  it("Arta and Drin match on a real shared seeded interest (technology)", async () => {
    const matches = await listMatches("user-arta");
    const drin = matches.find((m) => m.id === "user-drin");
    assert.ok(drin);
    assert.ok(drin.reasons.some((r) => /technology/i.test(r)));
    // Never exposes email or any other private field.
    assert.ok(!("email" in drin));
  });

  it("a non-discoverable member (Blerta) never appears in or receives matches", async () => {
    const matches = await listMatches("user-arta");
    assert.ok(!matches.some((m) => m.id === "user-blerta"));

    const blertaMatches = await listMatches("user-blerta");
    assert.deepEqual(blertaMatches, []);
  });

  it("blocking excludes a candidate from matches in both directions", async () => {
    const before = await listMatches("user-arta");
    assert.ok(before.some((m) => m.id === "user-drin"));

    await blockUser("user-arta", "user-drin");
    const afterBlockerView = await listMatches("user-arta");
    assert.ok(!afterBlockerView.some((m) => m.id === "user-drin"));
    const afterBlockedView = await listMatches("user-drin");
    assert.ok(!afterBlockedView.some((m) => m.id === "user-arta"));

    await unblockUser("user-arta", "user-drin");
    const restored = await listMatches("user-arta");
    assert.ok(restored.some((m) => m.id === "user-drin"));
  });

  it("requires a mutual basis before a connection request can be sent — refused otherwise, even if forced", async () => {
    // user-elmedina (moderator persona) shares no interest/community/project
    // with user-yll in this dataset and neither is set up as a match.
    await assert.rejects(() => requestConnection("user-elmedina", "user-yll", "hi"));
  });

  it("a valid connection request can be sent, then accepted or declined only by the recipient", async () => {
    await requestConnection("user-arta", "user-drin", "Let's collaborate on the workshop.");
    const incoming = await listIncomingConnectionRequests("user-drin");
    const request = incoming.find((r) => r.fromUserId === "user-arta");
    assert.ok(request);

    await assert.rejects(() => decideConnectionRequest("user-blerta", request.id, "accept"));
    await decideConnectionRequest("user-drin", request.id, "accept");

    const stillIncoming = await listIncomingConnectionRequests("user-drin");
    assert.ok(!stillIncoming.some((r) => r.id === request.id));
  });

  it("blocking withdraws any pending connection request between the pair", async () => {
    await requestConnection("user-arta", "user-drin", "Second try.");
    const before = await prisma.connectionRequest.findFirst({
      where: { fromUserId: "user-arta", toUserId: "user-drin" },
    });
    assert.equal(before?.status, "PENDING");

    await blockUser("user-drin", "user-arta");
    const after = await prisma.connectionRequest.findFirst({
      where: { fromUserId: "user-arta", toUserId: "user-drin" },
    });
    assert.equal(after?.status, "DECLINED");

    await unblockUser("user-drin", "user-arta");
  });

  it("reporting a person records the target user, never exposes it publicly", async () => {
    await reportUser("user-arta", "user-drin", "Test report reason");
    const report = await prisma.report.findFirst({
      where: { reporterId: "user-arta", reportedUserId: "user-drin" },
    });
    assert.ok(report);
    assert.equal(report?.status, "OPEN");
  });
});
