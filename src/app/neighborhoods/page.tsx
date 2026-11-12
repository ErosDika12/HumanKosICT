import Link from "next/link";
import { isFixtureMode } from "@/lib/simulated-clock";
import type { Metadata } from "next";
import { Card, Notice, PageShell } from "@/components/ui";
import { ArrowIcon } from "@/components/icons";
import { getCurrentUserForRender } from "@/lib/auth/current-user";
import { listNeighborhoodOverviews, type NeighborhoodOverview } from "@/lib/data/neighborhoods";
import { getI18n } from "@/lib/i18n/server";
import { safeLoad } from "@/lib/safe-load";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("nav.neighborhoods") };
}

export default async function NeighborhoodsPage() {
  const { t } = await getI18n();
  const user = await getCurrentUserForRender();
  const overviews = await safeLoad<NeighborhoodOverview[]>("neighborhoods", () => listNeighborhoodOverviews(user?.id), []);

  return (
    <PageShell className="max-w-5xl">
      <header className="flex max-w-2xl flex-col gap-1">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">{t("neighborhoods.title")}</h1>
        <p className="text-foreground-muted">{t("neighborhoods.lead")}</p>
      </header>

      {!overviews.ok && <Notice kind="info">{t("state.unavailable.body")}</Notice>}

      <ul className="grid gap-4 sm:grid-cols-2">
        {overviews.data.map(({ neighborhood, activities, communities, needs }) => (
          <li key={neighborhood.slug} className="flex">
            <Card className="relative flex w-full flex-col gap-3 p-5 transition-shadow focus-within:shadow-md hover:shadow-md">
              <h2 className="font-display text-xl font-semibold text-foreground">
                <Link href={`/neighborhoods/${neighborhood.slug}`} className="after:absolute after:inset-0 after:content-['']">
                  {t(`area.${neighborhood.areaEn}`)}
                </Link>
              </h2>
              <dl className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <dt className="text-foreground-muted">{t("neighborhoods.activities")}</dt>
                  <dd className="font-display text-lg font-semibold text-foreground">{activities.length}</dd>
                </div>
                <div>
                  <dt className="text-foreground-muted">{t("neighborhoods.communities")}</dt>
                  <dd className="font-display text-lg font-semibold text-foreground">{communities.length}</dd>
                </div>
                <div>
                  <dt className="text-foreground-muted">{t("neighborhoods.needs")}</dt>
                  <dd className="font-display text-lg font-semibold text-foreground">{needs.length}</dd>
                </div>
              </dl>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-brand-strong">
                {t("neighborhoods.open")}
                <ArrowIcon size={16} />
              </span>
            </Card>
          </li>
        ))}
      </ul>

      {isFixtureMode() && <p className="text-sm text-foreground-muted">{t("neighborhoods.demoNote")}</p>}
    </PageShell>
  );
}
