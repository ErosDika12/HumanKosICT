import "server-only";
import { prisma } from "@/lib/prisma";
import { CATEGORY_FROM_DB } from "./mappers";

export interface CategorySummary {
  category: string;
  activityCount: number;
}

/**
 * Aggregate-only, by design: groupBy never selects a user id, name, email,
 * or exact location. This is a Phase 2 placeholder for the full Phase 7
 * municipality dashboard (small-cell suppression, area-level gaps, etc.) —
 * it exists now only to prove the analyst role boundary end-to-end.
 */
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
