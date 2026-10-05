import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button, Card, Notice, PageShell } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/current-user";
import { demoLoginAction, loginAction } from "@/lib/auth/actions";
import { isDemoLoginEnabled } from "@/lib/data/demo-session";
import { getI18n } from "@/lib/i18n/server";
import { errorMessage } from "@/lib/i18n/errors";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("login.title") };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect("/");

  const { next, error } = await searchParams;
  const { t } = await getI18n();
  const isProduction = process.env.NODE_ENV === "production";
  const errText = errorMessage(t, error);
  const input = "rounded-lg border border-border bg-background px-3 py-2 text-base text-foreground";

  return (
    <PageShell className="max-w-3xl">
      <header>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">{t("login.title")}</h1>
        <p className="mt-1 text-foreground-muted">{t("login.lead")}</p>
      </header>
      {errText && <Notice kind="error">{errText}</Notice>}

      {isDemoLoginEnabled() && (
        <Card className="flex flex-col gap-3 border-accent bg-accent-tint p-6">
          <h2 className="font-display text-2xl font-semibold text-foreground">{t("login.demo.title")}</h2>
          <p className="text-sm text-foreground-muted">{t("login.demo.body")}</p>
          <form action={demoLoginAction}>
            <Button variant="primary" size="lg">
              {t("action.demoLogin")}
            </Button>
          </form>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="font-display text-xl font-semibold text-foreground">{t("login.staff.title")}</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          {t("login.staff.body")} {isProduction ? t("login.staff.prod") : t("login.staff.dev")}
        </p>
        <form action={loginAction} className="mt-4 flex flex-col gap-4">
          <input type="hidden" name="next" value={next ?? "/"} />
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">{t("login.email")}</span>
            <input type="email" name="email" required autoComplete="email" className={input} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">{t("login.password")}</span>
            <input type="password" name="password" required autoComplete="current-password" className={input} />
          </label>
          <Button variant="secondary" className="w-fit">
            {t("login.staff.title")}
          </Button>
        </form>
        {!isProduction && (
          <p className="mt-3 text-xs text-foreground-muted">
            <Link href="/dev-login" className="underline underline-offset-2">
              {t("login.personas")}
            </Link>
          </p>
        )}
      </Card>
    </PageShell>
  );
}
