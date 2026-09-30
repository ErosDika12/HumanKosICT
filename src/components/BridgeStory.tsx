"use client";

import Link from "next/link";
import { useState } from "react";
import type { BridgeShowcase } from "@/lib/data/bridge";
import { joinProjectAction } from "@/lib/actions/project-actions";
import { demoLoginAction } from "@/lib/auth/actions";
import { buttonClass, Pill } from "@/components/ui";

const STATE_LABEL = { done: "Done", current: "Now", upcoming: "Next", blocked: "Stopped" } as const;

function titleCase(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * The BRIDGE story as a stepper you can click through: need -> match ->
 * decision -> project -> first session. Each step shows the real stored
 * facts behind it and, where an action exists, the button to take it.
 * Purely a view over `BridgeShowcase` — nothing here invents progress.
 */
export function BridgeStory({ showcase, signedIn }: { showcase: BridgeShowcase; signedIn: boolean }) {
  const currentIndex = Math.max(0, showcase.stages.findIndex((s) => s.state === "current"));
  const [selected, setSelected] = useState(currentIndex);
  const stage = showcase.stages[selected];
  const { communityA, communityB, need, project, kickoff } = showcase;
  const reasons = showcase.reason.split(";").map((r) => r.trim()).filter(Boolean);

  return (
    <div className="flex flex-col gap-5">
      <ol className="grid gap-2 sm:grid-cols-5" aria-label="BRIDGE progress">
        {showcase.stages.map((s, i) => {
          const isSelected = i === selected;
          return (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => setSelected(i)}
                aria-pressed={isSelected}
                aria-current={s.state === "current" ? "step" : undefined}
                className={`flex h-full w-full flex-row items-start gap-3 rounded-2xl border p-3 text-left transition-colors sm:flex-col ${
                  isSelected ? "border-brand bg-brand-tint" : "border-border bg-surface hover:bg-surface-muted"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    s.state === "done"
                      ? "bg-success text-white"
                      : s.state === "current"
                        ? "bg-accent text-[#1c1b1a]"
                        : s.state === "blocked"
                          ? "bg-danger text-white"
                          : "border border-border bg-surface-muted text-foreground-muted"
                  }`}
                >
                  {s.state === "done" ? "✓" : i + 1}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-foreground">{s.label}</span>
                  <span className="text-[11px] font-medium uppercase tracking-wide text-foreground-muted">
                    {STATE_LABEL[s.state]}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm" aria-live="polite">
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={stage.state === "done" ? "success" : stage.state === "current" ? "accent" : "neutral"}>
            Step {selected + 1} · {stage.label}
          </Pill>
          <span className="text-sm text-foreground-muted">{stage.detail}</span>
        </div>

        {stage.key === "need" && (
          <div className="mt-4 flex flex-col gap-2">
            <blockquote className="border-l-4 border-accent pl-4 font-display text-lg text-foreground">
              &ldquo;{need.description}&rdquo;
            </blockquote>
            <p className="text-sm text-foreground-muted">
              Raised in {need.areaSq} · {titleCase(need.category)} · supported by {need.supporters}{" "}
              {need.supporters === 1 ? "person" : "people"}.
            </p>
            <Link href="/needs" className={buttonClass("secondary", "sm", "w-fit")}>
              See all community needs
            </Link>
          </div>
        )}

        {stage.key === "match" && (
          <div className="mt-4 flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              {[communityA, communityB].map((c, i) => (
                <div key={c.slug} className={i === 1 ? "sm:order-3" : ""}>
                  <Link
                    href={`/communities/${c.slug}`}
                    className="flex flex-col gap-1 rounded-xl border border-border bg-background p-3 hover:bg-surface-muted"
                  >
                    <span className="font-display font-semibold text-foreground">{c.name}</span>
                    <span className="text-xs text-foreground-muted">
                      {titleCase(c.category)} · {c.areaSq}
                    </span>
                  </Link>
                </div>
              ))}
              <span aria-hidden="true" className="text-center font-display text-2xl text-accent-strong sm:order-2">
                ×
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Why BRIDGE matched them</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-foreground-muted">
                {reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-foreground-muted">
                The match uses a documented, deterministic formula — never an opaque AI score.
              </p>
            </div>
          </div>
        )}

        {stage.key === "decision" && (
          <div className="mt-4 grid gap-3 text-sm text-foreground-muted sm:grid-cols-2">
            <div>
              <p className="font-semibold text-foreground">Mutual benefit</p>
              <p>{showcase.mutualBenefit}</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Resources needed</p>
              <p>{showcase.requiredResources}</p>
            </div>
            <p className="sm:col-span-2">
              Only an organizer of {communityA.name} or {communityB.name} can accept, edit or decline a proposal.
            </p>
            <Link href={`/bridge/${showcase.id}`} className={buttonClass("secondary", "sm", "w-fit")}>
              Open the full proposal
            </Link>
          </div>
        )}

        {stage.key === "project" && (
          <div className="mt-4 flex flex-col gap-3">
            {project ? (
              <>
                <p className="font-display text-lg font-semibold text-foreground">{project.title}</p>
                <div>
                  <div
                    className="h-2.5 overflow-hidden rounded-full bg-surface-muted"
                    role="progressbar"
                    aria-label="Volunteers joined"
                    aria-valuemin={0}
                    aria-valuemax={project.volunteersNeeded}
                    aria-valuenow={Math.min(project.volunteerCount, project.volunteersNeeded)}
                  >
                    <div
                      className="h-full rounded-full bg-success"
                      style={{ width: `${Math.min(100, (project.volunteerCount / project.volunteersNeeded) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-sm text-foreground-muted">
                    {project.volunteerCount} of {project.volunteersNeeded} volunteers joined
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!signedIn ? (
                    <form action={demoLoginAction}>
                      <button type="submit" className={buttonClass("accent", "md")}>
                        Log in as demo to join
                      </button>
                    </form>
                  ) : project.viewerIsVolunteer ? (
                    <span className="inline-flex items-center rounded-full bg-success-tint px-4 py-2 text-sm font-semibold text-success">
                      ✓ You joined this project
                    </span>
                  ) : (
                    <form action={joinProjectAction}>
                      <input type="hidden" name="projectId" value={project.id} />
                      <button type="submit" className={buttonClass("primary", "md")}>
                        Join the project
                      </button>
                    </form>
                  )}
                  <Link href={`/projects/${project.slug}`} className={buttonClass("secondary", "md")}>
                    View project
                  </Link>
                </div>
              </>
            ) : (
              <p className="text-sm text-foreground-muted">
                A project is created when an organizer accepts the proposal — nothing starts automatically.
              </p>
            )}
          </div>
        )}

        {stage.key === "session" && (
          <div className="mt-4 flex flex-col gap-3">
            {kickoff ? (
              <>
                <p className="font-display text-lg font-semibold text-foreground">{kickoff.title}</p>
                <p className="text-sm text-foreground-muted">
                  {kickoff.date} · {kickoff.startTime} · {kickoff.venueName}
                  {!kickoff.isPast && ` · ${kickoff.spotsLeft} spots left`}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/discover/${kickoff.slug}`} className={buttonClass(kickoff.viewerHasRsvp ? "secondary" : "primary", "md")}>
                    {kickoff.viewerHasRsvp ? "✓ You are going — view session" : "View session & RSVP"}
                  </Link>
                  {kickoff.viewerHasRsvp && (
                    <Link href="/plans" className={buttonClass("secondary", "md")}>
                      View plan
                    </Link>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-foreground-muted">No joint session is scheduled yet.</p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/50 bg-accent-tint p-4">
        <div className="flex max-w-xl flex-col gap-0.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-accent-strong">Your next step</span>
          <span className="text-sm text-foreground">{showcase.nextStep.description}</span>
        </div>
        <Link href={showcase.nextStep.href} className={buttonClass("primary", "md")}>
          {showcase.nextStep.label}
        </Link>
      </div>
    </div>
  );
}
