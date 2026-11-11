import "server-only";
import { prisma } from "@/lib/prisma";
import { assertRole, type Actor } from "@/lib/auth/roles";
import { MAX_PROPOSALS_PER_DAY } from "@/lib/city-config";
import { neighborhoodBySlug } from "@/lib/neighborhoods";
import { assertBoundedText, MAX_LONG_TEXT, MAX_SHORT_TEXT } from "@/lib/validation";

export interface ProposalView {
  id: string;
  title: string;
  body: string;
  areaSlug: string | null;
  createdAt: Date;
  supportCount: number;
  isSupportedByViewer: boolean;
}

/**
 * Community proposals are residents' own ideas. They are never official municipal
 * consultations, and the author is never shown.
 */
export async function listOpenProposals(viewerId?: string): Promise<ProposalView[]> {
  const rows = await prisma.cityProposal.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    include: {
      // Isolated demo visitors never change what other people see.
      _count: { select: { supports: { where: { user: { isDemoVisitor: false } } } } },
      supports: viewerId ? { where: { userId: viewerId }, select: { id: true } } : { take: 0, select: { id: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    areaSlug: r.areaSlug,
    createdAt: r.createdAt,
    supportCount: r._count.supports,
    isSupportedByViewer: r.supports.length > 0,
  }));
}

export async function createProposal(author: Actor, input: { title: string; body: string; areaSlug?: string }): Promise<string> {
  const title = (input.title ?? "").trim();
  const body = (input.body ?? "").trim();
  if (!title) throw new Error("Title is required.");
  if (!body) throw new Error("Description is required.");
  assertBoundedText(title, MAX_SHORT_TEXT, "Title");
  assertBoundedText(body, MAX_LONG_TEXT, "Description");
  const areaSlug = (input.areaSlug ?? "").trim() || null;
  if (areaSlug && !neighborhoodBySlug(areaSlug)) throw new Error("Unknown neighborhood.");

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent = await prisma.cityProposal.count({ where: { authorId: author.id, createdAt: { gte: since } } });
  if (recent >= MAX_PROPOSALS_PER_DAY) throw new Error("Proposal limit reached for today.");

  const created = await prisma.cityProposal.create({ data: { authorId: author.id, title, body, areaSlug } });
  return created.id;
}

/** Toggle; returns the new state. You can support a proposal once. */
export async function toggleProposalSupport(userId: string, proposalId: string): Promise<boolean> {
  const proposal = await prisma.cityProposal.findUnique({ where: { id: proposalId }, select: { status: true } });
  if (!proposal || proposal.status !== "OPEN") throw new Error("Proposal not found.");
  const existing = await prisma.cityProposalSupport.findUnique({ where: { proposalId_userId: { proposalId, userId } } });
  if (existing) {
    await prisma.cityProposalSupport.delete({ where: { id: existing.id } });
    return false;
  }
  await prisma.cityProposalSupport.create({ data: { proposalId, userId } });
  return true;
}

export async function hideProposal(actor: Actor, proposalId: string): Promise<void> {
  assertRole(actor, "MODERATOR");
  await prisma.cityProposal.update({ where: { id: proposalId }, data: { status: "HIDDEN" } });
}
