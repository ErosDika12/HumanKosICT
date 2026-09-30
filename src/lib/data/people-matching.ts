/**
 * Human matching (Phase 5) — deliberately simple and fully explainable.
 * Pure, no `server-only` import, unit-tested directly
 * (tests/people-matching.test.ts) with a good match, a match with no
 * mutual basis (excluded), and a blocked pair (excluded).
 *
 * A candidate is shown only if BOTH are opted in (`isDiscoverable` —
 * reused as the single consent flag for this feature too, see
 * docs/ARCHITECTURE.md "Human matching") and neither has blocked the
 * other, AND there is at least one concrete, named "mutual interest or
 * participation" basis: a shared interest tag, a shared community
 * membership, or a shared project. No basis, no match — never a bare
 * "0% in common" entry, and never a popularity/compatibility score.
 */
import { getInterest, type InterestId } from "@/lib/types";

export interface PersonInput {
  id: string;
  name: string;
  bio: string | null;
  isDiscoverable: boolean;
  interestIds: InterestId[];
  communities: { id: string; name: string }[];
  projects: { id: string; name: string }[];
}

export interface PersonMatch {
  id: string;
  name: string;
  bio: string | null;
  reasons: string[];
}

export function findMatches(
  viewer: PersonInput,
  others: PersonInput[],
  blockedEitherDirection: Set<string>
): PersonMatch[] {
  if (!viewer.isDiscoverable) return [];

  const matches: PersonMatch[] = [];

  for (const other of others) {
    if (other.id === viewer.id) continue;
    if (!other.isDiscoverable) continue;
    if (blockedEitherDirection.has(other.id)) continue;

    const reasons: string[] = [];

    const sharedInterests = viewer.interestIds.filter((i) => other.interestIds.includes(i));
    if (sharedInterests.length > 0) {
      const labels = sharedInterests.map((i) => getInterest(i).labelEn);
      reasons.push(`Shares your interest in ${labels.join(", ")}`);
    }

    const sharedCommunities = viewer.communities.filter((c) =>
      other.communities.some((oc) => oc.id === c.id)
    );
    if (sharedCommunities.length > 0) {
      reasons.push(`Both members of ${sharedCommunities.map((c) => c.name).join(", ")}`);
    }

    const sharedProjects = viewer.projects.filter((p) => other.projects.some((op) => op.id === p.id));
    if (sharedProjects.length > 0) {
      reasons.push(`Both volunteer on ${sharedProjects.map((p) => p.name).join(", ")}`);
    }

    if (reasons.length === 0) continue; // no mutual basis — not shown, per the brief

    matches.push({ id: other.id, name: other.name, bio: other.bio, reasons });
  }

  return matches.sort((a, b) => b.reasons.length - a.reasons.length || a.name.localeCompare(b.name));
}
