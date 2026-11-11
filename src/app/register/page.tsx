import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button, Card, Notice, PageShell } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/current-user";
import { registerAction } from "@/lib/auth/actions";
import { getI18n } from "@/lib/i18n/server";
import { errorMessage } from "@/lib/i18n/errors";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("register.title") };
}

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect("/");
  const { next, error } = await searchParams;
  const { t } = await getI18n();
  const errText = errorMessage(t, error);
  const input = "rounded-lg border border-border bg-background px-3 py-2 text-base text-foreground";

  return (
    <PageShell className="max-w-xl">
      <header>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">{t("register.title")}</h1>
        <p className="mt-1 text-foreground-muted">{t("register.lead")}</p>
      </header>
      {errText && <Notice kind="error">{errText}</Notice>}
      <Card className="p-6">
        <form action={registerAction} className="flex flex-col gap-4">
          <input type="hidden" name="next" value={next ?? "/"} />
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">{t("register.name")}</span>
            <input name="name" required maxLength={60} autoComplete="name" className={input} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">{t("register.email")}</span>
            <input type="email" name="email" required maxLength={254} autoComplete="email" className={input} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">{t("register.password")}</span>
            <input type="password" name="password" required minLength={10} maxLength={200} autoComplete="new-password" className={input} />
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="isAdult" required className="mt-1" />
            <span>{t("register.adult")}</span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="acceptsRules" required className="mt-1" />
            <span>{t("register.rules")}</span>
          </label>
          <p className="text-sm text-foreground-muted">{t("register.noVerify")}</p>
          <Button variant="primary" size="lg" className="w-fit">
            {t("register.submit")}
          </Button>
        </form>
        <p className="mt-4 text-sm">
          <Link href="/login" className="font-medium text-brand-strong underline underline-offset-2">
            {t("register.haveAccount")}
          </Link>
        </p>
      </Card>
    </PageShell>
  );
}
