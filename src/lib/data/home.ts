import "server-only";
import { prisma } from "@/lib/prisma";

export interface FriendExample {
  activitySlug: string;
  inviter: string;
  friend: string;
  message: string | null;
  accepted: boolean;
}

/**
 * The seeded invitation shown on the homepage as ONE concrete "go with a
 * friend" example. Read from stored records (never typed into the page), and
 * the page labels it a demo example between fictional people.
 */
export async function getFriendExample(): Promise<FriendExample | null> {
  const invite = await prisma.activityInvite.findFirst({
    where: { isSeededExample: true, status: "ACCEPTED", from: { isDemoVisitor: false }, to: { isDemoVisitor: false } },
    orderBy: { createdAt: "asc" },
    select: {
      message: true,
      activity: { select: { slug: true, status: true } },
      from: { select: { name: true } },
      to: { select: { name: true } },
    },
  });
  if (!invite || invite.activity.status !== "PUBLISHED") return null;
  return {
    activitySlug: invite.activity.slug,
    inviter: invite.from.name,
    friend: invite.to.name,
    message: invite.message,
    accepted: true,
  };
}
