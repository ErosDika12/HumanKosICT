import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORY_LABEL, formatActivityDate } from "@/components/ActivityCard";
import { DemoBadge } from "@/components/DemoBadge";
import { Photo } from "@/components/Photo";
import { Avatar, Button, ButtonLink, Card, Notice, Pill, buttonClass } from "@/components/ui";
import { getActivityBySlug, getUserRsvpState, listActivitySlugs } from "@/lib/data/activities";
import { getInterest } from "@/lib/types";
import { getCurrentUser } from "@/lib/auth/current-user";
import { demoLoginAction } from "@/lib/auth/actions";
import { getCommunityBySlug } from "@/lib/data/communities";
import { isPastActivityDate } from "@/lib/data/rsvp";
import { listAttendeesForOrganizer, AttendanceError } from "@/lib/data/attendance";
import { listFriends } from "@/lib/data/friends";
import { getInvitesForActivity } from "@/lib/data/invites";
import { photoForActivity } from "@/lib/photos";
import { slotOfActivity, SLOT_LABEL } from "@/lib/demo-social";
import { rsvpAction, cancelRsvpAction, reportActivityAction } from "@/lib/actions/activity-actions";
import { markAttendanceAction, unmarkAttendanceAction } from "@/lib/actions/attendance-actions";
import { respondInviteAction, sendInviteAction } from "@/lib/actions/social-actions";

export async function generateStaticParams() {
  const slugs = await listActivitySlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function ActivityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    rsvpError?: string;
    reported?: string;
    reportError?: string;
    rsvped?: string;
    canceled?: string;
    ok?: string;
    error?: string;
  }>;
}) {
  const { slug } = await params;
  const flash = await searchParams;
  const activity = await getActivityBySlug(slug);
  if (!activity) notFound();

  const user = await getCurrentUser();
  const community = await getCommunityBySlug(activity.communitySlug, user?.id);
  const isOrganizer = community?.viewerMembership === "organizer";

  if (activity.status === "draft" && !isOrganizer && user?.role !== "MODERATOR") {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-10 sm:px-6">
        <DemoBadge className="self-start" />
        <p className="text-sm text-foreground-muted">This event is pending moderator review and isn&apos;t public yet.</p>
      </div>
    );
  }

  const rsvpState = user ? await getUserRsvpState(user.id, activity.id) : { status: "none" as const };

  const spotsLeft = activity.capacity - activity.rsvpCount;
  const isFull = spotsLeft <= 0;
  const isGoing = rsvpState.status === "confirmed";
  const isCanceled = activity.status === "canceled";
  const isPast = isPastActivityDate(activity.date);
  const rsvpBlocked = isCanceled || isPast;
  const photo = photoForActivity(activity.slug, activity.category);
  const slot = slotOfActivity(activity.date, activity.startTime);

  const attendees = isOrganizer
    ? await listAttendeesForOrganizer(user!.id, activity.id).catch((err) => {
        if (err instanceof AttendanceError) return null;
        throw err;
      })
    : null;

  const [friends, invites] =
    user && !rsvpBlocked
      ? await Promise.all([listFriends(user.id), getInvitesForActivity(user.id, activity.id)])
      : [[], []];
  const sentByFriend = new Map(invites.filter((i) => i.direction === "sent").map((i) => [i.otherId, i]));
  const receivedInvites = invites.filter((i) => i.direction === "received");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <Link href="/discover" className="text-sm font-medium text-brand-strong underline underline-offset-2">
        ← Back to Discover
      </Link>

      <div className="relative isolate overflow-hidden rounded-3xl bg-[#0e2042]">
        <Photo photo={photo} priority sizes="(min-width: 1152px) 1152px, 100vw" illustrative className="absolute inset-0 -z-10" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0e2042]/95 via-[#0e2042]/50 to-transparent" aria-hidden="true" />
        <div className="flex min-h-[280px] flex-col justify-end gap-3 p-5 pb-12 text-white sm:min-h-[340px] sm:p-8 sm:pb-14">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="accent">{CATEGORY_LABEL[activity.category]}</Pill>
            <Pill tone={isFull ? "danger" : "success"}>{isFull ? "Full" : `${spotsLeft} spots left`}</Pill>
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium">Demo content</span>
          </div>
          <h1 className="max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">{activity.title}</h1>
          <p className="text-sm text-white/85 sm:text-base">
            {formatActivityDate(activity.date)} · {activity.startTime} · {activity.venueName}, {activity.areaEn}
          </p>
        </div>
      </div>

      {flash.rsvped && <Notice kind="ok">You&apos;re going! This RSVP is saved on your account — refresh and it stays.</Notice>}
      {flash.canceled && <Notice kind="info">Your RSVP was canceled.</Notice>}
      {flash.ok === "invited" && <Notice kind="ok">Invitation sent. It now appears in your plan and in the conversation.</Notice>}
      {flash.error && <Notice kind="error">{flash.error}</Notice>}
      {activity.status === "draft" && (
        <Notice kind="info">Pending review — only visible to you and moderators.</Notice>
      )}
      {isCanceled && <Notice kind="error">This activity was canceled by its organizer. RSVPs are closed.</Notice>}
      {!isCanceled && isPast && (
        <Notice kind="info">This activity&apos;s date has already passed on the simulated clock. RSVPs are closed.</Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="flex flex-col gap-6">
          <Card className="p-5 sm:p-6">
            <h2 className="font-display text-xl font-semibold text-foreground">About this activity</h2>
            <p className="mt-2 text-foreground-muted">{activity.summary}</p>
            <p className="mt-3 text-sm text-foreground-muted">{activity.description}</p>
            <p className="mt-3 text-sm text-foreground-muted" lang="sq">
              {activity.descriptionSq}
            </p>
            {activity.interestTags.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Interests">
                {activity.interestTags.map((tag) => {
                  const interest = getInterest(tag);
                  return (
                    <li key={tag}>
                      <Pill tone="neutral">
                        {interest.emoji} {interest.labelEn}
                      </Pill>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="font-display text-xl font-semibold text-foreground">Details</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <InfoRow label="Date & time" value={`${activity.date} · ${activity.startTime} (${activity.timezone})`} />
              <InfoRow label="Location" value={`${activity.venueName}, ${activity.areaEn}`} />
              <InfoRow label="Organizer" value={`${activity.organizer.name}${activity.organizer.verified ? " ✓ verified" : ""}`} />
              <InfoRow label="Cost" value={activity.cost === "free" ? "Free" : (activity.costDetail ?? "Paid")} />
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
            </dl>
            <div className="mt-4">
              <p className="text-sm font-semibold text-foreground">Accessibility</p>
              {activity.accessibility.length > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {activity.accessibility.map((a) => (
                    <li key={a}>
                      <Pill tone="brand">{a.replace(/-/g, " ")}</Pill>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-foreground-muted">No accessibility features are listed for this activity.</p>
              )}
            </div>
          </Card>

          {community && (
            <Card className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Organized by{" "}
                  <Link href={`/communities/${community.slug}`} className="text-brand-strong underline underline-offset-2">
                    {community.name}
                  </Link>
                </h2>
                {isOrganizer && (
                  <Link href={`/discover/${slug}/edit`} className="text-sm text-brand-strong underline underline-offset-2">
                    Edit this event
                  </Link>
                )}
              </div>
              <p className="mt-1 text-sm text-foreground-muted">{community.description}</p>
            </Card>
          )}

          {isOrganizer && (
            <Card className="p-5 sm:p-6">
              <h2 className="font-display text-lg font-semibold text-foreground">Attendance check-in</h2>
              {attendees === null ? (
                <p className="mt-2 text-sm text-foreground-muted">
                  Check-in opens once this activity&apos;s date has passed on the simulated clock (see footer) — this event is
                  still upcoming.
                </p>
              ) : attendees.length === 0 ? (
                <p className="mt-2 text-sm text-foreground-muted">No confirmed RSVPs to check in.</p>
              ) : (
                <ul className="mt-2 flex flex-col gap-2">
                  {attendees.map((a) => (
                    <li key={a.userId} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{a.name}</span>
                      {a.attended ? (
                        <form action={unmarkAttendanceAction}>
                          <input type="hidden" name="activityId" value={activity.id} />
                          <input type="hidden" name="userId" value={a.userId} />
                          <button type="submit" className="rounded-full border border-brand bg-brand-tint px-3 py-1 text-xs font-medium text-brand-strong">
                            Attended ✓ — undo
                          </button>
                        </form>
                      ) : (
                        <form action={markAttendanceAction}>
                          <input type="hidden" name="activityId" value={activity.id} />
                          <input type="hidden" name="userId" value={a.userId} />
                          <button type="submit" className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground-muted hover:bg-surface-muted">
                            Mark attended
                          </button>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          <div className="rounded-2xl border border-dashed border-border p-5">
            {flash.reported ? (
              <p className="text-sm font-medium text-success">
                {user?.isDemoVisitor
                  ? "Thanks — your demo report was recorded on your account (demo reports are not sent to the shared moderation queue)."
                  : "Thanks — a moderator will review this report."}
              </p>
            ) : user ? (
              <form action={reportActivityAction} className="flex flex-col gap-2">
                <input type="hidden" name="activityId" value={activity.id} />
                <label className="text-sm font-medium text-foreground" htmlFor="report-reason">
                  Report a concern about this activity
                </label>
                {flash.reportError && <Notice kind="error">{flash.reportError}</Notice>}
                <textarea
                  id="report-reason"
                  name="reason"
                  required
                  rows={2}
                  maxLength={500}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  placeholder="Describe the concern — a moderator will review it."
                />
                <Button type="submit" variant="secondary" size="sm" className="w-fit">
                  Submit report
                </Button>
              </form>
            ) : (
              <p className="text-xs text-foreground-muted">Log in as demo to report a concern about this activity.</p>
            )}
          </div>
        </div>

        {/* SIDEBAR: RSVP + go with a friend */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24" aria-label="Join this activity">
          <Card className="flex flex-col gap-3 p-5">
            <p className="font-display text-lg font-semibold text-foreground">
              {rsvpBlocked
                ? isCanceled
                  ? "This activity was canceled"
                  : "This activity has passed"
                : isGoing
                  ? "You're going ✓"
                  : isFull
                    ? "This activity is full"
                    : "Ready to join?"}
            </p>
            {flash.rsvpError && <Notice kind="error">{flash.rsvpError}</Notice>}
            <p className="text-sm text-foreground-muted">
              {formatActivityDate(activity.date)} · {activity.startTime} · {SLOT_LABEL[slot]}
            </p>
            {rsvpBlocked ? (
              isGoing ? (
                <form action={cancelRsvpAction}>
                  <input type="hidden" name="activityId" value={activity.id} />
                  <Button variant="secondary" className="w-full">Cancel RSVP</Button>
                </form>
              ) : null
            ) : isGoing ? (
              <div className="flex flex-col gap-2">
                <ButtonLink href="/plans" variant="primary" className="w-full">
                  View plan
                </ButtonLink>
                <form action={cancelRsvpAction}>
                  <input type="hidden" name="activityId" value={activity.id} />
                  <Button variant="secondary" size="sm" className="w-full">Cancel RSVP</Button>
                </form>
              </div>
            ) : user ? (
              <form action={rsvpAction}>
                <input type="hidden" name="activityId" value={activity.id} />
                <Button disabled={isFull} aria-disabled={isFull} title={isFull ? "This activity is at capacity" : undefined} className="w-full disabled:cursor-not-allowed disabled:opacity-50">
                  {isFull ? "Full" : "RSVP"}
                </Button>
              </form>
            ) : (
              <form action={demoLoginAction}>
                <button type="submit" className={buttonClass("accent", "md", "w-full")}>
                  Log in as demo to RSVP
                </button>
              </form>
            )}
            {isGoing && <p className="text-xs text-foreground-muted">Saved on your account — it stays after a refresh.</p>}
          </Card>

          {!rsvpBlocked && (
            <Card className="flex flex-col gap-3 p-5" >
              <h2 className="font-display text-lg font-semibold text-foreground">Go with a friend</h2>
              {!user ? (
                <p className="text-sm text-foreground-muted">
                  Log in as demo to invite one of your demo friends — no password needed.
                </p>
              ) : friends.length === 0 ? (
                <p className="text-sm text-foreground-muted">
                  You have no friends yet.{" "}
                  <Link href="/people" className="font-semibold text-brand-strong underline">
                    Find demo friends
                  </Link>{" "}
                  who share your interests.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {receivedInvites.map((inv) => (
                    <li key={inv.id} className="rounded-xl border border-accent bg-accent-tint p-3 text-sm">
                      <p className="font-semibold text-foreground">{inv.otherName} invited you</p>
                      {inv.message && <p className="text-foreground-muted">&ldquo;{inv.message}&rdquo;</p>}
                      {inv.isSeededExample && <p className="text-xs text-foreground-muted">Demo example invitation.</p>}
                      {inv.status === "pending" ? (
                        <div className="mt-2 flex gap-2">
                          <form action={respondInviteAction}>
                            <input type="hidden" name="inviteId" value={inv.id} />
                            <input type="hidden" name="decision" value="accept" />
                            <input type="hidden" name="returnTo" value={`/discover/${slug}`} />
                            <Button size="sm">Accept &amp; RSVP</Button>
                          </form>
                        </div>
                      ) : (
                        <Pill tone={inv.status === "accepted" ? "success" : "neutral"} className="mt-2">
                          {inv.status}
                        </Pill>
                      )}
                    </li>
                  ))}
                  {friends.map((f) => {
                    const fits = f.availability.includes(slot);
                    const sent = sentByFriend.get(f.id);
                    const accessibleOk = !f.needsAccessible || activity.accessibility.includes("wheelchair-accessible");
                    return (
                      <li key={f.id} className="rounded-xl border border-border p-3">
                        <div className="flex items-start gap-3">
                          <Avatar name={f.name} size={36} />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground">{f.name}</p>
                            <p className="text-xs text-foreground-muted">
                              {fits ? `✓ Usually free on ${SLOT_LABEL[slot]}` : `Usually not free on ${SLOT_LABEL[slot]}`}
                              {!accessibleOk && " · needs a wheelchair-accessible venue"}
                            </p>
                          </div>
                        </div>
                        {sent ? (
                          <div className="mt-2 flex flex-col gap-1 text-sm">
                            <Pill
                              tone={sent.status === "accepted" ? "success" : sent.status === "declined" ? "danger" : "accent"}
                              className="w-fit"
                            >
                              Invited · {sent.status}
                            </Pill>
                            {sent.replyNote && <p className="text-xs text-foreground-muted">{sent.replyNote}</p>}
                            <Link href={`/messages/${f.id}`} className="text-xs font-semibold text-brand-strong underline">
                              Message {f.name.split(" ")[0]}
                            </Link>
                          </div>
                        ) : (
                          <form action={sendInviteAction} className="mt-2 flex flex-col gap-2">
                            <input type="hidden" name="friendId" value={f.id} />
                            <input type="hidden" name="activityId" value={activity.id} />
                            <input type="hidden" name="returnTo" value={`/discover/${slug}`} />
                            <label className="sr-only" htmlFor={`msg-${f.id}`}>
                              Message to {f.name}
                            </label>
                            <input
                              id={`msg-${f.id}`}
                              name="message"
                              maxLength={300}
                              placeholder={`Come with me, ${f.name.split(" ")[0]}?`}
                              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            />
                            <Button size="sm" variant={fits ? "primary" : "secondary"}>
                              Invite {f.name.split(" ")[0]}
                            </Button>
                          </form>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              {user && friends.length > 0 && (
                <p className="text-xs text-foreground-muted">
                  Demo friends never reply live — invitations get a labeled, simulated reply based on their listed availability.
                </p>
              )}
            </Card>
          )}
        </aside>
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
