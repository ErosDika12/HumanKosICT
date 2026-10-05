import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeAchievements, computeQuest, computeScore, EMPTY_FACTS, MAX_SCORE, type ProgressFacts } from "@/lib/progress-rules";
import { prisma } from "@/lib/prisma";
import { createDemoVisitor } from "@/lib/data/demo-session";
import { createRsvp, cancelRsvp } from "@/lib/data/rsvp";
import { sendInvite } from "@/lib/data/invites";
import { joinCommunity } from "@/lib/data/communities";
import { getProgress } from "@/lib/data/progress";

const facts = (over: Partial<ProgressFacts>): ProgressFacts => ({ ...EMPTY_FACTS, ...over });
const earnedKeys = (f: ProgressFacts) => computeAchievements(f).filter((a) => a.earned).map((a) => a.key);

describe("progress rules (pure)", () => {
  it("a plan or RSVP is not attendance: only an organizer's confirmation earns attendance", () => {
    assert.deepEqual(earnedKeys(facts({ confirmedPlans: 3, everMadePlan: true })), ["first-plan"]);
    assert.ok(earnedKeys(facts({ confirmedAttendances: 1 })).includes("first-attendance"));
  });

  it("each achievement is a boolean over stored facts, so it can only ever be earned once", () => {
    const f = facts({ everMadePlan: true, communities: 5, bridgeProjects: 2 });
    const keys = earnedKeys(f);
    assert.equal(new Set(keys).size, keys.length);
    assert.deepEqual(keys.sort(), ["first-bridge", "first-community", "first-plan"]);
    assert.deepEqual(earnedKeys(f).sort(), keys.sort()); // recomputing never changes the answer
  });

  it("a canceled-then-remade plan still counts as one plan, never two", () => {
    assert.equal(computeScore(facts({ confirmedPlans: 1 })).total, 3);
    assert.equal(computeScore(facts({ confirmedPlans: 1, everMadePlan: true })).total, 3);
  });

  it("the score is capped per source and overall, and never negative", () => {
    assert.equal(computeScore(EMPTY_FACTS).total, 0);
    assert.equal(computeScore(facts({ confirmedPlans: 500 })).total, 9);
    assert.equal(computeScore(facts({ invitesSent: 999, supportedNeeds: 999 })).total, 4); // only the capped need-support counts; invitations never score
    const huge = facts({ confirmedAttendances: 99, confirmedVolunteerAttendances: 99, confirmedPlans: 99, communities: 99, projects: 99, bridgeProjects: 99, supportedNeeds: 99 });
    assert.ok(computeScore(huge).total <= MAX_SCORE);
  });

  it("messages, invitations, logins and clicks cannot raise the score (no such inputs exist)", () => {
    const base = computeScore(facts({ communities: 1 })).total;
    assert.equal(computeScore(facts({ communities: 1, invitesSent: 50 })).total, base);
  });

  it("the quest shows at most three steps, shows real completion, and only suggests inviting once there is a plan", () => {
    const fresh = computeQuest(EMPTY_FACTS);
    assert.deepEqual(fresh.next, ["plan", "community", "bridge"]);
    assert.equal(fresh.doneCount, 0);
    assert.equal(fresh.total, 4);
    const planned = computeQuest(facts({ confirmedPlans: 1 }));
    assert.deepEqual(planned.next, ["friend", "community", "bridge"]);
    assert.equal(planned.doneCount, 1);
    const all = computeQuest(facts({ confirmedPlans: 1, invitesSent: 1, communities: 1, bridgeProjects: 1 }));
    assert.deepEqual(all.next, []);
    assert.equal(all.doneCount, 4);
  });
});

describe("progress from stored data", () => {
  it("RSVP, cancel, RSVP again and a repeated request award nothing twice; each visitor has their own progress", async () => {
    const a = await createDemoVisitor();
    const b = await createDemoVisitor();
    const walk = await prisma.activity.findUniqueOrThrow({ where: { slug: "shetitje-fotografike-qender" } });

    assert.equal((await getProgress(a.id)).achievements.filter((x) => x.earned).length, 0);
    await createRsvp(a.id, walk.id);
    await createRsvp(a.id, walk.id).catch(() => undefined); // duplicate request
    const once = await getProgress(a.id);
    assert.deepEqual(once.achievements.filter((x) => x.earned).map((x) => x.key), ["first-plan"]);
    assert.equal(once.score.total, 3);

    await cancelRsvp(a.id, walk.id);
    const canceled = await getProgress(a.id);
    assert.equal(canceled.facts.confirmedPlans, 0);
    assert.equal(canceled.score.total, 0);
    assert.ok(canceled.achievements.find((x) => x.key === "first-plan")?.earned, "the plan was made once; canceling does not erase that");

    await createRsvp(a.id, walk.id);
    const again = await getProgress(a.id);
    assert.equal(again.score.total, 3);
    assert.deepEqual(again.achievements.filter((x) => x.earned).map((x) => x.key), ["first-plan"]);

    // Visitor B is untouched by A's actions.
    const other = await getProgress(b.id);
    assert.equal(other.score.total, 0);
    assert.equal(other.achievements.filter((x) => x.earned).length, 0);
  });

  it("joining a community and inviting a friend move the quest forward, but invitations never add score", async () => {
    const v = await createDemoVisitor();
    const walk = await prisma.activity.findUniqueOrThrow({ where: { slug: "shetitje-fotografike-qender" } });
    await createRsvp(v.id, walk.id);
    const friendship = await prisma.friendship.findFirstOrThrow({ where: { userId: v.id } });
    const before = await getProgress(v.id);
    await sendInvite(v.id, friendship.friendId, walk.id, "come along");
    const afterInvite = await getProgress(v.id);
    assert.equal(afterInvite.score.total, before.score.total);
    assert.ok(afterInvite.quest.steps.find((s) => s.key === "friend")?.done);

    const community = await prisma.community.findFirstOrThrow({ where: { status: "PUBLISHED", visibility: "PUBLIC" } });
    await joinCommunity(v.id, community.id);
    const joined = await getProgress(v.id);
    assert.ok(joined.achievements.find((x) => x.key === "first-community")?.earned);
    assert.equal(joined.score.total, before.score.total + 4);
  });
});
