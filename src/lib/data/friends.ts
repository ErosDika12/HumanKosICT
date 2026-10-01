import "server-only";
import { prisma } from "@/lib/prisma";
import { getInterest, type InterestId } from "@/lib/types";
import { isSimulatedPast } from "@/lib/simulated-clock";
import { listMatches } from "./people";
import { listActivities } from "./activities";
import { parseAvailability, slotOfActivity, SLOT_LABEL, type AvailabilitySlot } from "@/lib/demo-social";
import type { DemoActivity } from "@/lib/types";

export class SocialError extends Error {}

export interface FriendCard {
  id: string;
  name: string;
  bio: string | null;
  areaSq: string | null;
  interests: { id: InterestId; label: string; emoji: string }[];
  availability: AvailabilitySlot[];
  needsAccessible: boolean;
  isFriend: boolean;
  isSeededExample: boolean;
  /** Why this person is suggested — shared interest / community / project, never a score. */
  reasons: string[];
  sharedInterestIds: InterestId[];
}

function toInterestChips(ids: string[]) {
  return ids.map((id) => {
    const i = getInterest(id as InterestId);
    return { id: i.id, label: i.labelEn, emoji: i.emoji };
  });
}

const FRIEND_SELECT = {
  id: true,
  name: true,
  bio: true,
  areaSq: true,
  availability: true,
  isDemoFriend: true,
  interests: { select: { interestId: true } },
} as const;

async function viewerInterestIds(viewerId: string): Promise<string[]> {
  const rows = await prisma.userInterest.findMany({ where: { userId: viewerId }, select: { interestId: true } });
  return rows.map((r) => r.interestId);
}

function toCard(
  u: {
    id: string;
    name: string;
    bio: string | null;
    areaSq: string | null;
    availability: string | null;
    interests: { interestId: string }[];
  },
  viewerInterests: string[],
  isFriend: boolean,
  isSeededExample: boolean,
  reasons: string[]
): FriendCard {
  const { slots, needsAccessible } = parseAvailability(u.availability);
  const ids = u.interests.map((i) => i.interestId);
  return {
    id: u.id,
    name: u.name,
    bio: u.bio,
    areaSq: u.areaSq,
    interests: toInterestChips(ids),
    availability: slots,
    needsAccessible,
    isFriend,
    isSeededExample,
    reasons,
    sharedInterestIds: ids.filter((i) => viewerInterests.includes(i)) as InterestId[],
  };
}

export async function listFriends(viewerId: string): Promise<FriendCard[]> {
  const [rows, mine] = await Promise.all([
    prisma.friendship.findMany({
      where: { userId: viewerId },
      include: { friend: { select: FRIEND_SELECT } },
      orderBy: { createdAt: "asc" },
    }),
    viewerInterestIds(viewerId),
  ]);
  return rows.map((r) => toCard(r.friend, mine, true, r.isSeededExample, []));
}

/**
 * Suggested demo friends: only discoverable, non-visitor people who share a
 * real interest, community or project with the viewer (the existing
 * listMatches rule) and are not friends yet. Never a compatibility score.
 */
export async function listFriendSuggestions(viewerId: string): Promise<FriendCard[]> {
  const [matches, friendRows, mine] = await Promise.all([
    listMatches(viewerId),
    prisma.friendship.findMany({ where: { userId: viewerId }, select: { friendId: true } }),
    viewerInterestIds(viewerId),
  ]);
  const friendIds = new Set(friendRows.map((f) => f.friendId));
  const candidates = matches.filter((m) => !friendIds.has(m.id));
  if (candidates.length === 0) return [];
  const users = await prisma.user.findMany({
    where: { id: { in: candidates.map((c) => c.id) }, isDemoFriend: true },
    select: FRIEND_SELECT,
  });
  const byId = new Map(users.map((u) => [u.id, u]));
  return candidates
    .filter((c) => byId.has(c.id))
    .map((c) => toCard(byId.get(c.id)!, mine, false, false, c.reasons));
}

export async function areFriends(userId: string, otherId: string): Promise<boolean> {
  const row = await prisma.friendship.findUnique({
    where: { userId_friendId: { userId, friendId: otherId } },
    select: { id: true },
  });
  return row !== null;
}

export async function getFriendProfile(viewerId: string, friendId: string): Promise<FriendCard | null> {
  const [user, mine, friendship, matches] = await Promise.all([
    prisma.user.findFirst({ where: { id: friendId, isDemoFriend: true }, select: FRIEND_SELECT }),
    viewerInterestIds(viewerId),
    prisma.friendship.findUnique({ where: { userId_friendId: { userId: viewerId, friendId } } }),
    listMatches(viewerId),
  ]);
  if (!user || user.id === viewerId) return null;
  const reasons = matches.find((m) => m.id === friendId)?.reasons ?? [];
  return toCard(user, mine, friendship !== null, friendship?.isSeededExample ?? false, reasons);
}

/**
 * Adding a FICTIONAL demo friend is instant — they cannot accept anything in
 * real time, and the UI says so. Only `isDemoFriend` accounts qualify.
 */
export async function addDemoFriend(actorId: string, friendId: string): Promise<void> {
  if (actorId === friendId) throw new SocialError("You cannot add yourself.");
  const friend = await prisma.user.findFirst({ where: { id: friendId, isDemoFriend: true }, select: { id: true } });
  if (!friend) throw new SocialError("That person is not a demo friend.");
  const blocked = await prisma.block.findFirst({
    where: { OR: [{ blockerId: actorId, blockedId: friendId }, { blockerId: friendId, blockedId: actorId }] },
    select: { id: true },
  });
  if (blocked) throw new SocialError("You cannot add someone you have blocked or who blocked you.");
  const friendCount = await prisma.friendship.count({ where: { userId: actorId } });
  if (friendCount >= 50) throw new SocialError("Friend limit reached for this demo account.");
  for (const [userId, other] of [[actorId, friendId], [friendId, actorId]] as const) {
    await prisma.friendship.upsert({
      where: { userId_friendId: { userId, friendId: other } },
      create: { userId, friendId: other },
      update: {},
    });
  }
}

export async function removeFriend(actorId: string, friendId: string): Promise<void> {
  await prisma.friendship.deleteMany({
    where: { OR: [{ userId: actorId, friendId }, { userId: friendId, friendId: actorId }] },
  });
}

export interface SuitableActivity {
  activity: DemoActivity;
  reasons: string[];
  slot: AvailabilitySlot;
  alreadyInvited: boolean;
}

/**
 * Upcoming activities that suit BOTH people: a shared interest, the friend's
 * stated availability, their accessibility need, and open capacity. Every
 * reason shown is derived from stored data — nothing is guessed.
 */
export async function suitableActivities(viewerId: string, friendId: string, limit = 4): Promise<SuitableActivity[]> {
  const [friend, mine, all, invites] = await Promise.all([
    prisma.user.findFirst({ where: { id: friendId, isDemoFriend: true }, select: FRIEND_SELECT }),
    viewerInterestIds(viewerId),
    listActivities(),
    prisma.activityInvite.findMany({ where: { fromUserId: viewerId, toUserId: friendId }, select: { activityId: true } }),
  ]);
  if (!friend) return [];
  const theirs = friend.interests.map((i) => i.interestId);
  const { slots, needsAccessible } = parseAvailability(friend.availability);
  const invited = new Set(invites.map((i) => i.activityId));

  const results: (SuitableActivity & { score: number })[] = [];
  for (const activity of all) {
    if (isSimulatedPast(activity.date) || activity.status === "canceled") continue;
    if (activity.ageEligibility === "supervised-minors") continue; // adults only for friend plans
    if (activity.rsvpCount >= activity.capacity) continue;
    const slot = slotOfActivity(activity.date, activity.startTime);
    if (!slots.includes(slot)) continue;
    if (needsAccessible && !activity.accessibility.includes("wheelchair-accessible")) continue;
    const sharedTags = activity.interestTags.filter((t) => mine.includes(t) && theirs.includes(t));
    const friendTags = activity.interestTags.filter((t) => theirs.includes(t));
    if (friendTags.length === 0) continue;

    const reasons: string[] = [];
    if (sharedTags.length > 0) {
      reasons.push(`You both like ${sharedTags.map((t) => getInterest(t).labelEn.toLowerCase()).join(", ")}`);
    } else {
      reasons.push(`${friend.name.split(" ")[0]} likes ${friendTags.map((t) => getInterest(t).labelEn.toLowerCase()).join(", ")}`);
    }
    reasons.push(`Fits ${friend.name.split(" ")[0]}'s ${SLOT_LABEL[slot]}`);
    if (needsAccessible) reasons.push("Wheelchair-accessible venue");
    const spotsLeft = activity.capacity - activity.rsvpCount;
    if (spotsLeft <= 3) reasons.push(`Only ${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left`);
    results.push({
      activity,
      reasons,
      slot,
      alreadyInvited: invited.has(activity.id),
      score: sharedTags.length * 3 + friendTags.length,
    });
  }
  return results
    .sort((a, b) => b.score - a.score || a.activity.date.localeCompare(b.activity.date))
    .slice(0, limit)
    .map((r) => ({ activity: r.activity, reasons: r.reasons, slot: r.slot, alreadyInvited: r.alreadyInvited }));
}

/** Public preview for the homepage: a few demo friends and their interests (no private fields exist here). */
export async function listFriendPreview(limit = 4, spread = true): Promise<Pick<FriendCard, "id" | "name" | "areaSq" | "interests" | "availability">[]> {
  const users = await prisma.user.findMany({
    where: { isDemoFriend: true, isDiscoverable: true, role: "MEMBER" },
    select: FRIEND_SELECT,
    orderBy: { name: "asc" },
  });
  // A varied handful: spread across neighborhoods rather than alphabetically adjacent.
  const seen = new Set<string>();
  const picked = users.filter((u) => {
    if (!spread) return true;
    const key = u.areaSq ?? "";
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return picked.slice(0, limit).map((u) => {
    const card = toCard(u, [], false, false, []);
    return { id: card.id, name: card.name, areaSq: card.areaSq, interests: card.interests, availability: card.availability };
  });
}

export async function getDemoStats(): Promise<{ activities: number; friends: number; communities: number }> {
  const [activities, friends, communities] = await Promise.all([
    prisma.activity.count({ where: { status: "PUBLISHED" } }),
    prisma.user.count({ where: { isDemoFriend: true } }),
    prisma.community.count({ where: { status: "PUBLISHED" } }),
  ]);
  return { activities, friends, communities };
}

/** Names only — used by the assistant to recognise a friend mentioned in a message. */
export async function listDemoFriendNames(): Promise<{ id: string; name: string }[]> {
  return prisma.user.findMany({
    where: { isDemoFriend: true, isDiscoverable: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
