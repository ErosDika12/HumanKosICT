import "server-only";
import { prisma } from "@/lib/prisma";

export class RsvpError extends Error {}

/**
 * Creates or re-confirms an RSVP inside a transaction so the capacity check
 * and the write are atomic — two concurrent requests for the last spot
 * cannot both succeed. Idempotent: RSVPing again while already confirmed is
 * a no-op, not a duplicate row (enforced by the unique(userId, activityId)
 * constraint as a second line of defense).
 */
export async function createRsvp(userId: string, activityId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const activity = await tx.activity.findUnique({ where: { id: activityId } });
    if (!activity) throw new RsvpError("Activity not found.");
    if (activity.status === "CANCELED") throw new RsvpError("This activity was canceled.");
    if (isPast(activity.date)) throw new RsvpError("This activity has already happened.");

    const existing = await tx.rsvp.findUnique({
      where: { userId_activityId: { userId, activityId } },
    });
    if (existing?.status === "CONFIRMED") return; // already RSVP'd — no-op

    const confirmedCount = await tx.rsvp.count({
      where: { activityId, status: "CONFIRMED" },
    });
    const spotsLeft = activity.capacity - activity.simulatedRsvpBaseline - confirmedCount;
    if (spotsLeft <= 0) throw new RsvpError("This activity is full.");

    await tx.rsvp.upsert({
      where: { userId_activityId: { userId, activityId } },
      create: { userId, activityId, status: "CONFIRMED" },
      update: { status: "CONFIRMED" },
    });
  });
}

export async function cancelRsvp(userId: string, activityId: string): Promise<void> {
  await prisma.rsvp.updateMany({
    where: { userId, activityId },
    data: { status: "CANCELED" },
  });
}

function isPast(isoDate: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return isoDate < today;
}
