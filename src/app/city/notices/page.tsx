import type { Metadata } from "next";
import { Card, EmptyState, Notice, PageShell } from "@/components/ui";
import { listActiveNotices, type CityNoticeView } from "@/lib/data/city";
import { getI18n } from "@/lib/i18n/server";
import { safeLoad } from "@/lib/safe-load";
import { isHttpUrl } from "@/lib/city-config";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("city.notices.title") };
}

export default async function NoticesPage() {
  const { t, locale, shortDate } = await getI18n();
  const res = await safeLoad<CityNoticeView[]>("city-notices", () => listActiveNotices(), []);
  const day = (d: Date) => shortDate(d.toISOString().slice(0, 10));

  return (
    <PageShell className="max-w-4xl">
      <header className="flex max-w-2xl flex-col gap-1">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">{t("city.notices.title")}</h1>
        <p className="text-foreground-muted">{t("city.notices.body")}</p>
      </header>
      <Notice kind="info">{t("city.independent")}</Notice>
      {!res.ok && <Notice kind="info">{t("state.unavailable.body")}</Notice>}

      {res.data.length === 0 ? (
        <EmptyState title={t("city.notices.empty")} />
      ) : (
        <ul className="flex flex-col gap-4">
          {res.data.map((n) => (
            <li key={n.id}>
              <Card className="flex flex-col gap-2 p-5">
                <h2 className="font-display text-xl font-semibold text-foreground">{locale === "sq" ? n.titleSq : n.title}</h2>
                <p className="text-foreground-muted">{locale === "sq" ? n.bodySq : n.body}</p>
                <p className="text-sm text-foreground-muted">
                  {t("city.notices.published", { date: day(n.publishedAt) })}
                  {n.expiresAt && ` · ${t("city.notices.expires", { date: day(n.expiresAt) })}`} · {t("city.notices.source", { source: n.sourceName })}
                </p>
                {n.sourceUrl && isHttpUrl(n.sourceUrl) && (
                  <a href={n.sourceUrl} rel="noopener noreferrer" target="_blank" className="w-fit text-sm font-semibold text-brand-strong underline underline-offset-2">
                    {t("city.notices.sourceLink")}
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
