import "server-only";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "./password";
import { validateRegistration, type RegistrationInput } from "./registration-rules";

/**
 * Creates an ordinary MEMBER account. Role is never taken from input, and the
 * demo flags stay false so a real person is never treated as (or purged like)
 * a demo visitor. There is no email verification yet (no email service is
 * configured), so the address is stored as typed and is not proven to belong
 * to the person.
 */
export async function registerUser(input: RegistrationInput): Promise<{ id: string; role: "MEMBER" }> {
  const v = validateRegistration(input);
  const existing = await prisma.user.findUnique({ where: { email: v.email }, select: { id: true } });
  if (existing) throw new Error("Could not create this account.");
  const passwordHash = await hashPassword(v.password);
  try {
    const user = await prisma.user.create({
      data: { email: v.email, name: v.name, passwordHash, role: "MEMBER", isDiscoverable: false, isDemoPersona: false, isDemoVisitor: false, isDemoFriend: false },
      select: { id: true },
    });
    return { id: user.id, role: "MEMBER" };
  } catch {
    // Unique-constraint race with a concurrent sign-up for the same email.
    throw new Error("Could not create this account.");
  }
}
