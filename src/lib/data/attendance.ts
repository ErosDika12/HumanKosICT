import "server-only";
import { prisma } from "@/lib/prisma";
import { isSimulatedPast } from "@/lib/simulated-clock";
import { assertCommunityOrganizer } from "./communities";

export class AttendanceError extends Error {}

export interface AttendeeRow {
  userId: string;
  name: string;
  attended: boolean;
}

/**
 * Organizer-only. Deliberately refuses for an activity whose date hasn't
 * passed on the simulated clock (src/lib/simulated-clock.ts) — confirming
 * attendance at an event that, in-universe, hasn't happened yet wouldn't
 * mean anything. Lists every CONFIRMED RSVP holder, not just already-marked
 * attendees, so the organizer can see who to check off.
 */
export async function listAttendeesForOrganizer(actorId: string, activityId: string): Promise<AttendeeRow[]> {
  const activity = await prisma.activity.findUniqueOrThrow({ where: { id: activityId } });
  await assertCommunityOrganizer(actorId, activity.communityId);
  if (!isSimulatedPast(activity.date)) {
    throw new AttendanceError("Check-in opens once this activity's date has passed.");
  }

  const [rsvps, attendances] = await Promise.all([
    prisma.rsvp.findMany({
      where: { activityId, status: "CONFIRMED" },
      include: { user: { select: { id: true, name: true } } },
    }),
    prisma.attendance.findMany({ where: { activityId }, select: { userId: true } }),
  ]);
  const attendedIds = new Set(attendances.map((a) => a.userId));
  return rsvps.map((r) => ({ userId: r.user.id, name: r.user.name, attended: attendedIds.has(r.user.id) }));
}

export async function markAttendance(actorId: string, activityId: string, userId: string): Promise<void> {
  const activity = await prisma.activity.findUniqueOrThrow({ where: { id: activityId } });
  await assertCommunityOrganizer(actorId, activity.communityId);
  if (!isSimulatedPast(activity.date)) {
    throw new AttendanceError("Check-in opens once this activity's date has passed.");
  }
  await prisma.attendance.upsert({
    where: { userId_activityId: { userId, activityId } },
    create: { userId, activityId, confirmedById: actorId },
    update: {},
  });
}

export async function unmarkAttendance(actorId: string, activityId: string, userId: string): Promise<void> {
  const activity = await prisma.activity.findUniqueOrThrow({ where: { id: activityId } });
  await assertCommunityOrganizer(actorId, activity.communityId);
  await prisma.attendance.deleteMany({ where: { userId, activityId } });
}
