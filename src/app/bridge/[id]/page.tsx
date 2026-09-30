import Link from "next/link";
import { notFound } from "next/navigation";
import { BridgeStory } from "@/components/BridgeStory";
import { DemoBadge } from "@/components/DemoBadge";
import { PageShell, Pill } from "@/components/ui";
import { getBridgeProposal, getBridgeShowcase } from "@/lib/data/bridge";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  saveBridgeProposalAction,
  updateBridgeProposalAction,
  declineBridgeProposalAction,
  acceptBridgeProposalAction,
} from "@/lib/actions/bridge-actions";

const STATUS_LABEL: Record<string, string> = {
  suggested: "Suggested — not yet reviewed",
  saved: "Saved by an organizer",
  accepted: "Accepted",
  declined: "Declined",
};

export default async function BridgeProposalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string }>;
}) {
  const { id } = await params;
  const { updated } = await searchParams;
  const user = await getCurrentUser();
  const [proposal, showcase] = await Promise.all([getBridgeProposal(id, user?.id), getBridgeShowcase(id, user?.id)]);
  if (!proposal || !showcase) notFound();

  return (
    <PageShell className="max-w-4xl">
      <Link href="/bridge" className="text-sm font-medium text-brand-strong underline underline-offset-2">
        ← Back to BRIDGE
      </Link>

      <header className="flex flex-col gap-2">
        <DemoBadge className="self-start" />
        {updated && <p className="text-sm font-medium text-success">Proposal updated.</p>}
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {proposal.communityAName} × {proposal.communityBName}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={proposal.status === "accepted" ? "success" : "neutral"}>{STATUS_LABEL[proposal.status]}</Pill>
          <span className="text-sm text-foreground-muted">
            Addresses a need in {proposal.needAreaSq}: &ldquo;{proposal.needDescription}&rdquo;
          </span>
        </div>
      </header>

      <BridgeStory showcase={showcase} signedIn={Boolean(user)} />

      {proposal.viewerCanDecide && proposal.status !== "accepted" && proposal.status !== "declined" && (
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
          <h2 className="font-display text-sm font-semibold text-foreground">Organizer actions</h2>
          <form action={updateBridgeProposalAction} className="flex flex-col gap-3">
            <input type="hidden" name="id" value={proposal.id} />
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground">Mutual benefit (editable)</span>
              <textarea
                name="mutualBenefit"
                defaultValue={proposal.mutualBenefit}
                rows={2}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground">Required resources (editable)</span>
              <textarea
                name="requiredResources"
                defaultValue={proposal.requiredResources}
                rows={2}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground">Suggested next action (editable)</span>
              <textarea
                name="suggestedNextAction"
                defaultValue={proposal.suggestedNextAction}
                rows={2}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
            <button
              type="submit"
              className="inline-flex w-fit items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground-muted hover:bg-surface-muted"
            >
              Save edits
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            <form action={saveBridgeProposalAction}>
              <input type="hidden" name="id" value={proposal.id} />
              <button type="submit" className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground-muted hover:bg-surface-muted">
                Save for later
              </button>
            </form>
            <form action={acceptBridgeProposalAction}>
              <input type="hidden" name="id" value={proposal.id} />
              <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong">
                Accept → create draft project
              </button>
            </form>
            <form action={declineBridgeProposalAction}>
              <input type="hidden" name="id" value={proposal.id} />
              <button type="submit" className="rounded-lg border border-danger px-4 py-2 text-sm font-medium text-danger hover:bg-danger-tint">
                Decline
              </button>
            </form>
          </div>
        </div>
      )}

      {!proposal.viewerCanDecide && (
        <p className="text-xs text-foreground-muted">
          Only an organizer of {proposal.communityAName} or {proposal.communityBName} can act on this proposal.
        </p>
      )}
    </PageShell>
  );
}
