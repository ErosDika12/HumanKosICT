import Link from "next/link";
import { ActivityCard } from "@/components/ActivityCard";
import { Photo } from "@/components/Photo";
import { ButtonLink, Card, buttonClass } from "@/components/ui";
import { ArrowIcon, CalendarIcon } from "@/components/icons";
import { demoLoginAction } from "@/lib/auth/actions";
import { getCurrentUserForRender } from "@/lib/auth/current-user";
import { safeLoad } from "@/lib/safe-load";
import { listActivities } from "@/lib/data/activities";
import { listPlans } from "@/lib/data/invites";
import { listCommunities } from "@/lib/data/communities";
import { listNeeds } from "@/lib/data/needs";
import { NEIGHBORHOODS } from "@/lib/neighborhoods";
import { listFollowedSlugs } from "@/lib/data/follows";
import { SIMULATED_NOW_ISO } from "@/lib/simulated-clock";
import { localizeCommunityDescription } from "@/lib/i18n/content";
import { getProgress } from "@/lib/data/progress";
import { HumanQuest } from "@/components/HumanQuest";
import { getUserInterests } from "@/lib/data/interests";
import { scoreActivities } from "@/lib/data/recommendations";
import { photoForActivity } from "@/lib/photos";
import { isSimulatedPast } from "@/lib/simulated-clock";
import { getI18n } from "@/lib/i18n/server";
import { localizeActivity } from "@/lib/i18n/content";
import { matchesWindow, relativeDayLabel } from "@/lib/time-window";

// A mix a first-time visitor can act on: a weekend evening, an outdoor morning, something to build.
const FEATURED_SLUGS = ["shetitje-fotografike-qender", "mbjellja-e-pemeve-dardania", "laborator-ideshe-eko-teknologji"];

const RELATIVE_KEY: Record<string, string> = {
  "Already happened": "fact.past",
  Today: "fact.today",
  Tomorrow: "fact.tomorrow",
  "This weekend": "fact.thisWeekend",
  "Next weekend": "fact.nextWeekend",
};

export default async function HomePage() {
  const { t, locale, shortDate } = await getI18n();
  const user = await getCurrentUserForRender();
  // Each source loads independently: if one is unavailable the rest of the page still renders.
  const [activitiesRes, plansRes, interestsRes, progressRes] = await Promise.all([
    safeLoad("home-activities", () => listActivities(), []),
    safeLoad("home-plans", () => (user ? listPlans(user.id) : Promise.resolve([])), []),
    safeLoad("home-interests", () => (user ? getUserInterests(user.id) : Promise.resolve([])), []),
    safeLoad("home-progress", () => (user ? getProgress(user.id) : Promise.resolve(null)), null),
  ]);
  const all = activitiesRes.data;
  const plans = plansRes.data;
  const interestIds = interestsRes.data;
  const progress = progressRes.data;
  const upcoming = all.filter((a) => !isSimulatedPast(a.date));
  const featured = FEATURED_SLUGS.map((s) => upcoming.find((a) => a.slug === s)).filter((a) => a !== undefined);

  const nextPlan = plans.find((p) => !p.activity.isPast && !p.activity.isCanceled && p.myRsvp === "confirmed") ?? null;
  const planned = new Set(plans.map((p) => p.activity.slug));
  const suggestions = user
    ? scoreActivities(
        upcoming.filter((a) => !planned.has(a.slug) && a.ageEligibility !== "supervised-minors" && a.capacity - a.rsvpCount > 0),
        { interestIds, locale }
      ).slice(0, 3)
    : [];
  const dayLabel = (iso: string) => {
    const rel = relativeDayLabel(iso);
    return RELATIVE_KEY[rel] ? t(RELATIVE_KEY[rel]) : shortDate(iso);
  };
  const nextPlanActivity = nextPlan ? upcoming.find((a) => a.slug === nextPlan.activity.slug) : undefined;

  // Sections below each load independently; one failing source only hides that section.
  const [communitiesRes, needsRes, followedRes] = await Promise.all([
    safeLoad("home-communities", () => listCommunities(), []),
    safeLoad("home-needs", () => listNeeds(user?.id), []),
    safeLoad("home-followed", () => (user ? listFollowedSlugs(user.id) : Promise.resolve([] as string[])), [] as string[]),
  ]);
  // Neighborhoods the person follows come first; everyone else sees the full list.
  const followed = new Set(followedRes.data);
  const orderedNeighborhoods = [...NEIGHBORHOODS].sort((a, b) => Number(followed.has(b.slug)) - Number(followed.has(a.slug)));
  const open = upcoming.filter((a) => a.capacity - a.rsvpCount > 0);
  const todayWeekend = open
    .filter((a) => a.date === SIMULATED_NOW_ISO || matchesWindow(a.date, "weekend"))
    .sort((x, y) => (x.date + x.startTime).localeCompare(y.date + y.startTime))
    .slice(0, 3);
  const shownSlugs = new Set(todayWeekend.map((a) => a.slug));
  const freeBeginner = open
    .filter((a) => a.cost === "free" && (a.difficulty === "beginner" || a.difficulty === "all-levels") && !shownSlugs.has(a.slug))
    .slice(0, 3);
  const welcomingCommunities = communitiesRes.data.filter((c) => c.visibility === "public").slice(0, 3);
  const helpNeed = needsRes.data.find((n) => n.status === "open") ?? null;

  return (
    <>
      {user ? (
        <section className="border-b border-border bg-surface" aria-labelledby="hello-title">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
            <h1 id="hello-title" className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {t("home.hello", { name: user.name })}
            </h1>
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              <Card className="flex flex-col gap-3 p-5">
                <h2 className="font-display text-lg font-semibold text-foreground">{t("home.next.title")}</h2>
                {nextPlan ? (
                  <>
                    <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-strong">
                      <CalendarIcon size={16} />
                      {dayLabel(nextPlan.activity.date)} · {shortDate(nextPlan.activity.date)} · {nextPlan.activity.startTime}
                    </p>
                    <Link href={`/discover/${nextPlan.activity.slug}`} className="font-display text-xl font-semibold text-foreground hover:underline">
                      {nextPlanActivity ? localizeActivity(nextPlanActivity, locale).title : nextPlan.activity.title}
                    </Link>
                    {nextPlan.invites.filter((i) => i.status === "accepted").length > 0 && (
                      <p className="text-sm text-foreground-muted">
                        {t("home.next.withFriends", { names: nextPlan.invites.filter((i) => i.status === "accepted").map((i) => i.otherName.split(" ")[0]).join(", ") })}
                      </p>
                    )}
                    <ButtonLink href="/plans" variant="secondary" size="sm" className="w-fit">
                      {t("home.next.viewPlans")}
                    </ButtonLink>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-foreground-muted">{t("home.next.none")}</p>
                    <ButtonLink href="/discover?when=week" variant="primary" size="sm" className="w-fit">
                      {t("home.next.browse")}
                    </ButtonLink>
                  </>
                )}
              </Card>
              <div className="flex flex-col gap-3">
                <h2 className="font-display text-lg font-semibold text-foreground">{t("home.suggest.title")}</h2>
                <ul className="grid gap-3 sm:grid-cols-3">
                  {suggestions.map((a) => (
                    <li key={a.id} className="flex">
                      <ActivityCard activity={a} compact />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {progress && <HumanQuest progress={progress} compact />}
          </div>
        </section>
      ) : (
        <>
          <section className="hero-navy text-white" aria-labelledby="hero-title">
            <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_1fr]">
              <div className="flex flex-col gap-4">
                <h1 id="hero-title" className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
                  {t("home.title.line1")}
                  <br />
                  <span className="text-accent">{t("home.title.line2")}</span>
                </h1>
                <p className="max-w-md text-base text-white/85 sm:text-lg">{t("home.lead")}</p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <ButtonLink href="/discover" variant="accent" size="lg">
                    {t("action.explore")}
                  </ButtonLink>
                  <form action={demoLoginAction}>
                    <button type="submit" className={buttonClass("secondary", "lg", "border-white/40 bg-white/10 text-white hover:bg-white/20")}>
                      {t("action.demoLogin")}
                    </button>
                  </form>
                </div>
              </div>
              {/* Real photos of the featured activities; each one opens its activity. */}
              <ul className="hidden grid-cols-3 gap-3 lg:grid" aria-label={t("home.soon.title")}>
                {featured.map((a, i) => (
                  <li key={a.id} className={i === 1 ? "mt-8" : ""}>
                    <Link href={`/discover/${a.slug}`} className="group block">
                      <Photo photo={photoForActivity(a.slug, a.category)} small sizes="200px" className="relative aspect-[3/4] rounded-2xl ring-1 ring-white/20 transition-transform group-hover:-translate-y-1" />
                      <span className="sr-only">{localizeActivity(a, locale).title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>

        </>
      )}

      {!activitiesRes.ok && (
        <section className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6" aria-labelledby="unavailable-title">
          <div role="status" className="rounded-2xl border border-border bg-surface-muted p-5">
            <h2 id="unavailable-title" className="font-display text-lg font-semibold text-foreground">
              {t("state.unavailable.title")}
            </h2>
            <p className="mt-1 text-sm text-foreground-muted">{t("state.unavailable.body")}</p>
          </div>
        </section>
      )}

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 sm:px-6 sm:py-10">
        <ActivityRow id="today-title" title={t("home.today.title")} items={todayWeekend} emptyText={t("home.empty")} allLabel={t("home.soon.all")} />
        <ActivityRow id="free-title" title={t("home.free.title")} items={freeBeginner} emptyText={t("home.empty")} allLabel={t("home.soon.all")} />

        {welcomingCommunities.length > 0 && (
          <section aria-labelledby="communities-title" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 id="communities-title" className="font-display text-2xl font-semibold tracking-tight text-foreground">
                {t("home.communities.title")}
              </h2>
              <Link href="/communities" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-brand-strong hover:underline">
                {t("home.communities.all")}
                <ArrowIcon size={16} />
              </Link>
            </div>
            <ul className="grid gap-4 md:grid-cols-3">
              {welcomingCommunities.map((c) => (
                <li key={c.id} className="flex">
                  <Card className="relative flex w-full flex-col gap-2 p-5 transition-shadow focus-within:shadow-md hover:shadow-md">
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      <Link href={`/communities/${c.slug}`} className="after:absolute after:inset-0 after:content-[]">
                        {c.name}
                      </Link>
                    </h3>
                    <p className="line-clamp-2 text-sm text-foreground-muted">{localizeCommunityDescription(c, locale)}</p>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="neighborhoods-title" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="neighborhoods-title" className="font-display text-2xl font-semibold tracking-tight text-foreground">
              {t("home.neighborhoods.title")}
            </h2>
            <Link href="/neighborhoods" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-brand-strong hover:underline">
              {t("home.neighborhoods.all")}
              <ArrowIcon size={16} />
            </Link>
          </div>
          <ul className="flex flex-wrap gap-2">
            {orderedNeighborhoods.map((n) => (
              <li key={n.slug}>
                <Link
                  href={`/neighborhoods/${n.slug}`}
                  className="inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-4 text-sm font-medium text-foreground hover:bg-surface-muted"
                >
                  {followed.has(n.slug) && <span className="sr-only">{t("neighborhoods.following")}: </span>}
                  {t(`area.${n.areaEn}`)}
                  {followed.has(n.slug) && <span aria-hidden="true"> ✓</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {helpNeed && (
          <section aria-labelledby="help-title">
            <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <h2 id="help-title" className="font-display text-xl font-semibold text-foreground">
                  {t("home.help.title")}
                </h2>
                <p className="text-foreground-muted">{helpNeed.description}</p>
              </div>
              <ButtonLink href="/needs" variant="secondary" className="shrink-0">
                {t("home.help.cta")}
              </ButtonLink>
            </Card>
          </section>
        )}

        <p className="text-sm text-foreground-muted">{t("home.demoNote")}</p>
      </div>
    </>
  );
}

function ActivityRow({
  id,
  title,
  items,
  emptyText,
  allLabel,
}: {
  id: string;
  title: string;
  items: Awaited<ReturnType<typeof listActivities>>;
  emptyText: string;
  allLabel: string;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id={id} className="font-display text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <Link href="/discover" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-brand-strong hover:underline">
          {allLabel}
          <ArrowIcon size={16} />
        </Link>
      </div>
      {items.length > 0 ? (
        <ul className="grid gap-5 md:grid-cols-3">
          {items.map((a) => (
            <li key={a.id} className="flex">
              <ActivityCard activity={a} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-foreground-muted">{emptyText}</p>
      )}
    </section>
  );
}
