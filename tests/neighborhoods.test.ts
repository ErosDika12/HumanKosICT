import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NEIGHBORHOODS, neighborhoodByArea, neighborhoodBySlug } from "@/lib/neighborhoods";
import { listNeighborhoodOverviews, getNeighborhoodOverview } from "@/lib/data/neighborhoods";
import { listActivities } from "@/lib/data/activities";
import { isSimulatedPast } from "@/lib/simulated-clock";

describe("neighborhoods", () => {
  it("has unique, URL-safe slugs and resolves both stored area forms", () => {
    const slugs = NEIGHBORHOODS.map((n) => n.slug);
    assert.equal(new Set(slugs).size, slugs.length);
    for (const n of NEIGHBORHOODS) {
      assert.match(n.slug, /^[a-z0-9-]+$/);
      assert.equal(neighborhoodByArea(n.areaEn)?.slug, n.slug);
      assert.equal(neighborhoodByArea(n.areaSq)?.slug, n.slug);
      assert.equal(neighborhoodBySlug(n.slug)?.areaEn, n.areaEn);
    }
  });

  it("returns null for unknown slugs and areas instead of guessing", () => {
    assert.equal(neighborhoodBySlug("atlantis"), null);
    assert.equal(neighborhoodByArea("Prishtina — Atlantis"), null);
    assert.equal(neighborhoodByArea(null), null);
    assert.equal(neighborhoodByArea(""), null);
  });

  it("groups every upcoming published activity under exactly one neighborhood", async () => {
    const overviews = await listNeighborhoodOverviews();
    assert.equal(overviews.length, NEIGHBORHOODS.length);
    const upcoming = (await listActivities()).filter((a) => !isSimulatedPast(a.date) && neighborhoodByArea(a.areaEn));
    const grouped = overviews.flatMap((o) => o.activities.map((a) => a.slug));
    assert.equal(grouped.length, new Set(grouped).size, "an activity appeared under two neighborhoods");
    assert.equal(grouped.length, upcoming.length);
    for (const o of overviews) {
      for (const a of o.activities) assert.equal(neighborhoodByArea(a.areaEn)?.slug, o.neighborhood.slug);
      for (const n of o.needs) assert.notEqual(n.status, "resolved");
    }
  });

  it("looks a single neighborhood up by slug and returns null for an unknown one", async () => {
    assert.equal((await getNeighborhoodOverview("qender"))?.neighborhood.slug, "qender");
    assert.equal(await getNeighborhoodOverview("atlantis"), null);
  });
});
