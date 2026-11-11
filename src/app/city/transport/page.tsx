import type { Metadata } from "next";
import { Card, Notice, PageShell, Pill } from "@/components/ui";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("transport.title") };
}

/**
 * No transport or environment provider is configured, so nothing live is shown. This page never
 * estimates or invents bus arrivals, traffic or air-quality values; when a permitted source is
 * connected it must display the source, the update time and a stale/unavailable state.
 */
const TOPICS = ["buses", "traffic", "air"] as const;

export default async function TransportPage() {
  const { t } = await getI18n();
  return (
    <PageShell className="max-w-4xl">
      <header className="flex max-w-2xl flex-col gap-1">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">{t("transport.title")}</h1>
        <p className="text-foreground-muted">{t("transport.lead")}</p>
      </header>
      <Notice kind="info">{t("transport.notConnected")}</Notice>
      <ul className="grid gap-4 sm:grid-cols-3">
        {TOPICS.map((topic) => (
          <li key={topic} className="flex">
            <Card className="flex w-full flex-col gap-2 p-5">
              <Pill tone="neutral">{t("city.status.notConnected")}</Pill>
              <h2 className="font-display text-lg font-semibold text-foreground">{t(`transport.${topic}`)}</h2>
            </Card>
          </li>
        ))}
      </ul>
      <p className="max-w-2xl text-sm text-foreground-muted">{t("transport.promise")}</p>
    </PageShell>
  );
}
