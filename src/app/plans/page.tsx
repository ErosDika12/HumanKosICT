import Link from "next/link";
import { formatActivityDate } from "@/components/ActivityCard";
import { DemoBadge } from "@/components/DemoBadge";
import { JourneyChecklist } from "@/components/JourneyChecklist";
import { Avatar, Button, ButtonLink, Card, DemoFriendNote, EmptyState, Eyebrow, Notice, PageShell, Pill } from "@/components/ui";
import { demoLoginAction } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listPlans, type InviteView, type PlanView } from "@/lib/data/invites";
import { respondInviteAction } from "@/lib/actions/social-actions";

const OK: Record<string, string> = {
  "invite-accepted": "Accepted — you are going, and it is saved in your plan.",
  "invite-declined": "Invitation declined.",
  invited: "Invitation sent.",
};

function InviteRow({ invite, activityTitle }: { invite: InviteView; activityTitle: string }) {
  const tone = invite.status === "accepted" ? "success" : invite.status === "declined" ? "danger" : "accent";
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Avatar name={invite.otherName} size={28} />
        <span className="font-semibold text-foreground">
          {invite.direction === "sent" ? `You invited ${invite.otherName}` : `${invite.otherName} invited you`}
        </span>
        <Pill tone={tone}>{invite.status}</Pill>
        {invite.isSimulatedReply && <Pill tone="neutral">simulated reply</Pill>}
        {invite.isSeededExample && <Pill tone="neutral">demo example</Pill>}
      </div>
      {invite.message && <p className="text-foreground-muted">&ldquo;{invite.message}&rdquo;</p>}
      {invite.replyNote && <p className="text-xs text-foreground-muted">{invite.replyNote}</p>}
      <div className="flex flex-wrap gap-2">
        {invite.direction === "received" && invite.status === "pending" && (
          <>
            <form action={respondInviteAction}>
              <input type="hidden" name="inviteId" value={invite.id} />
              <input type="hidden" name="decision" value="accept" />
              <input type="hidden" name="returnTo" value="/plans" />
              <Button size="sm" aria-label={`Accept invitation to ${activityTitle}`}>Accept &amp; RSVP</Button>
            </form>
            <form action={respondInviteAction}>
              <input type="hidden" name="inviteId" value={invite.id} />
              <input type="hidden" name="decision" value="decline" />
              <input type="hidden" name="returnTo" value="/plans" />
              <Button variant="secondary" size="sm">Decline</Button>
            </form>
          </>
        )}
        <ButtonLink href={`/messages/${invite.otherId}`} variant="ghost" size="sm">
          Message {invite.otherName.split(" ")[0]}
        </ButtonLink>
      </div>
    </li>
  );
}

function PlanCard({ plan }: { plan: PlanView }) {
  const { activity } = plan;
  return (
    <Card className="flex flex-col gap-4 p-5" >
      <div id={`plan-${activity.id}`} className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-xl font-semibold text-foreground">
            <Link href={`/discover/${activity.slug}`} className="hover:underline">
              {activity.title}
            </Link>
          </h3>
          <p className="text-sm text-foreground-muted">
            📅 {formatActivityDate(activity.date)} · {activity.startTime} · 📍 {activity.venueName}, {activity.areaEn}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activity.isCanceled && <Pill tone="danger">Canceled</Pill>}
          {plan.myRsvp === "confirmed" ? <Pill tone="success">You&apos;re going ✓</Pill> : <Pill tone="neutral">Not RSVP&apos;d yet</Pill>}
        </div>
      </div>

      {plan.invites.length > 0 ? (
        <ul className="flex flex-col gap-2" aria-label={`Invitations for ${activity.title}`}>
          {plan.invites.map((i) => (
            <InviteRow key={i.id} invite={i} activityTitle={activity.title} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-foreground-muted">No invitations yet — bring someone along.</p>
      )}

      <div className="flex flex-wrap gap-2">
        <ButtonLink href={`/discover/${activity.slug}`} variant="secondary" size="sm">
          View activity
        </ButtonLink>
        {!activity.isPast && !activity.isCanceled && (
          <ButtonLink href={`/discover/${activity.slug}`} variant="primary" size="sm">
            {plan.myRsvp === "confirmed" ? "Invite a friend" : "RSVP & invite a friend"}
          </ButtonLink>
        )}
      </div>
    </Card>
  );
}

export default async function PlansPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const flash = await searchParams;
  const user = await getCurrentUser();

  if (!user) {
    return (
      <PageShell className="max-w-xl">
        <DemoBadge className="self-start" />
        <EmptyState
          title="Your plans live here"
          action={
            <form action={demoLoginAction}>
              <Button variant="accent" size="lg">Log in as demo</Button>
            </form>
          }
        >
          RSVP to an activity or invite a friend and it appears here as a plan — saved on your account.
        </EmptyState>
      </PageShell>
    );
  }

  const plans = await listPlans(user.id);
  const upcoming = plans.filter((p) => !p.activity.isPast);
  const past = plans.filter((p) => p.activity.isPast);
  const pendingReceived = upcoming.flatMap((p) => p.invites).filter((i) => i.direction === "received" && i.status === "pending").length;

  return (
    <PageShell className="max-w-4xl">
      {user.isDemoVisitor && <JourneyChecklist userId={user.id} />}
      <header className="flex flex-col gap-2">
        <DemoBadge className="self-start" />
        <Eyebrow>Plans</Eyebrow>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">Your plans</h1>
        <p className="text-foreground-muted">
          Every activity you RSVP&apos;d to or shared with a friend — with who is invited and where each invitation stands.
        </p>
      </header>

      {flash.ok && OK[flash.ok] && <Notice kind="ok">{OK[flash.ok]}</Notice>}
      {flash.error && <Notice kind="error">{flash.error}</Notice>}
      {pendingReceived > 0 && (
        <Notice kind="info">
          You have {pendingReceived} invitation{pendingReceived === 1 ? "" : "s"} waiting for an answer.
        </Notice>
      )}

      <section aria-labelledby="upcoming-plans" className="flex flex-col gap-4">
        <h2 id="upcoming-plans" className="font-display text-2xl font-semibold text-foreground">
          Upcoming <span className="text-base font-normal text-foreground-muted">({upcoming.length})</span>
        </h2>
        {upcoming.length === 0 ? (
          <EmptyState
            title="No plans yet"
            action={
              <ButtonLink href="/discover" variant="primary">
                Discover activities
              </ButtonLink>
            }
          >
            Pick an activity, RSVP, and invite a demo friend — your plan appears here.
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-4">
            {upcoming.map((p) => (
              <li key={p.activity.id}>
                <PlanCard plan={p} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section aria-labelledby="past-plans" className="flex flex-col gap-4">
          <h2 id="past-plans" className="font-display text-xl font-semibold text-foreground">
            Already happened <span className="text-base font-normal text-foreground-muted">({past.length})</span>
          </h2>
          <ul className="flex flex-col gap-4">
            {past.map((p) => (
              <li key={p.activity.id}>
                <PlanCard plan={p} />
              </li>
            ))}
          </ul>
        </section>
      )}
      <DemoFriendNote />
    </PageShell>
  );
}
