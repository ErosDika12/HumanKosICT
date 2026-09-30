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

  it("filters by weekend vs weekday using the activities' real calendar dates", async () => {
    const weekend = await listActivities({ when: "weekend" });
    const weekendSlugs = weekend.map((a) => a.slug);
    assert.ok(weekendSlugs.includes("pastrim-parku-gjelber"));
    assert.ok(weekendSlugs.includes("shetitje-fotografike-qender"));
    assert.ok(!weekendSlugs.includes("kodim-per-adoleshente")); // a Wednesday

    const weekday = await listActivities({ when: "weekday" });
    assert.ok(weekday.every((a) => !weekend.map((w) => w.slug).includes(a.slug)));
    assert.ok(weekday.length > 0);
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
