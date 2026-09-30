/**
 * Deterministic, explainable BRIDGE candidate scoring (Phase 5).
 *
 * Deliberately NOT `import "server-only"` — like recommendations.ts, this
 * is pure logic with no database dependency, so it's directly unit-tested
 * with fixtures (tests/bridge-scoring.test.ts) covering a good match, a bad
 * match, an ineligible ("blocked") candidate, and a changed need.
 *
 * Documented scoring formula — every point is a named, explainable factor,
 * never an opaque "AI says 95% match":
 *
 *   score = 2  if the two communities have different categories
 *              ("complementary capabilities" — BRIDGE pairs different
 *              domains working together, not two of the same kind)
 *         + 2  if the need's area matches either community's area
 *              ("geography" — the collaboration is locally groundable)
 *         + 2  if either community's category matches the need's category
 *              ("relevant community need" — at least one side directly
 *              addresses what was asked for)
 *         + 1  if either community has a PUBLISHED activity dated on or
 *              after the simulated clock's "today"
 *              (src/lib/simulated-clock.ts) — "availability": there's a
 *              near-term occasion to act on this, not just a standing idea
 *         + 1  if the two communities' activities share at least one
 *              interest tag ("shared goals" — some topical audience
 *              overlap despite different categories)
 *
 * A proposal is only generated for a need that is OPEN or IN_PROGRESS,
 * for a pair of distinct, PUBLISHED communities that are not already
 * ACCEPTED/DECLINED for that exact need, and only when the total score
 * meets MIN_BRIDGE_SCORE. Only the single highest-scoring need is kept per
 * community pair (deduplication — one proposal per pair, not one per need).
 */

export type BridgeCategory =
  | "sports"
  | "education"
  | "culture"
  | "community"
  | "technology"
  | "environment";

export interface BridgeCommunityInput {
  id: string;
  name: string;
  category: BridgeCategory;
  areaSq: string;
  status: "draft" | "published";
  organizerName: string;
  /** Interest tags across this community's own activities — the closest proxy this schema has for "capabilities." */
  activityInterestTags: string[];
  /** Whether this community has a PUBLISHED activity dated on/after the simulated clock's "today." */
  hasUpcomingActivity: boolean;
}

export interface BridgeNeedInput {
  id: string;
  category: BridgeCategory;
  areaSq: string;
  description: string;
  status: "open" | "in_progress" | "resolved";
}

export interface BridgeCandidate {
  communityAId: string;
  communityBId: string;
  needId: string;
  score: number;
  reasons: string[];
}

export const MIN_BRIDGE_SCORE = 4;

function scorePair(
  a: BridgeCommunityInput,
  b: BridgeCommunityInput,
  need: BridgeNeedInput
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (a.category !== b.category) {
    score += 2;
    reasons.push(`Complementary categories (${a.category} + ${b.category})`);
  }

  if (need.areaSq === a.areaSq || need.areaSq === b.areaSq) {
    score += 2;
    reasons.push(`Both can act locally in ${need.areaSq}`);
  }

  if (a.category === need.category || b.category === need.category) {
    score += 2;
    const matching = a.category === need.category ? a.name : b.name;
    reasons.push(`${matching} directly works in this need's category (${need.category})`);
  }

  if (a.hasUpcomingActivity || b.hasUpcomingActivity) {
    score += 1;
    reasons.push("At least one community has an upcoming scheduled activity to build on");
  }

  const sharedTags = a.activityInterestTags.filter((t) => b.activityInterestTags.includes(t));
  if (sharedTags.length > 0) {
    score += 1;
    reasons.push(`Shared audience interest: ${sharedTags.join(", ")}`);
  }

  return { score, reasons };
}

/**
 * Pure candidate generation. Excludes: the same community paired with
 * itself, any non-PUBLISHED ("draft"/inactive) community, and any need not
 * OPEN or IN_PROGRESS. Deduplicates to the single best-scoring need per
 * unordered community pair.
 */
export function generateBridgeCandidates(
  communities: BridgeCommunityInput[],
  needs: BridgeNeedInput[]
): BridgeCandidate[] {
  const eligibleCommunities = communities.filter((c) => c.status === "published");
  const eligibleNeeds = needs.filter((n) => n.status === "open" || n.status === "in_progress");

  const bestByPair = new Map<string, BridgeCandidate>();

  for (let i = 0; i < eligibleCommunities.length; i++) {
    for (let j = i + 1; j < eligibleCommunities.length; j++) {
      const a = eligibleCommunities[i];
      const b = eligibleCommunities[j];
      const pairKey = [a.id, b.id].sort().join(":");

      for (const need of eligibleNeeds) {
        const { score, reasons } = scorePair(a, b, need);
        if (score < MIN_BRIDGE_SCORE) continue;

        const existing = bestByPair.get(pairKey);
        if (!existing || score > existing.score) {
          bestByPair.set(pairKey, {
            communityAId: a.id,
            communityBId: b.id,
            needId: need.id,
            score,
            reasons,
          });
        }
      }
    }
  }

  return Array.from(bestByPair.values()).sort((x, y) => y.score - x.score);
}
