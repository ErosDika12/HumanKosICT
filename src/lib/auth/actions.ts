"use server";

import { cookies } from "next/headers";
import { errorParam } from "@/lib/i18n/errors";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "./password";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "./session";
import { assertNotProduction } from "./dev-guard";
import { createDemoVisitor, DemoLoginUnavailableError, isDemoLoginEnabled } from "@/lib/data/demo-session";
import { registerUser } from "./register";

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
    redirect(`/login?error=${errorParam("Enter your email and password.")}&next=${encodeURIComponent(safeNext)}`);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    redirect(`/login?error=${errorParam("Invalid email or password.")}&next=${encodeURIComponent(safeNext)}`);
  }

  await setSessionCookie(user.id, user.role);
  redirect(safeNext);
}

export async function registerAction(formData: FormData): Promise<void> {
  const next = String(formData.get("next") ?? "/");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  let created: { id: string; role: "MEMBER" };
  try {
    created = await registerUser({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      isAdult: formData.get("isAdult") === "on",
      acceptsRules: formData.get("acceptsRules") === "on",
    });
  } catch (err) {
    redirect(`/register?error=${errorParam(err)}&next=${encodeURIComponent(safeNext)}`);
  }
  await setSessionCookie(created.id, created.role);
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

/**
 * Public one-click "Log in as demo": creates an isolated, ordinary MEMBER
 * account (see src/lib/data/demo-session.ts). Never signs anyone in as an
 * organizer, moderator or analyst, and never needs a password.
 */
export async function demoLoginAction(): Promise<void> {
  // Demo shortcuts do not exist in production: the same buttons lead to real sign-in instead.
  if (!isDemoLoginEnabled()) redirect("/login");
  let visitor: { id: string; role: "MEMBER" };
  try {
    visitor = await createDemoVisitor();
  } catch (err) {
    if (err instanceof DemoLoginUnavailableError) {
      redirect(`/login?error=${errorParam(err.message)}`);
    }
    throw err;
  }
  await setSessionCookie(visitor.id, visitor.role);
  redirect("/");
}

export async function deleteAccountAction(formData: FormData): Promise<void> {
  const { requireUser } = await import("./current-user");
  const { deleteOwnAccount } = await import("@/lib/data/account");
  const user = await requireUser();
  try {
    await deleteOwnAccount(user.id, String(formData.get("confirm") ?? ""));
  } catch (err) {
    redirect(`/account?error=${errorParam(err)}`);
  }
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/");
}
