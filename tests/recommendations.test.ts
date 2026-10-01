import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { dayBucketOf, haversineKm, scoreActivities } from "@/lib/data/recommendations";
import type { DemoActivity } from "@/lib/types";

function fixtureActivity(overrides: Partial<DemoActivity>): DemoActivity {
  return {
    id: "a1",
    slug: "a1",
    title: "A1",
    titleSq: "A1",
    summary: "",
    summarySq: "",
    category: "technology",
    interestTags: [],
    areaSq: "",
    areaEn: "",
    venueName: "",
    lat: 42.66,
    lng: 21.16,
    date: "2036-06-13",
    startTime: "10:00",
    timezone: "Europe/Prishtina",
    capacity: 10,
    rsvpCount: 0,
    cost: "free",
    indoor: true,
    accessibility: [],
    ageEligibility: "all-ages",
    difficulty: "all-levels",
    organizer: { id: "o1", name: "Org", verified: true },
    communitySlug: "c1",
    description: "",
    descriptionSq: "",
    ...overrides,
  };
}

describe("dayBucketOf", () => {
  it("matches real Gregorian weekday/weekend for known seeded dates", () => {
    // Ground truth computed independently — see docs/PHASE_STATUS.md.
    assert.equal(dayBucketOf("2036-06-13"), "weekday"); // Friday
    assert.equal(dayBucketOf("2036-06-14"), "weekend"); // Saturday
    assert.equal(dayBucketOf("2036-06-17"), "weekday"); // Tuesday
    assert.equal(dayBucketOf("2036-06-21"), "weekend"); // Saturday
  });
});

describe("haversineKm", () => {
  it("returns ~0 for the same point and a plausible distance for two Prishtina-area points", () => {
    const a = { lat: 42.6653, lng: 21.1622 };
    assert.ok(haversineKm(a, a) < 0.001);

    const b = { lat: 42.6535, lng: 21.1553 };
    const distance = haversineKm(a, b);
    assert.ok(distance > 0.5 && distance < 5, `expected a few km, got ${distance}`);
  });
});

describe("scoreActivities", () => {
  it("falls back to soonest-first when there are no preferences at all (deterministic tie-break, not input order)", () => {
    const activities = [
      fixtureActivity({ id: "later", date: "2036-06-20" }),
      fixtureActivity({ id: "sooner", date: "2036-06-13" }),
    ];
    const scored = scoreActivities(activities, {});
    assert.deepEqual(scored.map((s) => s.id), ["sooner", "later"]);
    assert.deepEqual(scored.every((s) => s.score === 0), true);
    assert.deepEqual(scored.every((s) => (s.matchReasons ?? []).length === 0), true);
  });

  it("ranks matched interests above unmatched ones and explains why", () => {
    const activities = [
      fixtureActivity({ id: "no-match", interestTags: ["music"] }),
      fixtureActivity({ id: "match", interestTags: ["technology", "education"] }),
    ];
    const scored = scoreActivities(activities, { interestIds: ["technology"] });
    assert.equal(scored[0].id, "match");
    assert.ok(scored[0].matchReasons?.[0].includes("Technology"));
    assert.equal(scored[1].id, "no-match");
    assert.equal(scored[1].score, 0);
  });

  it("gives a weekend bonus and reason only to weekend-dated activities when requested", () => {
    const activities = [
      fixtureActivity({ id: "weekday", date: "2036-06-17" }), // Tuesday
      fixtureActivity({ id: "weekend", date: "2036-06-21" }), // Saturday of THIS weekend (today = Mon 16 June)
    ];
    const scored = scoreActivities(activities, { when: "weekend" });
    assert.equal(scored[0].id, "weekend");
    assert.ok(scored[0].matchReasons?.some((r) => /weekend/i.test(r)));
    assert.equal(scored[1].score, 0);
  });

  it("scores closer activities higher when an origin is given, without fabricating a reason string for it", () => {
    const origin = { lat: 42.6653, lng: 21.1622 };
    const activities = [
      fixtureActivity({ id: "far", lat: 42.9, lng: 21.5 }),
      fixtureActivity({ id: "near", lat: 42.6654, lng: 21.1623 }),
    ];
    const scored = scoreActivities(activities, { origin });
    assert.equal(scored[0].id, "near");
    assert.ok(scored[0].distanceKm !== undefined && scored[0].distanceKm < 1);
    assert.ok(scored[1].distanceKm !== undefined && scored[1].distanceKm > 10);
  });

  it("breaks ties deterministically by date then title", () => {
    const activities = [
      fixtureActivity({ id: "z", title: "Zebra event", date: "2036-06-13" }),
      fixtureActivity({ id: "a", title: "Apple event", date: "2036-06-13" }),
    ];
    const scored = scoreActivities(activities, {});
    assert.deepEqual(scored.map((s) => s.id), ["a", "z"]);
  });
});
