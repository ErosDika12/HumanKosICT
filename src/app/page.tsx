import Link from "next/link";
import { ActivityCard } from "@/components/ActivityCard";
import { Photo } from "@/components/Photo";
import { ButtonLink, Card, buttonClass } from "@/components/ui";
import { ArrowIcon, BridgeIcon, CalendarIcon, CommunityIcon, UsersIcon } from "@/components/icons";
import { demoLoginAction } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listActivities } from "@/lib/data/activities";
import { listPlans } from "@/lib/data/invites";
import { getProgress } from "@/lib/data/progress";
import { HumanQuest } from "@/components/HumanQuest";
import { getUserInterests } from "@/lib/data/interests";
import { scoreActivities } from "@/lib/data/recommendations";
import { photoForActivity } from "@/lib/photos";
import { isSimulatedPast } from "@/lib/simulated-clock";
import { getI18n } from "@/lib/i18n/server";
import { localizeActivity } from "@/lib/i18n/content";
import { relativeDayLabel } from "@/lib/time-window";

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
  const user = await getCurrentUser();
  const [all, plans, interestIds, progress] = await Promise.all([
    listActivities(),
    user ? listPlans(user.id) : Promise.resolve([]),
    user ? getUserInterests(user.id) : Promise.resolve([]),
    user ? getProgress(user.id) : Promise.resolve(null),
  ]);
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

  const entries = [
    { href: "/people", Icon: UsersIcon, title: t("home.entry.friends.title"), body: t("home.entry.friends.body") },
    { href: "/communities", Icon: CommunityIcon, title: t("home.entry.communities.title"), body: t("home.entry.communities.body") },
    { href: "/bridge", Icon: BridgeIcon, title: t("home.entry.bridge.title"), body: t("home.entry.bridge.body") },
  ];

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

          <section className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6 sm:pt-10" aria-labelledby="soon-title">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <h2 id="soon-title" className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {t("home.soon.title")}
              </h2>
              <Link href="/discover" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-brand-strong hover:underline">
                {t("home.soon.all")}
                <ArrowIcon size={16} />
              </Link>
            </div>
            <ul className="grid gap-5 md:grid-cols-3">
              {featured.map((a) => (
                <li key={a.id} className="flex">
                  <ActivityCard activity={a} />
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {/* Compact entry points to the rest of the product — one line each. */}
      <nav className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10" aria-label={t("shell.more")}>
        <ul className="grid gap-3 sm:grid-cols-3">
          {entries.map(({ href, Icon, title, body }) => (
            <li key={href}>
              <Link href={href} className="flex min-h-16 items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:bg-surface-muted">
                <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand-strong">
                  <Icon size={20} />
                </span>
                <span className="min-w-0">
                  <span className="block font-display font-semibold text-foreground">{title}</span>
                  <span className="block text-sm text-foreground-muted">{body}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
