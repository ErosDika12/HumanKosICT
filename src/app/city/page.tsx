import type { Metadata } from "next";
import { ButtonLink, Card, Notice, PageShell, Pill } from "@/components/ui";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("nav.city") };
}

/**
 * The City area is built in stages. Until a feature has a real, working
 * workflow behind it, it is listed with an honest "not available yet" label —
 * nothing here is simulated, and nothing implies municipal involvement.
 */
const SECTIONS = ["services", "report", "notices", "transport", "participate"] as const;

export default async function CityPage() {
  const { t } = await getI18n();
  return (
    <PageShell className="max-w-5xl">
      <header className="flex max-w-2xl flex-col gap-1">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">{t("city.title")}</h1>
        <p className="text-foreground-muted">{t("city.lead")}</p>
      </header>

      <Notice kind="info">{t("city.independent")}</Notice>

      <ul className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((key) => (
          <li key={key} className="flex">
            <Card className="flex w-full flex-col gap-2 p-5">
              <Pill tone="neutral">{t("city.status.unavailable")}</Pill>
              <h2 className="font-display text-xl font-semibold text-foreground">{t(`city.${key}.title`)}</h2>
              <p className="text-sm text-foreground-muted">{t(`city.${key}.body`)}</p>
            </Card>
          </li>
        ))}
      </ul>

      <ButtonLink href="/needs" variant="secondary" className="w-fit">
        {t("city.meanwhile")}
      </ButtonLink>
    </PageShell>
  );
}
