import Link from "next/link";
import type { Metadata } from "next";
import { listCommunities } from "@/lib/data/communities";
import { getCurrentUser } from "@/lib/auth/current-user";
import { Card, PageShell, Pill, ButtonLink } from "@/components/ui";
import { CalendarIcon, PinIcon } from "@/components/icons";
import { getI18n } from "@/lib/i18n/server";
import { areaFromEn, areaFromSq } from "@/lib/i18n/areas";
import { localizeCommunityDescription } from "@/lib/i18n/content";
import { ACTIVITIES } from "@/lib/demo-data";
import { localizeActivity } from "@/lib/i18n/content";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("nav.communities") };
}

export default async function CommunitiesPage() {
  const { t, locale, shortDate } = await getI18n();
  const [communities, user] = await Promise.all([listCommunities(), getCurrentUser()]);

  return (
    <PageShell className="max-w-5xl">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex max-w-2xl flex-col gap-1">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">{t("communities.title")}</h1>
          <p className="text-foreground-muted">{t("communities.lead")}</p>
        </div>
        {user && (
          <ButtonLink href="/communities/new" variant="secondary">
            {t("communities.start")}
          </ButtonLink>
        )}
      </header>

      <ul className="grid gap-5 sm:grid-cols-2">
        {communities.map((c) => {
          const next = c.nextActivity;
          const seeded = next ? ACTIVITIES.find((a) => a.slug === next.slug) : undefined;
          const nextTitle = next ? (seeded ? localizeActivity(seeded, locale).title : next.title) : null;
          return (
            <li key={c.id} className="flex">
              <Card className="relative flex w-full flex-col gap-3 p-5 transition-shadow focus-within:shadow-md hover:shadow-md">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone="brand">{t(`category.${c.category}`)}</Pill>
                  {c.visibility === "restricted" && <Pill tone="neutral">{t("communities.restricted")}</Pill>}
                </div>
                <h2 className="font-display text-xl font-semibold text-foreground">
                  <Link href={`/communities/${c.slug}`} className="after:absolute after:inset-0 after:content-['']">
                    {c.name}
                  </Link>
                  {c.verified && (
                    <span className="ml-1.5 text-sm font-medium text-brand" title={t("communities.verified")}>
                      ✓<span className="sr-only"> {t("communities.verified")}</span>
                    </span>
                  )}
                </h2>
                <p className="line-clamp-3 text-sm text-foreground-muted">{localizeCommunityDescription(c, locale)}</p>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-muted">
                  <span className="inline-flex items-center gap-1">
                    <PinIcon size={13} />
                    {areaFromSq(c.areaSq, t)}
                  </span>
                  <span>{t("communities.members", { n: c.memberCount })}</span>
                </p>
                <div className="mt-auto rounded-xl bg-surface-muted p-3 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">{t("communities.next")}</p>
                  {next ? (
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-foreground">
                      <CalendarIcon size={15} className="text-brand-strong" />
                      <span className="font-medium">{nextTitle}</span>
                      <span className="text-foreground-muted">
                        · {shortDate(next.date)} · {next.startTime} · {areaFromEn(next.areaEn, t)}
                      </span>
                    </p>
                  ) : (
                    <p className="mt-0.5 text-foreground-muted">{t("communities.noNext")}</p>
                  )}
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </PageShell>
  );
}
