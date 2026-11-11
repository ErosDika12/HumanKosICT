import "server-only";
import { prisma } from "@/lib/prisma";
import { assertRole, isAuthorizedPartner, PermissionError, type Actor } from "@/lib/auth/roles";
import {
  ISSUE_CATEGORIES,
  MAX_ISSUES_PER_DAY,
  MIN_ISSUE_DESCRIPTION,
  PARTNER_ONLY_STATUSES,
  isIssueCategory,
  type IssueCategory,
  type IssueStatusName,
} from "@/lib/city-config";
import { neighborhoodBySlug } from "@/lib/neighborhoods";
import { assertBoundedText, MAX_LONG_TEXT, MAX_SHORT_TEXT } from "@/lib/validation";

/** Statuses that are still being worked on; "similar report" checks only look at these. */
const OPEN_STATUSES: IssueStatusName[] = ["RECEIVED", "UNDER_REVIEW", "MUNICIPALITY_ACKNOWLEDGED"];
const TERMINAL_STATUSES: IssueStatusName[] = ["DUPLICATE", "DECLINED", "RESOLVED"];

export interface IssueEventView {
  status: IssueStatusName;
  note: string | null;
  createdAt: Date;
}

export interface MyIssueView {
  id: string;
  category: IssueCategory;
  description: string;
  areaSlug: string;
  status: IssueStatusName;
  createdAt: Date;
  events: IssueEventView[];
}

export interface IssueInput {
  category: string;
  description: string;
  areaSlug: string;
  latitude?: number | null;
  longitude?: number | null;
}

function validCoord(value: number | null | undefined, min: number, max: number): number | null {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value) || value < min || value > max) throw new Error("Location coordinates are not valid.");
  return value;
}

/**
 * Creates a report owned by `reporter`. The first history entry says exactly what
 * happened — received by Human Network — and nothing about any municipality.
 */
export async function createIssue(reporter: Actor, input: IssueInput): Promise<string> {
  if (!isIssueCategory(input.category)) throw new Error("Choose a valid category.");
  if (!neighborhoodBySlug(input.areaSlug)) throw new Error("Unknown neighborhood.");
  const description = (input.description ?? "").trim();
  if (description.length < MIN_ISSUE_DESCRIPTION) throw new Error(`Description must be at least ${MIN_ISSUE_DESCRIPTION} characters.`);
  assertBoundedText(description, MAX_LONG_TEXT, "Description");
  const latitude = validCoord(input.latitude, -90, 90);
  const longitude = validCoord(input.longitude, -180, 180);
  if ((latitude === null) !== (longitude === null)) throw new Error("Location coordinates are required together.");

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent = await prisma.issueReport.count({ where: { reporterId: reporter.id, createdAt: { gte: since } } });
  if (recent >= MAX_ISSUES_PER_DAY) throw new Error("Report limit reached for today.");

  const issue = await prisma.issueReport.create({
    data: {
      reporterId: reporter.id,
      category: input.category,
      description,
      areaSlug: input.areaSlug,
      latitude,
      longitude,
      // System event: the translated status label ("Received by Human Network") speaks for itself.
      events: { create: { status: "RECEIVED", note: null, actorId: null } },
    },
  });
  return issue.id;
}

/**
 * Duplicate handling, step one: how many open reports already exist for this category
 * and neighborhood. Only a count is returned — never anyone else's text or location.
 */
export async function countSimilarOpenIssues(category: string, areaSlug: string): Promise<number> {
  if (!isIssueCategory(category) || !neighborhoodBySlug(areaSlug)) return 0;
  return prisma.issueReport.count({ where: { category, areaSlug, status: { in: OPEN_STATUSES } } });
}

/** A person's own reports only. */
export async function listMyIssues(userId: string): Promise<MyIssueView[]> {
  const rows = await prisma.issueReport.findMany({
    where: { reporterId: userId },
    orderBy: { createdAt: "desc" },
    include: { events: { orderBy: { createdAt: "asc" } } },
  });
  return rows.map(toMyView);
}

/** Ownership is part of the query: another person's id returns null, indistinguishable from "does not exist". */
export async function getMyIssue(userId: string, issueId: string): Promise<MyIssueView | null> {
  const row = await prisma.issueReport.findFirst({
    where: { id: issueId, reporterId: userId },
    include: { events: { orderBy: { createdAt: "asc" } } },
  });
  return row ? toMyView(row) : null;
}

function toMyView(row: {
  id: string;
  category: string;
  description: string;
  areaSlug: string;
  status: string;
  createdAt: Date;
  events: { status: string; note: string | null; createdAt: Date }[];
}): MyIssueView {
  return {
    id: row.id,
    category: row.category as IssueCategory,
    description: row.description,
    areaSlug: row.areaSlug,
    status: row.status as IssueStatusName,
    createdAt: row.createdAt,
    events: row.events.map((e) => ({ status: e.status as IssueStatusName, note: e.note, createdAt: e.createdAt })),
  };
}

export interface QueueIssue {
  id: string;
  category: IssueCategory;
  description: string;
  areaSlug: string;
  status: IssueStatusName;
  createdAt: Date;
  /** Exact point, for staff handling the report only. Never sent to public views. */
  latitude: number | null;
  longitude: number | null;
}

/** Moderator queue. The reporter's identity is deliberately not included. */
export async function listIssueQueue(actor: Actor): Promise<QueueIssue[]> {
  assertRole(actor, "MODERATOR", "MUNICIPALITY_ANALYST");
  const rows = await prisma.issueReport.findMany({
    where: { status: { in: OPEN_STATUSES } },
    orderBy: { createdAt: "asc" },
    select: { id: true, category: true, description: true, areaSlug: true, status: true, createdAt: true, latitude: true, longitude: true },
  });
  return rows.map((r) => ({ ...r, category: r.category as IssueCategory, status: r.status as IssueStatusName }));
}

/**
 * Truthful status changes.
 *  - Moderators: UNDER_REVIEW, DUPLICATE (needs a target report), DECLINED (needs a note).
 *  - Only an authorized partner may record MUNICIPALITY_ACKNOWLEDGED or RESOLVED, and must give a
 *    reference note. Demo accounts never qualify, so a demo can't make a real report look acknowledged.
 *  - DUPLICATE, DECLINED and RESOLVED are final.
 * Every change appends to the reporter-visible history in the same transaction. Notes are only
 * what a person typed; the status label itself is translated at display time.
 */
export async function updateIssueStatus(
  actor: Actor,
  issueId: string,
  status: IssueStatusName,
  opts: { note?: string; duplicateOfId?: string } = {}
): Promise<void> {
  const note = (opts.note ?? "").trim();
  assertBoundedText(note, MAX_SHORT_TEXT, "Note");

  if (PARTNER_ONLY_STATUSES.includes(status)) {
    if (!isAuthorizedPartner(actor)) throw new PermissionError("Only an authorized partner can record that status.");
    if (!note) throw new Error("A reference note is required.");
  } else {
    assertRole(actor, "MODERATOR");
    if (!["UNDER_REVIEW", "DUPLICATE", "DECLINED"].includes(status)) throw new Error("This status change is not allowed.");
    if (status === "DECLINED" && !note) throw new Error("A note is required.");
  }

  const issue = await prisma.issueReport.findUnique({ where: { id: issueId }, select: { id: true, status: true } });
  if (!issue) throw new Error("Report not found.");
  if (TERMINAL_STATUSES.includes(issue.status as IssueStatusName)) throw new Error("This status change is not allowed.");

  let duplicateOfId: string | null = null;
  if (status === "DUPLICATE") {
    if (!opts.duplicateOfId || opts.duplicateOfId === issueId) throw new Error("Choose the report this duplicates.");
    const target = await prisma.issueReport.findUnique({ where: { id: opts.duplicateOfId }, select: { id: true, status: true } });
    if (!target || target.status === "DUPLICATE") throw new Error("Choose the report this duplicates.");
    duplicateOfId = target.id;
  }

  await prisma.$transaction([
    prisma.issueReport.update({ where: { id: issueId }, data: { status, duplicateOfId } }),
    prisma.issueEvent.create({
      data: { issueId, status, note: note || null, actorId: actor.id },
    }),
  ]);
}

/** Aggregate only: counts per neighborhood and status. No text, coordinates or reporter ever leave this function. */
export async function publicIssueCounts(): Promise<{ areaSlug: string; status: IssueStatusName; count: number }[]> {
  const rows = await prisma.issueReport.groupBy({
    by: ["areaSlug", "status"],
    where: { status: { notIn: ["DUPLICATE", "DECLINED"] } },
    _count: { _all: true },
  });
  return rows.map((r) => ({ areaSlug: r.areaSlug, status: r.status as IssueStatusName, count: r._count._all }));
}

export { ISSUE_CATEGORIES };
