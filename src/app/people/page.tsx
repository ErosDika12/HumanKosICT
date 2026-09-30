import { DemoBadge } from "@/components/DemoBadge";
import { FriendCardView } from "@/components/FriendCardView";
import { JourneyChecklist } from "@/components/JourneyChecklist";
import { Avatar, Card, DemoFriendNote, EmptyState, Eyebrow, Notice, PageShell, Pill, buttonClass } from "@/components/ui";
import { demoLoginAction } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listFriendPreview, listFriendSuggestions, listFriends } from "@/lib/data/friends";
import { SLOT_LABEL } from "@/lib/demo-social";

const OK: Record<string, string> = {
  "friend-added": "Friend added. You can now invite them to activities and message them.",
  "friend-removed": "Friend removed.",
};

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; blocked?: string; reported?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();

  if (!user) {
    const preview = await listFriendPreview(8);
    return (
      <PageShell>
        <header className="flex flex-col gap-2">
          <DemoBadge className="self-start" />
          <Eyebrow>Friends</Eyebrow>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">Find someone to go with</h1>
          <p className="max-w-2xl text-foreground-muted">
            Log in as a demo visitor to see which of the twelve fictional demo friends share your interests, what fits you
            both, and to invite them to an activity.
          </p>
          <form action={demoLoginAction} className="mt-2">
            <button type="submit" className={buttonClass("accent", "lg")}>
              Log in as demo
            </button>
          </form>
        </header>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {preview.map((f) => (
            <li key={f.id}>
              <Card className="flex h-full flex-col gap-3 p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={f.name} />
                  <div>
                    <p className="font-display font-semibold text-foreground">{f.name}</p>
                    <p className="text-xs text-foreground-muted">{f.areaSq?.replace("Prishtinë — ", "")}</p>
                  </div>
                </div>
                <ul className="flex flex-wrap gap-1.5">
                  {f.interests.map((i) => (
                    <li key={i.id}>
                      <Pill tone="neutral">
                        {i.emoji} {i.label}
                      </Pill>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-foreground-muted">Free {f.availability.map((s) => SLOT_LABEL[s]).join(", ")}</p>
              </Card>
            </li>
          ))}
        </ul>
        <DemoFriendNote />
      </PageShell>
    );
  }

  const [friends, suggestions] = await Promise.all([listFriends(user.id), listFriendSuggestions(user.id)]);

  return (
    <PageShell>
      {user.isDemoVisitor && <JourneyChecklist userId={user.id} />}
      <header className="flex flex-col gap-2">
        <DemoBadge className="self-start" />
        <Eyebrow>Friends</Eyebrow>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">Find someone to go with</h1>
        <p className="max-w-2xl text-foreground-muted">
          Demo friends who share an interest, community or project with you. Add one, then invite them to an activity that
          fits both of you.
        </p>
      </header>

      {params.ok && OK[params.ok] && <Notice kind="ok">{OK[params.ok]}</Notice>}
      {params.error && <Notice kind="error">{params.error}</Notice>}
      {params.blocked && <Notice kind="info">Blocked. They can no longer be suggested or messaged.</Notice>}
      {params.reported && <Notice kind="ok">Thanks — your report was recorded.</Notice>}

      <section aria-labelledby="your-friends" className="flex flex-col gap-4">
        <h2 id="your-friends" className="font-display text-2xl font-semibold text-foreground">
          Your friends <span className="text-base font-normal text-foreground-muted">({friends.length})</span>
        </h2>
        {friends.length === 0 ? (
          <EmptyState title="No friends yet">Add someone from the suggestions below.</EmptyState>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {friends.map((f) => (
              <li key={f.id}>
                <FriendCardView card={f} mode="friend" />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="suggested" className="flex flex-col gap-4">
        <h2 id="suggested" className="font-display text-2xl font-semibold text-foreground">
          Suggested for you <span className="text-base font-normal text-foreground-muted">({suggestions.length})</span>
        </h2>
        {suggestions.length === 0 ? (
          <EmptyState title="No more suggestions right now">
            You already have every demo friend who shares something with you. Update your interests to see more.
          </EmptyState>
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
      <DemoFriendNote />
    </PageShell>
  );
}
