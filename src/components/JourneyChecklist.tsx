import Link from "next/link";
import { getJourneyProgress } from "@/lib/data/demo-session";

/**
 * The demo journey as a checklist — ticks come from rows the visitor really
 * created (RSVPs, friendships, invitations, messages, assistant use), so a
 * refresh shows exactly the same progress.
 */
export async function JourneyChecklist({ userId, welcome = false, name }: { userId: string; welcome?: boolean; name?: string }) {
  const p = await getJourneyProgress(userId);
  const steps = [
    { label: "Pick an activity and RSVP", href: "/discover", done: p.rsvped },
    { label: "Add a demo friend", href: "/people", done: p.friendAdded },
    { label: "Invite them", href: "/people", done: p.invited },
    { label: "View your plan", href: "/plans", done: p.invited && p.rsvped },
    { label: "Send a message", href: "/messages", done: p.messaged },
    { label: "Ask the assistant", href: "/assistant", done: p.askedAssistant },
    { label: "Visit BRIDGE", href: "/bridge", done: false },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <section
      aria-label="Your demo journey"
      className={`rounded-2xl border p-4 ${welcome ? "border-accent bg-accent-tint" : "border-border bg-surface"}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-display text-base font-semibold text-foreground">
          {welcome ? `Welcome${name ? `, ${name}` : ""}! ` : ""}Your demo journey · {doneCount}/{steps.length} done
        </p>
        <p className="text-xs text-foreground-muted">Progress is saved on your temporary demo account.</p>
      </div>
      <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.label}>
            <Link
              href={s.href}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-muted"
            >
              <span
                aria-hidden="true"
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  s.done ? "bg-success text-white" : "border border-border text-foreground-muted"
                }`}
              >
                {s.done ? "✓" : i + 1}
              </span>
              <span className="text-foreground">
                {s.label}
                {s.done && <span className="sr-only"> (done)</span>}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
