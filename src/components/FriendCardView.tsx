import Link from "next/link";
import type { FriendCard } from "@/lib/data/friends";
import { addFriendAction } from "@/lib/actions/social-actions";
import { Avatar, Button, ButtonLink, Card, Pill } from "@/components/ui";
import { PinIcon } from "@/components/icons";
import { getI18n } from "@/lib/i18n/server";
import { areaFromSq } from "@/lib/i18n/areas";
import { localizeReason } from "@/lib/i18n/reasons";
import { localizeText } from "@/lib/i18n/content";
import { getInterest, interestLabel } from "@/lib/types";

/** One demo friend — shared interests highlighted, availability and neighborhood visible. */
export async function FriendCardView({ card, mode }: { card: FriendCard; mode: "friend" | "suggestion" }) {
  const { t, locale } = await getI18n();
  const shared = new Set(card.sharedInterestIds);
  return (
    <Card className="flex h-full flex-col gap-3 p-5">
      <div className="flex items-start gap-3">
        <Avatar name={card.name} size={48} />
        <div className="min-w-0">
          <h3 className="font-display text-lg font-semibold leading-tight text-foreground">
            <Link href={`/people/${card.id}`} className="hover:underline">
              {card.name}
            </Link>
          </h3>
          <p className="inline-flex items-center gap-1 text-xs text-foreground-muted">
            <PinIcon size={13} />
            {areaFromSq(card.areaSq, t)}
          </p>
        </div>
        <Pill tone="accent" className="ml-auto shrink-0">
          {t("friends.demoFriend")}
        </Pill>
      </div>
      {card.bio && <p className="line-clamp-2 text-sm text-foreground-muted">{localizeText(card.bio, locale)}</p>}
      <ul className="flex flex-wrap gap-1.5" aria-label={t("friends.interestsOf", { name: card.name })}>
        {card.interests.map((i) => (
          <li key={i.id}>
            <Pill tone={shared.has(i.id) ? "brand" : "neutral"}>
              {i.emoji} {interestLabel(getInterest(i.id), locale)}
              {shared.has(i.id) && <span className="sr-only"> {t("friends.sharedWithYou")}</span>}
            </Pill>
          </li>
        ))}
      </ul>
      {card.reasons.length > 0 && (
        <p className="text-xs font-medium text-brand-strong">{card.reasons.map((r) => localizeReason(r, t, locale)).join(" · ")}</p>
      )}
      <p className="text-xs text-foreground-muted">
        {t("friends.freeOn", { slots: card.availability.map((s) => t(`slotNoun.${s}`)).join(", ") })}
        {card.needsAccessible && ` · ${t("friends.needsAccessible").toLowerCase()}`}
      </p>
      {card.isSeededExample && mode === "friend" && <p className="text-xs text-foreground-muted">{t("friends.exampleFriendship")}</p>}
      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        {mode === "suggestion" ? (
          <>
            <form action={addFriendAction}>
              <input type="hidden" name="friendId" value={card.id} />
              <input type="hidden" name="returnTo" value={`/people/${card.id}`} />
              <Button size="sm">{t("action.addFriend")}</Button>
            </form>
            <ButtonLink href={`/people/${card.id}`} variant="secondary" size="sm">
              {t("friends.seeWhatFits")}
            </ButtonLink>
          </>
        ) : (
          <>
            <ButtonLink href={`/people/${card.id}`} variant="primary" size="sm">
              {t("friends.inviteToActivity")}
            </ButtonLink>
            <ButtonLink href={`/messages/${card.id}`} variant="secondary" size="sm">
              {t("friends.message")}
            </ButtonLink>
          </>
        )}
      </div>
    </Card>
  );
}
