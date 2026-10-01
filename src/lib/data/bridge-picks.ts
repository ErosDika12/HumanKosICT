/**
 * Which BRIDGE alternatives to show next to the featured story. Pure (no
 * database) and unit-tested — see tests/bridge-picks.test.ts.
 */
export interface PickableProposal {
  id: string;
  needId: string;
  score: number;
  reason: string;
  status: "suggested" | "saved" | "accepted" | "declined";
}

/**
 * A few strong alternatives, not twenty repeats: one best proposal per
 * community need (never the featured need again), ranked by the documented
 * score, preferring pairs that can act locally and share an audience.
 */
export function pickStrongMatches<T extends PickableProposal>(proposals: T[], featured: Pick<PickableProposal, "id" | "needId"> | undefined, limit = 3): T[] {
  const weight = (p: T) =>
    p.score * 10 + (p.reason.includes("Both can act locally") ? 2 : 0) + (p.reason.includes("Shared audience interest") ? 1 : 0);
  const bestByNeed = new Map<string, T>();
  for (const p of proposals) {
    if (p.status === "declined" || p.id === featured?.id || p.needId === featured?.needId || p.score < 6) continue;
    const current = bestByNeed.get(p.needId);
    if (!current || weight(p) > weight(current)) bestByNeed.set(p.needId, p);
  }
  return [...bestByNeed.values()].sort((a, b) => weight(b) - weight(a)).slice(0, limit);
}

