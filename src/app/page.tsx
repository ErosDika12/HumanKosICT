import Link from "next/link";
import { DemoBadge } from "@/components/DemoBadge";
import { ACTIVITIES, COMMUNITIES } from "@/lib/demo-data";

const JOURNEY_STEPS = [
  {
    title: "Choose interests",
    titleSq: "Zgjidh interesat",
    body: "Tell Human Network what you care about — technology, sport, environment, culture, and more.",
  },
  {
    title: "Discover on the map",
    titleSq: "Zbulo në hartë",
    body: "See real seeded activities near you, filter by category, and switch freely between map and list.",
  },
  {
    title: "Join and connect",
    titleSq: "Bashkohu dhe lidhu",
    body: "RSVP to an activity, meet its community, and see how BRIDGE proposes useful collaborations.",
  },
  {
    title: "Help the city listen",
    titleSq: "Ndihmo qytetin të dëgjojë",
    body: "Community needs feed an anonymous, aggregated municipal view — never individual data.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="border-b border-border bg-gradient-to-b from-brand-tint to-background">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-14 sm:px-6 sm:py-20">
          <DemoBadge className="self-start" />
          <h1 className="max-w-3xl font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Don&apos;t connect people to screens.
            <br />
            <span className="text-brand-strong">Connect people to each other.</span>
          </h1>
          <p className="max-w-2xl text-base text-foreground-muted sm:text-lg">
            KOSOVO 2036 — HUMAN NETWORK is an interactive prototype imagining a Prishtina where a
            live social map helps people find real activities, form communities, and let{" "}
            <span className="font-medium text-foreground">BRIDGE</span> propose useful
            collaborations between them — while the city gets an anonymous, aggregated view of
            what its neighborhoods need.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-strong"
            >
              Start onboarding · Fillo
            </Link>
            <Link
              href="/discover"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted"
            >
              Skip to Discover
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="font-display text-2xl font-semibold text-foreground">The core journey</h2>
        <p className="mt-1 max-w-2xl text-sm text-foreground-muted">
          This prototype currently implements Phase 1 of an eight-phase build: onboarding, map
          and list discovery, and activity detail. Later phases add accounts, RSVP, BRIDGE, the AI
          assistant, and the municipal dashboard.
        </p>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {JOURNEY_STEPS.map((step, i) => (
            <li
              key={step.title}
              className="rounded-xl border border-border bg-surface p-5 shadow-sm"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-tint text-sm font-semibold text-brand-strong">
                {i + 1}
              </span>
              <h3 className="mt-3 font-display text-base font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-1 text-xs uppercase tracking-wide text-foreground-muted">
                {step.titleSq}
              </p>
              <p className="mt-2 text-sm text-foreground-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-border bg-surface-muted">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:grid-cols-2 sm:px-6">
          <div className="rounded-xl border border-border bg-surface p-6">
            <p className="text-sm font-medium text-foreground-muted">Seeded this demo</p>
            <p className="mt-2 font-display text-3xl font-semibold text-foreground">
              {ACTIVITIES.length} activities
            </p>
            <p className="mt-1 text-sm text-foreground-muted">
              across sports, technology, culture, and environment — all fictional and dated for
              2036.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-6">
            <p className="text-sm font-medium text-foreground-muted">And</p>
            <p className="mt-2 font-display text-3xl font-semibold text-foreground">
              {COMMUNITIES.length} communities
            </p>
            <p className="mt-1 text-sm text-foreground-muted">
              organizing them — the same demo communities that later phases connect through
              BRIDGE.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
