import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { CATEGORY_FROM_DB, CATEGORY_TO_DB } from "./mappers";
import type { ActivityCategory } from "@/lib/types";
import { assertBoundedText, MAX_LONG_TEXT } from "@/lib/validation";
import { SIMULATED_NOW_ISO } from "@/lib/simulated-clock";

export class CommunityAuthorizationError extends Error {}

export interface CommunitySummary {
  id: string;
  slug: string;
  name: string;
  category: ActivityCategory;
  areaSq: string;
  visibility: "public" | "restricted";
  verified: boolean;
  memberCount: number;
  description: string;
  descriptionSq: string;
  /** The next published activity on or after the simulated today, or null. */
  nextActivity: { slug: string; title: string; date: string; startTime: string; areaEn: string } | null;
}

/** Only PUBLISHED communities — a DRAFT one (just created, not yet moderator-approved) never appears here. */
export async function listCommunities(): Promise<CommunitySummary[]> {
  const rows = await prisma.community.findMany({
    where: { status: "PUBLISHED" },
    include: {
      _count: { select: { memberships: { where: { status: "ACTIVE", user: { isDemoVisitor: false } } } } },
      activities: {
        where: { status: "PUBLISHED", date: { gte: SIMULATED_NOW_ISO } },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
        take: 1,
        select: { slug: true, title: true, date: true, startTime: true, areaEn: true },
      },
    },
    orderBy: { name: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    category: CATEGORY_FROM_DB[r.category],
    areaSq: r.areaSq,
    visibility: r.visibility === "RESTRICTED" ? "restricted" : "public",
    verified: r.verified,
    memberCount: r._count.memberships,
    description: r.description,
    descriptionSq: r.descriptionSq,
    nextActivity: r.activities[0] ?? null,
  }));
}

export type ViewerMembership = "none" | "pending" | "member" | "organizer";

export interface CommunityDetail extends Omit<CommunitySummary, "nextActivity"> {
  description: string;
  descriptionSq: string;
  language: string | null;
  rules: string | null;
  status: "draft" | "published";
  organizerName: string;
  organizerId: string;
  /** Published activities on or after the simulated today. */
  upcomingActivities: { slug: string; title: string; date: string; startTime: string }[];
  /** Published activities that already happened on the simulated clock, newest first. */
  pastActivities: { slug: string; title: string; date: string; startTime: string }[];
  projects: { slug: string; title: string; titleSq: string; status: "active" | "completed"; volunteersNeeded: number; volunteerCount: number }[];
  viewerMembership: ViewerMembership;
}

export async function getCommunityBySlug(
  slug: string,
  viewerId?: string
): Promise<CommunityDetail | null> {
  const community = await prisma.community.findUnique({
    where: { slug },
    include: {
      organizer: { select: { id: true, name: true } },
      _count: { select: { memberships: { where: { status: "ACTIVE", user: { isDemoVisitor: false } } } } },
      activities: {
        where: { status: "PUBLISHED" },
        orderBy: { date: "asc" },
        select: { slug: true, title: true, date: true, startTime: true },
      },
      projects: {
        orderBy: { createdAt: "asc" },
        include: { _count: { select: { volunteers: { where: { status: "ACTIVE", user: { isDemoVisitor: false } } } } } },
      },
    },
  });
  if (!community) return null;

  let viewerMembership: ViewerMembership = "none";
  if (viewerId) {
    if (community.organizerId === viewerId) {
      viewerMembership = "organizer";
    } else {
      const membership = await prisma.membership.findUnique({
        where: { userId_communityId: { userId: viewerId, communityId: community.id } },
      });
      if (membership) {
        viewerMembership =
          membership.role === "ORGANIZER" ? "organizer" : membership.status === "PENDING" ? "pending" : "member";
      }
    }
  }

  return {
    id: community.id,
    slug: community.slug,
    name: community.name,
    category: CATEGORY_FROM_DB[community.category],
    areaSq: community.areaSq,
    visibility: community.visibility === "RESTRICTED" ? "restricted" : "public",
    verified: community.verified,
    memberCount: community._count.memberships,
    description: community.description,
    descriptionSq: community.descriptionSq,
    language: community.language,
    rules: community.rules,
    status: community.status === "DRAFT" ? "draft" : "published",
    organizerName: community.organizer.name,
    organizerId: community.organizerId,
    upcomingActivities: community.activities.filter((a) => a.date >= SIMULATED_NOW_ISO),
    pastActivities: community.activities.filter((a) => a.date < SIMULATED_NOW_ISO).reverse(),
    projects: community.projects.map((p) => ({
      slug: p.slug,
      title: p.title,
      titleSq: p.titleSq,
      status: p.status === "COMPLETED" ? "completed" : "active",
      volunteersNeeded: p.volunteersNeeded,
      volunteerCount: p._count.volunteers,
    })),
    viewerMembership,
  };
}

async function assertCommunityOrganizer(actorId: string, communityId: string): Promise<void> {
  const community = await prisma.community.findUnique({ where: { id: communityId } });
  if (!community) throw new CommunityAuthorizationError("Community not found.");
  if (community.organizerId === actorId) return;
  const membership = await prisma.membership.findUnique({
    where: { userId_communityId: { userId: actorId, communityId } },
  });
  if (membership?.role === "ORGANIZER" && membership.status === "ACTIVE") return;
  throw new CommunityAuthorizationError("Only this community's organizer can do that.");
}

export { assertCommunityOrganizer };

/**
 * Joining a PUBLIC community activates membership immediately; joining a
 * RESTRICTED one creates a PENDING membership the organizer must approve —
 * never silent, automatic access (Phase 4 brief). Idempotent: re-joining
 * while already a member/pending is a no-op.
 */
export async function joinCommunity(userId: string, communityId: string): Promise<ViewerMembership> {
  const community = await prisma.community.findUniqueOrThrow({ where: { id: communityId } });
  const existing = await prisma.membership.findUnique({
    where: { userId_communityId: { userId, communityId } },
  });
  if (existing) {
    return existing.status === "PENDING" ? "pending" : existing.role === "ORGANIZER" ? "organizer" : "member";
  }

  const status: "ACTIVE" | "PENDING" = community.visibility === "RESTRICTED" ? "PENDING" : "ACTIVE";
  await prisma.membership.create({ data: { userId, communityId, status } });
  return status === "PENDING" ? "pending" : "member";
}

export async function leaveCommunity(userId: string, communityId: string): Promise<void> {
  const community = await prisma.community.findUnique({ where: { id: communityId } });
  if (community?.organizerId === userId) {
    throw new CommunityAuthorizationError("The organizer cannot leave their own community.");
  }
  await prisma.membership.deleteMany({ where: { userId, communityId } });
}

export interface PendingMember {
  membershipId: string;
  userId: string;
  name: string;
  joinedAt: Date;
}

export async function listPendingMembers(actorId: string, communityId: string): Promise<PendingMember[]> {
  await assertCommunityOrganizer(actorId, communityId);
  const rows = await prisma.membership.findMany({
    where: { communityId, status: "PENDING" },
    include: { user: { select: { name: true } } },
    orderBy: { joinedAt: "asc" },
  });
  return rows.map((r) => ({ membershipId: r.id, userId: r.userId, name: r.user.name, joinedAt: r.joinedAt }));
}

export async function decideMembership(
  actorId: string,
  membershipId: string,
  decision: "approve" | "deny"
): Promise<void> {
  const membership = await prisma.membership.findUniqueOrThrow({ where: { id: membershipId } });
  await assertCommunityOrganizer(actorId, membership.communityId);
  if (decision === "approve") {
    await prisma.membership.update({ where: { id: membershipId }, data: { status: "ACTIVE" } });
  } else {
    await prisma.membership.delete({ where: { id: membershipId } });
  }
}

export interface CreateCommunityInput {
  name: string;
  nameSq?: string;
  category: ActivityCategory;
  description: string;
  descriptionSq: string;
  areaSq: string;
  language?: string;
  rules?: string;
  visibility: "public" | "restricted";
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "community"
  );
}

/**
 * Any signed-in user may create a community (Phase 4 brief: "eligible
 * users can create a community"), but it starts DRAFT — invisible outside
 * this actor and any moderator until a moderator publishes it
 * (src/app/moderation/page.tsx) — "do not make every new public event
 * instantly trusted by default" applies to communities too.
 */
export async function createCommunity(actorId: string, input: CreateCommunityInput): Promise<string> {
  if (!input.name.trim() || !input.description.trim() || !input.descriptionSq.trim() || !input.areaSq.trim()) {
    throw new Error("Name, description (English and Albanian), and area are required.");
  }
  assertBoundedText(input.description, MAX_LONG_TEXT, "Description");
  assertBoundedText(input.descriptionSq, MAX_LONG_TEXT, "Description (Albanian)");
  const base = slugify(input.name);
  let slug = base;
  let suffix = 1;
  while (await prisma.community.findUnique({ where: { slug } })) {
    slug = `${base}-${++suffix}`;
  }

  const community = await prisma.community.create({
    data: {
      slug,
      name: input.name.trim(),
      nameSq: input.nameSq?.trim(),
      category: CATEGORY_TO_DB[input.category],
      description: input.description.trim(),
      descriptionSq: input.descriptionSq.trim(),
      areaSq: input.areaSq.trim(),
      language: input.language?.trim() || null,
      rules: input.rules?.trim() || null,
      visibility: input.visibility === "restricted" ? "RESTRICTED" : "PUBLIC",
      status: "DRAFT",
      organizerId: actorId,
    },
  });
  await prisma.membership.create({
    data: { userId: actorId, communityId: community.id, role: "ORGANIZER", status: "ACTIVE" },
  });
  return community.slug;
}

export interface UpdateCommunityInput {
  description?: string;
  descriptionSq?: string;
  language?: string;
  rules?: string;
  visibility?: "public" | "restricted";
}

export async function updateCommunity(
  actorId: string,
  communitySlug: string,
  input: UpdateCommunityInput
): Promise<void> {
  const community = await prisma.community.findUniqueOrThrow({ where: { slug: communitySlug } });
  await assertCommunityOrganizer(actorId, community.id);
  const data: Prisma.CommunityUpdateInput = {};
  if (input.description !== undefined) {
    assertBoundedText(input.description, MAX_LONG_TEXT, "Description");
    data.description = input.description.trim();
  }
  if (input.descriptionSq !== undefined) {
    assertBoundedText(input.descriptionSq, MAX_LONG_TEXT, "Description (Albanian)");
    data.descriptionSq = input.descriptionSq.trim();
  }
  if (input.language !== undefined) data.language = input.language.trim() || null;
  if (input.rules !== undefined) data.rules = input.rules.trim() || null;
  if (input.visibility !== undefined) {
    data.visibility = input.visibility === "restricted" ? "RESTRICTED" : "PUBLIC";
  }
  await prisma.community.update({ where: { id: community.id }, data });
}
