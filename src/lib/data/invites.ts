import "server-only";
import { prisma } from "@/lib/prisma";
import { SIMULATED_NOW_ISO, isSimulatedPast } from "@/lib/simulated-clock";
import { assertBoundedText, MAX_SHORT_TEXT } from "@/lib/validation";
import { decideSimulatedReply } from "@/lib/demo-social";
import { areFriends, SocialError } from "./friends";
import { createRsvp } from "./rsvp";
import { notifyUser } from "./notifications";

const MAX_OPEN_INVITES_PER_USER = 30;

export interface InviteView {
  id: string;
  direction: "sent" | "received";
  otherId: string;
  otherName: string;
  message: string | null;
  status: "pending" | "accepted" | "declined";
  /** True when a fictional friend's status came from the transparent availability rule. */
  isSimulatedReply: boolean;
  replyNote: string | null;
  isSeededExample: boolean;
}

export interface PlanView {
  activity: {
    id: string;
    slug: string;
    title: string;
    date: string;
    startTime: string;
    venueName: string;
    areaEn: string;
    category: string;
    isPast: boolean;
    isCanceled: boolean;
  };
  myRsvp: "confirmed" | "none";
  invites: InviteView[];
}

/**
 * "Come with me": the sender must already be friends with the recipient, the
 * activity must be upcoming and not canceled, and re-inviting the same friend
 * to the same activity updates the existing invitation (never a duplicate).
 *
 * A fictional demo friend cannot reply live. Their status is decided by
 * `decideSimulatedReply` — their stored availability, interests and
 * accessibility need — and is stored with isSimulatedReply = true so every
 * screen labels it as such.
 */
export async function sendInvite(actorId: string, friendId: string, activityId: string, message: string): Promise<void> {
  assertBoundedText(message, MAX_SHORT_TEXT, "Invitation message");
  if (typeof activityId !== "string" || !activityId) throw new SocialError("Choose an activity to invite them to.");
  if (!(await areFriends(actorId, friendId))) throw new SocialError("Add this person as a friend before inviting them.");

  const [activity, friend, openCount] = await Promise.all([
    prisma.activity.findUnique({
      where: { id: activityId },
      include: { interests: { select: { interestId: true } } },
    }),
    prisma.user.findUnique({
      where: { id: friendId },
      select: { id: true, name: true, isDemoFriend: true, availability: true, interests: { select: { interestId: true } } },
    }),
    prisma.activityInvite.count({ where: { fromUserId: actorId } }),
  ]);
  if (!activity || activity.status !== "PUBLISHED") throw new SocialError("That activity is not available.");
  if (isSimulatedPast(activity.date)) throw new SocialError("That activity has already happened.");
  if (!friend) throw new SocialError("Friend not found.");

  const existing = await prisma.activityInvite.findUnique({
    where: { activityId_fromUserId_toUserId: { activityId, fromUserId: actorId, toUserId: friendId } },
  });
  if (!existing && openCount >= MAX_OPEN_INVITES_PER_USER) {
    throw new SocialError("Invitation limit reached for this demo account.");
  }

  const confirmed = await prisma.rsvp.count({
    where: { activityId, status: "CONFIRMED", user: { isDemoVisitor: false } },
  });
  const isFull = confirmed + activity.simulatedRsvpBaseline >= activity.capacity;

  let status: "PENDING" | "ACCEPTED" | "DECLINED" = "PENDING";
  let replyNote: string | null = null;
  let isSimulatedReply = false;
  if (friend.isDemoFriend) {
    const reply = decideSimulatedReply({
      friend: {
        name: friend.name,
        interests: friend.interests.map((i) => i.interestId),
        availability: friend.availability,
      },
      activity: {
        title: activity.title,
        date: activity.date,
        startTime: activity.startTime,
        category: activity.category.toLowerCase(),
        interestTags: activity.interests.map((i) => i.interestId),
        accessibility: activity.accessibility.split(",").filter(Boolean),
        isFull,
      },
    });
    status = reply.status;
    replyNote = reply.note;
    isSimulatedReply = true;
  }

  const trimmed = message.trim() || `Want to come to "${activity.title}" with me?`;
  await prisma.activityInvite.upsert({
    where: { activityId_fromUserId_toUserId: { activityId, fromUserId: actorId, toUserId: friendId } },
    create: {
      activityId,
      fromUserId: actorId,
      toUserId: friendId,
      message: trimmed,
      status,
      isSimulatedReply,
      replyNote,
      respondedAt: status === "PENDING" ? null : new Date(),
    },
    update: {
      message: trimmed,
      status,
      isSimulatedReply,
      replyNote,
      respondedAt: status === "PENDING" ? null : new Date(),
    },
  });

  // The invitation also appears in the conversation thread, as the sender's own message.
  await prisma.message.create({
    data: { senderId: actorId, recipientId: friendId, body: `Invitation: ${activity.title} — ${trimmed}` },
  });
  await notifyUser(actorId, `Invitation sent to ${friend.name} for "${activity.title}".`, activityId);
}

/** The recipient of an invitation accepts (which RSVPs them) or declines. */
export async function respondToInvite(actorId: string, inviteId: string, accept: boolean): Promise<void> {
  const invite = await prisma.activityInvite.findUnique({ where: { id: inviteId } });
  if (!invite || invite.toUserId !== actorId) throw new SocialError("Only the invited person can respond.");
  if (invite.status !== "PENDING") return;
  if (accept) {
    await createRsvp(actorId, invite.activityId); // throws if full / past — surfaced to the user
  }
  await prisma.activityInvite.update({
    where: { id: inviteId },
    data: { status: accept ? "ACCEPTED" : "DECLINED", respondedAt: new Date() },
  });
}

function toInviteView(
  row: {
    id: string;
    fromUserId: string;
    toUserId: string;
    message: string | null;
    status: "PENDING" | "ACCEPTED" | "DECLINED";
    isSimulatedReply: boolean;
    replyNote: string | null;
    isSeededExample: boolean;
    from: { name: string };
    to: { name: string };
  },
  viewerId: string
): InviteView {
  const sent = row.fromUserId === viewerId;
  return {
    id: row.id,
    direction: sent ? "sent" : "received",
    otherId: sent ? row.toUserId : row.fromUserId,
    otherName: sent ? row.to.name : row.from.name,
    message: row.message,
    status: row.status.toLowerCase() as InviteView["status"],
    isSimulatedReply: row.isSimulatedReply,
    replyNote: row.replyNote,
    isSeededExample: row.isSeededExample,
  };
}

/** Every upcoming activity the viewer RSVP'd to or was invited to / invited someone to. */
export async function listPlans(viewerId: string): Promise<PlanView[]> {
  const [invites, rsvps] = await Promise.all([
    prisma.activityInvite.findMany({
      where: { OR: [{ fromUserId: viewerId }, { toUserId: viewerId }] },
      include: { activity: true, from: { select: { name: true } }, to: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.rsvp.findMany({ where: { userId: viewerId, status: "CONFIRMED" }, include: { activity: true } }),
  ]);
  const plans = new Map<string, PlanView>();
  const ensure = (a: (typeof rsvps)[number]["activity"]) => {
    let plan = plans.get(a.id);
    if (!plan) {
      plan = {
        activity: {
          id: a.id,
          slug: a.slug,
          title: a.title,
          date: a.date,
          startTime: a.startTime,
          venueName: a.venueName,
          areaEn: a.areaEn,
          category: a.category.toLowerCase(),
          isPast: isSimulatedPast(a.date),
          isCanceled: a.status === "CANCELED",
        },
        myRsvp: "none",
        invites: [],
      };
      plans.set(a.id, plan);
    }
    return plan;
  };
  for (const r of rsvps) ensure(r.activity).myRsvp = "confirmed";
  for (const inv of invites) ensure(inv.activity).invites.push(toInviteView(inv, viewerId));
  return [...plans.values()].sort(
    (a, b) => a.activity.date.localeCompare(b.activity.date) || a.activity.startTime.localeCompare(b.activity.startTime)
  );
}

export async function getPlan(viewerId: string, activityId: string): Promise<PlanView | null> {
  return (await listPlans(viewerId)).find((p) => p.activity.id === activityId) ?? null;
}

/** Pending invitations addressed to the viewer (e.g. the seeded one from Arta). */
export async function countPendingInvitesForViewer(viewerId: string): Promise<number> {
  return prisma.activityInvite.count({ where: { toUserId: viewerId, status: "PENDING" } });
}

/** Upcoming activities the viewer is going to (confirmed RSVP, not canceled, on/after the simulated today). Drives the Plans badge. */
export async function countUpcomingPlans(viewerId: string): Promise<number> {
  return prisma.rsvp.count({
    where: { userId: viewerId, status: "CONFIRMED", activity: { status: "PUBLISHED", date: { gte: SIMULATED_NOW_ISO } } },
  });
}

/** The viewer's own invitations for one activity (who they invited, and each status). */
export async function getInvitesForActivity(viewerId: string, activityId: string): Promise<InviteView[]> {
  const rows = await prisma.activityInvite.findMany({
    where: { activityId, OR: [{ fromUserId: viewerId }, { toUserId: viewerId }] },
    include: { from: { select: { name: true } }, to: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((r) => toInviteView(r, viewerId));
}
