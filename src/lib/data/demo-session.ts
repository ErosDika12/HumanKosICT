import "server-only";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  serializeAvailability,
  VISITOR_DEFAULT_AREA,
  VISITOR_DEFAULT_AVAILABILITY,
  VISITOR_DEFAULT_INTERESTS,
  VISITOR_STARTER_CONVERSATIONS,
  VISITOR_STARTER_FRIEND_IDS,
  VISITOR_STARTER_INVITE,
} from "@/lib/demo-social";

/**
 * One-click "Log in as demo" (public site).
 *
 * Isolation model: every click creates a brand-new, ordinary MEMBER account
 * (never an organizer, moderator or analyst) with its OWN copy of the starter
 * friendships, example conversation and invitation. Everything the visitor
 * does — RSVPs, friends, invites, messages, assistant usage — is stored on
 * that account, so visitors cannot see or damage each other's experience.
 * Shared state is protected too: visitor RSVPs never count toward shared
 * capacity, visitors never appear in anyone's matches, and they are excluded
 * from municipal aggregates. Accounts are purged after DEMO_VISITOR_TTL_HOURS
 * (cascade deletes remove everything they created), and creation is capped.
 */
export const DEMO_VISITOR_TTL_HOURS = 24;
const MAX_ACTIVE_VISITORS = 400;
const CREATE_BURST_LIMIT = 60; // new visitors per rolling 10 minutes, site-wide

export class DemoLoginUnavailableError extends Error {}

export function isDemoLoginEnabled(): boolean {
  return process.env.DEMO_LOGIN_DISABLED !== "1";
}

async function purgeExpiredVisitors(): Promise<void> {
  const cutoff = new Date(Date.now() - DEMO_VISITOR_TTL_HOURS * 3600_000);
  await prisma.user.deleteMany({ where: { isDemoVisitor: true, createdAt: { lt: cutoff } } });
}

export async function createDemoVisitor(): Promise<{ id: string; role: "MEMBER" }> {
  if (!isDemoLoginEnabled()) throw new DemoLoginUnavailableError("Demo login is turned off.");
  await purgeExpiredVisitors();

  const [active, recent] = await Promise.all([
    prisma.user.count({ where: { isDemoVisitor: true } }),
    prisma.user.count({ where: { isDemoVisitor: true, createdAt: { gt: new Date(Date.now() - 10 * 60_000) } } }),
  ]);
  if (recent >= CREATE_BURST_LIMIT) {
    throw new DemoLoginUnavailableError("The demo is busy right now — please try again in a few minutes.");
  }
  if (active >= MAX_ACTIVE_VISITORS) {
    // Free the oldest hundred instead of refusing the visitor.
    const oldest = await prisma.user.findMany({
      where: { isDemoVisitor: true },
      orderBy: { createdAt: "asc" },
      take: 100,
      select: { id: true },
    });
    await prisma.user.deleteMany({ where: { id: { in: oldest.map((u) => u.id) } } });
  }

  const suffix = randomBytes(4).toString("hex");
  const id = `visitor-${suffix}`;
  const passwordHash = await bcrypt.hash(randomBytes(24).toString("hex"), 4); // nobody can log in with it

  await prisma.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        id,
        email: `visitor-${suffix}@demo-visitor.humannetwork.example`,
        passwordHash,
        role: "MEMBER",
        name: `Guest ${Math.floor(1000 + Math.random() * 9000)}`,
        bio: "A one-click demo visitor. Everything you do here is stored on this temporary account only.",
        isDiscoverable: true,
        isDemoPersona: false,
        isDemoVisitor: true,
        areaSq: VISITOR_DEFAULT_AREA,
        availability: serializeAvailability(VISITOR_DEFAULT_AVAILABILITY),
      },
    });
    await tx.userInterest.createMany({
      data: VISITOR_DEFAULT_INTERESTS.map((interestId) => ({ userId: id, interestId })),
    });
    for (const friendId of VISITOR_STARTER_FRIEND_IDS) {
      await tx.friendship.createMany({
        data: [
          { userId: id, friendId, isSeededExample: true },
          { userId: friendId, friendId: id, isSeededExample: true },
        ],
      });
    }
    const base = Date.now() - VISITOR_STARTER_CONVERSATIONS.length * 60_000;
    for (const [i, m] of VISITOR_STARTER_CONVERSATIONS.entries()) {
      const fromVisitor = m.from === "VISITOR";
      await tx.message.create({
        data: {
          senderId: fromVisitor ? id : m.from,
          recipientId: m.to === "VISITOR" ? id : m.to,
          body: m.body,
          isSeededExample: true,
          createdAt: new Date(base + i * 60_000),
          readAt: new Date(base + i * 60_000),
        },
      });
    }
    const activity = await tx.activity.findUnique({ where: { slug: VISITOR_STARTER_INVITE.activitySlug } });
    if (activity) {
      await tx.activityInvite.create({
        data: {
          activityId: activity.id,
          fromUserId: VISITOR_STARTER_INVITE.fromFriendId,
          toUserId: id,
          message: VISITOR_STARTER_INVITE.message,
          isSeededExample: true,
        },
      });
    }
    await tx.notification.create({
      data: {
        userId: id,
        message: "Welcome to the demo! Arta (a fictional demo friend) invited you to a photography walk — open Plans to respond.",
        activityId: activity?.id,
      },
    });
  });

  return { id, role: "MEMBER" };
}

/** Real-action progress for the visitor's journey checklist — derived from stored rows only. */
export interface JourneyProgress {
  discovered: boolean;
  rsvped: boolean;
  friendAdded: boolean;
  invited: boolean;
  messaged: boolean;
  askedAssistant: boolean;
}

export async function getJourneyProgress(userId: string): Promise<JourneyProgress> {
  const [rsvps, friendsAdded, invites, messages, usage] = await Promise.all([
    prisma.rsvp.count({ where: { userId, status: "CONFIRMED" } }),
    prisma.friendship.count({ where: { userId, isSeededExample: false } }),
    prisma.activityInvite.count({ where: { fromUserId: userId, isSeededExample: false } }),
    prisma.message.count({ where: { senderId: userId, isSeededExample: false } }),
    prisma.assistantUsage.count({ where: { userId } }),
  ]);
  return {
    discovered: rsvps > 0 || invites > 0,
    rsvped: rsvps > 0,
    friendAdded: friendsAdded > 0 || invites > 0,
    invited: invites > 0,
    messaged: messages > 0,
    askedAssistant: usage > 0,
  };
}
