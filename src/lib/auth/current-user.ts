import "server-only";
import { cookies } from "next/headers";
import { rethrowNextControlFlow } from "@/lib/next-rethrow";
import type { Role, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verifySessionToken } from "./session";

export type CurrentUser = Pick<
  User,
  "id" | "email" | "name" | "nameSq" | "role" | "isDemoPersona" | "isDiscoverable" | "isDemoVisitor"
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
    select: {
      id: true,
      email: true,
      name: true,
      nameSq: true,
      role: true,
      isDemoPersona: true,
      isDiscoverable: true,
      isDemoVisitor: true,
    },
  });
  return user;
}

/**
 * Rendering-only variant: if the database is unreachable the visitor is shown
 * the signed-out view instead of a crash. It fails CLOSED — a database error
 * never grants a user. Authorization paths must keep using getCurrentUser /
 * requireUser / requireRole, which surface the error.
 */
export async function getCurrentUserForRender(): Promise<CurrentUser | null> {
  try {
    return await getCurrentUser();
  } catch (err) {
    // Keep Next.js dynamic-rendering bailouts (from cookies()) propagating; only real failures fall through.
    await rethrowNextControlFlow(err);
    const e = err as { name?: string; code?: string };
    console.error(`[auth] session lookup failed: ${e?.name ?? "Error"}${e?.code ? ` (${e.code})` : ""}`);
    return null;
  }
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
