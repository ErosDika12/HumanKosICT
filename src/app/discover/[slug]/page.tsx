import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Photo } from "@/components/Photo";
import { Avatar, Button, ButtonLink, Card, Notice, Pill, buttonClass } from "@/components/ui";
import { CalendarIcon, PinIcon } from "@/components/icons";
import { getActivityBySlug, getUserRsvpState, listActivitySlugs } from "@/lib/data/activities";
import { getInterest, interestLabel } from "@/lib/types";
import { getCurrentUser } from "@/lib/auth/current-user";
import { demoLoginAction } from "@/lib/auth/actions";
import { getCommunityBySlug } from "@/lib/data/communities";
import { isPastActivityDate } from "@/lib/data/rsvp";
import { listAttendeesForOrganizer, AttendanceError } from "@/lib/data/attendance";
import { listFriends } from "@/lib/data/friends";
import { getInvitesForActivity } from "@/lib/data/invites";
import { photoForActivity } from "@/lib/photos";
import { slotOfActivity } from "@/lib/demo-social";
import { rsvpAction, cancelRsvpAction, reportActivityAction } from "@/lib/actions/activity-actions";
import { markAttendanceAction, unmarkAttendanceAction } from "@/lib/actions/attendance-actions";
import { respondInviteAction, sendInviteAction } from "@/lib/actions/social-actions";
import { getI18n } from "@/lib/i18n/server";
import { errorMessage } from "@/lib/i18n/errors";
import { localizeActivity, localizeCommunityDescription, localizeText } from "@/lib/i18n/content";

export async function generateStaticParams() {
  const slugs = await listActivitySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [activity, { locale }] = await Promise.all([getActivityBySlug(slug), getI18n()]);
  return { title: activity ? localizeActivity(activity, locale).title : undefined };
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
  const { t, locale, longDate } = await getI18n();
  const activity = await getActivityBySlug(slug);
  if (!activity) notFound();
  const text = localizeActivity(activity, locale);

  const user = await getCurrentUser();
  const community = await getCommunityBySlug(activity.communitySlug, user?.id);
  const isOrganizer = community?.viewerMembership === "organizer";

  if (activity.status === "draft" && !isOrganizer && user?.role !== "MODERATOR") {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-10 sm:px-6">
        <p className="text-sm text-foreground-muted">{t("activity.draftPendingPage")}</p>
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
  const area = t(`area.${activity.areaEn}`);
  const errText = errorMessage(t, flash.error);
  const rsvpErr = errorMessage(t, flash.rsvpError);
  const reportErr = errorMessage(t, flash.reportError);

  const attendees = isOrganizer
    ? await listAttendeesForOrganizer(user!.id, activity.id).catch((err) => {
        if (err instanceof AttendanceError) return null;
        throw err;
      })
    : null;

  const [friends, invites] =
    user && !rsvpBlocked ? await Promise.all([listFriends(user.id), getInvitesForActivity(user.id, activity.id)]) : [[], []];
  const sentByFriend = new Map(invites.filter((i) => i.direction === "sent").map((i) => [i.otherId, i]));
  const receivedInvites = invites.filter((i) => i.direction === "received");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <Link href="/discover" className="text-sm font-medium text-brand-strong underline underline-offset-2">
        ← {t("activity.back")}
      </Link>

      <div className="relative isolate overflow-hidden rounded-3xl bg-[#0e2042]">
        <Photo photo={photo} priority sizes="(min-width: 1152px) 1152px, 100vw" illustrative className="absolute inset-0 -z-10" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0e2042]/95 via-[#0e2042]/50 to-transparent" aria-hidden="true" />
        <div className="flex min-h-[260px] flex-col justify-end gap-3 p-5 pb-12 text-white sm:min-h-[320px] sm:p-8 sm:pb-14">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="accent">{t(`category.${activity.category}`)}</Pill>
            <Pill tone={isFull ? "danger" : "success"}>{isFull ? t("fact.full") : t("fact.spotsLeft", { n: spotsLeft })}</Pill>
          </div>
          <h1 className="max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">{text.title}</h1>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/90 sm:text-base">
            <span className="inline-flex items-center gap-1.5">
              <CalendarIcon size={18} />
              {longDate(activity.date)} · {activity.startTime}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <PinIcon size={18} />
              {activity.venueName}, {area}
            </span>
          </p>
        </div>
      </div>

      {flash.rsvped && <Notice kind="ok">{t("activity.rsvp.done")}</Notice>}
      {flash.canceled && <Notice kind="info">{t("activity.rsvp.cancelDone")}</Notice>}
      {flash.ok === "invited" && <Notice kind="ok">{t("activity.flash.invited")}</Notice>}
      {errText && <Notice kind="error">{errText}</Notice>}
      {activity.status === "draft" && <Notice kind="info">{t("activity.draftNotice")}</Notice>}
      {isCanceled && <Notice kind="error">{t("activity.canceledNotice")}</Notice>}
      {!isCanceled && isPast && <Notice kind="info">{t("activity.pastNotice")}</Notice>}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="flex flex-col gap-6">
          <Card className="p-5 sm:p-6">
            <h2 className="font-display text-xl font-semibold text-foreground">{t("activity.about")}</h2>
            <p className="mt-2 text-foreground">{text.summary}</p>
            <p className="mt-3 text-sm leading-relaxed text-foreground-muted">{text.description}</p>
            {activity.interestTags.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2" aria-label={t("activity.topics")}>
                {activity.interestTags.map((tag) => {
                  const interest = getInterest(tag);
                  return (
                    <li key={tag}>
                      <Pill tone="neutral">
                        {interest.emoji} {interestLabel(interest, locale)}
                      </Pill>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="font-display text-xl font-semibold text-foreground">{t("activity.details")}</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <InfoRow label={t("activity.dateTime")} value={`${longDate(activity.date)} · ${activity.startTime}`} />
              <InfoRow label={t("activity.location")} value={`${activity.venueName}, ${area}`} />
              <InfoRow label={t("activity.organizer")} value={`${activity.organizer.name}${activity.organizer.verified ? ` ✓ ${t("activity.verified")}` : ""}`} />
              <InfoRow label={t("activity.cost")} value={activity.cost === "free" ? t("fact.free") : (text.costDetail ?? t("fact.paid"))} />
              <InfoRow label={t("activity.setting")} value={activity.indoor ? t("fact.indoor") : t("fact.outdoor")} />
              <InfoRow label={t("activity.eligibility")} value={t(`age.${activity.ageEligibility}`)} />
              <InfoRow label={t("activity.difficulty")} value={t(`difficulty.${activity.difficulty}`)} />
              <InfoRow
                label={t("activity.capacity")}
                value={isFull ? t("activity.capacityFull", { total: activity.capacity }) : t("activity.capacityLeft", { n: spotsLeft, total: activity.capacity })}
              />
            </dl>
            <div className="mt-4">
              <p className="text-sm font-semibold text-foreground">{t("activity.accessibility")}</p>
              {activity.accessibility.length > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {activity.accessibility.map((a) => (
                    <li key={a}>
                      <Pill tone="brand">{t(`access.${a}`)}</Pill>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-foreground-muted">{t("activity.noAccessibility")}</p>
              )}
            </div>
          </Card>

          {community && (
            <Card className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  {t("activity.organizedBy")}{" "}
                  <Link href={`/communities/${community.slug}`} className="text-brand-strong underline underline-offset-2">
                    {community.name}
                  </Link>
                </h2>
                {isOrganizer && (
                  <Link href={`/discover/${slug}/edit`} className="text-sm text-brand-strong underline underline-offset-2">
                    {t("activity.editEvent")}
                  </Link>
                )}
              </div>
              <p className="mt-1 text-sm text-foreground-muted">{localizeCommunityDescription(community, locale)}</p>
            </Card>
          )}

          {isOrganizer && (
            <Card className="p-5 sm:p-6">
              <h2 className="font-display text-lg font-semibold text-foreground">{t("activity.attendance.title")}</h2>
              {attendees === null ? (
                <p className="mt-2 text-sm text-foreground-muted">{t("activity.attendance.closed")}</p>
              ) : attendees.length === 0 ? (
                <p className="mt-2 text-sm text-foreground-muted">{t("activity.attendance.none")}</p>
              ) : (
                <ul className="mt-2 flex flex-col gap-2">
                  {attendees.map((a) => (
                    <li key={a.userId} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-foreground">{a.name}</span>
                      <form action={a.attended ? unmarkAttendanceAction : markAttendanceAction}>
                        <input type="hidden" name="activityId" value={activity.id} />
                        <input type="hidden" name="userId" value={a.userId} />
                        <button
                          type="submit"
                          className={`min-h-9 rounded-full border px-3 py-1 text-xs font-medium ${
                            a.attended ? "border-brand bg-brand-tint text-brand-strong" : "border-border text-foreground-muted hover:bg-surface-muted"
                          }`}
                        >
                          {a.attended ? t("activity.attendance.attended") : t("activity.attendance.mark")}
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          <div className="rounded-2xl border border-dashed border-border p-5">
            {flash.reported ? (
              <p className="text-sm font-medium text-success">{user?.isDemoVisitor ? t("activity.report.thanksDemo") : t("activity.report.thanks")}</p>
            ) : user ? (
              <form action={reportActivityAction} className="flex flex-col gap-2">
                <input type="hidden" name="activityId" value={activity.id} />
                <label className="text-sm font-medium text-foreground" htmlFor="report-reason">
                  {t("activity.report.label")}
                </label>
                {reportErr && <Notice kind="error">{reportErr}</Notice>}
                <textarea
                  id="report-reason"
                  name="reason"
                  required
                  rows={2}
                  maxLength={500}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  placeholder={t("activity.report.placeholder")}
                />
                <Button type="submit" variant="secondary" size="sm" className="w-fit">
                  {t("activity.report.submit")}
                </Button>
              </form>
            ) : (
              <p className="text-xs text-foreground-muted">{t("activity.report.login")}</p>
            )}
          </div>
        </div>

        {/* SIDEBAR: RSVP, then go with a friend */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24" aria-label={t("activity.rsvp.aria")}>
          <Card className={`flex flex-col gap-3 p-5 ${isGoing ? "border-success" : ""}`}>
            <p className="font-display text-lg font-semibold text-foreground">
              {rsvpBlocked
                ? isCanceled
                  ? t("activity.rsvp.canceledTitle")
                  : t("activity.rsvp.passedTitle")
                : isGoing
                  ? t("activity.rsvp.going")
                  : isFull
                    ? t("activity.rsvp.full")
                    : t("activity.rsvp.ready")}
            </p>
            {rsvpErr && <Notice kind="error">{rsvpErr}</Notice>}
            <p className="text-sm text-foreground-muted">
              {longDate(activity.date)} · {activity.startTime} · {t(`slot.${slot}`)}
            </p>
            {rsvpBlocked ? (
              isGoing ? (
                <form action={cancelRsvpAction}>
                  <input type="hidden" name="activityId" value={activity.id} />
                  <Button variant="secondary" className="w-full">{t("action.cancelRsvp")}</Button>
                </form>
              ) : null
            ) : isGoing ? (
              <div className="flex flex-col gap-2">
                <ButtonLink href="/plans" variant="primary" className="w-full">
                  {t("activity.rsvp.viewPlan")}
                </ButtonLink>
                <form action={cancelRsvpAction}>
                  <input type="hidden" name="activityId" value={activity.id} />
                  <Button variant="secondary" size="sm" className="w-full">{t("action.cancelRsvp")}</Button>
                </form>
              </div>
            ) : user ? (
              <form action={rsvpAction}>
                <input type="hidden" name="activityId" value={activity.id} />
                <Button disabled={isFull} aria-disabled={isFull} title={isFull ? t("activity.rsvp.atCapacity") : undefined} className="w-full disabled:cursor-not-allowed disabled:opacity-50">
                  {isFull ? t("fact.full") : t("action.rsvp")}
                </Button>
              </form>
            ) : (
              <form action={demoLoginAction}>
                <button type="submit" className={buttonClass("accent", "md", "w-full")}>
                  {t("activity.rsvp.loginToRsvp")}
                </button>
              </form>
            )}
            {isGoing ? (
              <p className="text-xs text-foreground-muted">{t("activity.rsvp.saved")}</p>
            ) : !rsvpBlocked && !isFull ? (
              <p className="text-xs text-foreground-muted">{t("activity.rsvp.what")}</p>
            ) : null}
          </Card>

          {!rsvpBlocked && (
            <Card className={`flex flex-col gap-3 p-5 ${flash.rsvped ? "ring-2 ring-brand" : ""}`}>
              <h2 className="font-display text-lg font-semibold text-foreground">{t("activity.friend.title")}</h2>
              {!user ? (
                <p className="text-sm text-foreground-muted">{t("activity.friend.login")}</p>
              ) : friends.length === 0 ? (
                <p className="text-sm text-foreground-muted">
                  {t("activity.friend.none")}{" "}
                  <Link href="/people" className="font-semibold text-brand-strong underline">
                    {t("activity.friend.find")}
                  </Link>{" "}
                  {t("activity.friend.findTail")}
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {receivedInvites.map((inv) => (
                    <li key={inv.id} className="rounded-xl border border-accent bg-accent-tint p-3 text-sm">
                      <p className="font-semibold text-foreground">{t("activity.friend.invitedYou", { name: inv.otherName })}</p>
                      {inv.message && <p className="text-foreground-muted">“{localizeText(inv.message, locale)}”</p>}
                      {inv.isSeededExample && <p className="text-xs text-foreground-muted">{t("activity.friend.demoExample")}</p>}
                      {inv.status === "pending" ? (
                        <div className="mt-2 flex gap-2">
                          <form action={respondInviteAction}>
                            <input type="hidden" name="inviteId" value={inv.id} />
                            <input type="hidden" name="decision" value="accept" />
                            <input type="hidden" name="returnTo" value={`/discover/${slug}`} />
                            <Button size="sm">{t("action.rsvpAccept")}</Button>
                          </form>
                        </div>
                      ) : (
                        <Pill tone={inv.status === "accepted" ? "success" : "neutral"} className="mt-2">
                          {t(`invite.${inv.status}`)}
                        </Pill>
                      )}
                    </li>
                  ))}
                  {friends.map((f) => {
                    const fits = f.availability.includes(slot);
                    const sent = sentByFriend.get(f.id);
                    const accessibleOk = !f.needsAccessible || activity.accessibility.includes("wheelchair-accessible");
                    const first = f.name.split(" ")[0];
                    return (
                      <li key={f.id} className="rounded-xl border border-border p-3">
                        <div className="flex items-start gap-3">
                          <Avatar name={f.name} size={36} />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground">{f.name}</p>
                            <p className="text-xs text-foreground-muted">
                              {fits ? `✓ ${t("activity.friend.usuallyFree", { slot: t(`slot.${slot}`) })}` : t("activity.friend.usuallyBusy", { slot: t(`slot.${slot}`) })}
                              {!accessibleOk && ` · ${t("activity.friend.needsAccessible")}`}
                            </p>
                          </div>
                        </div>
                        {sent ? (
                          <div className="mt-2 flex flex-col gap-1 text-sm">
                            <Pill tone={sent.status === "accepted" ? "success" : sent.status === "declined" ? "danger" : "accent"} className="w-fit">
                              {t("activity.friend.invited", { status: t(`invite.${sent.status}`) })}
                            </Pill>
                            {sent.replyNote && <p className="text-xs text-foreground-muted">{localizeText(sent.replyNote, locale)}</p>}
                            <Link href={`/messages/${f.id}`} className="text-xs font-semibold text-brand-strong underline">
                              {t("activity.friend.message", { name: first })}
                            </Link>
                          </div>
                        ) : (
                          <form action={sendInviteAction} className="mt-2 flex flex-col gap-2">
                            <input type="hidden" name="friendId" value={f.id} />
                            <input type="hidden" name="activityId" value={activity.id} />
                            <input type="hidden" name="returnTo" value={`/discover/${slug}`} />
                            <label className="sr-only" htmlFor={`msg-${f.id}`}>
                              {t("activity.friend.messageTo", { name: f.name })}
                            </label>
                            <input
                              id={`msg-${f.id}`}
                              name="message"
                              maxLength={300}
                              placeholder={t("activity.friend.placeholder", { name: first })}
                              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            />
                            <Button size="sm" variant={fits ? "primary" : "secondary"}>
                              {t("action.invite", { name: first })}
                            </Button>
                          </form>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              {user && friends.length > 0 && <p className="text-xs text-foreground-muted">{t("activity.friend.simNote")}</p>}
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
