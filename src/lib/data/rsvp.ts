import "server-only";
import { prisma } from "@/lib/prisma";
import { isSimulatedPast } from "@/lib/simulated-clock";
import { notifyUser } from "./notifications";

export class RsvpError extends Error {}

const MAX_VISITOR_RSVPS = 15;

/**
 * Creates or re-confirms an RSVP inside a transaction so the capacity check
 * and the write are atomic — two concurrent requests for the last spot
 * cannot both succeed. Idempotent: RSVPing again while already confirmed is
 * a no-op, not a duplicate row (enforced by the unique(userId, activityId)
 * constraint as a second line of defense).
 */
export async function createRsvp(userId: string, activityId: string): Promise<void> {
  const activityTitle = await prisma.$transaction(async (tx) => {
    const activity = await tx.activity.findUnique({ where: { id: activityId } });
    if (!activity) throw new RsvpError("Activity not found.");
    if (activity.status === "CANCELED") throw new RsvpError("This activity was canceled.");
    if (isSimulatedPast(activity.date)) throw new RsvpError("This activity has already happened.");

    const existing = await tx.rsvp.findUnique({
      where: { userId_activityId: { userId, activityId } },
    });
    if (existing?.status === "CONFIRMED") return null; // already RSVP'd — no-op, no duplicate notification

    // Demo visitors' RSVPs are isolated from shared capacity (see activities.ts).
    const confirmedCount = await tx.rsvp.count({
      where: { activityId, status: "CONFIRMED", user: { isDemoVisitor: false } },
    });
    const visitor = await tx.user.findUnique({ where: { id: userId }, select: { isDemoVisitor: true } });
    if (visitor?.isDemoVisitor) {
      const mine = await tx.rsvp.count({ where: { userId, status: "CONFIRMED" } });
      if (mine >= MAX_VISITOR_RSVPS) {
        throw new RsvpError("Demo accounts can hold up to 15 RSVPs — cancel one to add another.");
      }
    }
    const spotsLeft = activity.capacity - activity.simulatedRsvpBaseline - confirmedCount;
    if (spotsLeft <= 0) throw new RsvpError("This activity is full.");

    await tx.rsvp.upsert({
      where: { userId_activityId: { userId, activityId } },
      create: { userId, activityId, status: "CONFIRMED" },
      update: { status: "CONFIRMED" },
    });

    return activity.title;
  });

  if (activityTitle) {
    await notifyUser(userId, `You're going to "${activityTitle}" — RSVP confirmed.`, activityId);
  }
}

export async function cancelRsvp(userId: string, activityId: string): Promise<void> {
  await prisma.rsvp.updateMany({
    where: { userId, activityId },
    data: { status: "CANCELED" },
  });
}

/** @deprecated use isSimulatedPast from src/lib/simulated-clock.ts directly. Kept so existing imports don't need to change. */
export const isPastActivityDate = isSimulatedPast;
