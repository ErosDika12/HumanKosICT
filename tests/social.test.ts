import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import { createDemoVisitor, getJourneyProgress } from "@/lib/data/demo-session";
import {
  addDemoFriend,
  listFriends,
  listFriendSuggestions,
  removeFriend,
  SocialError,
  suitableActivities,
} from "@/lib/data/friends";
import { listPlans, respondToInvite, sendInvite } from "@/lib/data/invites";
import { getThread, listThreads, sendMessage, unreadMessageCount } from "@/lib/data/messages";
import { getActivityBySlug } from "@/lib/data/activities";
import { createRsvp } from "@/lib/data/rsvp";
import { listMatches } from "@/lib/data/people";
import { createNeed, listNeeds } from "@/lib/data/needs";
import { consumeAssistantQuota } from "@/lib/assistant/usage";
import { ValidationError } from "@/lib/validation";

async function activityId(slug: string): Promise<string> {
  return (await prisma.activity.findUniqueOrThrow({ where: { slug } })).id;
}

describe("One-click demo visitor — isolated, ordinary member", () => {
  it("creates a MEMBER (never privileged) with starter friends, a labeled example conversation and an invitation", async () => {
    const v = await createDemoVisitor();
    const user = await prisma.user.findUniqueOrThrow({ where: { id: v.id } });
    assert.equal(user.role, "MEMBER");
    assert.equal(user.isDemoVisitor, true);
    assert.equal(user.isDemoPersona, false);
    assert.equal(user.isDemoFriend, false);

    const friends = await listFriends(v.id);
    assert.deepEqual(friends.map((f) => f.id).sort(), ["friend-era", "user-arta"]);
    assert.ok(friends.every((f) => f.isSeededExample));

    const thread = await getThread(v.id, "user-arta");
    assert.ok(thread.length >= 3);
    assert.ok(thread.every((m) => m.isSeededExample), "starter lines are labeled demo examples");

    const plans = await listPlans(v.id);
    const walk = plans.find((p) => p.activity.slug === "shetitje-fotografike-qender");
    assert.ok(walk);
    assert.equal(walk.invites[0].status, "pending");
    assert.equal(walk.invites[0].isSeededExample, true);
  });

  it("isolates visitors from each other and from shared public state", async () => {
    const a = await createDemoVisitor();
    const b = await createDemoVisitor();
    assert.notEqual(a.id, b.id);

    const slug = "kodim-per-adoleshente";
    const before = (await getActivityBySlug("mbjellja-e-pemeve-dardania"))!.rsvpCount;
    await createRsvp(a.id, await activityId("mbjellja-e-pemeve-dardania"));
    const after = (await getActivityBySlug("mbjellja-e-pemeve-dardania"))!.rsvpCount;
    assert.equal(after, before, "a visitor's RSVP never changes shared counts");
    void slug;

    await sendMessage(a.id, "user-arta", "private note from visitor A");
    const bThread = await getThread(b.id, "user-arta");
    assert.ok(!bThread.some((m) => m.body.includes("private note")), "visitor B cannot see visitor A's messages");
    assert.ok((await listThreads(a.id)).length >= 1);

    // Visitors are never suggested to anyone, and never appear in matches.
    const artaMatches = await listMatches("user-arta");
    assert.ok(!artaMatches.some((m) => m.id === a.id || m.id === b.id));

    // A visitor's own need is visible only to that visitor.
    await createNeed(a.id, { category: "technology", areaSq: "Prishtinë — Qendër", description: "Visitor-only need" });
    assert.ok((await listNeeds(a.id)).some((n) => n.description === "Visitor-only need"));
    assert.ok(!(await listNeeds(b.id)).some((n) => n.description === "Visitor-only need"));
    assert.ok(!(await listNeeds()).some((n) => n.description === "Visitor-only need"));
  });

  it("purges expired visitors (cascade) the next time a visitor is created", async () => {
    const old = await createDemoVisitor();
    await prisma.user.update({ where: { id: old.id }, data: { createdAt: new Date(Date.now() - 48 * 3600_000) } });
    await createDemoVisitor();
    assert.equal(await prisma.user.findUnique({ where: { id: old.id } }), null);
    assert.equal(await prisma.friendship.count({ where: { userId: old.id } }), 0);
    assert.equal(await prisma.message.count({ where: { senderId: old.id } }), 0);
  });
});

describe("Friends, invitations, plans and messages", () => {
  it("suggests a demo friend who shares a real interest, and friends can be added and removed", async () => {
    const v = await createDemoVisitor();
    const suggestions = await listFriendSuggestions(v.id);
    const lulzim = suggestions.find((s) => s.id === "friend-lulzim");
    assert.ok(lulzim, "Lulzim shares the visitor's technology interest");
    assert.ok(lulzim.reasons.some((r) => /technology/i.test(r)));

    await addDemoFriend(v.id, "friend-lulzim");
    assert.ok((await listFriends(v.id)).some((f) => f.id === "friend-lulzim"));
    await removeFriend(v.id, "friend-lulzim");
    assert.ok(!(await listFriends(v.id)).some((f) => f.id === "friend-lulzim"));
  });

  it("only fictional demo friends can be added this way — never staff accounts", async () => {
    const v = await createDemoVisitor();
    await assert.rejects(() => addDemoFriend(v.id, "user-elmedina"), SocialError);
    await assert.rejects(() => addDemoFriend(v.id, "user-agron"), SocialError);
    await assert.rejects(() => addDemoFriend(v.id, v.id), SocialError);
  });

  it("invitations need a friendship, an upcoming activity, and get a labeled simulated reply", async () => {
    const v = await createDemoVisitor();
    const dataNight = await activityId("nate-e-te-dhenave-qytetare"); // Tue 24 Jun, 18:00, technology/science
    await assert.rejects(() => sendInvite(v.id, "friend-lulzim", dataNight, ""), SocialError, "not friends yet");

    await addDemoFriend(v.id, "friend-lulzim");
    await sendInvite(v.id, "friend-lulzim", dataNight, "Come along?");
    let plan = (await listPlans(v.id)).find((p) => p.activity.id === dataNight)!;
    const invite = plan.invites.find((i) => i.otherId === "friend-lulzim")!;
    assert.equal(invite.status, "accepted");
    assert.equal(invite.isSimulatedReply, true);
    assert.match(invite.replyNote ?? "", /Simulated reply/);

    // Re-inviting updates the same invitation (never a duplicate).
    await sendInvite(v.id, "friend-lulzim", dataNight, "Still keen?");
    plan = (await listPlans(v.id)).find((p) => p.activity.id === dataNight)!;
    assert.equal(plan.invites.filter((i) => i.otherId === "friend-lulzim").length, 1);

    // A friend who needs a wheelchair-accessible venue declines a venue that is not.
    await addDemoFriend(v.id, "friend-ilir");
    const germia = await activityId("shetitje-natyrore-germia"); // Sun, not accessible
    await sendInvite(v.id, "friend-ilir", germia, "");
    const ilir = (await listPlans(v.id)).find((p) => p.activity.id === germia)!.invites.find((i) => i.otherId === "friend-ilir")!;
    assert.equal(ilir.status, "declined");
    assert.match(ilir.replyNote ?? "", /wheelchair/);

    // Past activities cannot be invited to (simulated clock).
    await assert.rejects(() => sendInvite(v.id, "friend-lulzim", null as unknown as string, ""), SocialError);
    const past = await activityId("punetori-ai-fillestare");
    await assert.rejects(() => sendInvite(v.id, "friend-lulzim", past, ""), SocialError);
  });

  it("suitable activities honor availability, accessibility needs and open capacity", async () => {
    const v = await createDemoVisitor();
    const forIlir = await suitableActivities(v.id, "friend-ilir", 8);
    assert.ok(forIlir.length > 0);
    assert.ok(forIlir.every((s) => s.activity.accessibility.includes("wheelchair-accessible")));
    assert.ok(forIlir.every((s) => s.slot === "weekends"));
    const forLulzim = await suitableActivities(v.id, "friend-lulzim", 8);
    assert.ok(forLulzim.every((s) => s.slot === "weekday-evenings"));
    assert.ok(forLulzim.every((s) => s.activity.capacity - s.activity.rsvpCount > 0));
  });

  it("the recipient can accept the seeded invitation (which RSVPs them) — nobody else can", async () => {
    const v = await createDemoVisitor();
    const other = await createDemoVisitor();
    const invite = await prisma.activityInvite.findFirstOrThrow({ where: { toUserId: v.id } });
    await assert.rejects(() => respondToInvite(other.id, invite.id, true), SocialError);

    await respondToInvite(v.id, invite.id, true);
    const rsvp = await prisma.rsvp.findFirst({ where: { userId: v.id, activityId: invite.activityId } });
    assert.equal(rsvp?.status, "CONFIRMED");
    assert.equal((await prisma.activityInvite.findUniqueOrThrow({ where: { id: invite.id } })).status, "ACCEPTED");

    const progress = await getJourneyProgress(v.id);
    assert.equal(progress.rsvped, true);
  });

  it("messages: friends only, non-empty, bounded, persisted, and unread counts work", async () => {
    const v = await createDemoVisitor();
    await assert.rejects(() => sendMessage(v.id, "friend-lulzim", "hi"), SocialError, "not friends");
    await assert.rejects(() => sendMessage(v.id, "user-arta", "   "), SocialError);
    await assert.rejects(() => sendMessage(v.id, "user-arta", "x".repeat(1001)), ValidationError);
    await sendMessage(v.id, "user-arta", "See you Saturday!");
    const thread = await getThread(v.id, "user-arta");
    assert.equal(thread[thread.length - 1].body, "See you Saturday!");
    assert.equal(thread[thread.length - 1].isSeededExample, false);
    assert.equal(await unreadMessageCount(v.id), 0, "seeded starter lines do not create a misleading unread badge");
    const progress = await getJourneyProgress(v.id);
    assert.equal(progress.messaged, true);
  });
});

describe("Assistant usage limits", () => {
  it("counts every message per account per day and reports when the AI budget and hard limit are exceeded", async () => {
    const v = await createDemoVisitor();
    process.env.ASSISTANT_DAILY_LIMIT = "3";
    process.env.ASSISTANT_AI_DAILY_LIMIT = "2";
    try {
      const r1 = await consumeAssistantQuota(v.id);
      const r2 = await consumeAssistantQuota(v.id);
      const r3 = await consumeAssistantQuota(v.id);
      const r4 = await consumeAssistantQuota(v.id);
      assert.deepEqual([r1.allowed, r1.aiAllowed], [true, true]);
      assert.deepEqual([r2.allowed, r2.aiAllowed], [true, true]);
      assert.deepEqual([r3.allowed, r3.aiAllowed], [true, false]);
      assert.deepEqual([r4.allowed, r4.aiAllowed], [false, false]);
    } finally {
      delete process.env.ASSISTANT_DAILY_LIMIT;
      delete process.env.ASSISTANT_AI_DAILY_LIMIT;
    }
  });
});
