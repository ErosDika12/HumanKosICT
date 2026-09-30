import Link from "next/link";
import { BridgeNetworkGraph } from "@/components/BridgeNetworkGraph";
import { BridgeStory } from "@/components/BridgeStory";
import { DemoBadge } from "@/components/DemoBadge";
import { Card, EmptyState, Eyebrow, PageShell, Pill } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  getBridgeGraph,
  getBridgeShowcase,
  getFeaturedBridgeId,
  listBridgeProposals,
  regenerateBridgeProposals,
} from "@/lib/data/bridge";

const STATUS_LABEL: Record<string, string> = {
  suggested: "Suggested",
  saved: "Under review",
  accepted: "Accepted",
  declined: "Declined",
};
const STATUS_TONE = { suggested: "neutral", saved: "brand", accepted: "success", declined: "neutral" } as const;

const HOW_IT_WORKS = [
  { n: "1", title: "A neighbor raises a need", body: "Residents post what is missing in their area and others back it with one click." },
  { n: "2", title: "BRIDGE matches two communities", body: "A documented formula pairs communities that can act together on that need — and shows every reason." },
  { n: "3", title: "Organizers decide, everyone helps", body: "Only a human organizer accepts. Then a project opens, volunteers join, and a first session is scheduled." },
];

export default async function BridgePage({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  const { all } = await searchParams;
  await regenerateBridgeProposals();
  const user = await getCurrentUser();
  const featuredId = await getFeaturedBridgeId();
  const [featured, proposals, graph] = await Promise.all([
    featuredId ? getBridgeShowcase(featuredId, user?.id) : Promise.resolve(null),
    listBridgeProposals(),
    getBridgeGraph(),
  ]);
  const others = proposals.filter((p) => p.id !== featuredId);
  const visible = all ? others : others.slice(0, 5);

  return (
    <PageShell>
      <header className="flex flex-col gap-4">
        <DemoBadge className="self-start" />
        <div className="flex flex-col gap-2">
          <Eyebrow>BRIDGE · communities working together</Eyebrow>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Two communities. One shared need. One plan.
          </h1>
          <p className="max-w-3xl text-base text-foreground-muted">
            BRIDGE turns a neighborhood need into a concrete collaboration between two real communities. Below is a
            seeded example you can click through — every number comes from stored records, and every step explains why.
          </p>
        </div>
        <ol className="grid gap-3 sm:grid-cols-3">
          {HOW_IT_WORKS.map((s) => (
            <li key={s.n} className="flex gap-3 rounded-2xl border border-border bg-surface p-4">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white"
              >
                {s.n}
              </span>
              <div>
                <p className="font-display font-semibold text-foreground">{s.title}</p>
                <p className="text-sm text-foreground-muted">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </header>

      {featured ? (
        <section aria-labelledby="featured-bridge" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="accent">Featured example</Pill>
            <h2 id="featured-bridge" className="font-display text-2xl font-semibold text-foreground">
              {featured.communityA.name} × {featured.communityB.name}
            </h2>
            <Pill tone={STATUS_TONE[featured.status]}>{STATUS_LABEL[featured.status]}</Pill>
          </div>
          <BridgeStory showcase={featured} signedIn={Boolean(user)} />
          <Link href={`/bridge/${featured.id}`} className="w-fit text-sm font-medium text-brand-strong underline underline-offset-2">
            Open the full proposal →
          </Link>
        </section>
      ) : (
        <EmptyState title="No BRIDGE proposals right now">
          No open community need and published community pair currently scores high enough. See{" "}
          <Link href="/needs" className="underline">
            community needs
          </Link>
          .
        </EmptyState>
      )}

      {others.length > 0 && (
        <section aria-labelledby="more-bridge" className="flex flex-col gap-3">
          <h2 id="more-bridge" className="font-display text-2xl font-semibold text-foreground">
            More matches BRIDGE found
          </h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {visible.map((p) => (
              <li key={p.id}>
                <Card className="h-full p-4 transition-shadow hover:shadow-md">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      <Link href={`/bridge/${p.id}`} className="hover:underline">
                        {p.communityAName} × {p.communityBName}
                      </Link>
                    </h3>
                    <Pill tone={STATUS_TONE[p.status]}>{STATUS_LABEL[p.status]}</Pill>
                  </div>
                  <p className="mt-2 text-sm text-foreground-muted">
                    Need in {p.needAreaSq}: &ldquo;{p.needDescription}&rdquo;
                  </p>
                  <Link href={`/bridge/${p.id}`} className="mt-3 inline-block text-sm font-semibold text-brand-strong hover:underline">
                    Explore this match →
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
          {!all && others.length > visible.length && (
            <Link href="/bridge?all=1" className="w-fit text-sm font-medium text-brand-strong underline underline-offset-2">
              Show all {others.length} other matches
            </Link>
          )}
        </section>
      )}

      <details className="rounded-2xl border border-border bg-surface p-4">
        <summary className="cursor-pointer font-display text-lg font-semibold text-foreground">
          See the network view
        </summary>
        <div className="mt-4">
          <BridgeNetworkGraph graph={graph} />
        </div>
      </details>
    </PageShell>
  );
}
