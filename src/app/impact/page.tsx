import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getImpactSummary } from "@/lib/data/impact";
import { SIMULATED_NOW_LABEL } from "@/lib/simulated-clock";

export default async function ImpactPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-10 sm:px-6">
        <p className="text-sm text-foreground-muted">
          <Link href="/login?next=/impact" className="text-brand underline underline-offset-2">
            Sign in
          </Link>{" "}
          to see your impact.
        </p>
      </div>
    );
  }

  const impact = await getImpactSummary(user.id);
  const hasAnything =
    impact.attendedEvents.length > 0 || impact.joinedProjects.length > 0 || impact.communities.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-semibold text-foreground">Your impact</h1>
        <p className="text-sm text-foreground-muted">
          Every item below comes from a real stored action — organizer-confirmed attendance, a
          real volunteer sign-up, or an active membership. No follower counts, no popularity score,
          no estimated or self-reported hours.
        </p>
      </div>

      {!hasAnything && (
        <p className="rounded-xl border border-dashed border-border bg-surface-muted p-6 text-center text-sm text-foreground-muted">
          Nothing recorded yet — RSVP to an activity, join a project, or join a community to see it
          here.
        </p>
      )}

      {impact.communities.length > 0 && (
        <Section title="Communities">
          <ul className="flex flex-col gap-2">
            {impact.communities.map((c) => (
              <li key={c.communitySlug} className="flex items-center justify-between text-sm">
                <Link href={`/communities/${c.communitySlug}`} className="text-brand underline underline-offset-2">
                  {c.name}
                </Link>
                <span className="text-xs capitalize text-foreground-muted">{c.role}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {impact.attendedEvents.length > 0 && (
        <Section title="Attended events">
          <p className="mb-2 text-xs text-foreground-muted">
            Confirmed by the event&apos;s organizer, not self-reported. Simulated &quot;today&quot; for this
            demo: {SIMULATED_NOW_LABEL}.
          </p>
          <ul className="flex flex-col gap-2">
            {impact.attendedEvents.map((e) => (
              <li key={e.activitySlug} className="flex items-center justify-between text-sm">
                <Link href={`/discover/${e.activitySlug}`} className="text-brand underline underline-offset-2">
                  {e.title}
                </Link>
                <span className="text-xs text-foreground-muted">
                  {e.date} · confirmed by {e.confirmedByName}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {impact.joinedProjects.length > 0 && (
        <Section title="Projects you're volunteering on">
          <ul className="flex flex-col gap-2">
            {impact.joinedProjects.map((p) => (
              <li key={p.projectSlug} className="flex items-center justify-between text-sm">
                <Link href={`/projects/${p.projectSlug}`} className="text-brand underline underline-offset-2">
                  {p.title}
                </Link>
                <span className="text-xs text-foreground-muted">
                  {p.communityName} · {p.volunteerCount} of {p.volunteersNeeded} volunteers
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h2 className="font-display text-sm font-semibold text-foreground">{title}</h2>
      <div className="mt-2">{children}</div>
    </div>
  );
}
