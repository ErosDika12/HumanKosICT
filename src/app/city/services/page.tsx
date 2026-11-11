import type { Metadata } from "next";
import { Card, EmptyState, Notice, PageShell, Pill } from "@/components/ui";
import { listPublishedServices, isReviewStale, type CityServiceView } from "@/lib/data/city";
import { getI18n } from "@/lib/i18n/server";
import { safeLoad } from "@/lib/safe-load";
import { isHttpUrl } from "@/lib/city-config";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("city.services.title") };
}

export default async function ServicesPage() {
  const { t, locale, shortDate } = await getI18n();
  const res = await safeLoad<CityServiceView[]>("city-services", () => listPublishedServices(), []);

  return (
    <PageShell className="max-w-4xl">
      <header className="flex max-w-2xl flex-col gap-1">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">{t("city.services.title")}</h1>
        <p className="text-foreground-muted">{t("city.services.body")}</p>
      </header>
      <Notice kind="info">{t("city.independent")}</Notice>
      {!res.ok && <Notice kind="info">{t("state.unavailable.body")}</Notice>}

      {res.data.length === 0 ? (
        <EmptyState title={t("city.status.empty")}>{t("city.services.empty")}</EmptyState>
      ) : (
        <ul className="flex flex-col gap-4">
          {res.data.map((s) => (
            <li key={s.id}>
              <Card className="flex flex-col gap-2 p-5">
                <Pill tone="neutral">{s.category}</Pill>
                <h2 className="font-display text-xl font-semibold text-foreground">{locale === "sq" ? s.nameSq : s.name}</h2>
                <p className="text-foreground-muted">{locale === "sq" ? s.descriptionSq : s.description}</p>
                <p className="text-sm text-foreground-muted">
                  {t("city.services.source", { source: s.sourceName })} · {t("city.services.reviewed", { date: shortDate(s.reviewedAt.toISOString().slice(0, 10)) })}
                </p>
                {isReviewStale(s.reviewedAt) && <Notice kind="info">{t("city.services.stale")}</Notice>}
                {isHttpUrl(s.officialUrl) && (
                  <a href={s.officialUrl} rel="noopener noreferrer" target="_blank" className="w-fit text-sm font-semibold text-brand-strong underline underline-offset-2">
                    {t("city.services.official")}
                  </a>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
