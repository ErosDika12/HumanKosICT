import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generateBridgeCandidates,
  MIN_BRIDGE_SCORE,
  type BridgeCommunityInput,
  type BridgeNeedInput,
} from "@/lib/data/bridge-scoring";

function community(overrides: Partial<BridgeCommunityInput>): BridgeCommunityInput {
  return {
    id: "c1",
    name: "Community 1",
    category: "technology",
    areaSq: "Prishtinë — Qendër",
    status: "published",
    organizerName: "Organizer",
    activityInterestTags: [],
    hasUpcomingActivity: false,
    ...overrides,
  };
}

function need(overrides: Partial<BridgeNeedInput>): BridgeNeedInput {
  return {
    id: "n1",
    category: "environment",
    areaSq: "Prishtinë — Dardania",
    description: "A neighborhood need",
    status: "open",
    ...overrides,
  };
}

describe("generateBridgeCandidates", () => {
  it("good match: complementary categories, matching geography, relevant need, availability -> proposed", () => {
    const tech = community({ id: "tech", name: "AI Klub", category: "technology", hasUpcomingActivity: true });
    const env = community({ id: "env", name: "Green Group", category: "environment", areaSq: "Prishtinë — Dardania" });
    const n = need({ id: "n1", category: "environment", areaSq: "Prishtinë — Dardania" });

    const candidates = generateBridgeCandidates([tech, env], [n]);
    assert.equal(candidates.length, 1);
    assert.equal(candidates[0].score >= MIN_BRIDGE_SCORE, true);
    assert.ok(candidates[0].reasons.some((r) => /complementary/i.test(r)));
    assert.ok(candidates[0].reasons.some((r) => /dardania/i.test(r)));
  });

  it("bad match: same category, no geography or category relevance -> excluded", () => {
    const a = community({ id: "a", category: "sports", areaSq: "Prishtinë — Lakrishtë" });
    const b = community({ id: "b", category: "sports", areaSq: "Prishtinë — Sunny Hill" });
    const n = need({ category: "culture", areaSq: "Prishtinë — Qendër" });

    const candidates = generateBridgeCandidates([a, b], [n]);
    assert.deepEqual(candidates, []);
  });

  it("blocked (ineligible) candidate: a DRAFT community is excluded even with an otherwise perfect score", () => {
    const tech = community({ id: "tech", category: "technology", hasUpcomingActivity: true });
    const draftEnv = community({
      id: "draft-env",
      category: "environment",
      areaSq: "Prishtinë — Dardania",
      status: "draft",
    });
    const n = need({ category: "environment", areaSq: "Prishtinë — Dardania" });

    const candidates = generateBridgeCandidates([tech, draftEnv], [n]);
    assert.deepEqual(candidates, []);
  });

  it("changed need: a RESOLVED need no longer produces a candidate for the same pair", () => {
    const tech = community({ id: "tech", category: "technology", hasUpcomingActivity: true });
    const env = community({ id: "env", category: "environment", areaSq: "Prishtinë — Dardania" });
    const openNeed = need({ id: "n1", category: "environment", areaSq: "Prishtinë — Dardania", status: "open" });
    const resolvedNeed = { ...openNeed, status: "resolved" as const };

    const before = generateBridgeCandidates([tech, env], [openNeed]);
    assert.equal(before.length, 1);

    const after = generateBridgeCandidates([tech, env], [resolvedNeed]);
    assert.deepEqual(after, []);
  });

  it("deduplicates to a single best-scoring need per community pair", () => {
    const tech = community({ id: "tech", category: "technology", hasUpcomingActivity: true });
    const env = community({ id: "env", category: "environment", areaSq: "Prishtinë — Dardania" });
    // Deliberately scores lower than strongNeed: no geography match for
    // either community (neither is in Sunny Hill), so only complementary
    // categories + category relevance + availability apply.
    const weakNeed = need({ id: "weak", category: "technology", areaSq: "Prishtinë — Sunny Hill" });
    const strongNeed = need({ id: "strong", category: "environment", areaSq: "Prishtinë — Dardania" });

    const candidates = generateBridgeCandidates([tech, env], [weakNeed, strongNeed]);
    assert.equal(candidates.length, 1);
    assert.equal(candidates[0].needId, "strong");
  });
});
