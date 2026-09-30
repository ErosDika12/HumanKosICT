import "server-only";
import { prisma } from "@/lib/prisma";
import { assertBoundedText } from "@/lib/validation";
import { areFriends, SocialError } from "./friends";

export const MAX_MESSAGE_LENGTH = 1000;
const MAX_MESSAGES_SENT_PER_USER = 200;

export interface ThreadSummary {
  friendId: string;
  friendName: string;
  lastBody: string;
  lastAt: Date;
  lastIsMine: boolean;
  unread: number;
  hasSeededExample: boolean;
}

export interface ThreadMessage {
  id: string;
  mine: boolean;
  body: string;
  createdAt: Date;
  isSeededExample: boolean;
}

/**
 * Direct messages exist only between friends. A fictional demo friend never
 * replies live: the thread holds the viewer's own messages plus clearly
 * labeled seeded example lines (isSeededExample).
 */
export async function sendMessage(actorId: string, friendId: string, body: string): Promise<void> {
  const text = body.trim();
  if (!text) throw new SocialError("Write a message first.");
  assertBoundedText(text, MAX_MESSAGE_LENGTH, "Message");
  if (!(await areFriends(actorId, friendId))) throw new SocialError("You can only message friends.");
  const sent = await prisma.message.count({ where: { senderId: actorId, isSeededExample: false } });
  if (sent >= MAX_MESSAGES_SENT_PER_USER) throw new SocialError("Message limit reached for this demo account.");
  await prisma.message.create({ data: { senderId: actorId, recipientId: friendId, body: text } });
}

export async function getThread(viewerId: string, friendId: string): Promise<ThreadMessage[]> {
  const rows = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: viewerId, recipientId: friendId },
        { senderId: friendId, recipientId: viewerId },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 200,
  });
  return rows.map((m) => ({
    id: m.id,
    mine: m.senderId === viewerId,
    body: m.body,
    createdAt: m.createdAt,
    isSeededExample: m.isSeededExample,
  }));
}

export async function markThreadRead(viewerId: string, friendId: string): Promise<void> {
  await prisma.message.updateMany({
    where: { senderId: friendId, recipientId: viewerId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function listThreads(viewerId: string): Promise<ThreadSummary[]> {
  const rows = await prisma.message.findMany({
    where: { OR: [{ senderId: viewerId }, { recipientId: viewerId }] },
    orderBy: { createdAt: "desc" },
    include: { sender: { select: { id: true, name: true } }, recipient: { select: { id: true, name: true } } },
    take: 400,
  });
  const threads = new Map<string, ThreadSummary>();
  for (const m of rows) {
    const mine = m.senderId === viewerId;
    const other = mine ? m.recipient : m.sender;
    let t = threads.get(other.id);
    if (!t) {
      t = {
        friendId: other.id,
        friendName: other.name,
        lastBody: m.body,
        lastAt: m.createdAt,
        lastIsMine: mine,
        unread: 0,
        hasSeededExample: false,
      };
      threads.set(other.id, t);
    }
    if (!mine && !m.readAt) t.unread += 1;
    if (m.isSeededExample) t.hasSeededExample = true;
  }
  return [...threads.values()].sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());
}

export async function unreadMessageCount(viewerId: string): Promise<number> {
  return prisma.message.count({ where: { recipientId: viewerId, readAt: null } });
}
