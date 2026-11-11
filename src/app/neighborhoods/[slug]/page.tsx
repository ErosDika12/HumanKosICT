import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ActivityCard } from "@/components/ActivityCard";
import { Card, EmptyState, Notice, PageShell, Pill, ButtonLink } from "@/components/ui";
import { getCurrentUserForRender } from "@/lib/auth/current-user";
import { getNeighborhoodOverview } from "@/lib/data/neighborhoods";
import { listFollowedSlugs } from "@/lib/data/follows";
import { followNeighborhoodAction, unfollowNeighborhoodAction } from "@/lib/actions/city-actions";
import { errorMessage } from "@/lib/i18n/errors";
import { buttonClass } from "@/components/ui";
import { getI18n } from "@/lib/i18n/server";
import { localizeCommunityDescription } from "@/lib/i18n/content";
import { neighborhoodBySlug } from "@/lib/neighborhoods";
import { safeLoad } from "@/lib/safe-load";

export async function generateMetadata({ params }: PageProps<"/neighborhoods/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { t } = await getI18n();
  const n = neighborhoodBySlug(slug);
  return { title: n ? t(`area.${n.areaEn}`) : t("nav.neighborhoods") };
}

export default async function NeighborhoodPage({ params, searchParams }: PageProps<"/neighborhoods/[slug]">) {
  const { slug } = await params;
  const neighborhood = neighborhoodBySlug(slug);
  if (!neighborhood) notFound();

  const { t, locale } = await getI18n();
  const user = await getCurrentUserForRender();
  const sp = await searchParams;
  const errorCode = typeof sp.error === "string" ? sp.error : undefined;
  const [overview, followed] = await Promise.all([
    safeLoad("neighborhood", () => getNeighborhoodOverview(slug, user?.id), null),
    user ? safeLoad("followed", () => listFollowedSlugs(user.id), [] as string[]) : Promise.resolve({ ok: true as const, data: [] as string[] }),
  ]);
  const data = overview.data;
  const isFollowing = followed.data.includes(slug);
  const err = errorMessage(t, errorCode);

  return (
    <PageShell className="max-w-5xl">
      <header className="flex flex-col gap-2">
        <Link href="/neighborhoods" className="text-sm font-medium text-brand-strong hover:underline">
          ← {t("neighborhoods.back")}
        </Link>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">{t(`area.${neighborhood.areaEn}`)}</h1>
      </header>

      {!overview.ok && <Notice kind="info">{t("state.unavailable.body")}</Notice>}
      {err && <Notice kind="error">{err}</Notice>}

      <div className="flex flex-col gap-2">
        {user ? (
          <form action={isFollowing ? unfollowNeighborhoodAction : followNeighborhoodAction}>
            <input type="hidden" name="slug" value={slug} />
            <button type="submit" aria-pressed={isFollowing} className={buttonClass(isFollowing ? "secondary" : "primary", "md")}>
              {isFollowing ? `${t("neighborhoods.following")} · ${t("neighborhoods.unfollow")}` : t("neighborhoods.follow")}
            </button>
          </form>
        ) : (
          <p className="text-sm text-foreground-muted">{t("neighborhoods.signIn")}</p>
        )}
        <p className="text-sm text-foreground-muted">{t("neighborhoods.followHint")}</p>
      </div>

      <section aria-labelledby="n-activities" className="flex flex-col gap-3">
        <h2 id="n-activities" className="font-display text-2xl font-semibold text-foreground">
          {t("neighborhoods.activities")}
        </h2>
        {data && data.activities.length > 0 ? (
          <ul className="grid gap-5 md:grid-cols-3">
            {data.activities.map((a) => (
              <li key={a.id} className="flex">
                <ActivityCard activity={a} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title={t("neighborhoods.noActivities")} />
        )}
      </section>

      <section aria-labelledby="n-communities" className="flex flex-col gap-3">
        <h2 id="n-communities" className="font-display text-2xl font-semibold text-foreground">
          {t("neighborhoods.communities")}
        </h2>
        {data && data.communities.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2">
            {data.communities.map((c) => (
              <li key={c.id} className="flex">
                <Card className="relative flex w-full flex-col gap-2 p-5 transition-shadow focus-within:shadow-md hover:shadow-md">
                  <Pill tone="brand">{t(`category.${c.category}`)}</Pill>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    <Link href={`/communities/${c.slug}`} className="after:absolute after:inset-0 after:content-['']">
                      {c.name}
                    </Link>
                  </h3>
                  <p className="line-clamp-2 text-sm text-foreground-muted">{localizeCommunityDescription(c, locale)}</p>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title={t("neighborhoods.noCommunities")} />
        )}
      </section>

      <section aria-labelledby="n-needs" className="flex flex-col gap-3">
        <h2 id="n-needs" className="font-display text-2xl font-semibold text-foreground">
          {t("neighborhoods.needs")}
        </h2>
        {data && data.needs.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {data.needs.map((n) => (
              <li key={n.id}>
                <Card className="flex flex-col gap-1 p-4">
                  <Pill tone="neutral">{t(`category.${n.category}`)}</Pill>
                  <p className="text-foreground">{n.description}</p>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title={t("neighborhoods.noNeeds")} />
        )}
        <ButtonLink href="/needs" variant="secondary" className="w-fit">
          {t("neighborhoods.helpAll")}
        </ButtonLink>
      </section>

      <p className="text-sm text-foreground-muted">{t("neighborhoods.demoNote")}</p>
    </PageShell>
  );
}
