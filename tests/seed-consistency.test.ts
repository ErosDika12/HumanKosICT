import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";

// Slugs and shape frozen in docs/DEMO_DATA.md "What Phase 2 must preserve" —
// Phase 1's /discover/[slug] URLs must keep resolving after migration.
const EXPECTED_ACTIVITY_SLUGS = [
  "punetori-ai-fillestare",
  "pastrim-parku-gjelber",
  "basketboll-i-hapur-lakrishte",
  "mbremje-kulturore-sunny-hill",
  "kodim-per-adoleshente",
  "shetitje-fotografike-qender",
].sort();

const EXPECTED_COMMUNITY_SLUGS = [
  "prishtina-ai-klub",
  "gjelber-per-prishtinen",
  "rinia-basketboll-lakrishte",
  "kolektivi-kulturor-prizreni-i-vjeter",
].sort();

// Phase 9 expanded the demo to 18 activities and 7 communities; the Phase 1
// slugs above must keep resolving.
const TOTAL_ACTIVITIES = 18;
const TOTAL_COMMUNITIES = 7;

describe("seed consistency", () => {
  it("still seeds every Phase 1 activity and community by slug, plus the Phase 9 additions", async () => {
    const activities = (await prisma.activity.findMany({ select: { slug: true } })).map((a) => a.slug);
    const communities = (await prisma.community.findMany({ select: { slug: true } })).map((c) => c.slug);

    for (const slug of EXPECTED_ACTIVITY_SLUGS) assert.ok(activities.includes(slug), `missing activity ${slug}`);
    for (const slug of EXPECTED_COMMUNITY_SLUGS) assert.ok(communities.includes(slug), `missing community ${slug}`);
    assert.equal(activities.length, TOTAL_ACTIVITIES);
    assert.equal(communities.length, TOTAL_COMMUNITIES);
  });

  it("seeds all 15 fixed-catalog interests", async () => {
    const interests = await prisma.interest.findMany();
    assert.equal(interests.length, 15);
  });

  it("preserves one full-capacity and one minor-eligible activity", async () => {
    const full = await prisma.activity.findUniqueOrThrow({
      where: { slug: "basketboll-i-hapur-lakrishte" },
    });
    assert.equal(full.simulatedRsvpBaseline, full.capacity);

    const supervised = await prisma.activity.findUniqueOrThrow({
      where: { slug: "kodim-per-adoleshente" },
    });
    assert.equal(supervised.ageEligibility, "SUPERVISED_MINORS");
  });

  it("re-running the seed is idempotent (upserts, no duplicates)", async () => {
    const { seedDatabase } = await import("../prisma/seed-lib");
    await seedDatabase(prisma);

    const activities = await prisma.activity.findMany();
    const communities = await prisma.community.findMany();
    assert.equal(activities.length, TOTAL_ACTIVITIES);
    assert.equal(communities.length, TOTAL_COMMUNITIES);
  });
});
