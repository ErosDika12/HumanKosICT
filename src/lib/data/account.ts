import "server-only";
import { prisma } from "@/lib/prisma";

/** Only ordinary people may delete themselves here; staff and seeded personas are managed by operators. */
export async function deleteOwnAccount(userId: string, confirmation: string): Promise<void> {
  if (confirmation.trim() !== "DELETE") throw new Error("Type DELETE to confirm.");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, isDemoPersona: true, isDemoFriend: true } });
  if (!user || user.isDemoPersona || user.isDemoFriend || (user.role !== "MEMBER" && user.role !== "ORGANIZER")) {
    throw new Error("You cannot delete this account here.");
  }
  await prisma.user.delete({ where: { id: userId } });
}
