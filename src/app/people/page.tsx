import Link from "next/link";
import type { Metadata } from "next";
import { FriendCardView } from "@/components/FriendCardView";
import { Avatar, Button, Card, EmptyState, Notice, PageShell, Pill, buttonClass } from "@/components/ui";
import { PinIcon } from "@/components/icons";
import { Photo } from "@/components/Photo";
import { demoLoginAction } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listFriendPreview, listFriendSuggestions, listFriends, suitableActivities } from "@/lib/data/friends";
import { getFriendExample } from "@/lib/data/home";
import { getActivityBySlug } from "@/lib/data/activities";
import { sendInviteAction } from "@/lib/actions/social-actions";
import { photoForActivity } from "@/lib/photos";
import { getI18n } from "@/lib/i18n/server";
import { errorMessage } from "@/lib/i18n/errors";
import { areaFromSq } from "@/lib/i18n/areas";
import { localizeActivity, localizeText } from "@/lib/i18n/content";
import { getInterest, interestLabel } from "@/lib/types";
import { relativeDayLabel } from "@/lib/time-window";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("nav.friends") };
}

const OK_KEY: Record<string, string> = {
  "friend-added": "friends.ok.added",
  "friend-removed": "friends.ok.removed",
};

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; blocked?: string; reported?: string }>;
}) {
  const params = await searchParams;
  const { t, locale, shortDate } = await getI18n();
  const user = await getCurrentUser();
  const errText = errorMessage(t, params.error);

  if (!user) {
    const [preview, example] = await Promise.all([listFriendPreview(12, false), getFriendExample()]);
    const exampleActivity = example ? await getActivityBySlug(example.activitySlug) : null;
    const exampleText = exampleActivity ? localizeActivity(exampleActivity, locale) : null;
    return (
      <PageShell>
        <header className="flex flex-col gap-3">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">{t("friends.title")}</h1>
          <p className="max-w-2xl text-foreground-muted">{t("friends.guestLead")}</p>
          <form action={demoLoginAction}>
            <button type="submit" className={buttonClass("accent", "lg")}>
              {t("action.demoLogin")}
            </button>
          </form>
        </header>

        {example && exampleActivity && exampleText && (
          <Card className="grid overflow-hidden sm:grid-cols-[minmax(0,260px)_1fr]">
            <Photo photo={photoForActivity(exampleActivity.slug, exampleActivity.category)} small illustrative className="relative min-h-40" />
            <div className="flex flex-col gap-3 p-5">
              <Pill tone="accent" className="w-fit">
                {t("home.friend.example")}
              </Pill>
              <p className="font-display text-xl font-semibold text-foreground">{exampleText.title}</p>
              <p className="text-sm text-foreground-muted">
                {shortDate(exampleActivity.date)} · {exampleActivity.startTime} · {t(`area.${exampleActivity.areaEn}`)}
              </p>
              <div className="flex items-center gap-3">
                <span className="flex -space-x-2">
                  <Avatar name={example.inviter} size={36} />
                  <Avatar name={example.friend} size={36} />
                </span>
                <div className="text-sm">
                  <p className="font-medium text-foreground">{t("home.friend.invitedLine", { inviter: example.inviter, friend: example.friend })}</p>
                  {example.message && <p className="text-foreground-muted">“{localizeText(example.message, locale)}”</p>}
                </div>
              </div>
              <p className="text-sm font-medium text-success">{t("home.friend.accepted", { friend: example.friend.split(" ")[0] })}</p>
            </div>
          </Card>
        )}

        <section aria-labelledby="preview-title" className="flex flex-col gap-4">
          <h2 id="preview-title" className="font-display text-2xl font-semibold text-foreground">
            {t("friends.guestPreview")} <span className="text-base font-normal text-foreground-muted">({preview.length})</span>
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {preview.map((f) => (
              <li key={f.id}>
                <Card className="flex h-full flex-col gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={f.name} />
                    <div>
                      <p className="font-display font-semibold text-foreground">{f.name}</p>
                      <p className="inline-flex items-center gap-1 text-xs text-foreground-muted">
                        <PinIcon size={13} />
                        {areaFromSq(f.areaSq, t)}
                      </p>
                    </div>
                  </div>
                  <ul className="flex flex-wrap gap-1.5">
                    {f.interests.map((i) => (
                      <li key={i.id}>
                        <Pill tone="neutral">
                          {i.emoji} {interestLabel(getInterest(i.id), locale)}
                        </Pill>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-foreground-muted">{t("friends.freeOn", { slots: f.availability.map((s) => t(`slotNoun.${s}`)).join(", ") })}</p>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      </PageShell>
    );
  }

  const [friends, suggestions] = await Promise.all([listFriends(user.id), listFriendSuggestions(user.id)]);
  // One concrete "do this together" idea per friend, so the page is about activities, not just people.
  const ideas = await Promise.all(friends.slice(0, 6).map((f) => suitableActivities(user.id, f.id, 1)));

  return (
    <PageShell>
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">{t("friends.title")}</h1>
        <p className="max-w-2xl text-foreground-muted">{t("friends.lead")}</p>
      </header>

      {params.ok && OK_KEY[params.ok] && <Notice kind="ok">{t(OK_KEY[params.ok])}</Notice>}
      {errText && <Notice kind="error">{errText}</Notice>}
      {params.blocked && <Notice kind="info">{t("friends.blocked")}</Notice>}
      {params.reported && <Notice kind="ok">{t("friends.reported")}</Notice>}

      <section aria-labelledby="your-friends" className="flex flex-col gap-4">
        <h2 id="your-friends" className="font-display text-2xl font-semibold text-foreground">
          {t("friends.yours")} <span className="text-base font-normal text-foreground-muted">({friends.length})</span>
        </h2>
        {friends.length === 0 ? (
          <EmptyState title={t("friends.none.title")}>{t("friends.none.body")}</EmptyState>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {friends.map((f, i) => {
              const idea = ideas[i]?.[0];
              const ideaText = idea ? localizeActivity(idea.activity, locale) : null;
              const rel = idea ? relativeDayLabel(idea.activity.date) : "";
              return (
                <li key={f.id} className="flex flex-col gap-2">
                  <FriendCardView card={f} mode="friend" />
                  {idea && ideaText && (
                    <div className="rounded-2xl border border-border bg-surface-muted p-3 text-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">{t("friends.suggestActivity")}</p>
                      <Link href={`/discover/${idea.activity.slug}`} className="mt-1 block font-semibold text-foreground hover:underline">
                        {ideaText.title}
                      </Link>
                      <p className="text-xs text-foreground-muted">
                        {rel === "This weekend" ? t("fact.thisWeekend") : rel === "Next weekend" ? t("fact.nextWeekend") : shortDate(idea.activity.date)} · {idea.activity.startTime}
                      </p>
                      {idea.alreadyInvited ? (
                        <p className="mt-2 text-xs font-medium text-success">{t("friends.invitedCheck")}</p>
                      ) : (
                        <form action={sendInviteAction} className="mt-2">
                          <input type="hidden" name="friendId" value={f.id} />
                          <input type="hidden" name="activityId" value={idea.activity.id} />
                          <input type="hidden" name="message" value={t("friends.inviteDefault", { title: ideaText.title })} />
                          <input type="hidden" name="returnTo" value="/people" />
                          <Button size="sm" variant="secondary">
                            {t("action.invite", { name: f.name.split(" ")[0] })}
                          </Button>
                        </form>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="suggested" className="flex flex-col gap-4">
        <h2 id="suggested" className="font-display text-2xl font-semibold text-foreground">
          {t("friends.suggested")} <span className="text-base font-normal text-foreground-muted">({suggestions.length})</span>
        </h2>
        {suggestions.length === 0 ? (
          <EmptyState title={t("friends.noMore.title")}>{t("friends.noMore.body")}</EmptyState>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {suggestions.map((f) => (
              <li key={f.id}>
                <FriendCardView card={f} mode="suggestion" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageShell>
  );
}
