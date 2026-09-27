import "server-only";
import { prisma } from "@/lib/prisma";
import type { InterestId } from "@/lib/types";

export async function getUserInterests(userId: string): Promise<InterestId[]> {
  const rows = await prisma.userInterest.findMany({
    where: { userId },
    select: { interestId: true },
  });
  return rows.map((r) => r.interestId as InterestId);
}

/** Replaces the user's saved interests with exactly this set (idempotent). */
export async function saveUserInterests(userId: string, interestIds: InterestId[]): Promise<void> {
  await prisma.$transaction([
    prisma.userInterest.deleteMany({ where: { userId } }),
    ...(interestIds.length > 0
      ? [
          prisma.userInterest.createMany({
            data: interestIds.map((interestId) => ({ userId, interestId })),
          }),
        ]
      : []),
  ]);
}
