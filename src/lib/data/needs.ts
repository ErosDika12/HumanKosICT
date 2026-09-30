import "server-only";
import { prisma } from "@/lib/prisma";
import type { ActivityCategory } from "@/lib/types";
import { CATEGORY_FROM_DB, CATEGORY_TO_DB } from "./mappers";
import { assertBoundedText, MAX_SHORT_TEXT } from "@/lib/validation";

export interface NeedItem {
  id: string;
  category: ActivityCategory;
  areaSq: string;
  description: string;
  status: "open" | "in_progress" | "resolved";
  createdAt: Date;
  communityName: string | null;
  supportCount: number;
  isSupportedByViewer: boolean;
  bridgeProposalId: string | null;
}

/**
 * Never selects or returns submittedById — a need's public list is exactly
 * as anonymous as docs/PRODUCT_CONTRACT.md requires ("no public pinpoint
 * for a reporter"). The submitter is visible only to moderators
 * (src/lib/data/reports.ts-style pattern), never in this list.
 */
export async function listNeeds(viewerId?: string): Promise<NeedItem[]> {
  // A sentinel that matches no real user id, so the `supports` sub-query
  // shape is always the same regardless of whether a viewer is signed in —
  // avoids Prisma's conditional-include typing entirely.
  const viewerFilter = viewerId ?? "__no-viewer__";
  const rows = await prisma.communityNeed.findMany({
    // Demo visitors are isolated: a visitor's needs and supports are visible to that visitor only.
    where: { OR: [{ submittedBy: { isDemoVisitor: false } }, { submittedById: viewerFilter }] },
    orderBy: { createdAt: "desc" },
    include: {
      community: { select: { name: true } },
      supports: {
        where: { OR: [{ user: { isDemoVisitor: false } }, { userId: viewerFilter }] },
        select: { userId: true },
      },
      bridgeProposals: {
        where: { status: { in: ["SUGGESTED", "SAVED", "ACCEPTED"] } },
        select: { id: true },
        take: 1,
      },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    category: CATEGORY_FROM_DB[r.category],
    areaSq: r.areaSq,
    description: r.description,
    status: r.status === "IN_PROGRESS" ? "in_progress" : r.status === "RESOLVED" ? "resolved" : "open",
    createdAt: r.createdAt,
    communityName: r.community?.name ?? null,
    supportCount: r.supports.length,
    isSupportedByViewer: r.supports.some((s) => s.userId === viewerFilter),
    bridgeProposalId: r.bridgeProposals[0]?.id ?? null,
  }));
}

export interface SimilarNeed {
  id: string;
  description: string;
  supportCount: number;
}

/** Non-blocking duplicate guidance — the Phase 4 brief's alternative to hard-blocking a resubmission. */
export async function findSimilarOpenNeed(
  category: ActivityCategory,
  areaSq: string
): Promise<SimilarNeed | null> {
  const match = await prisma.communityNeed.findFirst({
    where: { category: CATEGORY_TO_DB[category], areaSq, status: { in: ["OPEN", "IN_PROGRESS"] } },
    include: { _count: { select: { supports: true } } },
    orderBy: { createdAt: "desc" },
  });
  return match ? { id: match.id, description: match.description, supportCount: match._count.supports } : null;
}

export interface NeedInput {
  category: ActivityCategory;
  areaSq: string;
  description: string;
  communityId?: string;
}

export async function createNeed(actorId: string, input: NeedInput): Promise<string> {
  if (!input.description.trim() || !input.areaSq.trim()) {
    throw new Error("Area and description are required.");
  }
  assertBoundedText(input.description, MAX_SHORT_TEXT, "Need description");
  assertBoundedText(input.areaSq, 200, "Area");
  const need = await prisma.communityNeed.create({
    data: {
      category: CATEGORY_TO_DB[input.category],
      areaSq: input.areaSq.trim(),
      description: input.description.trim(),
      communityId: input.communityId,
      submittedById: actorId,
    },
  });
  return need.id;
}

/** Toggle: supporting again removes support (idempotent either direction, never a duplicate row). */
export async function toggleNeedSupport(actorId: string, needId: string): Promise<boolean> {
  const existing = await prisma.needSupport.findUnique({
    where: { userId_needId: { userId: actorId, needId } },
  });
  if (existing) {
    await prisma.needSupport.delete({ where: { id: existing.id } });
    return false;
  }
  await prisma.needSupport.create({ data: { userId: actorId, needId } });
  return true;
}

export async function reportNeed(actorId: string, needId: string, reason: string): Promise<void> {
  if (!reason.trim()) throw new Error("A reason is required.");
  assertBoundedText(reason, MAX_SHORT_TEXT, "Report reason");
  await prisma.report.create({ data: { reporterId: actorId, needId, reason: reason.trim() } });
}
