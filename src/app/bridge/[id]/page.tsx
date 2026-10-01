import Link from "next/link";
import { notFound } from "next/navigation";
import { BridgeStory } from "@/components/BridgeStory";
import { PageShell, Pill } from "@/components/ui";
import { getBridgeProposal, getBridgeShowcase } from "@/lib/data/bridge";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  saveBridgeProposalAction,
  updateBridgeProposalAction,
  declineBridgeProposalAction,
  acceptBridgeProposalAction,
} from "@/lib/actions/bridge-actions";
import { getI18n } from "@/lib/i18n/server";
import { areaFromSq } from "@/lib/i18n/areas";
import { localizeText } from "@/lib/i18n/content";
import { localizeBridgeText } from "@/lib/i18n/bridge-text";

export default async function BridgeProposalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string }>;
}) {
  const { id } = await params;
  const { updated } = await searchParams;
  const { t, locale } = await getI18n();
  const user = await getCurrentUser();
  const [proposal, showcase] = await Promise.all([getBridgeProposal(id, user?.id), getBridgeShowcase(id, user?.id)]);
  if (!proposal || !showcase) notFound();

  const field = (key: string) => t("bridge.org.editable", { field: t(key) });
  const textareaClass = "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground";
  const btn = "min-h-10 rounded-full border border-border px-5 py-2 text-sm font-medium text-foreground hover:bg-surface-muted";

  return (
    <PageShell className="max-w-4xl">
      <Link href="/bridge" className="text-sm font-medium text-brand-strong underline underline-offset-2">
        ← {t("bridge.back")}
      </Link>

      <header className="flex flex-col gap-2">
        {updated && <p className="text-sm font-medium text-success">{t("bridge.updated")}</p>}
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {proposal.communityAName} × {proposal.communityBName}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={proposal.status === "accepted" ? "success" : "neutral"}>{t(`bridge.status.long.${proposal.status}`)}</Pill>
          <span className="text-sm text-foreground-muted">
            {t("bridge.addresses", { area: areaFromSq(proposal.needAreaSq, t), need: localizeText(proposal.needDescription, locale) })}
          </span>
        </div>
      </header>

      <BridgeStory showcase={showcase} signedIn={Boolean(user)} />

      <section className="grid gap-4 rounded-2xl border border-border bg-surface p-5 text-sm sm:grid-cols-2">
        <div>
          <h2 className="font-semibold text-foreground">{t("bridge.resources")}</h2>
          <p className="mt-1 text-foreground-muted">{localizeBridgeText(proposal.requiredResources, t, locale)}</p>
        </div>
        <div>
          <h2 className="font-semibold text-foreground">{t("bridge.nextAction")}</h2>
          <p className="mt-1 text-foreground-muted">{localizeBridgeText(proposal.suggestedNextAction, t, locale)}</p>
        </div>
      </section>

      {proposal.viewerCanDecide && proposal.status !== "accepted" && proposal.status !== "declined" && (
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-display text-sm font-semibold text-foreground">{t("bridge.org.title")}</h2>
          <form action={updateBridgeProposalAction} className="flex flex-col gap-3">
            <input type="hidden" name="id" value={proposal.id} />
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground">{field("bridge.mutual")}</span>
              <textarea name="mutualBenefit" defaultValue={proposal.mutualBenefit} rows={2} className={textareaClass} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground">{field("bridge.resources")}</span>
              <textarea name="requiredResources" defaultValue={proposal.requiredResources} rows={2} className={textareaClass} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground">{field("bridge.nextAction")}</span>
              <textarea name="suggestedNextAction" defaultValue={proposal.suggestedNextAction} rows={2} className={textareaClass} />
            </label>
            <button type="submit" className={`${btn} w-fit`}>
              {t("bridge.org.saveEdits")}
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            <form action={saveBridgeProposalAction}>
              <input type="hidden" name="id" value={proposal.id} />
              <button type="submit" className={btn}>
                {t("bridge.org.saveLater")}
              </button>
            </form>
            <form action={acceptBridgeProposalAction}>
              <input type="hidden" name="id" value={proposal.id} />
              <button type="submit" className="min-h-10 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-strong">
                {t("bridge.org.accept")}
              </button>
            </form>
            <form action={declineBridgeProposalAction}>
              <input type="hidden" name="id" value={proposal.id} />
              <button type="submit" className="min-h-10 rounded-full border border-danger px-5 py-2 text-sm font-medium text-danger hover:bg-danger-tint">
                {t("bridge.org.decline")}
              </button>
            </form>
          </div>
        </div>
      )}

      {!proposal.viewerCanDecide && (
        <p className="text-xs text-foreground-muted">{t("bridge.onlyOrganizers", { a: proposal.communityAName, b: proposal.communityBName })}</p>
      )}
    </PageShell>
  );
}
