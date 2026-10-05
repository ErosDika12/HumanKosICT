import Link from "next/link";
import { notFound } from "next/navigation";
import { ConversationList } from "@/components/ConversationList";
import { Avatar, Button, ButtonLink, Notice, PageShell } from "@/components/ui";
import { demoLoginAction } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { areFriends, getFriendProfile } from "@/lib/data/friends";
import { getThread, listThreads, markThreadRead, MAX_MESSAGE_LENGTH } from "@/lib/data/messages";
import { sendMessageAction } from "@/lib/actions/social-actions";
import { getI18n } from "@/lib/i18n/server";
import { errorMessage } from "@/lib/i18n/errors";
import { localizeText } from "@/lib/i18n/content";

export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { id } = await params;
  const flash = await searchParams;
  const { t, locale } = await getI18n();
  const user = await getCurrentUser();
  if (!user) {
    return (
      <PageShell className="max-w-xl">
        <p className="text-foreground-muted">{t("messages.lead")}</p>
        <form action={demoLoginAction}>
          <Button variant="accent" size="lg">{t("action.demoLogin")}</Button>
        </form>
      </PageShell>
    );
  }
  const friend = await getFriendProfile(user.id, id);
  if (!friend) notFound();
  const isFriend = await areFriends(user.id, id);
  await markThreadRead(user.id, id);
  const [thread, threads] = await Promise.all([getThread(user.id, id), listThreads(user.id)]);
  const first = friend.name.split(" ")[0];
  const errText = errorMessage(t, flash.error);

  return (
    <PageShell className="max-w-5xl">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* Desktop keeps the list beside the chat; on a phone only the open conversation is shown. */}
        <div className="hidden lg:block">
          <ConversationList threads={threads} activeId={id} />
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Link href="/messages" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand-strong lg:hidden">
            <span aria-hidden="true">←</span>
            {t("messages.back")}
          </Link>
          <header className="flex items-center gap-3">
            <Avatar name={friend.name} size={52} />
            <div>
              <h1 className="font-display text-2xl font-semibold text-foreground">{t("messages.thread", { name: friend.name })}</h1>
              <p className="text-sm text-foreground-muted">
                {t("friends.demoFriendLong")} ·{" "}
                <Link href={`/people/${friend.id}`} className="underline">
                  {t("friends.viewProfile")}
                </Link>
              </p>
            </div>
          </header>

          <Notice kind="info">{t("messages.noReply", { name: first })}</Notice>
          {flash.ok === "sent" && <Notice kind="ok">{t("messages.sent")}</Notice>}
          {errText && <Notice kind="error">{errText}</Notice>}

          <ol className="flex flex-col gap-3" aria-label={t("messages.thread", { name: friend.name })}>
            {thread.length === 0 && <li className="text-sm text-foreground-muted">{t("messages.empty")}</li>}
            {thread.map((m) => (
              <li key={m.id} className={`flex flex-col gap-0.5 ${m.mine ? "items-end" : "items-start"}`}>
                <span
                  className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${
                    m.mine ? "rounded-br-md bg-brand text-white" : "rounded-bl-md bg-surface-muted text-foreground"
                  }`}
                >
                  <span className="sr-only">{m.mine ? t("messages.you") : first}: </span>
                  {m.isSeededExample ? localizeText(m.body, locale) : m.body}
                </span>
                <span className="px-1 text-[11px] text-foreground-muted">
                  {m.mine ? t("messages.you") : first}
                  {m.isSeededExample ? ` · ${t("messages.demoLabel")}` : ""}
                </span>
              </li>
            ))}
          </ol>

          {isFriend ? (
            <form action={sendMessageAction} className="sticky bottom-20 flex flex-col gap-2 rounded-2xl border border-border bg-surface p-3 shadow-lg lg:bottom-4">
              <input type="hidden" name="friendId" value={friend.id} />
              <input type="hidden" name="returnTo" value={`/messages/${friend.id}`} />
              <label htmlFor="body" className="text-sm font-medium text-foreground">
                {t("friends.messageName", { name: first })}
              </label>
              <div className="flex gap-2">
                <textarea
                  id="body"
                  name="body"
                  required
                  rows={2}
                  maxLength={MAX_MESSAGE_LENGTH}
                  className="min-h-[3rem] flex-1 rounded-xl border border-border bg-background px-3 py-2 text-base"
                  placeholder={t("messages.placeholder")}
                />
                <Button className="self-end">{t("messages.send")}</Button>
              </div>
            </form>
          ) : (
            <Notice kind="info">
              {t("friends.startConversation", { name: first })}{" "}
              <ButtonLink href={`/people/${friend.id}`} variant="secondary" size="sm" className="ml-2">
                {t("friends.viewProfile")}
              </ButtonLink>
            </Notice>
          )}
        </div>
      </div>
    </PageShell>
  );
}
