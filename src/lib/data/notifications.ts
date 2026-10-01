import "server-only";
import { prisma } from "@/lib/prisma";
import { SIMULATED_NOW_ISO } from "@/lib/simulated-clock";
import { addDaysIso } from "@/lib/time-window";

/**
 * Simple in-app inbox — no external messaging dependency (Phase 4 brief).
 * Only ever created for a genuinely useful state change: RSVP confirmation
 * (src/lib/data/rsvp.ts) or an organizer edit to an event's date/time/venue,
 * or a cancellation (src/lib/data/activities.ts) — never a marketing ping,
 * never on every possible action.
 */
export async function notifyUser(
  userId: string,
  message: string,
  activityId?: string
): Promise<void> {
  await prisma.notification.create({ data: { userId, message, activityId } });
}

/** Notifies everyone with a CONFIRMED RSVP on an activity — used for organizer edits/cancellations. */
export async function notifyRsvpHolders(activityId: string, message: string): Promise<void> {
  const rsvps = await prisma.rsvp.findMany({
    where: { activityId, status: "CONFIRMED" },
    select: { userId: true },
  });
  if (rsvps.length === 0) return;
  await prisma.notification.createMany({
    data: rsvps.map((r) => ({ userId: r.userId, message, activityId })),
  });
}

export interface NotificationItem {
  id: string;
  message: string;
  createdAt: Date;
  readAt: Date | null;
  activitySlug: string | null;
  activityTitle: string | null;
}

export async function listNotifications(userId: string): Promise<NotificationItem[]> {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { activity: { select: { slug: true, title: true } } },
    take: 50,
  });
  return rows.map((r) => ({
    id: r.id,
    message: r.message,
    createdAt: r.createdAt,
    readAt: r.readAt,
    activitySlug: r.activity?.slug ?? null,
    activityTitle: r.activity?.title ?? null,
  }));
}

export async function unreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export interface ReminderItem {
  slug: string;
  title: string;
  titleSq: string;
  date: string;
  startTime: string;
  venueName: string;
}

/**
 * In-app reminders for plans that are coming up within the next week of the
 * SIMULATED calendar. Derived from the visitor's confirmed RSVPs at read time —
 * there is no background scheduler, so a reminder can never be late, duplicated
 * or sent for an RSVP that was canceled.
 */
export async function listReminders(userId: string, withinDays = 6): Promise<ReminderItem[]> {
  const to = addDaysIso(SIMULATED_NOW_ISO, withinDays);
  const rows = await prisma.rsvp.findMany({
    where: {
      userId,
      status: "CONFIRMED",
      activity: { status: "PUBLISHED", date: { gte: SIMULATED_NOW_ISO, lte: to } },
    },
    select: { activity: { select: { slug: true, title: true, titleSq: true, date: true, startTime: true, venueName: true } } },
  });
  return rows
    .map((r) => r.activity)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
}
