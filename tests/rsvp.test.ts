import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import { createRsvp, cancelRsvp, RsvpError } from "@/lib/data/rsvp";
import { getActivityBySlug } from "@/lib/data/activities";

describe("RSVP capacity and uniqueness", () => {
  it("rejects an RSVP on an activity already at seeded capacity", async () => {
    // "basketboll-i-hapur-lakrishte" is seeded at 16/16 (see docs/DEMO_DATA.md
    // — a deliberate full-capacity fixture carried over from Phase 1).
    const activity = await prisma.activity.findUniqueOrThrow({
      where: { slug: "basketboll-i-hapur-lakrishte" },
    });
    await assert.rejects(() => createRsvp("user-blerta", activity.id), RsvpError);
  });

  it("rejects an RSVP on an activity already past on the simulated clock", async () => {
    // "punetori-ai-fillestare" is dated 2036-06-13, before SIMULATED_NOW_ISO
    // (2036-06-16, src/lib/simulated-clock.ts) — a real fixture for the
    // past-event rejection path, not just a defensive check with nothing to
    // click through (see docs/PHASE_STATUS.md Phase 3's noted limitation,
    // closed in Phase 4).
    const activity = await prisma.activity.findUniqueOrThrow({
      where: { slug: "punetori-ai-fillestare" },
    });
    await assert.rejects(() => createRsvp("user-blerta", activity.id), /already happened/);
  });

  it("is idempotent: RSVPing twice does not create a duplicate row", async () => {
    // Dated 2036-06-20 — still upcoming on the simulated clock.
    const activity = await prisma.activity.findUniqueOrThrow({
      where: { slug: "mbremje-kulturore-sunny-hill" },
    });

    await createRsvp("user-blerta", activity.id);
    await createRsvp("user-blerta", activity.id);

    const rows = await prisma.rsvp.findMany({
      where: { userId: "user-blerta", activityId: activity.id },
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].status, "CONFIRMED");

    await cancelRsvp("user-blerta", activity.id);
    const cancelled = await prisma.rsvp.findUniqueOrThrow({
      where: { userId_activityId: { userId: "user-blerta", activityId: activity.id } },
    });
    assert.equal(cancelled.status, "CANCELED");
  });

  it("enforces capacity for the last spot", async () => {
    const community = await prisma.community.findUniqueOrThrow({
      where: { slug: "prishtina-ai-klub" },
    });
    const activity = await prisma.activity.create({
      data: {
        slug: "test-last-spot-activity",
        title: "Test capacity race",
        titleSq: "Test capacity race",
        summary: "Test fixture",
        summarySq: "Test fixture",
        category: "TECHNOLOGY",
        areaSq: "Test",
        areaEn: "Test",
        venueName: "Test venue",
        lat: 0,
        lng: 0,
        date: "2036-06-21", // upcoming on the simulated clock
        startTime: "10:00",
        capacity: 1,
        simulatedRsvpBaseline: 0,
        cost: "FREE",
        indoor: true,
        accessibility: "",
        ageEligibility: "ALL_AGES",
        difficulty: "ALL_LEVELS",
        description: "Test fixture",
        descriptionSq: "Test fixture",
        organizerId: community.organizerId,
        communityId: community.id,
      },
    });

    try {
      const results = await Promise.allSettled([
        createRsvp("user-arta", activity.id),
        createRsvp("user-fatlume", activity.id),
      ]);

      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");
      assert.equal(fulfilled.length, 1);
      assert.equal(rejected.length, 1);

      const confirmedCount = await prisma.rsvp.count({
        where: { activityId: activity.id, status: "CONFIRMED" },
      });
      assert.equal(confirmedCount, 1);
    } finally {
      // Always clean up, even on assertion failure, so this fixture never
      // pollutes tests/seed-consistency.test.ts's row counts.
      await prisma.activity.delete({ where: { id: activity.id } });
    }
  });

  it("getActivityBySlug reflects real confirmed RSVPs on top of the simulated baseline", async () => {
    const activity = await getActivityBySlug("punetori-ai-fillestare");
    assert.ok(activity);
    // Seeded baseline 12 + user-arta's seeded RSVP = 13.
    assert.equal(activity.rsvpCount, 13);
  });
});
