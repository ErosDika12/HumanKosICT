import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoBadge } from "@/components/DemoBadge";
import { getCommunityBySlug, listPendingMembers } from "@/lib/data/communities";
import { ensureBridgeProposals, listBridgeProposalsForCommunity } from "@/lib/data/bridge";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  joinCommunityAction,
  leaveCommunityAction,
  decideMembershipAction,
} from "@/lib/actions/community-actions";

export default async function CommunityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ joined?: string; created?: string }>;
}) {
  const { slug } = await params;
  const { joined, created } = await searchParams;
  const user = await getCurrentUser();
  const community = await getCommunityBySlug(slug, user?.id);
  if (!community) notFound();

  const canManage = community.viewerMembership === "organizer" || user?.role === "MODERATOR";
  if (community.status === "draft" && !canManage) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-10 sm:px-6">
        <DemoBadge className="self-start" />
        <p className="text-sm text-foreground-muted">
          This community is pending moderator review and isn&apos;t public yet.
        </p>
      </div>
    );
  }

  const pendingMembers =
    canManage && community.visibility === "restricted" ? await listPendingMembers(user!.id, community.id) : [];

  await ensureBridgeProposals();
  const bridgeProposals = await listBridgeProposalsForCommunity(community.id);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <Link href="/communities" className="text-sm text-brand underline underline-offset-2">
        ← Back to Communities
      </Link>

      <div className="flex flex-col gap-2">
        <DemoBadge className="self-start" />
        {community.status === "draft" && (
          <span className="inline-flex w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-100">
            Pending review — only visible to you and moderators
          </span>
        )}
        {created && <p className="text-sm text-success">Community created — pending moderator review.</p>}
        {joined === "pending" && (
          <p className="text-sm text-foreground-muted">
            Your join request is pending the organizer&apos;s approval.
          </p>
        )}
        {joined === "member" && <p className="text-sm text-success">You joined this community.</p>}
        <h1 className="font-display text-3xl font-semibold text-foreground">
          {community.name} {community.verified && <span className="text-brand">✓ verified</span>}
        </h1>
        <p className="text-sm text-foreground-muted">
          📍 {community.areaSq} · {community.memberCount} members · organized by {community.organizerName}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="font-display text-sm font-semibold text-foreground">Purpose</h2>
        <p className="mt-2 text-sm text-foreground-muted">{community.description}</p>
        <p className="mt-2 text-sm text-foreground-muted" lang="sq">
          {community.descriptionSq}
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {community.language && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-foreground-muted">Language</dt>
              <dd className="text-sm text-foreground">{community.language}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs uppercase tracking-wide text-foreground-muted">Visibility</dt>
            <dd className="text-sm text-foreground capitalize">{community.visibility}</dd>
          </div>
          {community.rules && (
            <div className="mt-4 sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-foreground-muted">Rules</dt>
              <dd className="mt-1 text-sm text-foreground-muted">{community.rules}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!user ? (
          <Link
            href={`/login?next=${encodeURIComponent(`/communities/${slug}`)}`}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong"
          >
            Sign in to join
          </Link>
        ) : community.viewerMembership === "organizer" ? (
          <Link
            href={`/communities/${slug}/edit`}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground-muted hover:bg-surface-muted"
          >
            Edit community
          </Link>
        ) : community.viewerMembership === "pending" ? (
          <span className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted">
            Join request pending approval
          </span>
        ) : community.viewerMembership === "member" ? (
          <form action={leaveCommunityAction}>
            <input type="hidden" name="communityId" value={community.id} />
            <button type="submit" className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground-muted hover:bg-surface-muted">
              Leave community
            </button>
          </form>
        ) : (
          <form action={joinCommunityAction}>
            <input type="hidden" name="communityId" value={community.id} />
            <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong">
              {community.visibility === "restricted" ? "Request to join" : "Join community"}
            </button>
          </form>
        )}
        {user && (
          <>
            <Link href={`/communities/${slug}/activities/new`} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground-muted hover:bg-surface-muted">
              {community.viewerMembership === "organizer" ? "New event" : "Propose an event"}
            </Link>
            {community.viewerMembership === "organizer" && (
              <Link href={`/communities/${slug}/projects/new`} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground-muted hover:bg-surface-muted">
                New project
              </Link>
            )}
          </>
        )}
      </div>

      {canManage && pendingMembers.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="font-display text-sm font-semibold text-foreground">Pending join requests</h2>
          <div className="mt-2 flex flex-col gap-2">
            {pendingMembers.map((m) => (
              <div key={m.membershipId} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-foreground">{m.name}</span>
                <div className="flex gap-2">
                  <form action={decideMembershipAction}>
                    <input type="hidden" name="membershipId" value={m.membershipId} />
                    <input type="hidden" name="decision" value="approve" />
                    <input type="hidden" name="communitySlug" value={slug} />
                    <button type="submit" className="rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground-muted hover:bg-surface-muted">
                      Approve
                    </button>
                  </form>
                  <form action={decideMembershipAction}>
                    <input type="hidden" name="membershipId" value={m.membershipId} />
                    <input type="hidden" name="decision" value="deny" />
                    <input type="hidden" name="communitySlug" value={slug} />
                    <button type="submit" className="rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground-muted hover:bg-surface-muted">
                      Deny
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="font-display text-sm font-semibold text-foreground">Upcoming events</h2>
        {community.upcomingActivities.length === 0 ? (
          <p className="mt-2 text-sm text-foreground-muted">No upcoming events yet.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {community.upcomingActivities.map((a) => (
              <li key={a.slug}>
                <Link href={`/discover/${a.slug}`} className="text-sm text-brand underline underline-offset-2">
                  {a.title}
                </Link>
                <span className="ml-2 text-xs text-foreground-muted">
                  {a.date} · {a.startTime}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {community.pastActivities.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="font-display text-sm font-semibold text-foreground">Recent events (already happened)</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {community.pastActivities.map((a) => (
              <li key={a.slug}>
                <Link href={`/discover/${a.slug}`} className="text-sm text-brand underline underline-offset-2">
                  {a.title}
                </Link>
                <span className="ml-2 text-xs text-foreground-muted">
                  {a.date} · {a.startTime}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="font-display text-sm font-semibold text-foreground">Projects</h2>
        {community.projects.length === 0 ? (
          <p className="mt-2 text-sm text-foreground-muted">No active projects yet.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {community.projects.map((p) => (
              <li key={p.slug} className="flex items-center justify-between text-sm">
                <Link href={`/projects/${p.slug}`} className="text-brand underline underline-offset-2">
                  {p.title}
                </Link>
                <span className="text-xs text-foreground-muted">
                  {p.volunteerCount} of {p.volunteersNeeded} volunteers
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {bridgeProposals.length > 0 && (
        <div className="rounded-xl border border-brand bg-brand-tint p-5">
          <h2 className="font-display text-sm font-semibold text-brand-strong">
            💡 BRIDGE — proposed collaboration
          </h2>
          <ul className="mt-2 flex flex-col gap-2">
            {bridgeProposals.map((p) => (
              <li key={p.id} className="text-sm">
                <Link href={`/bridge/${p.id}`} className="text-brand-strong underline underline-offset-2">
                  {p.communityAName} × {p.communityBName}
                </Link>{" "}
                <span className="text-xs text-foreground-muted">({p.status})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
