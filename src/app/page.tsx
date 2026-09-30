import Link from "next/link";
import { ActivityCard } from "@/components/ActivityCard";
import { MapPreview } from "@/components/MapPreview";
import { Photo } from "@/components/Photo";
import { Avatar, ButtonLink, Card, Eyebrow, Pill, SectionHeading, buttonClass } from "@/components/ui";
import { demoLoginAction } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listActivities } from "@/lib/data/activities";
import { getBridgeShowcase, getFeaturedBridgeId, regenerateBridgeProposals } from "@/lib/data/bridge";
import { getDemoStats, listFriendPreview } from "@/lib/data/friends";
import { getPhoto } from "@/lib/photos";
import { isSimulatedPast, SIMULATED_NOW_LABEL } from "@/lib/simulated-clock";
import { SLOT_LABEL } from "@/lib/demo-social";

const FEATURED_SLUGS = ["shetitje-fotografike-qender", "laborator-ideshe-eko-teknologji", "mbjellja-e-pemeve-dardania"];

const STEPS = [
  { emoji: "🔎", title: "Discover", body: "Filter 18 fictional activities by interest, day, cost and accessibility — on a list or a real map.", href: "/discover", cta: "Browse activities" },
  { emoji: "🤝", title: "Go with a friend", body: "Meet demo friends who share your interests, see what suits you both, and invite them in one click.", href: "/people", cta: "Find friends" },
  { emoji: "🗓️", title: "Make a plan", body: "Your RSVPs and invitations become a plan you can review, change and message about.", href: "/plans", cta: "View plans" },
  { emoji: "🌉", title: "Build together", body: "BRIDGE connects two communities around a real need — from proposal to first joint session.", href: "/bridge", cta: "Explore BRIDGE" },
];

export default async function HomePage() {
  const user = await getCurrentUser();
  await regenerateBridgeProposals();
  const featuredId = await getFeaturedBridgeId();
  const [all, friends, stats, bridge] = await Promise.all([
    listActivities(),
    listFriendPreview(4),
    getDemoStats(),
    featuredId ? getBridgeShowcase(featuredId, user?.id) : Promise.resolve(null),
  ]);
  const upcoming = all.filter((a) => !isSimulatedPast(a.date));
  const featured = FEATURED_SLUGS.map((s) => upcoming.find((a) => a.slug === s)).filter((a) => a !== undefined);
  const hero = getPhoto("boulevard");
  const cta = getPhoto("newborn");

  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-[#0e2042] text-white" aria-labelledby="hero-title">
        <Photo photo={hero} priority sizes="100vw" className="absolute inset-0 -z-10" />
        <div className="hero-overlay absolute inset-0 -z-10" aria-hidden="true" />
        <div className="mx-auto flex min-h-[520px] max-w-6xl flex-col justify-center gap-6 px-4 py-16 sm:px-6 sm:py-24">
          <div className="flex flex-col gap-4">
            <p className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-accent" />
              Prishtina · {SIMULATED_NOW_LABEL} · simulated demo
            </p>
            <h1 id="hero-title" className="max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Find something to do.
              <br />
              Find someone to go with.
              <br />
              <span className="text-accent">See your city build together.</span>
            </h1>
            <div className="gold-rule w-40" aria-hidden="true" />
            <p className="max-w-2xl text-base text-white/90 sm:text-lg">
              Human Network is a prototype of a neighborhood platform for Prishtina in 2036: discover local activities,
              invite friends, make plans, and watch communities collaborate on real needs through BRIDGE.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {user ? (
              <>
                <ButtonLink href="/discover" variant="accent" size="lg">
                  Continue to Discover
                </ButtonLink>
                <ButtonLink href="/plans" variant="secondary" size="lg" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
                  View your plans
                </ButtonLink>
              </>
            ) : (
              <>
                <form action={demoLoginAction}>
                  <button type="submit" className={buttonClass("accent", "lg", "shadow-lg")}>
                    Log in as demo
                  </button>
                </form>
                <ButtonLink href="/discover" variant="secondary" size="lg" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
                  Browse without logging in
                </ButtonLink>
              </>
            )}
          </div>
          {!user && (
            <p className="max-w-xl text-sm text-white/80">
              One click, no password, no email. You get your own temporary demo account — what you do stays on it and is
              removed after a day.
            </p>
          )}
          <dl className="mt-2 grid max-w-2xl grid-cols-3 gap-3 text-center">
            {[
              [stats.activities, "fictional activities"],
              [stats.friends, "demo friends"],
              [stats.communities, "communities"],
            ].map(([n, label]) => (
              <div key={String(label)} className="rounded-2xl bg-white/10 px-3 py-3 backdrop-blur">
                <dt className="text-xs text-white/80">{label}</dt>
                <dd className="font-display text-3xl font-semibold text-white">{n}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="absolute bottom-2 right-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] text-white">
          Photo: {hero.author}, {hero.license}
        </p>
      </section>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-4 py-16 sm:px-6">
        {/* HOW IT WORKS */}
        <section aria-labelledby="how-title" className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="How it works"
            title="From “what’s on?” to “see you there”"
            description="Four steps, one connected system — everything below is clickable and stored."
          />
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <Card className="flex h-full flex-col gap-3 p-5">
                  <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-tint text-2xl">
                    {s.emoji}
                  </span>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    <span className="mr-1.5 text-accent-strong">{i + 1}.</span>
                    {s.title}
                  </h3>
                  <p className="text-sm text-foreground-muted">{s.body}</p>
                  <Link href={s.href} className="mt-auto text-sm font-semibold text-brand-strong hover:underline">
                    {s.cta} →
                  </Link>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        {/* FEATURED ACTIVITIES */}
        <section aria-labelledby="featured-title" className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="This week in Prishtina (simulated)"
            title="Featured activities"
            description="Fictional events with real, stored details — RSVPs persist on your demo account."
            action={
              <ButtonLink href="/discover" variant="secondary" size="sm">
                See all {stats.activities} activities
              </ButtonLink>
            }
          />
          <div className="grid gap-5 md:grid-cols-3">
            {featured.map((a) => (
              <ActivityCard key={a.id} activity={a} />
            ))}
          </div>
        </section>

        {/* MAP */}
        <section aria-labelledby="map-title" className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="flex flex-col gap-4">
            <SectionHeading
              eyebrow="The map"
              title="Everything is somewhere real"
              description="Venues are placed in real Prishtina neighborhoods — Qendër, Dardania, Sunny Hill, Lakrishtë, Ulpiana and Gërmia. Pick a marker to open the activity."
            />
            <ul className="flex flex-wrap gap-2 text-sm">
              {["Qendër", "Dardania", "Sunny Hill", "Lakrishtë", "Ulpiana", "Gërmia"].map((n) => (
                <li key={n}>
                  <Pill tone="brand">{n}</Pill>
                </li>
              ))}
            </ul>
            <ButtonLink href="/discover?view=map" variant="primary" className="w-fit">
              Open the full map
            </ButtonLink>
          </div>
          <MapPreview activities={upcoming} />
        </section>

        {/* FRIENDS */}
        <section aria-labelledby="friends-title" className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="Demo friends"
            title="Meet people who like what you like"
            description="Twelve fictional demo friends with different interests, neighborhoods and availability. They are not real and never reply live — see how each one fits your plans."
            action={
              <ButtonLink href="/people" variant="secondary" size="sm">
                Find friends
              </ButtonLink>
            }
          />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {friends.map((f) => (
              <li key={f.id}>
                <Card className="flex h-full flex-col gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={f.name} />
                    <div>
                      <p className="font-display font-semibold text-foreground">{f.name}</p>
                      <p className="text-xs text-foreground-muted">{f.areaSq?.replace("Prishtinë — ", "")}</p>
                    </div>
                  </div>
                  <ul className="flex flex-wrap gap-1.5" aria-label={`${f.name}'s interests`}>
                    {f.interests.slice(0, 3).map((i) => (
                      <li key={i.id}>
                        <Pill tone="neutral">
                          {i.emoji} {i.label}
                        </Pill>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-foreground-muted">Free {f.availability.map((s) => SLOT_LABEL[s]).join(", ")}</p>
                  <Pill tone="accent" className="w-fit">
                    Demo friend · fictional
                  </Pill>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        {/* BRIDGE */}
        {bridge && (
          <section aria-labelledby="bridge-title" className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
            <div className="grid lg:grid-cols-[1.05fr_1fr]">
              <div className="flex flex-col gap-5 p-6 sm:p-8">
                <Eyebrow>BRIDGE · a real example</Eyebrow>
                <h2 id="bridge-title" className="font-display text-3xl font-semibold tracking-tight text-foreground">
                  How two communities solve one neighborhood need
                </h2>
                <p className="text-foreground-muted">
                  Neighbors in {bridge.need.areaSq.replace("Prishtinë — ", "")} asked for help: &ldquo;{bridge.need.description}&rdquo;
                  BRIDGE matched <strong>{bridge.communityA.name}</strong> with <strong>{bridge.communityB.name}</strong>. Their
                  organizers accepted, a project opened, and the first joint session is scheduled.
                </p>
                <ol className="flex flex-col gap-2" aria-label="BRIDGE progress">
                  {bridge.stages.map((s, i) => (
                    <li key={s.key} className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          s.state === "done" ? "bg-success text-white" : s.state === "current" ? "bg-accent text-[#1c1b1a]" : "border border-border bg-surface-muted text-foreground-muted"
                        }`}
                      >
                        {s.state === "done" ? "✓" : i + 1}
                      </span>
                      <span className="text-sm">
                        <span className="font-semibold text-foreground">{s.label}</span>
                        <span className="text-foreground-muted"> — {s.detail}</span>
                        {s.state === "current" && <span className="sr-only"> (current step)</span>}
                      </span>
                    </li>
                  ))}
                </ol>
                <div className="flex flex-wrap gap-3">
                  <ButtonLink href="/bridge" variant="primary" size="md">
                    Explore BRIDGE
                  </ButtonLink>
                  <ButtonLink href={bridge.nextStep.href} variant="secondary" size="md">
                    {bridge.nextStep.label}
                  </ButtonLink>
                </div>
              </div>
              <Photo photo={getPhoto("germia")} small={false} illustrative className="relative min-h-[260px] bg-surface-muted" />
            </div>
          </section>
        )}

        {/* HONESTY */}
        <section aria-labelledby="honest-title" className="grid gap-6 rounded-3xl bg-brand-tint p-6 sm:p-8 lg:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Eyebrow>Honest by design</Eyebrow>
            <h2 id="honest-title" className="font-display text-2xl font-semibold text-foreground">
              What is real, what is simulated
            </h2>
            <p className="text-sm text-foreground-muted">
              This is a competition prototype. It never pretends to be more than it is.
            </p>
          </div>
          <ul className="grid gap-2 text-sm text-foreground">
            <li>✅ <strong>Real:</strong> the software, the database, your RSVPs, invitations and messages (on your temporary account).</li>
            <li>🎭 <strong>Simulated:</strong> every person, community, event and number in Prishtina 2036 — labeled as demo content.</li>
            <li>🕒 <strong>Simulated clock:</strong> “today” is {SIMULATED_NOW_LABEL}, not the real date.</li>
            <li>🖼️ <strong>Photos:</strong> real licensed photographs used only as illustrations — <Link href="/credits" className="underline">credits</Link>.</li>
            <li>💬 <strong>Friends never reply live.</strong> Replies are labeled examples or a visible availability rule.</li>
          </ul>
        </section>

        {/* FINAL CTA */}
        <section className="relative isolate overflow-hidden rounded-3xl bg-[#0e2042] p-8 text-white sm:p-12">
          <Photo photo={cta} small={false} className="absolute inset-0 -z-10 opacity-40" />
          <div className="hero-overlay absolute inset-0 -z-10" aria-hidden="true" />
          <div className="flex max-w-xl flex-col gap-4">
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">Ready to plan something?</h2>
            <p className="text-white/90">Take the whole journey in about three minutes — no sign-up.</p>
            {user ? (
              <ButtonLink href="/discover" variant="accent" size="lg" className="w-fit">
                Continue to Discover
              </ButtonLink>
            ) : (
              <form action={demoLoginAction}>
                <button type="submit" className={buttonClass("accent", "lg")}>
                  Log in as demo
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
