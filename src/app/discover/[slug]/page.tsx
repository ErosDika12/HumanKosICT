import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoBadge } from "@/components/DemoBadge";
import { getActivityBySlug, getUserRsvpState, listActivitySlugs } from "@/lib/data/activities";
import { getInterest } from "@/lib/types";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { rsvpAction, cancelRsvpAction, reportActivityAction } from "@/lib/actions/activity-actions";

export async function generateStaticParams() {
  const slugs = await listActivitySlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function ActivityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ rsvpError?: string; reported?: string }>;
}) {
  const { slug } = await params;
  const { rsvpError, reported } = await searchParams;
  const activity = await getActivityBySlug(slug);
  if (!activity) notFound();

  const community = await prisma.community.findUnique({
    where: { slug: activity.communitySlug },
    select: { name: true, description: true, verified: true },
  });

  const user = await getCurrentUser();
  const rsvpState = user ? await getUserRsvpState(user.id, activity.id) : { status: "none" as const };

  const spotsLeft = activity.capacity - activity.rsvpCount;
  const isFull = spotsLeft <= 0;
  const isGoing = rsvpState.status === "confirmed";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <Link href="/discover" className="text-sm text-brand underline underline-offset-2">
        ← Back to Discover
      </Link>

      <div className="flex flex-col gap-2">
        <DemoBadge className="self-start" />
        <h1 className="font-display text-3xl font-semibold text-foreground">{activity.title}</h1>
        <p className="text-sm text-foreground-muted">{activity.titleSq}</p>
      </div>

      <div className="grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2">
        <InfoRow label="Date & time" value={`${activity.date} · ${activity.startTime} (${activity.timezone})`} />
        <InfoRow label="Location" value={`${activity.venueName}, ${activity.areaEn}`} />
        <InfoRow label="Organizer" value={`${activity.organizer.name}${activity.organizer.verified ? " ✓ verified" : ""}`} />
        <InfoRow label="Cost" value={activity.cost === "free" ? "Free" : activity.costDetail ?? "Paid"} />
        <InfoRow label="Setting" value={activity.indoor ? "Indoor" : "Outdoor"} />
        <InfoRow
          label="Eligibility"
          value={
            activity.ageEligibility === "all-ages"
              ? "All ages"
              : activity.ageEligibility === "adults-only"
                ? "Adults only"
                : "Supervised minors only"
          }
        />
        <InfoRow label="Difficulty" value={activity.difficulty} />
        <InfoRow
          label="Capacity"
          value={isFull ? `Full (${activity.capacity}/${activity.capacity})` : `${spotsLeft} of ${activity.capacity} spots left`}
        />
      </div>

      {activity.accessibility.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="font-display text-sm font-semibold text-foreground">Accessibility</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {activity.accessibility.map((a) => (
              <li key={a} className="rounded-full bg-brand-tint px-3 py-1 text-xs text-brand-strong">
                {a.replace(/-/g, " ")}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="font-display text-sm font-semibold text-foreground">About this activity</h2>
        <p className="mt-2 text-sm text-foreground-muted">{activity.description}</p>
        <p className="mt-3 text-sm text-foreground-muted" lang="sq">
          {activity.descriptionSq}
        </p>
      </div>

      {activity.interestTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activity.interestTags.map((tag) => {
            const interest = getInterest(tag);
            return (
              <span key={tag} className="rounded-full bg-surface-muted px-3 py-1 text-xs text-foreground-muted">
                {interest.emoji} {interest.labelEn}
              </span>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-foreground">
            {isGoing ? "You're going ✓" : isFull ? "This activity is full" : "Ready to join?"}
          </p>
          {rsvpError && (
            <p role="alert" className="mt-1 text-sm text-danger">
              {rsvpError}
            </p>
          )}
          {!user && (
            <p className="text-sm text-foreground-muted">
              Sign in to RSVP — every account here is a fictional seeded demo persona.
            </p>
          )}
        </div>
        {isGoing ? (
          <form action={cancelRsvpAction}>
            <input type="hidden" name="activityId" value={activity.id} />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-surface-muted px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-surface"
            >
              Cancel RSVP
            </button>
          </form>
        ) : user ? (
          <form action={rsvpAction}>
            <input type="hidden" name="activityId" value={activity.id} />
            <button
              type="submit"
              disabled={isFull}
              aria-disabled={isFull}
              title={isFull ? "This activity is at capacity" : undefined}
              className="inline-flex items-center justify-center rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-strong disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-foreground-muted"
            >
              {isFull ? "Full — join waitlist unavailable" : "RSVP"}
            </button>
          </form>
        ) : (
          <Link
            href={`/login?next=${encodeURIComponent(`/discover/${activity.slug}`)}`}
            className="inline-flex items-center justify-center rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-strong"
          >
            Sign in to RSVP
          </Link>
        )}
      </div>

      {community && (
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="font-display text-sm font-semibold text-foreground">
            Organized by {community.name}
          </h2>
          <p className="mt-1 text-sm text-foreground-muted">{community.description}</p>
          <p className="mt-1 text-xs text-foreground-muted">
            Full community pages (membership, projects) arrive in Phase 4.
          </p>
        </div>
      )}

      <div className="rounded-xl border border-dashed border-border p-5">
        {reported ? (
          <p className="text-sm text-success">Thanks — a moderator will review this report.</p>
        ) : user ? (
          <form action={reportActivityAction} className="flex flex-col gap-2">
            <input type="hidden" name="activityId" value={activity.id} />
            <label className="text-sm font-medium text-foreground" htmlFor="report-reason">
              Report a concern about this activity
            </label>
            <textarea
              id="report-reason"
              name="reason"
              required
              rows={2}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Describe the concern — a moderator will review it."
            />
            <button
              type="submit"
              className="inline-flex w-fit items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground-muted hover:bg-surface-muted"
            >
              Submit report
            </button>
          </form>
        ) : (
          <p className="text-xs text-foreground-muted">
            <Link href="/login" className="underline underline-offset-2">
              Sign in
            </Link>{" "}
            to report a concern about this activity.
          </p>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-foreground-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
