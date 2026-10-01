import Link from "next/link";
import type { Metadata } from "next";
import { Avatar, Button, ButtonLink, Card, EmptyState, Notice, PageShell, Pill } from "@/components/ui";
import { CalendarIcon, PinIcon } from "@/components/icons";
import { demoLoginAction } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listPlans, type InviteView, type PlanView } from "@/lib/data/invites";
import { listActivities } from "@/lib/data/activities";
import { respondInviteAction } from "@/lib/actions/social-actions";
import { getI18n, type I18n } from "@/lib/i18n/server";
import { errorMessage } from "@/lib/i18n/errors";
import { areaFromEn } from "@/lib/i18n/areas";
import { localizeActivity, localizeText } from "@/lib/i18n/content";
import { localizeReason } from "@/lib/i18n/reasons";
import { relativeDayLabel } from "@/lib/time-window";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("nav.plans") };
}

const OK_KEY: Record<string, string> = {
  "invite-accepted": "plans.ok.accepted",
  "invite-declined": "plans.ok.declined",
  invited: "activity.flash.invited",
};

function InviteRow({ invite, title, i18n }: { invite: InviteView; title: string; i18n: I18n }) {
  const { t, locale } = i18n;
  const tone = invite.status === "accepted" ? "success" : invite.status === "declined" ? "danger" : "accent";
  const first = invite.otherName.split(" ")[0];
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Avatar name={invite.otherName} size={28} />
        <span className="font-semibold text-foreground">
          {invite.direction === "sent" ? t("plans.youInvited", { name: invite.otherName }) : t("plans.invitedYou", { name: invite.otherName })}
        </span>
        <Pill tone={tone}>{t(`invite.${invite.status}`)}</Pill>
        {invite.isSimulatedReply && <Pill tone="neutral">{t("state.simulated")}</Pill>}
        {invite.isSeededExample && <Pill tone="neutral">{t("state.demoExample")}</Pill>}
      </div>
      {invite.message && <p className="text-foreground-muted">“{localizeText(invite.message, locale)}”</p>}
      {invite.replyNote && <p className="text-xs text-foreground-muted">{localizeReason(invite.replyNote, t, locale)}</p>}
      <div className="flex flex-wrap gap-2">
        {invite.direction === "received" && invite.status === "pending" && (
          <>
            <form action={respondInviteAction}>
              <input type="hidden" name="inviteId" value={invite.id} />
              <input type="hidden" name="decision" value="accept" />
              <input type="hidden" name="returnTo" value="/plans" />
              <Button size="sm" aria-label={`${t("action.rsvpAccept")}: ${title}`}>{t("action.rsvpAccept")}</Button>
            </form>
            <form action={respondInviteAction}>
              <input type="hidden" name="inviteId" value={invite.id} />
              <input type="hidden" name="decision" value="decline" />
              <input type="hidden" name="returnTo" value="/plans" />
              <Button variant="secondary" size="sm">{t("plans.respond.decline")}</Button>
            </form>
          </>
        )}
        <ButtonLink href={`/messages/${invite.otherId}`} variant="ghost" size="sm">
          {t("plans.message", { name: first })}
        </ButtonLink>
      </div>
    </li>
  );
}

function PlanCard({ plan, i18n, titleBySlug }: { plan: PlanView; i18n: I18n; titleBySlug: Map<string, string> }) {
  const { t, shortDate } = i18n;
  const { activity } = plan;
  const title = titleBySlug.get(activity.slug) ?? activity.title;
  const rel = relativeDayLabel(activity.date);
  const relLabel = rel === "This weekend" ? t("fact.thisWeekend") : rel === "Next weekend" ? t("fact.nextWeekend") : rel === "Tomorrow" ? t("fact.tomorrow") : rel === "Today" ? t("fact.today") : null;
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div id={`plan-${activity.id}`} className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-xl font-semibold text-foreground">
            <Link href={`/discover/${activity.slug}`} className="hover:underline">
              {title}
            </Link>
          </h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground-muted">
            <span className="inline-flex items-center gap-1">
              <CalendarIcon size={15} />
              {relLabel ? `${relLabel} · ` : ""}
              {shortDate(activity.date)} · {activity.startTime}
            </span>
            <span className="inline-flex items-center gap-1">
              <PinIcon size={15} />
              {activity.venueName}, {areaFromEn(activity.areaEn, t)}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activity.isCanceled && <Pill tone="danger">{t("activity.rsvp.canceledTitle")}</Pill>}
          {plan.myRsvp === "confirmed" ? <Pill tone="success">{t("plans.going")}</Pill> : <Pill tone="neutral">{t("plans.notGoing")}</Pill>}
        </div>
      </div>

      {plan.invites.length > 0 && (
        <ul className="flex flex-col gap-2" aria-label={title}>
          {plan.invites.map((i) => (
            <InviteRow key={i.id} invite={i} title={title} i18n={i18n} />
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <ButtonLink href={`/discover/${activity.slug}`} variant="secondary" size="sm">
          {t("action.viewActivity")}
        </ButtonLink>
        {!activity.isPast && !activity.isCanceled && (
          <ButtonLink href={`/discover/${activity.slug}`} variant="primary" size="sm">
            {t("activity.friend.title")}
          </ButtonLink>
        )}
      </div>
    </Card>
  );
}

export default async function PlansPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const flash = await searchParams;
  const i18n = await getI18n();
  const { t, locale, shortDate } = i18n;
  const user = await getCurrentUser();
  const errText = errorMessage(t, flash.error);

  if (!user) {
    // A meaningful preview instead of an empty page: what a plan looks like, with real seeded data.
    const sample = (await listActivities()).find((a) => a.slug === "shetitje-fotografike-qender");
    const sampleText = sample ? localizeActivity(sample, locale) : null;
    return (
      <PageShell className="max-w-3xl">
        <header className="flex flex-col gap-3">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">{t("plans.guest.title")}</h1>
          <p className="text-foreground-muted">{t("plans.guest.body")}</p>
          <form action={demoLoginAction}>
            <Button variant="accent" size="lg">{t("action.demoLogin")}</Button>
          </form>
        </header>
        {sample && sampleText && (
          <Card className="flex flex-col gap-3 border-dashed p-5">
            <Pill tone="accent" className="w-fit">{t("plans.guest.sample")}</Pill>
            <p className="font-display text-xl font-semibold text-foreground">{sampleText.title}</p>
            <p className="text-sm text-foreground-muted">
              {shortDate(sample.date)} · {sample.startTime} · {areaFromEn(sample.areaEn, t)}
            </p>
            <Pill tone="success" className="w-fit">{t("plans.going")}</Pill>
            <div className="rounded-xl border border-border bg-background p-3 text-sm">
              <p className="font-semibold text-foreground">{t("plans.youInvited", { name: "Era Shala" })}</p>
              <p className="text-foreground-muted">{t("home.friend.accepted", { friend: "Era" })}</p>
            </div>
          </Card>
        )}
      </PageShell>
    );
  }

  const plans = await listPlans(user.id);
  const upcoming = plans.filter((p) => !p.activity.isPast);
  const past = plans.filter((p) => p.activity.isPast);
  const pendingReceived = upcoming.flatMap((p) => p.invites).filter((i) => i.direction === "received" && i.status === "pending").length;
  const all = await listActivities();
  const titleBySlug = new Map(all.map((a) => [a.slug, localizeActivity(a, locale).title]));

  return (
    <PageShell className="max-w-4xl">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">{t("plans.title")}</h1>
        <p className="text-foreground-muted">{t("plans.lead")}</p>
      </header>

      {flash.ok && OK_KEY[flash.ok] && <Notice kind="ok">{t(OK_KEY[flash.ok])}</Notice>}
      {errText && <Notice kind="error">{errText}</Notice>}
      {pendingReceived > 0 && <Notice kind="info">{t("plans.pendingInvites", { n: pendingReceived })}</Notice>}

      <section aria-labelledby="upcoming-plans" className="flex flex-col gap-4">
        <h2 id="upcoming-plans" className="font-display text-2xl font-semibold text-foreground">
          {t("plans.upcoming")} <span className="text-base font-normal text-foreground-muted">({upcoming.length})</span>
        </h2>
        {upcoming.length === 0 ? (
          <EmptyState
            title={t("plans.empty.title")}
            action={
              <ButtonLink href="/discover?when=week" variant="primary">
                {t("plans.empty.browse")}
              </ButtonLink>
            }
          >
            {t("plans.empty.body")}
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-4">
            {upcoming.map((p) => (
              <li key={p.activity.id}>
                <PlanCard plan={p} i18n={i18n} titleBySlug={titleBySlug} />
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-foreground-muted">{t("plans.reminder")}</p>
      </section>

      {past.length > 0 && (
        <section aria-labelledby="past-plans" className="flex flex-col gap-4">
          <h2 id="past-plans" className="font-display text-xl font-semibold text-foreground">
            {t("plans.past")} <span className="text-base font-normal text-foreground-muted">({past.length})</span>
          </h2>
          <ul className="flex flex-col gap-4">
            {past.map((p) => (
              <li key={p.activity.id}>
                <PlanCard plan={p} i18n={i18n} titleBySlug={titleBySlug} />
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="text-xs text-foreground-muted">{t("friends.note")}</p>
    </PageShell>
  );
}
