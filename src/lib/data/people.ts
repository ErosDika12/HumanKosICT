import "server-only";
import { prisma } from "@/lib/prisma";
import { findMatches, type PersonInput, type PersonMatch } from "./people-matching";
import type { InterestId } from "@/lib/types";
import { assertBoundedText, MAX_SHORT_TEXT } from "@/lib/validation";

async function toPersonInput(userId: string): Promise<PersonInput | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      interests: { select: { interestId: true } },
      memberships: {
        where: { status: "ACTIVE" },
        select: { community: { select: { id: true, name: true } } },
      },
      projectVolunteers: {
        where: { status: "ACTIVE" },
        select: { project: { select: { id: true, title: true } } },
      },
    },
  });
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    bio: user.bio,
    isDiscoverable: user.isDiscoverable,
    interestIds: user.interests.map((i) => i.interestId as InterestId),
    communities: user.memberships.map((m) => m.community),
    projects: user.projectVolunteers.map((v) => ({ id: v.project.id, name: v.project.title })),
  };
}

/**
 * Never returns anyone who isn't opted in (`isDiscoverable`), never
 * includes email/exact location, and never a match with no named mutual
 * basis. Works correctly with as few as two or three discoverable adults —
 * see docs/DEMO_DATA.md for the seeded fixture.
 */
export async function listMatches(viewerId: string): Promise<PersonMatch[]> {
  const viewer = await toPersonInput(viewerId);
  if (!viewer) return [];

  const [otherUsers, blocksMade, blocksReceived] = await Promise.all([
    prisma.user.findMany({
      // One-click demo visitors are isolated: never shown to anyone else.
      where: { id: { not: viewerId }, isDiscoverable: true, isDemoVisitor: false },
      select: { id: true },
    }),
    prisma.block.findMany({ where: { blockerId: viewerId }, select: { blockedId: true } }),
    prisma.block.findMany({ where: { blockedId: viewerId }, select: { blockerId: true } }),
  ]);

  const others = (
    await Promise.all(otherUsers.map((u) => toPersonInput(u.id)))
  ).filter((p): p is PersonInput => p !== null);

  const blocked = new Set([
    ...blocksMade.map((b) => b.blockedId),
    ...blocksReceived.map((b) => b.blockerId),
  ]);

  return findMatches(viewer, others, blocked);
}

export async function blockUser(actorId: string, targetId: string): Promise<void> {
  if (actorId === targetId) throw new Error("You cannot block yourself.");
  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId: actorId, blockedId: targetId } },
    create: { blockerId: actorId, blockedId: targetId },
    update: {},
  });
  // Blocking withdraws any pending connection in either direction — a
  // block is never a soft signal.
  await prisma.connectionRequest.updateMany({
    where: {
      status: "PENDING",
      OR: [
        { fromUserId: actorId, toUserId: targetId },
        { fromUserId: targetId, toUserId: actorId },
      ],
    },
    data: { status: "DECLINED", decidedAt: new Date() },
  });
  // Blocking also ends any friendship in either direction.
  await prisma.friendship.deleteMany({
    where: { OR: [{ userId: actorId, friendId: targetId }, { userId: targetId, friendId: actorId }] },
  });
}

export async function unblockUser(actorId: string, targetId: string): Promise<void> {
  await prisma.block.deleteMany({ where: { blockerId: actorId, blockedId: targetId } });
}

export async function reportUser(actorId: string, targetId: string, reason: string): Promise<void> {
  if (!reason.trim()) throw new Error("A reason is required.");
  assertBoundedText(reason, MAX_SHORT_TEXT, "Report reason");
  if (actorId === targetId) throw new Error("You cannot report yourself.");
  await prisma.report.create({
    data: { reporterId: actorId, reportedUserId: targetId, reason: reason.trim() },
  });
}

/**
 * "Mutual interest or participation should precede a contact request" —
 * re-checked here server-side (never trusting that the UI only showed the
 * button because a match existed), not just enforced by which button the
 * page happened to render.
 */
export async function requestConnection(actorId: string, targetId: string, reason: string): Promise<void> {
  if (actorId === targetId) throw new Error("You cannot connect with yourself.");
  assertBoundedText(reason, MAX_SHORT_TEXT, "Connection request reason");
  const matches = await listMatches(actorId);
  if (!matches.some((m) => m.id === targetId)) {
    throw new Error("A connection request requires a shared interest, community, or project first.");
  }
  await prisma.connectionRequest.upsert({
    where: { fromUserId_toUserId: { fromUserId: actorId, toUserId: targetId } },
    create: { fromUserId: actorId, toUserId: targetId, reason: reason.trim() || "Would like to connect." },
    update: { status: "PENDING", reason: reason.trim() || "Would like to connect.", decidedAt: null },
  });
}

export interface ConnectionRequestItem {
  id: string;
  fromUserId: string;
  fromName: string;
  reason: string;
  createdAt: Date;
}

export async function listIncomingConnectionRequests(userId: string): Promise<ConnectionRequestItem[]> {
  const rows = await prisma.connectionRequest.findMany({
    where: { toUserId: userId, status: "PENDING" },
    include: { fromUser: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    fromUserId: r.fromUserId,
    fromName: r.fromUser.name,
    reason: r.reason,
    createdAt: r.createdAt,
  }));
}

export async function decideConnectionRequest(
  actorId: string,
  requestId: string,
  decision: "accept" | "decline"
): Promise<void> {
  const request = await prisma.connectionRequest.findUniqueOrThrow({ where: { id: requestId } });
  if (request.toUserId !== actorId) {
    throw new Error("Only the recipient can respond to a connection request.");
  }
  await prisma.connectionRequest.update({
    where: { id: requestId },
    data: { status: decision === "accept" ? "ACCEPTED" : "DECLINED", decidedAt: new Date() },
  });
}
