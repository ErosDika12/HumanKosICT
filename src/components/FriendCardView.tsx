import Link from "next/link";
import type { FriendCard } from "@/lib/data/friends";
import { SLOT_LABEL } from "@/lib/demo-social";
import { addFriendAction } from "@/lib/actions/social-actions";
import { Avatar, Button, ButtonLink, Card, Pill } from "@/components/ui";

/** One demo friend — shared interests highlighted, availability and neighborhood visible. */
export function FriendCardView({ card, mode }: { card: FriendCard; mode: "friend" | "suggestion" }) {
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
          <p className="text-xs text-foreground-muted">{card.areaSq?.replace("Prishtinë — ", "📍 ")}</p>
        </div>
        <Pill tone="accent" className="ml-auto shrink-0">
          Demo friend
        </Pill>
      </div>
      {card.bio && <p className="line-clamp-2 text-sm text-foreground-muted">{card.bio}</p>}
      <ul className="flex flex-wrap gap-1.5" aria-label={`${card.name}'s interests`}>
        {card.interests.map((i) => (
          <li key={i.id}>
            <Pill tone={shared.has(i.id) ? "brand" : "neutral"}>
              {i.emoji} {i.label}
              {shared.has(i.id) && <span className="sr-only"> (shared with you)</span>}
            </Pill>
          </li>
        ))}
      </ul>
      {card.reasons.length > 0 && (
        <p className="text-xs font-medium text-brand-strong">✨ {card.reasons.join(" · ")}</p>
      )}
      <p className="text-xs text-foreground-muted">
        Free {card.availability.map((s) => SLOT_LABEL[s]).join(", ")}
        {card.needsAccessible && " · prefers wheelchair-accessible venues"}
      </p>
      {card.isSeededExample && mode === "friend" && (
        <p className="text-xs text-foreground-muted">Example friendship (demo content).</p>
      )}
      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        {mode === "suggestion" ? (
          <>
            <form action={addFriendAction}>
              <input type="hidden" name="friendId" value={card.id} />
              <input type="hidden" name="returnTo" value={`/people/${card.id}`} />
              <Button size="sm">Add friend</Button>
            </form>
            <ButtonLink href={`/people/${card.id}`} variant="secondary" size="sm">
              See what fits
            </ButtonLink>
          </>
        ) : (
          <>
            <ButtonLink href={`/people/${card.id}`} variant="primary" size="sm">
              Invite to an activity
            </ButtonLink>
            <ButtonLink href={`/messages/${card.id}`} variant="secondary" size="sm">
              Message
            </ButtonLink>
          </>
        )}
      </div>
    </Card>
  );
}
