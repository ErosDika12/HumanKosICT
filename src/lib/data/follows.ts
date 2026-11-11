import "server-only";
import { prisma } from "@/lib/prisma";
import { MAX_FOLLOWED_NEIGHBORHOODS } from "@/lib/city-config";
import { neighborhoodBySlug } from "@/lib/neighborhoods";

/** The neighborhoods a person follows, chosen by hand. GPS is never involved. */
export async function listFollowedSlugs(userId: string): Promise<string[]> {
  const rows = await prisma.neighborhoodFollow.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { slug: true },
  });
  return rows.map((r) => r.slug).filter((slug) => neighborhoodBySlug(slug) !== null);
}

/** Idempotent. Unknown slugs are rejected so the table only ever holds real neighborhoods. */
export async function followNeighborhood(userId: string, slug: string): Promise<void> {
  if (!neighborhoodBySlug(slug)) throw new Error("Unknown neighborhood.");
  const existing = await prisma.neighborhoodFollow.count({ where: { userId } });
  const already = await prisma.neighborhoodFollow.findUnique({ where: { userId_slug: { userId, slug } } });
  if (already) return;
  if (existing >= MAX_FOLLOWED_NEIGHBORHOODS) throw new Error("You are following the maximum number of neighborhoods.");
  await prisma.neighborhoodFollow.create({ data: { userId, slug } });
}

export async function unfollowNeighborhood(userId: string, slug: string): Promise<void> {
  await prisma.neighborhoodFollow.deleteMany({ where: { userId, slug } });
}
