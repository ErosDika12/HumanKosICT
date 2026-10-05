import Link from "next/link";
import { redirect } from "next/navigation";
import { Button, Card, Notice, PageShell } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/current-user";
import { demoLoginAction, loginAction } from "@/lib/auth/actions";
import { isDemoLoginEnabled } from "@/lib/data/demo-session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/discover");

  const { next, error } = await searchParams;
  const isProduction = process.env.NODE_ENV === "production";

  return (
    <PageShell className="max-w-3xl">
      <header>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">Sign in</h1>
        <p className="mt-1 text-foreground-muted">
          The quickest way in is the demo. Staff sign-in is only for the seeded organizer, moderator and analyst accounts.
        </p>
      </header>
      {error && <Notice kind="error">{error}</Notice>}

      {isDemoLoginEnabled() && (
        <Card className="flex flex-col gap-3 border-accent bg-accent-tint p-6">
          <h2 className="font-display text-2xl font-semibold text-foreground">Log in as demo</h2>
          <p className="text-sm text-foreground-muted">
            One click, no password. You get your own temporary member account with example friends, an example
            conversation and an invitation. Everything you do stays on it — other visitors never see it — and it is
            removed after a day.
          </p>
          <form action={demoLoginAction}>
            <Button variant="primary" size="lg">
              Log in as demo
            </Button>
          </form>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="font-display text-xl font-semibold text-foreground">Staff sign in</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          For maintainers reviewing moderation and the municipality view.
          {isProduction
            ? " These accounts use a private password that is not published on this site."
            : " Local development: every seeded persona shares the password Demo-2036! (see the persona list)."}
        </p>
        <form action={loginAction} className="mt-4 flex flex-col gap-4">
          <input type="hidden" name="next" value={next ?? "/discover"} />
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">Email</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
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
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
          <Button variant="secondary" className="w-fit">
            Staff sign in
          </Button>
        </form>
        {!isProduction && (
          <p className="mt-3 text-xs text-foreground-muted">
            See{" "}
            <Link href="/dev-login" className="underline underline-offset-2">
              the persona list
            </Link>{" "}
            (development only) for exact emails and roles.
          </p>
        )}
      </Card>
    </PageShell>
  );
}
