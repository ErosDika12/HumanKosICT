import "server-only";
import { prisma } from "@/lib/prisma";

export interface PendingCommunity {
  id: string;
  slug: string;
  name: string;
  organizerName: string;
  createdAt: Date;
}

export interface PendingActivity {
  id: string;
  slug: string;
  title: string;
  communityName: string;
  organizerName: string;
  createdAt: Date;
}

/**
 * Moderator-only publishing queue — the server side of "do not make every
 * new public community/event instantly trusted by default"
 * (docs/PRODUCT_CONTRACT.md). Nothing an organizer creates is discoverable
 * until it appears here and a moderator explicitly publishes it.
 */
export async function listPendingCommunities(): Promise<PendingCommunity[]> {
  const rows = await prisma.community.findMany({
    where: { status: "DRAFT" },
    include: { organizer: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    organizerName: r.organizer.name,
    createdAt: r.createdAt,
  }));
}

export async function listPendingActivities(): Promise<PendingActivity[]> {
  const rows = await prisma.activity.findMany({
    where: { status: "DRAFT" },
    include: { organizer: { select: { name: true } }, community: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    communityName: r.community.name,
    organizerName: r.organizer.name,
    createdAt: r.createdAt,
  }));
}

export async function publishCommunity(communityId: string): Promise<void> {
  await prisma.community.update({ where: { id: communityId }, data: { status: "PUBLISHED" } });
}

export async function publishActivity(activityId: string): Promise<void> {
  await prisma.activity.update({ where: { id: activityId }, data: { status: "PUBLISHED" } });
}
