import "server-only";
import { prisma } from "@/lib/prisma";

export async function fileReport(reporterId: string, activityId: string, reason: string): Promise<void> {
  if (!reason.trim()) throw new Error("A reason is required.");
  await prisma.report.create({
    data: { reporterId, activityId, reason: reason.trim() },
  });
}

export interface ReportListItem {
  id: string;
  reason: string;
  status: "OPEN" | "RESOLVED" | "DISMISSED";
  createdAt: Date;
  activityTitle: string | null;
  reporterName: string;
}

/** Moderator-only. Never exposes the reporter's email or other private fields. */
export async function listOpenReports(): Promise<ReportListItem[]> {
  const reports = await prisma.report.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    include: {
      activity: { select: { title: true } },
      reporter: { select: { name: true } },
    },
  });
  return reports.map((r) => ({
    id: r.id,
    reason: r.reason,
    status: r.status,
    createdAt: r.createdAt,
    activityTitle: r.activity?.title ?? null,
    reporterName: r.reporter.name,
  }));
}

export async function resolveReport(moderatorId: string, reportId: string, note?: string): Promise<void> {
  await prisma.report.update({
    where: { id: reportId },
    data: { status: "RESOLVED", moderatorId, moderatorNote: note, resolvedAt: new Date() },
  });
}
