import "server-only";
import { prisma } from "@/lib/prisma";
import { CATEGORY_FROM_DB, CATEGORY_TO_DB } from "./mappers";
import type { ActivityCategory } from "@/lib/types";
import {
  computeRealDemandCells,
  computeRealGapRows,
  computeScenarioGapRows,
  topGaps,
  topScenarioGaps,
  type RealGapRow,
  type ScenarioGapRow,
  type SupplyCell,
} from "./municipality-aggregation";
import { assertBoundedText, MAX_LONG_TEXT } from "@/lib/validation";

export interface CategorySummary {
  category: string;
  activityCount: number;
}

/** Aggregate-only, by design: never selects a user id, name, email, or exact location. */
export async function getActivityCategorySummary(): Promise<CategorySummary[]> {
  const rows = await prisma.activity.groupBy({
    by: ["category"],
    where: { status: "PUBLISHED" },
    _count: { _all: true },
  });
  return rows.map((r) => ({
    category: CATEGORY_FROM_DB[r.category],
    activityCount: r._count._all,
  }));
}

/**
 * Public activity supply, per (area, category) — always real and never
 * suppressed: a published activity is public by definition. The
 * "documented time window" for this whole dashboard is the seeded 2036
 * demo period in full (there is no real ongoing time series in a
 * fictional, fixed-calendar prototype to bucket further — see
 * docs/ARCHITECTURE.md "Municipality intelligence").
 */
async function getSupplyCells(): Promise<SupplyCell[]> {
  const rows = await prisma.activity.groupBy({
    by: ["areaSq", "category"],
    where: { status: "PUBLISHED" },
    _count: { _all: true },
  });
  return rows.map((r) => ({
    areaSq: r.areaSq,
    category: CATEGORY_FROM_DB[r.category],
    activityCount: r._count._all,
  }));
}

/**
 * Real demand: every OPEN/IN_PROGRESS need's submitter plus its
 * supporters, as distinct contributor ids — the exact figure
 * `computeRealDemandCells` suppresses below `MIN_DISTINCT_CONTRIBUTORS`.
 * Never selects a need's free-text `description` here — the aggregation
 * layer only ever sees ids, area, and category.
 */
async function getRealDemandInputs() {
  const needs = await prisma.communityNeed.findMany({
    // One-click demo visitors never contribute to municipal aggregates.
    where: { status: { in: ["OPEN", "IN_PROGRESS"] }, submittedBy: { isDemoVisitor: false } },
    select: {
      areaSq: true,
      category: true,
      submittedById: true,
      supports: { where: { user: { isDemoVisitor: false } }, select: { userId: true } },
    },
  });
  return needs.map((n) => ({
    areaSq: n.areaSq,
    category: CATEGORY_FROM_DB[n.category],
    contributorIds: [n.submittedById, ...n.supports.map((s) => s.userId)],
  }));
}

export async function getRealGapRows(): Promise<RealGapRow[]> {
  const [demandInputs, supply] = await Promise.all([getRealDemandInputs(), getSupplyCells()]);
  const demandCells = computeRealDemandCells(demandInputs);
  return computeRealGapRows(demandCells, supply);
}

export async function getTopRealGaps(limit = 5) {
  return topGaps(await getRealGapRows(), limit);
}

/**
 * Requirement 4 of the Phase 7 brief: a separate, explicitly-labeled
 * SYNTHETIC dataset (`MunicipalityScenarioDemand` — no relation to `User`
 * at all) large enough to show the "several simulated requests... few
 * relevant events" story without fabricating individual accounts. Never
 * merged with `getRealGapRows()`'s output — always its own type
 * (`ScenarioGapRow`), always rendered in its own clearly-labeled section.
 */
export async function getScenarioGapRows(): Promise<ScenarioGapRow[]> {
  const [scenario, supply] = await Promise.all([
    prisma.municipalityScenarioDemand.findMany(),
    getSupplyCells(),
  ]);
  return computeScenarioGapRows(
    scenario.map((s) => ({
      areaSq: s.areaSq,
      category: CATEGORY_FROM_DB[s.category],
      syntheticCount: s.syntheticCount,
      note: s.note,
    })),
    supply
  );
}

export async function getTopScenarioGaps(limit = 5) {
  return topScenarioGaps(await getScenarioGapRows(), limit);
}

export interface CandidateSpace {
  venueName: string;
  areaSq: string;
  scheduledActivityCount: number;
}

/**
 * "Candidate space in this scenario" — never "underused": this only ever
 * counts real scheduled activities at a known seeded venue, never claims
 * usage evidence beyond that count. Real venues only, from real published
 * activities — no fabricated public place list.
 */
export async function listCandidateSpaces(): Promise<CandidateSpace[]> {
  const rows = await prisma.activity.groupBy({
    by: ["venueName", "areaSq"],
    where: { status: "PUBLISHED" },
    _count: { _all: true },
  });
  return rows
    .map((r) => ({ venueName: r.venueName, areaSq: r.areaSq, scheduledActivityCount: r._count._all }))
    .sort((a, b) => a.scheduledActivityCount - b.scheduledActivityCount);
}

export interface RecommendationDraft {
  areaSq: string;
  category: ActivityCategory;
  text: string;
  isSaved: boolean;
  updatedByName: string | null;
}

function defaultRecommendationText(
  areaSq: string,
  category: ActivityCategory,
  gap: number,
  candidateVenue: string | null
): string {
  const venueClause = candidateVenue
    ? `${candidateVenue} is a candidate space in this scenario (already hosts scheduled activities in the area).`
    : `No specific seeded venue stands out yet in this scenario — an organizer would need to identify one.`;
  return (
    `Suggestion for human review: consider a recurring monthly ${category} workshop in ${areaSq}. ` +
    `This scenario's simulated demand exceeds real supply by ${gap} in this category/area. ${venueClause} ` +
    `This is a draft suggestion only — no event has been created, and no automatic decision has been made.`
  );
}

/** Aggregate-only and analyst-authored — never derived from or containing any need's free text or submitter identity. */
export async function getRecommendationDraft(
  areaSq: string,
  category: ActivityCategory
): Promise<RecommendationDraft> {
  const [saved, scenarioRows, candidateSpaces] = await Promise.all([
    prisma.municipalityRecommendationNote.findUnique({
      where: { areaSq_category: { areaSq, category: CATEGORY_TO_DB[category] } },
      include: { updatedBy: { select: { name: true } } },
    }),
    getScenarioGapRows(),
    listCandidateSpaces(),
  ]);
  if (saved) {
    return { areaSq, category, text: saved.text, isSaved: true, updatedByName: saved.updatedBy.name };
  }
  const scenarioRow = scenarioRows.find((r) => r.areaSq === areaSq && r.category === category);
  const candidate = candidateSpaces.find((c) => c.areaSq === areaSq)?.venueName ?? null;
  return {
    areaSq,
    category,
    text: defaultRecommendationText(areaSq, category, scenarioRow?.gap ?? 0, candidate),
    isSaved: false,
    updatedByName: null,
  };
}

export async function saveRecommendationNote(
  actorId: string,
  areaSq: string,
  category: ActivityCategory,
  text: string
): Promise<void> {
  if (!text.trim()) throw new Error("Recommendation text is required.");
  assertBoundedText(text, MAX_LONG_TEXT, "Recommendation text");
  await prisma.municipalityRecommendationNote.upsert({
    where: { areaSq_category: { areaSq, category: CATEGORY_TO_DB[category] } },
    create: { areaSq, category: CATEGORY_TO_DB[category], text: text.trim(), updatedById: actorId },
    update: { text: text.trim(), updatedById: actorId },
  });
}
