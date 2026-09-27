import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { ActivityCategory, DemoActivity, InterestId } from "@/lib/types";
import { CATEGORY_TO_DB, toDemoActivity } from "./mappers";

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
    where: { activityId: { in: activities.map((a) => a.id) }, status: "CONFIRMED" },
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
}

export async function listActivities(filters: ActivityFilters = {}): Promise<DemoActivity[]> {
  const rows = await prisma.activity.findMany({
    where: {
      status: "PUBLISHED",
      ...(filters.category ? { category: CATEGORY_TO_DB[filters.category] } : {}),
      ...(filters.interestIds && filters.interestIds.length > 0
        ? { interests: { some: { interestId: { in: filters.interestIds } } } }
        : {}),
    },
    include: ACTIVITY_INCLUDE,
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
  const withCounts = await withConfirmedCounts(rows);
  return withCounts.map(toDemoActivity);
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
