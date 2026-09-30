import Link from "next/link";
import { DemoBadge } from "@/components/DemoBadge";
import { Avatar, Button, ButtonLink, Card, DemoFriendNote, EmptyState, Eyebrow, PageShell, Pill } from "@/components/ui";
import { demoLoginAction } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listThreads } from "@/lib/data/messages";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <PageShell className="max-w-xl">
        <DemoBadge className="self-start" />
        <EmptyState
          title="Messages"
          action={
            <form action={demoLoginAction}>
              <Button variant="accent" size="lg">Log in as demo</Button>
            </form>
          }
        >
          Message your demo friends after you add them. Everything you send is stored on your demo account.
        </EmptyState>
      </PageShell>
    );
  }
  const threads = await listThreads(user.id);

  return (
    <PageShell className="max-w-3xl">
      <header className="flex flex-col gap-2">
        <DemoBadge className="self-start" />
        <Eyebrow>Messages</Eyebrow>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">Conversations</h1>
        <p className="text-foreground-muted">Direct messages with your friends. Demo friends never reply live.</p>
      </header>
      {threads.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          action={
            <ButtonLink href="/people" variant="primary">
              Find friends
            </ButtonLink>
          }
        >
          Add a demo friend, then send the first message.
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {threads.map((t) => (
            <li key={t.friendId}>
              <Link href={`/messages/${t.friendId}`} className="block">
                <Card className="flex items-center gap-3 p-4 transition-shadow hover:shadow-md">
                  <Avatar name={t.friendName} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display font-semibold text-foreground">{t.friendName}</span>
                      {t.hasSeededExample && <Pill tone="neutral">includes demo examples</Pill>}
                      {t.unread > 0 && <Pill tone="danger">{t.unread} new</Pill>}
                    </div>
                    <p className="truncate text-sm text-foreground-muted">
                      {t.lastIsMine && "You: "}
                      {t.lastBody}
                    </p>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <DemoFriendNote />
    </PageShell>
  );
}
