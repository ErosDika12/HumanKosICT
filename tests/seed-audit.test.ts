import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import { ACTIVITIES } from "@/lib/demo-data";
import { SIMULATED_NOW_ISO } from "@/lib/simulated-clock";
import { listCommunities, getCommunityBySlug } from "@/lib/data/communities";
import { listActivities } from "@/lib/data/activities";

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

describe("seeded data does not contradict itself", () => {
  it("no activity text names a different weekday than its date, and no activity is over capacity", () => {
    for (const a of ACTIVITIES) {
      const dow = WEEKDAYS[new Date(`${a.date}T00:00:00Z`).getUTCDay()];
      const text = `${a.title} ${a.summary}`.toLowerCase();
      for (const day of WEEKDAYS) {
        if (day !== dow && new RegExp(`\b${day}\b`).test(text)) {
          assert.fail(`${a.slug} is on a ${dow} but its title/summary says "${day}"`);
        }
      }
      assert.ok(a.rsvpCount <= a.capacity, `${a.slug} has more RSVPs than capacity`);
    }
  });

  it("a community need never claims an activity is full while that activity has open places", async () => {
    const needs = await prisma.communityNeed.findMany({ include: { community: { include: { activities: true } } } });
    for (const need of needs) {
      if (!need.community) continue;
      if (!/\b(full|at capacity|fills up)\b/i.test(need.description)) continue;
      const open = need.community.activities.filter((a) => a.date >= SIMULATED_NOW_ISO && a.simulatedRsvpBaseline < a.capacity);
      assert.equal(open.length, 0, `need "${need.description}" claims full, but ${open.map((a) => a.slug).join(", ")} still has places`);
    }
  });

  it("the Dardania coding need and the clean-up need no longer carry the contradicting claims", async () => {
    const all = (await prisma.communityNeed.findMany()).map((n) => n.description).join("\n");
    assert.doesNotMatch(all, /already full/);
    assert.doesNotMatch(all, /fills up within a day/);
  });

  it("the featured BRIDGE project explains how it answers the second clean-up request and names the kickoff date", async () => {
    const project = await prisma.project.findUniqueOrThrow({ where: { slug: "collaboration-prishtina-ai-klub-gjelber-per-prishtinen" } });
    assert.match(project.description, /second monthly clean-up/);
    assert.match(project.description, /sign-up/);
    const lab = await prisma.activity.findUniqueOrThrow({ where: { slug: "laborator-ideshe-eko-teknologji" } });
    assert.equal(lab.date, "2036-06-25");
    assert.match(project.description, /25 June/);
    const proposal = await prisma.bridgeProposal.findFirstOrThrow({ where: { kickoffActivityId: lab.id } });
    assert.match(proposal.mutualBenefit, /second monthly clean-up/);
  });

  it("community pages and cards only call activities on/after the simulated today 'upcoming'", async () => {
    const detail = await getCommunityBySlug("gjelber-per-prishtinen");
    assert.ok(detail);
    assert.ok(detail.upcomingActivities.length > 0);
    for (const a of detail.upcomingActivities) assert.ok(a.date >= SIMULATED_NOW_ISO, `${a.slug} (${a.date}) is not upcoming`);
    assert.ok(detail.pastActivities.some((a) => a.slug === "pastrim-parku-gjelber"));
    assert.ok(!detail.upcomingActivities.some((a) => a.slug === "pastrim-parku-gjelber"), "14 June clean-up already happened");

    for (const c of await listCommunities()) {
      if (c.nextActivity) assert.ok(c.nextActivity.date >= SIMULATED_NOW_ISO, `${c.slug} next activity is in the past`);
    }
  });

  it("the unfiltered Discover list, once past activities are removed, starts with the earliest upcoming date", async () => {
    const upcoming = (await listActivities()).filter((a) => a.date >= SIMULATED_NOW_ISO);
    const dates = upcoming.map((a) => a.date);
    assert.deepEqual(dates, [...dates].sort());
  });
});
