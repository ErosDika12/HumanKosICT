import Link from "next/link";
import { notFound } from "next/navigation";
import { formatActivityDate } from "@/components/ActivityCard";
import { DemoBadge } from "@/components/DemoBadge";
import { Avatar, Button, ButtonLink, Card, DemoFriendNote, EmptyState, Notice, PageShell, Pill } from "@/components/ui";
import { demoLoginAction } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getFriendProfile, suitableActivities } from "@/lib/data/friends";
import { getThread } from "@/lib/data/messages";
import { SLOT_LABEL } from "@/lib/demo-social";
import { addFriendAction, removeFriendAction, sendInviteAction } from "@/lib/actions/social-actions";
import { blockUserAction, reportUserAction } from "@/lib/actions/people-actions";

const OK: Record<string, string> = {
  "friend-added": "Friend added — now pick an activity below, or say hello.",
  invited: "Invitation sent. See it in Plans, and in your conversation.",
};

export default async function FriendProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { id } = await params;
  const flash = await searchParams;
  const user = await getCurrentUser();
  if (!user) {
    return (
      <PageShell className="max-w-xl">
        <DemoBadge className="self-start" />
        <EmptyState
          title="Log in as demo to see this friend"
          action={
            <form action={demoLoginAction}>
              <Button variant="accent" size="lg">Log in as demo</Button>
            </form>
          }
        >
          Profiles of demo friends are shown to demo visitors only.
        </EmptyState>
      </PageShell>
    );
  }

  const friend = await getFriendProfile(user.id, id);
  if (!friend) notFound();
  const [suitable, thread] = await Promise.all([
    suitableActivities(user.id, id, 4),
    friend.isFriend ? getThread(user.id, id) : Promise.resolve([]),
  ]);
  const shared = new Set(friend.sharedInterestIds);
  const preview = thread.slice(-3);
  const first = friend.name.split(" ")[0];

  return (
    <PageShell className="max-w-5xl">
      <Link href="/people" className="text-sm font-medium text-brand-strong underline underline-offset-2">
        ← Back to Friends
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Avatar name={friend.name} size={72} />
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <DemoBadge />
              <Pill tone="accent">Demo friend · fictional</Pill>
              {friend.isFriend && <Pill tone="success">✓ Your friend</Pill>}
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{friend.name}</h1>
            <p className="text-sm text-foreground-muted">
              {friend.areaSq?.replace("Prishtinë — ", "📍 ")} · free {friend.availability.map((s) => SLOT_LABEL[s]).join(", ")}
              {friend.needsAccessible && " · prefers wheelchair-accessible venues"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {friend.isFriend ? (
            <ButtonLink href={`/messages/${friend.id}`} variant="primary">
              Message {first}
            </ButtonLink>
          ) : (
            <form action={addFriendAction}>
              <input type="hidden" name="friendId" value={friend.id} />
              <input type="hidden" name="returnTo" value={`/people/${friend.id}`} />
              <Button size="md">Add {first} as a friend</Button>
            </form>
          )}
        </div>
      </header>

      {flash.ok && OK[flash.ok] && <Notice kind="ok">{OK[flash.ok]}</Notice>}
      {flash.error && <Notice kind="error">{flash.error}</Notice>}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="flex flex-col gap-6">
          <Card className="p-5 sm:p-6">
            <h2 className="font-display text-xl font-semibold text-foreground">About {first}</h2>
            <p className="mt-2 text-foreground-muted">{friend.bio}</p>
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Interests">
              {friend.interests.map((i) => (
                <li key={i.id}>
                  <Pill tone={shared.has(i.id) ? "brand" : "neutral"}>
                    {i.emoji} {i.label}
                    {shared.has(i.id) && <span className="sr-only"> (shared with you)</span>}
                  </Pill>
                </li>
              ))}
            </ul>
            {friend.reasons.length > 0 && (
              <p className="mt-3 text-sm font-medium text-brand-strong">✨ {friend.reasons.join(" · ")}</p>
            )}
          </Card>

          <section aria-labelledby="fits" className="flex flex-col gap-3">
            <h2 id="fits" className="font-display text-2xl font-semibold text-foreground">
              Activities that suit you both
            </h2>
            {suitable.length === 0 ? (
              <EmptyState title="Nothing matches right now">
                No open upcoming activity fits both {first}&apos;s availability and interests.{" "}
                <Link href="/discover" className="underline">
                  Browse all activities
                </Link>
                .
              </EmptyState>
            ) : (
              <ul className="flex flex-col gap-3">
                {suitable.map((s) => (
                  <li key={s.activity.id}>
                    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-display text-lg font-semibold text-foreground">{s.activity.title}</p>
                        <p className="text-sm text-foreground-muted">
                          {formatActivityDate(s.activity.date)} · {s.activity.startTime} · {s.activity.areaEn.replace("Prishtina — ", "")}
                        </p>
                        <ul className="mt-1 flex flex-wrap gap-1.5">
                          {s.reasons.map((r) => (
                            <li key={r}>
                              <Pill tone="brand">{r}</Pill>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <ButtonLink href={`/discover/${s.activity.slug}`} variant="secondary" size="sm">
                          View activity
                        </ButtonLink>
                        {friend.isFriend &&
                          (s.alreadyInvited ? (
                            <Pill tone="success">Invited ✓</Pill>
                          ) : (
                            <form action={sendInviteAction}>
                              <input type="hidden" name="friendId" value={friend.id} />
                              <input type="hidden" name="activityId" value={s.activity.id} />
                              <input type="hidden" name="message" value={`Want to come to "${s.activity.title}" with me?`} />
                              <input type="hidden" name="returnTo" value={`/people/${friend.id}`} />
                              <Button size="sm">Invite {first}</Button>
                            </form>
                          ))}
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
            {!friend.isFriend && <p className="text-sm text-foreground-muted">Add {first} as a friend to send invitations.</p>}
          </section>
        </div>

        <aside className="flex flex-col gap-4" aria-label="Conversation and safety">
          <Card className="flex flex-col gap-3 p-5">
            <h2 className="font-display text-lg font-semibold text-foreground">Conversation</h2>
            {friend.isFriend ? (
              <>
                {preview.length === 0 ? (
                  <p className="text-sm text-foreground-muted">No messages yet — say hello.</p>
                ) : (
                  <ul className="flex flex-col gap-2 text-sm">
                    {preview.map((m) => (
                      <li key={m.id} className={m.mine ? "text-right" : ""}>
                        <span className={`inline-block max-w-[90%] rounded-2xl px-3 py-1.5 ${m.mine ? "bg-brand text-white" : "bg-surface-muted text-foreground"}`}>
                          {m.body}
                        </span>
                        {m.isSeededExample && <span className="block text-[11px] text-foreground-muted">demo example</span>}
                      </li>
                    ))}
                  </ul>
                )}
                <ButtonLink href={`/messages/${friend.id}`} variant="secondary" size="sm">
                  Open conversation
                </ButtonLink>
              </>
            ) : (
              <p className="text-sm text-foreground-muted">Add {first} as a friend to start a conversation.</p>
            )}
            <DemoFriendNote />
          </Card>

          <details className="rounded-2xl border border-border bg-surface p-4">
            <summary className="cursor-pointer text-sm font-semibold text-foreground">Safety & friendship</summary>
            <div className="mt-3 flex flex-col gap-3">
              {friend.isFriend && (
                <form action={removeFriendAction}>
                  <input type="hidden" name="friendId" value={friend.id} />
                  <Button variant="secondary" size="sm">Remove friend</Button>
                </form>
              )}
              <form action={blockUserAction}>
                <input type="hidden" name="targetId" value={friend.id} />
                <Button variant="danger" size="sm">Block {first}</Button>
              </form>
              <form action={reportUserAction} className="flex flex-col gap-2">
                <input type="hidden" name="targetId" value={friend.id} />
                <input type="hidden" name="returnTo" value={`/people/${friend.id}`} />
                <label htmlFor="report-user" className="text-sm font-medium text-foreground">
                  Report a concern
                </label>
                <input
                  id="report-user"
                  name="reason"
                  required
                  maxLength={500}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder="What happened?"
                />
                <Button variant="secondary" size="sm">Send report</Button>
              </form>
            </div>
          </details>
        </aside>
      </div>
    </PageShell>
  );
}
