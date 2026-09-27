import Link from "next/link";
import { redirect } from "next/navigation";
import { DemoBadge } from "@/components/DemoBadge";
import { getCurrentUser } from "@/lib/auth/current-user";
import { loginAction } from "@/lib/auth/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/discover");

  const { next, error } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <DemoBadge className="self-start" />
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">Sign in</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Use a seeded demo account. Every account below is fictional — see{" "}
          <Link href="/discover" className="underline underline-offset-2">
            Discover
          </Link>{" "}
          for what members and organizers can do.
        </p>
      </div>

      <form action={loginAction} className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
        <input type="hidden" name="next" value={next ?? "/discover"} />
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Email</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="arta.krasniqi@demo.humannetwork.example"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Password</span>
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            placeholder="Demo-2036!"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-strong"
        >
          Sign in
        </button>
      </form>

      <p className="text-xs text-foreground-muted">
        Demo credential for every seeded persona:{" "}
        <code className="rounded bg-surface-muted px-1.5 py-0.5">Demo-2036!</code>. See{" "}
        <Link href="/dev-login" className="underline underline-offset-2">
          the persona list
        </Link>{" "}
        (development only) for exact emails and roles.
      </p>
    </div>
  );
}
