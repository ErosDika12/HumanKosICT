import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { ActivityCategory, DemoActivity, InterestId } from "@/lib/types";
import {
  AGE_TO_DB,
  CATEGORY_TO_DB,
  COST_TO_DB,
  DIFFICULTY_TO_DB,
  toDemoActivity,
} from "./mappers";
import { matchesWindow, type TimeWindow } from "@/lib/time-window";

const ACTIVITY_INCLUDE = {
  community: { select: { id: true, slug: true, name: true, verified: true } },
  interests: { select: { interestId: true } },
} satisfies Prisma.ActivityInclude;

type ActivityWithRelations = Prisma.ActivityGetPayload<{ include: typeof ACTIVITY_INCLUDE }>;

async function withConfirmedCounts(
  activities: ActivityWithRelations[]
): Promise<Array<ActivityWithRelations & { _confirmedRsvpCount: number }>> {
  if (activities.length === 0) return [];
  const counts = await prisma.rsvp.groupBy({
    by: ["activityId"],
    // One-click demo visitors are isolated: their RSVPs never change what
    // other visitors see (public counts, "spots left", capacity).
    where: { activityId: { in: activities.map((a) => a.id) }, status: "CONFIRMED", user: { isDemoVisitor: false } },
    _count: { _all: true },
  });
  const countByActivity = new Map(counts.map((c) => [c.activityId, c._count._all]));
  return activities.map((a) => ({
    ...a,
    _confirmedRsvpCount: countByActivity.get(a.id) ?? 0,
  }));
}

export interface ActivityFilters {
  category?: ActivityCategory;
  interestIds?: InterestId[];
  /** Exact match against Activity.areaEn — see listDiscoveryFacets() for real values. */
  area?: string;
  cost?: DemoActivity["cost"];
  indoor?: boolean;
  /** Hard constraint: activity must have ALL of these accessibility tags. */
  accessibility?: string[];
  ageEligibility?: DemoActivity["ageEligibility"];
  difficulty?: DemoActivity["difficulty"];
  /** Hard constraint: the activity's date falls inside this window on the simulated clock (see time-window.ts). */
  when?: TimeWindow;
}

/**
 * Accessibility and day-bucket filtering happen in JS after the Prisma
 * query, not in `where`: accessibility is stored as a comma string (SQLite
 * has no array type — see docs/ARCHITECTURE.md) so an "ALL of these tags"
 * match isn't a plain column filter, and day-of-week is derived from the
 * date string, not a stored column. Both are cheap at this dataset's scale
 * (a handful of seeded activities) — this is a documented trade-off, not an
 * oversight, and everything else (category/area/cost/indoor/age/difficulty)
 * still filters at the query layer.
 */
export async function listActivities(filters: ActivityFilters = {}): Promise<DemoActivity[]> {
  const rows = await prisma.activity.findMany({
    where: {
      status: "PUBLISHED",
      ...(filters.category ? { category: CATEGORY_TO_DB[filters.category] } : {}),
      ...(filters.area ? { areaEn: filters.area } : {}),
      ...(filters.cost ? { cost: COST_TO_DB[filters.cost] } : {}),
      ...(filters.indoor !== undefined ? { indoor: filters.indoor } : {}),
      ...(filters.ageEligibility ? { ageEligibility: AGE_TO_DB[filters.ageEligibility] } : {}),
      ...(filters.difficulty ? { difficulty: DIFFICULTY_TO_DB[filters.difficulty] } : {}),
      ...(filters.interestIds && filters.interestIds.length > 0
        ? { interests: { some: { interestId: { in: filters.interestIds } } } }
        : {}),
    },
    include: ACTIVITY_INCLUDE,
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
  const withCounts = await withConfirmedCounts(rows);
  let activities = withCounts.map(toDemoActivity);

  if (filters.accessibility && filters.accessibility.length > 0) {
    activities = activities.filter((a) =>
      filters.accessibility!.every((tag) => a.accessibility.includes(tag))
    );
  }
  if (filters.when) {
    activities = activities.filter((a) => matchesWindow(a.date, filters.when!));
  }

  return activities;
}

export interface DiscoveryFacets {
  areas: string[];
  accessibilityTags: string[];
}

/**
 * Real, currently-seeded values only — the Phase 3 brief is explicit that
 * discovery must never promise a filter the underlying data can't satisfy.
 */
export async function listDiscoveryFacets(): Promise<DiscoveryFacets> {
  const rows = await prisma.activity.findMany({
    where: { status: "PUBLISHED" },
    select: { areaEn: true, accessibility: true },
  });
  const areas = Array.from(new Set(rows.map((r) => r.areaEn))).sort();
  const accessibilityTags = Array.from(
    new Set(rows.flatMap((r) => (r.accessibility ? r.accessibility.split(",").filter(Boolean) : [])))
  ).sort();
  return { areas, accessibilityTags };
}

export async function getActivityBySlug(slug: string): Promise<DemoActivity | null> {
  const row = await prisma.activity.findUnique({
    where: { slug },
    include: ACTIVITY_INCLUDE,
  });
  if (!row) return null;
  const [withCount] = await withConfirmedCounts([row]);
  return toDemoActivity(withCount);
}

export async function listActivitySlugs(): Promise<string[]> {
  const rows = await prisma.activity.findMany({ select: { slug: true } });
  return rows.map((r) => r.slug);
}

export interface RsvpState {
  status: "confirmed" | "canceled" | "none";
}

export async function getUserRsvpState(userId: string, activityId: string): Promise<RsvpState> {
  const rsvp = await prisma.rsvp.findUnique({
    where: { userId_activityId: { userId, activityId } },
  });
  if (!rsvp) return { status: "none" };
  return { status: rsvp.status === "CONFIRMED" ? "confirmed" : "canceled" };
}
