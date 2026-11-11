import type { Metadata } from "next";
import { Card, PageShell } from "@/components/ui";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("safety.title") };
}

export default async function SafetyPage() {
  const { t } = await getI18n();
  // The contact is only shown if the operator configured one; nothing is invented.
  const contact = process.env.SUPPORT_EMAIL?.trim();
  const blocks = ["meet", "report", "emergency"] as const;
  return (
    <PageShell className="max-w-3xl">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">{t("safety.title")}</h1>
        <p className="text-foreground-muted">{t("safety.lead")}</p>
      </header>
      {blocks.map((k) => (
        <Card key={k} className="flex flex-col gap-1 p-5">
          <h2 className="font-display text-xl font-semibold text-foreground">{t(`safety.${k}.title`)}</h2>
          <p className="text-foreground-muted">{t(`safety.${k}.body`)}</p>
        </Card>
      ))}
      <Card className="flex flex-col gap-1 p-5">
        <h2 className="font-display text-xl font-semibold text-foreground">{t("safety.contact.title")}</h2>
        {contact ? (
          <p className="text-foreground-muted">
            {t("safety.contact.body")}{" "}
            <a href={`mailto:${contact}`} className="font-medium text-brand-strong underline underline-offset-2">
              {contact}
            </a>
          </p>
        ) : (
          <p className="text-foreground-muted">{t("safety.contact.none")}</p>
        )}
      </Card>
      <p className="text-sm text-foreground-muted">{t("safety.youth")}</p>
    </PageShell>
  );
}
