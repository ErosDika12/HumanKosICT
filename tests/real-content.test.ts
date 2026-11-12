import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { prisma, unfilteredPrisma } from "@/lib/prisma";
import { withRealContentFilter, addRealContentFilter } from "@/lib/real-content-filter";
import { currentDateIso, isFixtureMode, isoDateInTirane } from "@/lib/simulated-clock";

// The test database holds the 2036 development fixtures. The production boundary must hide all of them
// while leaving a real organizer's own content visible.
const real = withRealContentFilter(unfilteredPrisma);
const tag = `rc${Date.now().toString(36)}`;
const cleanup: (() => Promise<unknown>)[] = [];

after(async () => {
  for (const fn of cleanup.reverse()) await fn().catch(() => undefined);
});

describe("production content boundary", () => {
  it("fixtures exist in the unfiltered database (so the assertions below are meaningful)", async () => {
    assert.ok((await unfilteredPrisma.activity.count()) > 0);
    assert.ok((await unfilteredPrisma.community.count()) > 0);
    assert.ok((await unfilteredPrisma.communityNeed.count()) > 0);
    assert.ok((await unfilteredPrisma.user.count({ where: { isDemoFriend: true } })) > 0);
  });

  it("hides every fictional activity, community, need, project, bridge proposal and synthetic demand", async () => {
    assert.equal(await real.activity.count(), 0);
    assert.equal(await real.community.count(), 0);
    assert.equal(await real.communityNeed.count(), 0);
    assert.equal(await real.project.count(), 0);
    assert.equal(await real.bridgeProposal.count(), 0);
    assert.equal(await real.municipalityScenarioDemand.count(), 0);
  });

  it("hides fictional friends from every lookup, including by id", async () => {
    const friend = await unfilteredPrisma.user.findFirstOrThrow({ where: { isDemoFriend: true } });
    assert.equal(await real.user.count({ where: { isDemoFriend: true } }), 0);
    assert.equal(await real.user.findUnique({ where: { id: friend.id } }), null);
    assert.equal(await real.user.findFirst({ where: { id: friend.id } }), null);
  });

  it("still finds staff by email so sign-in keeps working", async () => {
    const staff = await real.user.findUnique({ where: { email: "elmedina.tahiri@demo.humannetwork.example" } });
    assert.equal(staff?.role, "MODERATOR");
  });

  it("keeps a real organizer's own content visible, including unique lookups", async () => {
    const organizer = await unfilteredPrisma.user.create({
      data: { email: `${tag}@example.com`, passwordHash: "x", name: "Real Organizer", role: "ORGANIZER" },
    });
    cleanup.push(() => unfilteredPrisma.user.delete({ where: { id: organizer.id } }));
    const community = await unfilteredPrisma.community.create({
      data: { slug: `${tag}-c`, name: "Real", category: "TECHNOLOGY", description: "d", descriptionSq: "d", areaSq: "Qendër", status: "PUBLISHED", organizerId: organizer.id },
    });
    cleanup.push(() => unfilteredPrisma.community.delete({ where: { id: community.id } }));
    const activity = await unfilteredPrisma.activity.create({
      data: {
        slug: `${tag}-a`, title: "Real", titleSq: "Real", summary: "s", summarySq: "s", category: "TECHNOLOGY", areaSq: "Qendër", areaEn: "Center",
        venueName: "Venue", lat: 42.66, lng: 21.16, date: "2099-01-01", startTime: "18:00", capacity: 10, cost: "FREE", indoor: true,
        accessibility: "", ageEligibility: "ALL_AGES", difficulty: "ALL_LEVELS", description: "d", descriptionSq: "d",
        organizerId: organizer.id, communityId: community.id,
      },
    });
    cleanup.push(() => unfilteredPrisma.activity.delete({ where: { id: activity.id } }));

    assert.equal(await real.activity.count(), 1);
    assert.equal((await real.activity.findUnique({ where: { slug: `${tag}-a` } }))?.id, activity.id);
    assert.equal((await real.community.findMany()).length, 1);
    // a fixture activity is invisible even when asked for by its unique slug
    assert.equal(await real.activity.findUnique({ where: { slug: "test-does-not-matter" } }), null);
    const fixtureSlug = (await unfilteredPrisma.activity.findFirstOrThrow({ where: { organizer: { isDemoPersona: true } } })).slug;
    assert.equal(await real.activity.findUnique({ where: { slug: fixtureSlug } }), null);
  });

  it("merges the filter without discarding an existing unique key or AND clause", () => {
    const out = addRealContentFilter("findUnique", { where: { id: "x", AND: [{ a: 1 }] } }, { b: 2 }) as { where: { id: string; AND: unknown[] } };
    assert.equal(out.where.id, "x");
    assert.deepEqual(out.where.AND, [{ a: 1 }, { b: 2 }]);
    const many = addRealContentFilter("findMany", { where: { a: 1 } }, { b: 2 }) as { where: { AND: unknown[] } };
    assert.deepEqual(many.where.AND, [{ a: 1 }, { b: 2 }]);
    const create = { data: { x: 1 } };
    assert.equal(addRealContentFilter("create", create, { b: 2 }), create);
  });
});

describe("real clock", () => {
  it("fixture mode is on in tests and never on in production", () => {
    assert.equal(isFixtureMode(), true);
    assert.equal(isFixtureMode({ NODE_ENV: "production" }), false);
    assert.equal(isFixtureMode({ NODE_ENV: "development", HN_REAL_CLOCK: "1" }), false);
  });

  it("uses Europe/Tirane for the calendar date, including across the midnight boundary", () => {
    // 23:30 UTC on 30 Oct is already 31 Oct in Tirane (CET, UTC+1); in summer (CEST, UTC+2) 22:30 UTC is already the next day.
    assert.equal(isoDateInTirane(new Date("2026-11-11T23:30:00Z")), "2026-11-12");
    assert.equal(isoDateInTirane(new Date("2026-07-01T21:59:00Z")), "2026-07-01");
    assert.equal(isoDateInTirane(new Date("2026-07-01T22:01:00Z")), "2026-07-02");
    // daylight-saving change: the clocks go back on 25 Oct 2026
    assert.equal(isoDateInTirane(new Date("2026-10-24T22:30:00Z")), "2026-10-25");
    assert.equal(isoDateInTirane(new Date("2026-10-25T22:30:00Z")), "2026-10-25");
    assert.equal(isoDateInTirane(new Date("2026-10-25T23:30:00Z")), "2026-10-26");
  });

  it("returns the fixed fixture date only in fixture mode", () => {
    assert.equal(currentDateIso(), "2036-06-16");
  });
});

// keep the shared client referenced so a misconfigured import fails loudly
void prisma;
