import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoBadge } from "@/components/DemoBadge";
import { Avatar, Button, ButtonLink, Notice, PageShell } from "@/components/ui";
import { demoLoginAction } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { areFriends, getFriendProfile } from "@/lib/data/friends";
import { getThread, markThreadRead, MAX_MESSAGE_LENGTH } from "@/lib/data/messages";
import { sendMessageAction } from "@/lib/actions/social-actions";

export default async function ThreadPage({
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
        <p className="text-foreground-muted">Log in as demo to read and send messages.</p>
        <form action={demoLoginAction}>
          <Button variant="accent" size="lg">Log in as demo</Button>
        </form>
      </PageShell>
    );
  }
  const friend = await getFriendProfile(user.id, id);
  if (!friend) notFound();
  const isFriend = await areFriends(user.id, id);
  await markThreadRead(user.id, id);
  const thread = await getThread(user.id, id);
  const first = friend.name.split(" ")[0];

  return (
    <PageShell className="max-w-3xl">
      <Link href="/messages" className="text-sm font-medium text-brand-strong underline underline-offset-2">
        ← All conversations
      </Link>
      <header className="flex items-center gap-3">
        <Avatar name={friend.name} size={52} />
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">{friend.name}</h1>
          <p className="text-sm text-foreground-muted">
            Demo friend · fictional · <Link href={`/people/${friend.id}`} className="underline">view profile</Link>
          </p>
        </div>
      </header>

      <Notice kind="info">
        {first} is a fictional demo friend and will not reply live. Lines labeled &ldquo;demo example&rdquo; are seeded; your own
        messages are real and saved on your account.
      </Notice>
      {flash.ok === "sent" && <Notice kind="ok">Message sent and saved.</Notice>}
      {flash.error && <Notice kind="error">{flash.error}</Notice>}

      <ol className="flex flex-col gap-3" aria-label={`Conversation with ${friend.name}`}>
        {thread.length === 0 && <li className="text-sm text-foreground-muted">No messages yet — say hello.</li>}
        {thread.map((m) => (
          <li key={m.id} className={`flex flex-col gap-0.5 ${m.mine ? "items-end" : "items-start"}`}>
            <span
              className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm ${
                m.mine ? "rounded-br-md bg-brand text-white" : "rounded-bl-md bg-surface-muted text-foreground"
              }`}
            >
              <span className="sr-only">{m.mine ? "You said: " : `${first} said: `}</span>
              {m.body}
            </span>
            <span className="px-1 text-[11px] text-foreground-muted">
              {m.mine ? "You" : first}
              {m.isSeededExample ? " · demo example" : ""}
            </span>
          </li>
        ))}
      </ol>

      {isFriend ? (
        <form action={sendMessageAction} className="sticky bottom-4 flex flex-col gap-2 rounded-2xl border border-border bg-surface p-3 shadow-lg">
          <input type="hidden" name="friendId" value={friend.id} />
          <input type="hidden" name="returnTo" value={`/messages/${friend.id}`} />
          <label htmlFor="body" className="text-sm font-medium text-foreground">
            Message {first}
          </label>
          <div className="flex gap-2">
            <textarea
              id="body"
              name="body"
              required
              rows={2}
              maxLength={MAX_MESSAGE_LENGTH}
              className="min-h-[3rem] flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
              placeholder={`Write to ${first}…`}
            />
            <Button className="self-end">Send</Button>
          </div>
        </form>
      ) : (
        <Notice kind="info">
          Add {first} as a friend to message them.{" "}
          <ButtonLink href={`/people/${friend.id}`} variant="secondary" size="sm" className="ml-2">
            Open profile
          </ButtonLink>
        </Notice>
      )}
    </PageShell>
  );
}
