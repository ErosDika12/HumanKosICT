"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "./password";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "./session";
import { assertNotProduction } from "./dev-guard";

async function setSessionCookie(userId: string, role: import("@prisma/client").Role) {
  const token = await createSessionToken({ sub: userId, role });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/discover");
  const safeNext = next.startsWith("/") ? next : "/discover";

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent("Enter your email and password.")}&next=${encodeURIComponent(safeNext)}`);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    redirect(`/login?error=${encodeURIComponent("Invalid email or password.")}&next=${encodeURIComponent(safeNext)}`);
  }

  await setSessionCookie(user.id, user.role);
  redirect(safeNext);
}

export async function logoutAction(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/");
}

/**
 * Development-only persona switcher. Every request is refused outright in
 * production, both by this guard and by the route that renders the picker
 * (src/app/dev-login/page.tsx calling notFound()) — defense in depth so the
 * dev switcher can never authorize a production request.
 */
export async function devLoginAction(formData: FormData): Promise<void> {
  assertNotProduction();

  const personaId = String(formData.get("personaId") ?? "");
  const user = await prisma.user.findFirst({
    where: { id: personaId, isDemoPersona: true },
  });
  if (!user) redirect("/dev-login?error=Unknown+demo+persona");

  await setSessionCookie(user.id, user.role);
  redirect("/discover");
}
