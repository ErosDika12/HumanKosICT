import "server-only";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";
import { assertBoundedText, MAX_LONG_TEXT } from "@/lib/validation";

/**
 * Explicit public/private projections (Phase 2 mission: "define clear
 * public, member-only, private, and aggregate projections"). Never widen
 * PublicProfile to include email, phone, or any field the user has not
 * opted into — see docs/PRODUCT_CONTRACT.md non-negotiable boundaries.
 */

export interface PublicProfile {
  id: string;
  name: string;
  isDiscoverable: boolean;
  bio: string | null;
}

export interface OwnProfile {
  id: string;
  email: string;
  name: string;
  nameSq: string | null;
  bio: string | null;
  bioSq: string | null;
  isDiscoverable: boolean;
  role: User["role"];
}

export function toPublicProfile(user: User): PublicProfile | null {
  if (!user.isDiscoverable) return null;
  return { id: user.id, name: user.name, isDiscoverable: true, bio: user.bio };
}

export function toOwnProfile(user: User): OwnProfile {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    nameSq: user.nameSq,
    bio: user.bio,
    bioSq: user.bioSq,
    isDiscoverable: user.isDiscoverable,
    role: user.role,
  };
}

export async function getOwnProfile(userId: string): Promise<OwnProfile | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user ? toOwnProfile(user) : null;
}

export interface ProfileUpdateInput {
  bio?: string;
  bioSq?: string;
  isDiscoverable?: boolean;
}

export class ProfileAuthorizationError extends Error {}

/**
 * Members may edit only their own profile. `actorId` always comes from the
 * verified session (never from client-supplied form data), and this check
 * is the second line of defense: even if a caller passed a different
 * `targetUserId` by mistake, the update is refused rather than silently
 * applied to the wrong account.
 */
export async function updateOwnProfile(
  actorId: string,
  targetUserId: string,
  input: ProfileUpdateInput
): Promise<OwnProfile> {
  if (actorId !== targetUserId) {
    throw new ProfileAuthorizationError("You can only edit your own profile.");
  }
  if (input.bio !== undefined) assertBoundedText(input.bio, MAX_LONG_TEXT, "Bio");
  if (input.bioSq !== undefined) assertBoundedText(input.bioSq, MAX_LONG_TEXT, "Bio (Albanian)");
  const user = await prisma.user.update({
    where: { id: targetUserId },
    data: input,
  });
  return toOwnProfile(user);
}
