import "server-only";
import { cookies } from "next/headers";
import type { Role, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verifySessionToken } from "./session";

export type CurrentUser = Pick<
  User,
  "id" | "email" | "name" | "nameSq" | "role" | "isDemoPersona"
>;

/**
 * Reads and verifies the session cookie, then confirms the user still
 * exists (a seeded demo account could have been reset). Returns null for a
 * visitor — every Phase 1 page must keep rendering with no session at all.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await verifySessionToken(token);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, name: true, nameSq: true, role: true, isDemoPersona: true },
  });
  return user;
}

export class AuthorizationError extends Error {}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthorizationError("Sign-in required.");
  return user;
}

export async function requireRole(...roles: Role[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new AuthorizationError(`This action requires one of: ${roles.join(", ")}.`);
  }
  return user;
}
