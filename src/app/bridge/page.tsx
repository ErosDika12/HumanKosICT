import Link from "next/link";
import type { Metadata } from "next";
import { BridgeNetworkGraph } from "@/components/BridgeNetworkGraph";
import { BridgeStory } from "@/components/BridgeStory";
import { Card, EmptyState, PageShell, Pill } from "@/components/ui";
import { ArrowIcon } from "@/components/icons";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  getBridgeGraph,
  getBridgeShowcase,
  getFeaturedBridgeId,
  listBridgeProposals,
  ensureBridgeProposals,
} from "@/lib/data/bridge";
import { pickStrongMatches } from "@/lib/data/bridge-picks";
import { getI18n } from "@/lib/i18n/server";
import { areaFromSq } from "@/lib/i18n/areas";
import { localizeText } from "@/lib/i18n/content";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("nav.bridge") };
}

const STATUS_TONE = { suggested: "neutral", saved: "brand", accepted: "success", declined: "neutral" } as const;

export default async function BridgePage() {
  const { t, locale } = await getI18n();
  await ensureBridgeProposals();
  const user = await getCurrentUser();
  const featuredId = await getFeaturedBridgeId();
  const [featured, proposals, graph] = await Promise.all([
    featuredId ? getBridgeShowcase(featuredId, user?.id) : Promise.resolve(null),
    listBridgeProposals(),
    getBridgeGraph(),
  ]);
  const featuredSummary = proposals.find((p) => p.id === featuredId);
  const strong = pickStrongMatches(proposals, featuredSummary);

  return (
    <PageShell>
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">{t("bridge.headline")}</h1>
        <p className="max-w-3xl text-base text-foreground-muted">{t("bridge.lead")}</p>
      </header>

      {featured ? (
        <section aria-labelledby="featured-bridge" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="accent">{t("bridge.featured")}</Pill>
            <h2 id="featured-bridge" className="font-display text-2xl font-semibold text-foreground">
              {featured.communityA.name} × {featured.communityB.name}
            </h2>
            <Pill tone={STATUS_TONE[featured.status]}>{t(`bridge.status.${featured.status}`)}</Pill>
          </div>
          <BridgeStory showcase={featured} signedIn={Boolean(user)} />
          <Link href={`/bridge/${featured.id}`} className="inline-flex w-fit items-center gap-1 text-sm font-medium text-brand-strong underline underline-offset-2">
            {t("bridge.full")}
            <ArrowIcon size={14} />
          </Link>
        </section>
      ) : (
        <EmptyState title={t("bridge.empty.title")}>
          {t("bridge.empty.body")}{" "}
          <Link href="/needs" className="underline">
            {t("nav.needs")}
          </Link>
        </EmptyState>
      )}

      {strong.length > 0 && (
        <section aria-labelledby="more-bridge" className="flex flex-col gap-3">
          <div>
            <h2 id="more-bridge" className="font-display text-2xl font-semibold text-foreground">
              {t("bridge.more.title")}
            </h2>
            <p className="text-sm text-foreground-muted">{t("bridge.more.lead")}</p>
          </div>
          <ul className="grid gap-4 md:grid-cols-3">
            {strong.map((p) => (
              <li key={p.id} className="flex">
                <Card className="flex w-full flex-col gap-2 p-4 transition-shadow hover:shadow-md">
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {p.communityAName} × {p.communityBName}
                  </h3>
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">{t("bridge.more.needIn", { area: areaFromSq(p.needAreaSq, t) })}</p>
                  <p className="text-sm text-foreground-muted">“{localizeText(p.needDescription, locale)}”</p>
                  <Link href={`/bridge/${p.id}`} className="mt-auto inline-flex items-center gap-1 pt-1 text-sm font-semibold text-brand-strong hover:underline">
                    {t("bridge.more.explore")}
                    <ArrowIcon size={14} />
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      <details className="rounded-2xl border border-border bg-surface p-4">
        <summary className="cursor-pointer font-display text-lg font-semibold text-foreground">{t("bridge.network")}</summary>
        <div className="mt-4">
          <BridgeNetworkGraph graph={graph} />
        </div>
      </details>
    </PageShell>
  );
}
