import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { listActivities, listDiscoveryFacets } from "@/lib/data/activities";

describe("Discover filter combinations against seeded fixtures", () => {
  it("filters by accessibility tag (hard constraint, AND semantics)", async () => {
    const captioned = await listActivities({ accessibility: ["captioned"] });
    assert.ok(captioned.map((a) => a.slug).includes("mbremje-kulturore-sunny-hill"));
    assert.ok(captioned.every((a) => a.accessibility.includes("captioned")));

    const wheelchairAndQuiet = await listActivities({
      accessibility: ["wheelchair-accessible", "quiet-space-available"],
    });
    assert.ok(wheelchairAndQuiet.map((a) => a.slug).includes("punetori-ai-fillestare"));
    assert.ok(
      wheelchairAndQuiet.every(
        (a) => a.accessibility.includes("wheelchair-accessible") && a.accessibility.includes("quiet-space-available")
      )
    );
    // The Germia walk and the bike ride are deliberately NOT accessible.
    assert.ok(!wheelchairAndQuiet.map((a) => a.slug).includes("shetitje-natyrore-germia"));
  });

  it("'weekend' means THIS weekend on the simulated clock (Mon 16 June 2036), not every weekend in the data", async () => {
    const weekend = (await listActivities({ when: "weekend" })).map((a) => a.slug);
    assert.ok(weekend.includes("shetitje-fotografike-qender")); // Sat 21 June
    assert.ok(weekend.includes("mbjellja-e-pemeve-dardania")); // Sun 22 June
    assert.ok(!weekend.includes("pastrim-parku-gjelber")); // 14 June — already happened
    assert.ok(!weekend.includes("turne-basketbolli-3x3")); // 28 June — next weekend
    assert.ok(!weekend.includes("kodim-per-adoleshente")); // a Tuesday

    const nextWeekend = (await listActivities({ when: "next-weekend" })).map((a) => a.slug);
    assert.ok(nextWeekend.includes("turne-basketbolli-3x3"));
    assert.ok(!nextWeekend.includes("shetitje-fotografike-qender"));

    const week = (await listActivities({ when: "week" })).map((a) => a.slug);
    assert.ok(week.includes("kodim-per-adoleshente")); // Tue 17 June
    assert.ok(week.includes("shetitje-fotografike-qender")); // Sat 21 June
    assert.ok(!week.includes("turne-basketbolli-3x3"));

    const weekday = await listActivities({ when: "weekday" });
    assert.ok(weekday.length > 0);
    assert.ok(weekday.every((a) => ![0, 6].includes(new Date(`${a.date}T00:00:00Z`).getUTCDay())));
  });

  it("filters by cost and by indoor/outdoor", async () => {
    const paid = await listActivities({ cost: "paid" });
    assert.ok(paid.map((a) => a.slug).includes("mbremje-kulturore-sunny-hill"));
    assert.ok(paid.every((a) => a.cost === "paid"));
    assert.ok(paid.length >= 3);

    const outdoor = await listActivities({ indoor: false });
    const outdoorSlugs = outdoor.map((a) => a.slug);
    for (const slug of ["pastrim-parku-gjelber", "basketboll-i-hapur-lakrishte", "shetitje-fotografike-qender"]) {
      assert.ok(outdoorSlugs.includes(slug));
    }
    assert.ok(outdoor.every((a) => !a.indoor));
  });

  it("filters by exact age eligibility", async () => {
    const supervised = await listActivities({ ageEligibility: "supervised-minors" });
    assert.deepEqual(supervised.map((a) => a.slug), ["kodim-per-adoleshente"]);
  });

  it("combines multiple filters with AND semantics", async () => {
    const result = await listActivities({ category: "culture", cost: "paid" });
    assert.ok(result.map((a) => a.slug).includes("mbremje-kulturore-sunny-hill"));
    assert.ok(result.every((a) => a.category === "culture" && a.cost === "paid"));

    const empty = await listActivities({ category: "sports", cost: "paid" });
    assert.deepEqual(empty, []);
  });

  it("never offers a facet value the seeded data doesn't actually have", async () => {
    const facets = await listDiscoveryFacets();
    assert.ok(facets.areas.length > 0);
    assert.ok(facets.accessibilityTags.includes("captioned"));
    assert.ok(!facets.accessibilityTags.includes("sign-language-interpreter"));
  });
});
