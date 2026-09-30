/**
 * Pure, deterministic municipality aggregation (Phase 7) — no `server-only`
 * import, directly unit-tested (tests/municipality-aggregation.test.ts).
 * This module is the entire privacy boundary: if a rule lives here, it
 * applies no matter which page or future API path calls it — there is no
 * separate "raw list" or "export" function anywhere that could bypass it.
 *
 * Documented rules:
 *
 * - **Small-cell suppression**: a real (non-scenario) demand cell is only
 *   ever shown as an exact number when at least MIN_DISTINCT_CONTRIBUTORS
 *   distinct people (submitters + supporters, deduplicated) stand behind
 *   it. Below that, the cell is `{ kind: "suppressed" }` — never a
 *   near-exact number, never the underlying count in any form.
 * - **No derivable totals (differencing)**: this module has no function
 *   that sums real per-category cells into a per-area (or grand) total.
 *   That's deliberate: if it did, and exactly one sibling category were
 *   suppressed, `total − sum(visible siblings)` would reconstruct the
 *   suppressed value exactly. Any area/grand total a caller wants must be
 *   computed as its own independent aggregation (with its own suppression
 *   check), never derived from the per-category rows this module returns.
 * - **A suppressed cell never enters a ranking**: `topGaps` only ranks
 *   cells with a real, disclosed value — a suppressed cell's rank position
 *   would itself leak ordinal information about a small group.
 * - A threshold alone does not guarantee anonymity in all cases (e.g. an
 *   attacker with outside knowledge of who lives in an area could still
 *   narrow things down) — this is a defensible, documented mitigation, not
 *   a formal privacy guarantee.
 */
import type { ActivityCategory } from "@/lib/types";

export const MIN_DISTINCT_CONTRIBUTORS = 3;

export type GapValue = { kind: "count"; value: number } | { kind: "suppressed" };

function cellKey(areaSq: string, category: string): string {
  return `${areaSq}\u0000${category}`;
}

export function suppressCount(distinctCount: number): GapValue {
  return distinctCount < MIN_DISTINCT_CONTRIBUTORS
    ? { kind: "suppressed" }
    : { kind: "count", value: distinctCount };
}

export interface RealNeedInput {
  areaSq: string;
  category: ActivityCategory;
  /** Every distinct contributing user id for this one need row: the submitter plus every supporter. */
  contributorIds: string[];
}

export interface RealDemandCell {
  areaSq: string;
  category: ActivityCategory;
  demand: GapValue;
}

/** Groups by (area, category) and deduplicates contributors across needs in the same cell before suppressing. */
export function computeRealDemandCells(needs: RealNeedInput[]): RealDemandCell[] {
  const grouped = new Map<string, { areaSq: string; category: ActivityCategory; contributors: Set<string> }>();
  for (const need of needs) {
    const key = cellKey(need.areaSq, need.category);
    let entry = grouped.get(key);
    if (!entry) {
      entry = { areaSq: need.areaSq, category: need.category, contributors: new Set() };
      grouped.set(key, entry);
    }
    for (const id of need.contributorIds) entry.contributors.add(id);
  }
  return Array.from(grouped.values()).map((e) => ({
    areaSq: e.areaSq,
    category: e.category,
    demand: suppressCount(e.contributors.size),
  }));
}

export interface SupplyCell {
  areaSq: string;
  category: ActivityCategory;
  activityCount: number;
}

export interface RealGapRow {
  areaSq: string;
  category: ActivityCategory;
  demand: GapValue;
  supply: number;
  gap: GapValue;
}

/**
 * Joins demand cells with supply cells (supply is always real and public —
 * a published activity is not private, so it's never suppressed). A
 * suppressed demand cell produces a suppressed gap too — the module never
 * computes `unknown − known` and calls it a number.
 */
export function computeRealGapRows(demandCells: RealDemandCell[], supplyCells: SupplyCell[]): RealGapRow[] {
  const supplyMap = new Map(supplyCells.map((s) => [cellKey(s.areaSq, s.category), s.activityCount]));
  return demandCells.map((d) => {
    const supply = supplyMap.get(cellKey(d.areaSq, d.category)) ?? 0;
    const gap: GapValue = d.demand.kind === "count" ? { kind: "count", value: d.demand.value - supply } : { kind: "suppressed" };
    return { areaSq: d.areaSq, category: d.category, demand: d.demand, supply, gap };
  });
}

/** Only ever ranks disclosed (non-suppressed) gaps — a suppressed cell never appears, at any rank. */
export function topGaps<T extends { gap: GapValue }>(rows: T[], limit = 5): (T & { gap: { kind: "count"; value: number } })[] {
  return rows
    .filter((r): r is T & { gap: { kind: "count"; value: number } } => r.gap.kind === "count")
    .sort((a, b) => b.gap.value - a.gap.value)
    .slice(0, limit);
}

export interface ScenarioInput {
  areaSq: string;
  category: ActivityCategory;
  syntheticCount: number;
  note: string;
}

export interface ScenarioGapRow {
  areaSq: string;
  category: ActivityCategory;
  syntheticDemand: number;
  supply: number;
  gap: number;
  note: string;
}

/**
 * The synthetic scenario dataset (Phase 7 brief's requirement 4) has no
 * underlying individuals at all, so no suppression applies — but it is
 * returned as its own distinct type (`ScenarioGapRow`, never `RealGapRow`)
 * so a caller can never accidentally blend it into the real, privacy-
 * governed numbers above.
 */
export function computeScenarioGapRows(scenario: ScenarioInput[], supplyCells: SupplyCell[]): ScenarioGapRow[] {
  const supplyMap = new Map(supplyCells.map((s) => [cellKey(s.areaSq, s.category), s.activityCount]));
  return scenario.map((s) => {
    const supply = supplyMap.get(cellKey(s.areaSq, s.category)) ?? 0;
    return {
      areaSq: s.areaSq,
      category: s.category,
      syntheticDemand: s.syntheticCount,
      supply,
      gap: s.syntheticCount - supply,
      note: s.note,
    };
  });
}

export function topScenarioGaps(rows: ScenarioGapRow[], limit = 5): ScenarioGapRow[] {
  return [...rows].sort((a, b) => b.gap - a.gap).slice(0, limit);
}
