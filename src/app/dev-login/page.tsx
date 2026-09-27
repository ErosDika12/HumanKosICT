import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DemoBadge } from "@/components/DemoBadge";
import { devLoginAction } from "@/lib/auth/actions";

const ROLE_LABEL: Record<string, string> = {
  MEMBER: "Member",
  ORGANIZER: "Organizer",
  MODERATOR: "Moderator",
  MUNICIPALITY_ANALYST: "Municipality analyst",
};

export default async function DevLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // Refused outright outside development — this route must never exist in
  // a deployed build. The server action itself repeats this guard.
  if (process.env.NODE_ENV === "production") notFound();

  const { error } = await searchParams;
  const personas = await prisma.user.findMany({
    where: { isDemoPersona: true },
    orderBy: { role: "asc" },
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <DemoBadge className="self-start" />
      <div className="rounded-xl border border-amber-400 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-600 dark:bg-amber-950 dark:text-amber-100">
        <p className="font-semibold">Development only</p>
        <p className="mt-1">
          This persona switcher is not part of the deployed judge demo path — it 404s outside
          development (<code>NODE_ENV=production</code>) and the underlying action refuses to run
          there even if the route were reached directly. Use{" "}
          <a href="/login" className="underline underline-offset-2">
            /login
          </a>{" "}
          with a persona&apos;s email + <code>Demo-2036!</code> for the real judge-facing flow.
        </p>
      </div>

      <h1 className="font-display text-2xl font-semibold text-foreground">Sign in as…</h1>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {personas.map((persona) => (
          <form key={persona.id} action={devLoginAction}>
            <input type="hidden" name="personaId" value={persona.id} />
            <button
              type="submit"
              className="flex w-full flex-col gap-1 rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:bg-surface-muted"
            >
              <span className="text-sm font-semibold text-foreground">{persona.name}</span>
              <span className="text-xs text-foreground-muted">{persona.email}</span>
              <span className="mt-1 inline-flex w-fit rounded-full bg-brand-tint px-2 py-0.5 text-xs font-medium text-brand-strong">
                {ROLE_LABEL[persona.role] ?? persona.role}
              </span>
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
