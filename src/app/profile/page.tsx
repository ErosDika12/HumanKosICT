import Link from "next/link";
import type { Metadata } from "next";
import { HumanQuest } from "@/components/HumanQuest";
import { ButtonLink, Card, Notice, PageShell, buttonClass } from "@/components/ui";
import { ArrowIcon, CalendarIcon } from "@/components/icons";
import { demoLoginAction } from "@/lib/auth/actions";
import { getCurrentUserForRender } from "@/lib/auth/current-user";
import { listPlans } from "@/lib/data/invites";
import { listFollowedSlugs } from "@/lib/data/follows";
import { neighborhoodBySlug } from "@/lib/neighborhoods";
import { getProgress } from "@/lib/data/progress";
import { getI18n } from "@/lib/i18n/server";
import { localizeActivity } from "@/lib/i18n/content";
import { ACTIVITIES } from "@/lib/demo-data";
import { safeLoad } from "@/lib/safe-load";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("nav.profile") };
}

const LINKS = [
  { href: "/people", key: "profile.friends" },
  { href: "/messages", key: "profile.messages" },
  { href: "/inbox", key: "profile.notifications" },
  { href: "/communities", key: "profile.communities" },
  { href: "/needs", key: "profile.help" },
  { href: "/account", key: "profile.account" },
] as const;

export default async function ProfilePage() {
  const { t, locale, shortDate } = await getI18n();
  const user = await getCurrentUserForRender();

  if (!user) {
    return (
      <PageShell className="max-w-xl">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">{t("profile.title")}</h1>
        <p className="text-foreground-muted">{t("profile.signIn")}</p>
        <div className="flex flex-wrap items-center gap-3">
          <form action={demoLoginAction}>
            <button type="submit" className={buttonClass("accent", "lg")}>
              {t("action.demoLogin")}
            </button>
          </form>
          <ButtonLink href="/login" variant="secondary" size="lg">
            {t("nav.staffSignIn")}
          </ButtonLink>
        </div>
      </PageShell>
    );
  }

  const [plansRes, progressRes, followedRes] = await Promise.all([
    safeLoad("profile-plans", () => listPlans(user.id), []),
    safeLoad("profile-progress", () => getProgress(user.id), null),
    safeLoad("profile-followed", () => listFollowedSlugs(user.id), [] as string[]),
  ]);
  const upcoming = plansRes.data.filter((p) => !p.activity.isPast && !p.activity.isCanceled && p.myRsvp === "confirmed").slice(0, 3);

  return (
    <PageShell className="max-w-4xl">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">{user.name}</h1>
      </header>

      {(!plansRes.ok || !progressRes.ok) && <Notice kind="info">{t("profile.unavailable")}</Notice>}

      <section aria-labelledby="p-plans" className="flex flex-col gap-3">
        <h2 id="p-plans" className="font-display text-2xl font-semibold text-foreground">
          {t("profile.plans")}
        </h2>
        {upcoming.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {upcoming.map((p) => {
              const seeded = ACTIVITIES.find((a) => a.slug === p.activity.slug);
              const title = seeded ? localizeActivity(seeded, locale).title : p.activity.title;
              return (
                <li key={p.activity.id}>
                  <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="flex flex-col gap-0.5">
                      <Link href={`/discover/${p.activity.slug}`} className="font-display text-lg font-semibold text-foreground hover:underline">
                        {title}
                      </Link>
                      <span className="inline-flex items-center gap-1.5 text-sm text-foreground-muted">
                        <CalendarIcon size={15} />
                        {shortDate(p.activity.date)} · {p.activity.startTime}
                      </span>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-foreground-muted">{t("profile.noPlans")}</p>
        )}
        <Link href="/plans" className="inline-flex min-h-10 w-fit items-center gap-1.5 text-sm font-semibold text-brand-strong hover:underline">
          {t("profile.allPlans")}
          <ArrowIcon size={16} />
        </Link>
      </section>

      <section aria-labelledby="p-neighborhoods" className="flex flex-col gap-3">
        <h2 id="p-neighborhoods" className="font-display text-2xl font-semibold text-foreground">
          {t("profile.neighborhoods")}
        </h2>
        {followedRes.data.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {followedRes.data.map((slug) => {
              const n = neighborhoodBySlug(slug);
              return n ? (
                <li key={slug}>
                  <Link href={`/neighborhoods/${slug}`} className="inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-4 text-sm font-medium text-foreground hover:bg-surface-muted">
                    {t(`area.${n.areaEn}`)}
                  </Link>
                </li>
              ) : null;
            })}
          </ul>
        ) : (
          <p className="text-foreground-muted">{t("profile.noNeighborhoods")}</p>
        )}
        <Link href="/neighborhoods" className="inline-flex min-h-10 w-fit items-center gap-1.5 text-sm font-semibold text-brand-strong hover:underline">
          {t("home.neighborhoods.all")}
          <ArrowIcon size={16} />
        </Link>
      </section>

      {progressRes.data && (
        <section aria-labelledby="p-progress" className="flex flex-col gap-3">
          <h2 id="p-progress" className="font-display text-2xl font-semibold text-foreground">
            {t("profile.progress")}
          </h2>
          <HumanQuest progress={progressRes.data} />
          <Link href="/impact" className="inline-flex min-h-10 w-fit items-center gap-1.5 text-sm font-semibold text-brand-strong hover:underline">
            {t("profile.progressLink")}
            <ArrowIcon size={16} />
          </Link>
        </section>
      )}

      <nav aria-label={t("nav.profile")}>
        <ul className="grid gap-3 sm:grid-cols-2">
          {LINKS.map(({ href, key }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 font-medium text-foreground transition-colors hover:bg-surface-muted"
              >
                {t(key)}
                <ArrowIcon size={16} />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </PageShell>
  );
}
