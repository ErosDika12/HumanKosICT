import Link from "next/link";
import { ActivityCard } from "@/components/ActivityCard";
import { HeroNetwork } from "@/components/HeroNetwork";
import { Photo } from "@/components/Photo";
import { Avatar, ButtonLink, Card, buttonClass } from "@/components/ui";
import { ArrowIcon, CalendarIcon, CheckIcon } from "@/components/icons";
import { demoLoginAction } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listActivities } from "@/lib/data/activities";
import { getBridgeShowcase, getFeaturedBridgeId, ensureBridgeProposals } from "@/lib/data/bridge";
import { getFriendExample } from "@/lib/data/home";
import { listPlans } from "@/lib/data/invites";
import { getUserInterests } from "@/lib/data/interests";
import { scoreActivities } from "@/lib/data/recommendations";
import { photoForActivity } from "@/lib/photos";
import { SIMULATED_NOW_ISO, isSimulatedPast } from "@/lib/simulated-clock";
import { getI18n } from "@/lib/i18n/server";
import { localizeActivity, localizeText } from "@/lib/i18n/content";
import { relativeDayLabel } from "@/lib/time-window";

const FEATURED_SLUGS = ["shetitje-fotografike-qender", "mbjellja-e-pemeve-dardania", "laborator-ideshe-eko-teknologji"];

const RELATIVE_KEY: Record<string, string> = {
  "Already happened": "fact.past",
  Today: "fact.today",
  Tomorrow: "fact.tomorrow",
  "This weekend": "fact.thisWeekend",
  "Next weekend": "fact.nextWeekend",
};

export default async function HomePage() {
  const { t, locale, longDate, shortDate } = await getI18n();
  const user = await getCurrentUser();
  await ensureBridgeProposals();
  const featuredId = await getFeaturedBridgeId();
  const [all, friendExample, bridge, plans, interestIds] = await Promise.all([
    listActivities(),
    getFriendExample(),
    featuredId ? getBridgeShowcase(featuredId, user?.id) : Promise.resolve(null),
    user ? listPlans(user.id) : Promise.resolve([]),
    user ? getUserInterests(user.id) : Promise.resolve([]),
  ]);
  const upcoming = all.filter((a) => !isSimulatedPast(a.date));
  const featured = FEATURED_SLUGS.map((s) => upcoming.find((a) => a.slug === s)).filter((a) => a !== undefined);

  // Personal area (signed-in visitors)
  const nextPlan = plans.find((p) => !p.activity.isPast && !p.activity.isCanceled && p.myRsvp === "confirmed") ?? null;
  const planned = new Set(plans.map((p) => p.activity.slug));
  const suggestions = user
    ? scoreActivities(upcoming.filter((a) => !planned.has(a.slug) && a.ageEligibility !== "supervised-minors" && a.capacity - a.rsvpCount > 0), { interestIds, locale })
        .slice(0, 3)
    : [];

  const friendActivity = friendExample ? upcoming.find((a) => a.slug === friendExample.activitySlug) : undefined;
  const dayLabel = (iso: string) => {
    const rel = relativeDayLabel(iso);
    return RELATIVE_KEY[rel] ? t(RELATIVE_KEY[rel]) : shortDate(iso);
  };

  return (
    <>
      {user ? (
        <section className="border-b border-border bg-surface" aria-labelledby="hello-title">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
            <div>
              <h1 id="hello-title" className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {t("home.hello", { name: user.name })}
              </h1>
              <p className="mt-1 text-foreground-muted">{t("home.hello.sub")}</p>
            </div>
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              <Card className="flex flex-col gap-3 p-5">
                <h2 className="font-display text-lg font-semibold text-foreground">{t("home.next.title")}</h2>
                {nextPlan ? (
                  <>
                    <div>
                      <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-strong">
                        <CalendarIcon size={16} />
                        {dayLabel(nextPlan.activity.date)} · {shortDate(nextPlan.activity.date)} · {nextPlan.activity.startTime}
                      </p>
                      <Link href={`/discover/${nextPlan.activity.slug}`} className="mt-1 block font-display text-xl font-semibold text-foreground hover:underline">
                        {localizeTitleBySlug(upcoming, nextPlan.activity.slug, nextPlan.activity.title, locale)}
                      </Link>
                      {nextPlan.invites.filter((i) => i.status === "accepted").length > 0 && (
                        <p className="mt-1 text-sm text-foreground-muted">
                          {t("home.next.withFriends", { names: nextPlan.invites.filter((i) => i.status === "accepted").map((i) => i.otherName.split(" ")[0]).join(", ") })}
                        </p>
                      )}
                    </div>
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
                <div>
                  <h2 className="font-display text-lg font-semibold text-foreground">{t("home.suggest.title")}</h2>
                  <p className="text-sm text-foreground-muted">{t("home.suggest.sub")}</p>
                </div>
                <ul className="grid gap-3 sm:grid-cols-3">
                  {suggestions.map((a) => (
                    <li key={a.id} className="flex">
                      <ActivityCard activity={a} compact />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="hero-navy relative isolate overflow-hidden text-white" aria-labelledby="hero-title">
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="flex flex-col gap-5">
              <p className="inline-flex w-fit items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/90">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-accent" />
                {t("home.kicker", { date: longDate(SIMULATED_NOW_ISO) })}
              </p>
              <h1 id="hero-title" className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
                {t("home.title.line1")}
                <br />
                <span className="text-accent">{t("home.title.line2")}</span>
              </h1>
              <p className="max-w-xl text-base text-white/85 sm:text-lg">{t("home.lead")}</p>
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
              <p className="text-sm text-white/70">{t("home.demoNote")}</p>
            </div>
            <div className="hidden lg:block">
              <HeroNetwork caption={t("home.networkCaption")} alt={t("home.networkAlt")} />
            </div>
          </div>
        </section>
      )}

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 py-12 sm:px-6 sm:py-16">
        {/* Three things happening soon (signed-out visitors; signed-in visitors see personal suggestions above) */}
        {!user && (
        <section aria-labelledby="soon-title" className="flex flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="soon-title" className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {t("home.soon.title")}
              </h2>
              <p className="mt-1 text-foreground-muted">{t("home.soon.lead")}</p>
            </div>
            <Link href="/discover" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-strong hover:underline">
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
        )}

        {/* One concrete example of going with a friend */}
        {friendExample && friendActivity && (
          <section aria-labelledby="friend-title" className="grid items-center gap-8 rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-8 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
              <h2 id="friend-title" className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {t("home.friend.title")}
              </h2>
              <p className="text-foreground-muted">{t("home.friend.lead")}</p>
              <ol className="flex flex-col gap-2 text-sm font-medium text-foreground">
                {(["home.friend.step1", "home.friend.step2", "home.friend.step3"] as const).map((key, i) => (
                  <li key={key} className="flex items-center gap-3">
                    <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    {t(key)}
                  </li>
                ))}
              </ol>
              <div className="flex flex-wrap gap-3 pt-1">
                {user ? (
                  <ButtonLink href="/people" variant="primary">
                    {t("home.friend.cta")}
                  </ButtonLink>
                ) : (
                  <form action={demoLoginAction}>
                    <button type="submit" className={buttonClass("primary", "md")}>
                      {t("home.friend.cta")}
                    </button>
                  </form>
                )}
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border bg-background">
              <Photo photo={photoForActivity(friendActivity.slug, friendActivity.category)} small illustrative className="relative aspect-[16/8] w-full" />
              <div className="flex flex-col gap-3 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent-strong">{t("home.friend.example")}</p>
                <Link href={`/discover/${friendActivity.slug}`} className="font-display text-lg font-semibold text-foreground hover:underline">
                  {localizeActivity(friendActivity, locale).title}
                </Link>
                <div className="flex items-center gap-3">
                  <span className="flex -space-x-2">
                    <Avatar name={friendExample.inviter} size={36} />
                    <Avatar name={friendExample.friend} size={36} />
                  </span>
                  <div className="text-sm">
                    <p className="font-medium text-foreground">{t("home.friend.invitedLine", { inviter: friendExample.inviter, friend: friendExample.friend })}</p>
                    {friendExample.message && <p className="text-foreground-muted">“{localizeText(friendExample.message, locale)}”</p>}
                  </div>
                </div>
                <p className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
                  <CheckIcon size={16} />
                  {t("home.friend.accepted", { friend: friendExample.friend.split(" ")[0] })}
                </p>
                <p className="text-xs text-foreground-muted">{t("home.friend.disclaimer")}</p>
              </div>
            </div>
          </section>
        )}

        {/* One understandable BRIDGE story */}
        {bridge && (
          <section aria-labelledby="bridge-title" className="flex flex-col gap-5">
            <div>
              <h2 id="bridge-title" className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {t("home.bridge.title")}
              </h2>
              <p className="mt-1 text-foreground-muted">{t("home.bridge.lead")}</p>
            </div>
            <ol className="grid gap-4 md:grid-cols-4">
              <BridgeStep n={1} title={t("home.bridge.step1")}>
                {localizeText(bridge.need.description, locale)}
              </BridgeStep>
              <BridgeStep n={2} title={t("home.bridge.step2")}>
                <strong>{bridge.communityA.name}</strong> × <strong>{bridge.communityB.name}</strong>
              </BridgeStep>
              <BridgeStep n={3} title={t("home.bridge.step3")}>
                {bridge.project ? t("home.bridge.step3Detail", { n: bridge.project.volunteerCount, total: bridge.project.volunteersNeeded }) : "—"}
              </BridgeStep>
              <BridgeStep n={4} title={t("home.bridge.step4")}>
                {bridge.kickoff ? `${shortDate(bridge.kickoff.date)} · ${bridge.kickoff.title}` : "—"}
              </BridgeStep>
            </ol>
            <div>
              <ButtonLink href="/bridge" variant="primary">
                {t("home.bridge.cta")}
              </ButtonLink>
            </div>
          </section>
        )}

        {!user && (
          <section className="hero-navy rounded-3xl px-6 py-10 text-center text-white sm:px-10">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">{t("home.final.title")}</h2>
            <p className="mx-auto mt-2 max-w-lg text-white/80">{t("home.final.lead")}</p>
            <form action={demoLoginAction} className="mt-5 flex justify-center">
              <button type="submit" className={buttonClass("accent", "lg")}>
                {t("action.demoLogin")}
              </button>
            </form>
          </section>
        )}
      </div>
    </>
  );
}

function BridgeStep({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4">
      <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-tint text-sm font-bold text-brand-strong">
        {n}
      </span>
      <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-foreground-muted">{children}</p>
    </li>
  );
}

function localizeTitleBySlug(
  list: { slug: string; title: string; titleSq: string; summary: string; summarySq: string; description: string; descriptionSq: string; costDetail?: string }[],
  slug: string,
  fallback: string,
  locale: "sq" | "en" | "sr"
): string {
  const a = list.find((x) => x.slug === slug);
  return a ? localizeActivity(a, locale).title : fallback;
}
