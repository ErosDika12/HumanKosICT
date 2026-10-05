import Link from "next/link";
import { AuthorizationError, getCurrentUser, requireRole } from "@/lib/auth/current-user";
import { listOpenReports } from "@/lib/data/reports";
import { listPendingActivities, listPendingCommunities } from "@/lib/data/moderation";
import {
  resolveReportAction,
  publishCommunityAction,
  publishActivityAction,
} from "@/lib/actions/moderation-actions";

export default async function ModerationPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <AccessNote message={
        <>
          <Link href="/login?next=/moderation" className="text-brand underline underline-offset-2">
            Sign in
          </Link>{" "}
          as a moderator persona to view reports.
        </>
      } />
    );
  }

  try {
    await requireRole("MODERATOR");
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return (
        <AccessNote
          message={`Access denied — this page is moderator-only. Your account (${user.role.toLowerCase()}) doesn't have that role.`}
        />
      );
    }
    throw err;
  }

  const [reports, pendingCommunities, pendingActivities] = await Promise.all([
    listOpenReports(),
    listPendingCommunities(),
    listPendingActivities(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">

      <section className="flex flex-col gap-3">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Pending communities & events
        </h1>
        <p className="text-sm text-foreground-muted">
          New organizer-created communities and events start hidden from Discover until published
          here — see docs/PRODUCT_CONTRACT.md.
        </p>
        {pendingCommunities.length === 0 && pendingActivities.length === 0 ? (
          <p className="text-sm text-foreground-muted">Nothing pending review right now.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {pendingCommunities.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Community: {c.name} <span className="text-foreground-muted">by {c.organizerName}</span>
                  </p>
                  <Link href={`/communities/${c.slug}`} className="text-xs text-brand underline underline-offset-2">
                    Preview
                  </Link>
                </div>
                <form action={publishCommunityAction}>
                  <input type="hidden" name="communityId" value={c.id} />
                  <button type="submit" className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground-muted hover:bg-surface-muted">
                    Publish
                  </button>
                </form>
              </div>
            ))}
            {pendingActivities.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Event: {a.title} <span className="text-foreground-muted">— {a.communityName}, by {a.organizerName}</span>
                  </p>
                  <Link href={`/discover/${a.slug}`} className="text-xs text-brand underline underline-offset-2">
                    Preview
                  </Link>
                </div>
                <form action={publishActivityAction}>
                  <input type="hidden" name="activityId" value={a.id} />
                  <button type="submit" className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground-muted hover:bg-surface-muted">
                    Publish
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-semibold text-foreground">Open reports</h2>
        {reports.length === 0 ? (
          <p className="text-sm text-foreground-muted">No open reports right now.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {reports.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-surface p-4">
                <p className="text-sm font-medium text-foreground">
                  {r.activityTitle ?? (r.needDescription ? `Need: ${r.needDescription}` : "Report")} — reported by{" "}
                  {r.reporterName}
                </p>
                <p className="mt-1 text-sm text-foreground-muted">{r.reason}</p>
                <form action={resolveReportAction} className="mt-3 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="reportId" value={r.id} />
                  <input
                    type="text"
                    name="note"
                    placeholder="Resolution note (optional)"
                    aria-label="Resolution note (optional)"
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground-muted hover:bg-surface-muted"
                  >
                    Mark resolved
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function AccessNote({ message }: { message: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-10 sm:px-6">
      <p className="text-sm text-foreground-muted">{message}</p>
    </div>
  );
}
