import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, Button, ButtonLink, Card, EmptyState, Notice, PageShell, Pill } from "@/components/ui";
import { PinIcon } from "@/components/icons";
import { demoLoginAction } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getFriendProfile, suitableActivities } from "@/lib/data/friends";
import { getThread } from "@/lib/data/messages";
import { addFriendAction, removeFriendAction, sendInviteAction } from "@/lib/actions/social-actions";
import { blockUserAction, reportUserAction } from "@/lib/actions/people-actions";
import { getI18n } from "@/lib/i18n/server";
import { errorMessage } from "@/lib/i18n/errors";
import { areaFromEn, areaFromSq } from "@/lib/i18n/areas";
import { localizeActivity, localizeText } from "@/lib/i18n/content";
import { localizeReason } from "@/lib/i18n/reasons";
import { getInterest, interestLabel } from "@/lib/types";

const OK_KEY: Record<string, string> = {
  "friend-added": "friends.ok.friendAddedProfile",
  invited: "friends.ok.invited",
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
  const { t, locale, shortDate } = await getI18n();
  const user = await getCurrentUser();
  if (!user) {
    return (
      <PageShell className="max-w-xl">
        <EmptyState
          title={t("friends.loginToSee")}
          action={
            <form action={demoLoginAction}>
              <Button variant="accent" size="lg">{t("action.demoLogin")}</Button>
            </form>
          }
        >
          {t("friends.loginBody")}
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
  const errText = errorMessage(t, flash.error);

  return (
    <PageShell className="max-w-5xl">
      <Link href="/people" className="inline-block py-2 text-sm font-medium text-brand-strong underline underline-offset-2">
        ← {t("friends.back")}
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Avatar name={friend.name} size={72} />
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="accent">{t("friends.demoFriendLong")}</Pill>
              {friend.isFriend && <Pill tone="success">✓ {t("friends.yourFriend")}</Pill>}
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{friend.name}</h1>
            <p className="flex flex-wrap items-center gap-x-2 text-sm text-foreground-muted">
              <span className="inline-flex items-center gap-1">
                <PinIcon size={14} />
                {areaFromSq(friend.areaSq, t)}
              </span>
              <span>· {t("friends.freeOn", { slots: friend.availability.map((s) => t(`slotNoun.${s}`)).join(", ") })}</span>
              {friend.needsAccessible && <span>· {t("friends.needsAccessible")}</span>}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {friend.isFriend ? (
            <ButtonLink href={`/messages/${friend.id}`} variant="primary">
              {t("friends.messageName", { name: first })}
            </ButtonLink>
          ) : (
            <form action={addFriendAction}>
              <input type="hidden" name="friendId" value={friend.id} />
              <input type="hidden" name="returnTo" value={`/people/${friend.id}`} />
              <Button size="md">{t("friends.addAsFriend", { name: first })}</Button>
            </form>
          )}
        </div>
      </header>

      {flash.ok && OK_KEY[flash.ok] && <Notice kind="ok">{t(OK_KEY[flash.ok])}</Notice>}
      {errText && <Notice kind="error">{errText}</Notice>}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="flex flex-col gap-6">
          <Card className="p-5 sm:p-6">
            <h2 className="font-display text-xl font-semibold text-foreground">{t("friends.about", { name: first })}</h2>
            <p className="mt-2 text-foreground-muted">{localizeText(friend.bio, locale)}</p>
            <ul className="mt-4 flex flex-wrap gap-2" aria-label={t("friends.interests")}>
              {friend.interests.map((i) => (
                <li key={i.id}>
                  <Pill tone={shared.has(i.id) ? "brand" : "neutral"}>
                    {i.emoji} {interestLabel(getInterest(i.id), locale)}
                    {shared.has(i.id) && <span className="sr-only"> {t("friends.sharedWithYou")}</span>}
                  </Pill>
                </li>
              ))}
            </ul>
            {friend.reasons.length > 0 && (
              <p className="mt-3 text-sm font-medium text-brand-strong">{friend.reasons.map((r) => localizeReason(r, t, locale)).join(" · ")}</p>
            )}
          </Card>

          <section aria-labelledby="fits" className="flex flex-col gap-3">
            <h2 id="fits" className="font-display text-2xl font-semibold text-foreground">
              {t("friends.fitsTitle")}
            </h2>
            {suitable.length === 0 ? (
              <EmptyState title={t("friends.nothingMatches")}>
                {t("friends.nothingMatchesBody", { name: first })}{" "}
                <Link href="/discover" className="underline">
                  {t("friends.browseAll")}
                </Link>
              </EmptyState>
            ) : (
              <ul className="flex flex-col gap-3">
                {suitable.map((s) => {
                  const text = localizeActivity(s.activity, locale);
                  return (
                    <li key={s.activity.id}>
                      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-display text-lg font-semibold text-foreground">{text.title}</p>
                          <p className="text-sm text-foreground-muted">
                            {shortDate(s.activity.date)} · {s.activity.startTime} · {areaFromEn(s.activity.areaEn, t)}
                          </p>
                          <ul className="mt-1 flex flex-wrap gap-1.5">
                            {s.reasons.map((r) => (
                              <li key={r}>
                                <Pill tone="brand">{localizeReason(r, t, locale)}</Pill>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <ButtonLink href={`/discover/${s.activity.slug}`} variant="secondary" size="sm">
                            {t("action.viewActivity")}
                          </ButtonLink>
                          {friend.isFriend &&
                            (s.alreadyInvited ? (
                              <Pill tone="success">{t("friends.invitedCheck")}</Pill>
                            ) : (
                              <form action={sendInviteAction}>
                                <input type="hidden" name="friendId" value={friend.id} />
                                <input type="hidden" name="activityId" value={s.activity.id} />
                                <input type="hidden" name="message" value={t("friends.inviteDefault", { title: text.title })} />
                                <input type="hidden" name="returnTo" value={`/people/${friend.id}`} />
                                <Button size="sm">{t("action.invite", { name: first })}</Button>
                              </form>
                            ))}
                        </div>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            )}
            {!friend.isFriend && <p className="text-sm text-foreground-muted">{t("friends.addToInvite", { name: first })}</p>}
          </section>
        </div>

        <aside className="flex flex-col gap-4" aria-label={t("friends.conversation")}>
          <Card className="flex flex-col gap-3 p-5">
            <h2 className="font-display text-lg font-semibold text-foreground">{t("friends.conversation")}</h2>
            {friend.isFriend ? (
              <>
                {preview.length === 0 ? (
                  <p className="text-sm text-foreground-muted">{t("messages.empty")}</p>
                ) : (
                  <ul className="flex flex-col gap-2 text-sm">
                    {preview.map((m) => (
                      <li key={m.id} className={m.mine ? "text-right" : ""}>
                        <span className={`inline-block max-w-[90%] rounded-2xl px-3 py-1.5 ${m.mine ? "bg-brand text-white" : "bg-surface-muted text-foreground"}`}>
                          {m.isSeededExample ? localizeText(m.body, locale) : m.body}
                        </span>
                        {m.isSeededExample && <span className="block text-[11px] text-foreground-muted">{t("state.demoExample")}</span>}
                      </li>
                    ))}
                  </ul>
                )}
                <ButtonLink href={`/messages/${friend.id}`} variant="secondary" size="sm">
                  {t("friends.openConversation")}
                </ButtonLink>
              </>
            ) : (
              <p className="text-sm text-foreground-muted">{t("friends.startConversation", { name: first })}</p>
            )}
            <p className="text-xs text-foreground-muted">{t("messages.noReply", { name: first })}</p>
          </Card>

          <details className="rounded-2xl border border-border bg-surface p-4">
            <summary className="cursor-pointer text-sm font-semibold text-foreground">{t("friends.safety")}</summary>
            <div className="mt-3 flex flex-col gap-3">
              {friend.isFriend && (
                <form action={removeFriendAction}>
                  <input type="hidden" name="friendId" value={friend.id} />
                  <Button variant="secondary" size="sm">{t("friends.removeFriend")}</Button>
                </form>
              )}
              <form action={blockUserAction}>
                <input type="hidden" name="targetId" value={friend.id} />
                <Button variant="danger" size="sm">{t("friends.blockName", { name: first })}</Button>
              </form>
              <form action={reportUserAction} className="flex flex-col gap-2">
                <input type="hidden" name="targetId" value={friend.id} />
                <input type="hidden" name="returnTo" value={`/people/${friend.id}`} />
                <label htmlFor="report-user" className="text-sm font-medium text-foreground">
                  {t("friends.reportConcern")}
                </label>
                <input
                  id="report-user"
                  name="reason"
                  required
                  maxLength={500}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder={t("friends.whatHappened")}
                />
                <Button variant="secondary" size="sm">{t("friends.sendReport")}</Button>
              </form>
            </div>
          </details>
        </aside>
      </div>
    </PageShell>
  );
}
