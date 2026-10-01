import Link from "next/link";
import { DemoBadge } from "@/components/DemoBadge";
import { listNeeds, findSimilarOpenNeed } from "@/lib/data/needs";
import { ensureBridgeProposals } from "@/lib/data/bridge";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createNeedAction, toggleNeedSupportAction, reportNeedAction } from "@/lib/actions/need-actions";
import type { ActivityCategory } from "@/lib/types";

const CATEGORIES: { id: ActivityCategory; label: string }[] = [
  { id: "technology", label: "Technology" },
  { id: "environment", label: "Environment" },
  { id: "sports", label: "Sports" },
  { id: "education", label: "Education" },
  { id: "culture", label: "Culture" },
  { id: "community", label: "Community" },
];

const STATUS_LABEL: Record<string, string> = { open: "Open", in_progress: "In progress", resolved: "Resolved" };

export default async function NeedsPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; supported?: string; reported?: string; category?: string; area?: string }>;
}) {
  const { submitted, reported, category, area } = await searchParams;
  const user = await getCurrentUser();
  await ensureBridgeProposals();
  const needs = await listNeeds(user?.id);
  const similar =
    category && area
      ? await findSimilarOpenNeed(category as ActivityCategory, area)
      : null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2">
        <DemoBadge className="self-start" />
        <h1 className="font-display text-3xl font-semibold text-foreground">Community needs</h1>
        <p className="text-sm text-foreground-muted">
          Nevojat e komunitetit — never shows who submitted a need, only its area, category, and
          description.
        </p>
      </div>

      {submitted && <p className="text-sm text-success">Need submitted — thanks for flagging it.</p>}
      {reported && <p className="text-sm text-success">Thanks — a moderator will review this report.</p>}

      {user ? (
        <details id="submit-need" open={Boolean(similar)} className="rounded-xl border border-border bg-surface p-4">
          <summary className="cursor-pointer text-sm font-medium text-foreground">Submit a need</summary>
          <form action={createNeedAction} className="mt-3 flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground">Category</span>
              <select name="category" defaultValue={category ?? "community"} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground">Approximate area</span>
              <input
                type="text"
                name="areaSq"
                defaultValue={area}
                placeholder="Prishtinë — Dardania"
                required
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground">Description</span>
              <textarea name="description" required rows={3} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
            </label>
            {similar && (
              <div className="rounded-lg border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-600 dark:bg-amber-950 dark:text-amber-100">
                <p>
                  A similar open need for this category and area already exists ({similar.supportCount}{" "}
                  supporters): &quot;{similar.description}&quot; — consider supporting it below instead of
                  submitting a near-duplicate.
                </p>
                <label className="mt-2 flex items-center gap-2">
                  <input type="checkbox" name="acknowledgedSimilar" />
                  This is a genuinely different need — submit it anyway
                </label>
              </div>
            )}
            <button type="submit" className="inline-flex w-fit items-center justify-center rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong">
              Submit
            </button>
          </form>
        </details>
      ) : (
        <p className="text-sm text-foreground-muted">
          <Link href="/login?next=/needs" className="underline underline-offset-2">
            Sign in
          </Link>{" "}
          to submit or support a need.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {needs.length === 0 ? (
          <p className="text-sm text-foreground-muted">No needs submitted yet.</p>
        ) : (
          needs.map((n) => (
            <div key={n.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-brand-tint px-2.5 py-1 text-xs font-medium capitalize text-brand-strong">
                  {n.category}
                </span>
                <span className="text-xs text-foreground-muted">{STATUS_LABEL[n.status]}</span>
              </div>
              <p className="mt-2 text-sm text-foreground">{n.description}</p>
              <p className="mt-1 text-xs text-foreground-muted">
                📍 {n.areaSq}
                {n.communityName && ` · ${n.communityName}`}
              </p>
              {n.bridgeProposalId && (
                <Link
                  href={`/bridge/${n.bridgeProposalId}`}
                  className="mt-1 inline-block text-xs text-brand-strong underline underline-offset-2"
                >
                  💡 See BRIDGE proposal for this need →
                </Link>
              )}
              <div className="mt-3 flex items-center gap-3">
                {user ? (
                  <form action={toggleNeedSupportAction}>
                    <input type="hidden" name="needId" value={n.id} />
                    <button
                      type="submit"
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${
                        n.isSupportedByViewer
                          ? "border-brand bg-brand text-white"
                          : "border-border text-foreground-muted hover:bg-surface-muted"
                      }`}
                    >
                      {n.isSupportedByViewer ? "Supported ✓" : "I also need this"} · {n.supportCount}
                    </button>
                  </form>
                ) : (
                  <span className="text-xs text-foreground-muted">{n.supportCount} supporters</span>
                )}
                {user && (
                  <form action={reportNeedAction} className="flex items-center gap-1">
                    <input type="hidden" name="needId" value={n.id} />
                    <input
                      type="text"
                      name="reason"
                      required
                      placeholder="Report reason"
                      aria-label={`Reason for reporting: ${n.description}`}
                      className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                    />
                    <button type="submit" className="text-xs text-foreground-muted underline underline-offset-2">
                      Report
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
