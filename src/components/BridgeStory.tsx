import Link from "next/link";
import type { BridgeShowcase } from "@/lib/data/bridge";
import { joinProjectAction } from "@/lib/actions/project-actions";
import { demoLoginAction } from "@/lib/auth/actions";
import { buttonClass } from "@/components/ui";
import { CheckIcon, PinIcon } from "@/components/icons";
import { getI18n } from "@/lib/i18n/server";
import { areaFromSq } from "@/lib/i18n/areas";
import { localizeActivity, localizeText } from "@/lib/i18n/content";
import { localizeBridgeReasons, localizeBridgeText } from "@/lib/i18n/bridge-text";
import { ACTIVITIES } from "@/lib/demo-data";

/**
 * The BRIDGE story as one readable column: need → two communities → project →
 * first joint session, then HOW the project meets the need, then one obvious
 * next action. Purely a view over `BridgeShowcase` — nothing here invents
 * progress, and every label comes from the visitor's language.
 */
export async function BridgeStory({ showcase, signedIn }: { showcase: BridgeShowcase; signedIn: boolean }) {
  const { t, locale, shortDate } = await getI18n();
  const { communityA, communityB, need, project, kickoff, stages } = showcase;

  const stateOf = (key: string) => stages.find((s) => s.key === key)?.state ?? "upcoming";
  const kickoffTitle = kickoff
    ? (() => {
        const seeded = ACTIVITIES.find((a) => a.slug === kickoff.slug);
        return seeded ? localizeActivity(seeded, locale).title : kickoff.title;
      })()
    : "";
  const reasons = localizeBridgeReasons(showcase.reason, t, locale);
  const decisionKey = showcase.status;

  const steps: { key: string; title: string; state: string; body: React.ReactNode }[] = [
    {
      key: "need",
      title: t("bridge.step.need"),
      state: stateOf("need"),
      body: (
        <>
          <blockquote className="border-l-4 border-accent pl-3 font-display text-base text-foreground">“{localizeText(need.description, locale)}”</blockquote>
          <p className="mt-2 text-sm text-foreground-muted">
            <span className="inline-flex items-center gap-1">
              <PinIcon size={14} />
              {areaFromSq(need.areaSq, t)}
            </span>{" "}
            · {t("bridge.step.need.detail", { n: need.supporters })}
          </p>
        </>
      ),
    },
    {
      key: "match",
      title: t("bridge.step.match"),
      state: stateOf("match"),
      body: (
        <>
          <p className="text-base">
            <Link href={`/communities/${communityA.slug}`} className="font-semibold text-brand-strong hover:underline">
              {communityA.name}
            </Link>{" "}
            <span className="text-accent-strong">×</span>{" "}
            <Link href={`/communities/${communityB.slug}`} className="font-semibold text-brand-strong hover:underline">
              {communityB.name}
            </Link>
          </p>
          <details className="mt-2 text-sm text-foreground-muted">
            <summary className="cursor-pointer py-2 font-medium text-foreground">{t("bridge.why")}</summary>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <p className="mt-1 text-xs">{t("bridge.formula")}</p>
          </details>
        </>
      ),
    },
    {
      key: "project",
      title: t("bridge.step.project"),
      state: stateOf("project"),
      body: project ? (
        <>
          <p className="text-sm text-foreground-muted">{t("bridge.volunteers", { n: project.volunteerCount, total: project.volunteersNeeded })}</p>
          <div
            className="mt-1 h-2 overflow-hidden rounded-full bg-surface-muted"
            role="progressbar"
            aria-label={t("bridge.volunteersAria")}
            aria-valuemin={0}
            aria-valuemax={project.volunteersNeeded}
            aria-valuenow={Math.min(project.volunteerCount, project.volunteersNeeded)}
          >
            <div className="h-full rounded-full bg-success" style={{ width: `${Math.min(100, (project.volunteerCount / project.volunteersNeeded) * 100)}%` }} />
          </div>
        </>
      ) : (
        <p className="text-sm text-foreground-muted">{t("bridge.step.project.none")}</p>
      ),
    },
    {
      key: "session",
      title: t("bridge.step.session"),
      state: stateOf("session"),
      body: kickoff ? (
        <p className="text-sm text-foreground-muted">
          <span className="font-medium text-foreground">{kickoffTitle}</span> · {shortDate(kickoff.date)} · {kickoff.startTime}
        </p>
      ) : (
        <p className="text-sm text-foreground-muted">{t("bridge.step.session.none")}</p>
      ),
    },
  ];

  // The primary action follows the stored state: join → RSVP → plan.
  const nextKind = showcase.nextStep.kind;

  return (
    <div className="flex flex-col gap-6">
      <ol className="grid gap-4 md:grid-cols-2" aria-label={t("bridge.story.label")}>
        {steps.map((s, i) => (
          <li key={s.key} className="flex gap-3 rounded-2xl border border-border bg-surface p-4">
            <span
              aria-hidden="true"
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                s.state === "done" ? "bg-success text-white" : s.state === "current" ? "bg-accent text-[#1c1b1a]" : "bg-surface-muted text-foreground-muted"
              }`}
            >
              {s.state === "done" ? <CheckIcon size={16} /> : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="flex flex-wrap items-center gap-2 font-display text-base font-semibold text-foreground">
                {s.title}
                <span className="text-[11px] font-medium uppercase tracking-wide text-foreground-muted">{t(`bridge.state.${s.state}`)}</span>
              </h3>
              <div className="mt-1">{s.body}</div>
            </div>
          </li>
        ))}
      </ol>

      <section className="rounded-2xl border border-brand/40 bg-brand-tint p-5" aria-labelledby="helps-title">
        <h3 id="helps-title" className="font-display text-lg font-semibold text-brand-strong">
          {t("bridge.helps.title")}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-foreground">{localizeBridgeText(showcase.mutualBenefit, t, locale)}</p>
        {kickoff && (
          <p className="mt-2 text-sm text-foreground-muted">
            {t("bridge.helps.firstSession")}: <span className="font-medium text-foreground">{kickoffTitle}</span> · {shortDate(kickoff.date)}
          </p>
        )}
      </section>

      <div className="flex flex-col gap-3 rounded-2xl border border-accent/50 bg-accent-tint p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex max-w-xl flex-col gap-0.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-accent-strong">{t("bridge.next.label")}</span>
          <span className="text-sm text-foreground">
            {nextKind === "review"
              ? t("bridge.next.review.desc", { a: communityA.name, b: communityB.name })
              : nextKind === "join-project"
                ? t("bridge.next.join.desc")
                : nextKind === "rsvp-kickoff"
                  ? t("bridge.next.rsvp.desc", { title: kickoffTitle })
                  : nextKind === "view-plan"
                    ? t("bridge.next.plan.desc")
                    : t("bridge.next.explore.desc")}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {project && !signedIn && (
            <form action={demoLoginAction}>
              <button type="submit" className={buttonClass("accent", "md")}>
                {t("bridge.loginToJoin")}
              </button>
            </form>
          )}
          {project && signedIn && !project.viewerIsVolunteer && decisionKey === "accepted" && (
            <form action={joinProjectAction}>
              <input type="hidden" name="projectId" value={project.id} />
              <button type="submit" className={buttonClass("primary", "md")}>
                {t("action.joinProject")}
              </button>
            </form>
          )}
          {project && project.viewerIsVolunteer && (
            <span className="inline-flex items-center rounded-full bg-success-tint px-4 py-2 text-sm font-semibold text-success">{t("bridge.joined")}</span>
          )}
          {kickoff && (
            <Link href={`/discover/${kickoff.slug}`} className={buttonClass(kickoff.viewerHasRsvp ? "secondary" : "primary", "md")}>
              {kickoff.viewerHasRsvp ? t("bridge.goingSession") : t("bridge.rsvpSession")}
            </Link>
          )}
          {project && (
            <Link href={`/projects/${project.slug}`} className={buttonClass("secondary", "md")}>
              {t("bridge.viewProject")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
