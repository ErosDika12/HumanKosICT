import Link from "next/link";
import type { Metadata } from "next";
import { HumanQuest } from "@/components/HumanQuest";
import { PageShell, EmptyState, buttonClass, Pill } from "@/components/ui";
import { CheckIcon } from "@/components/icons";
import { demoLoginAction } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getImpactSummary } from "@/lib/data/impact";
import { getProgress } from "@/lib/data/progress";
import { MAX_SCORE } from "@/lib/progress-rules";
import { getI18n } from "@/lib/i18n/server";
import { localizeActivity, localizeText } from "@/lib/i18n/content";
import { ACTIVITIES } from "@/lib/demo-data";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("progress.title") };
}

export default async function ImpactPage() {
  const { t, locale, shortDate } = await getI18n();
  const user = await getCurrentUser();
  if (!user) {
    return (
      <PageShell className="max-w-xl">
        <EmptyState
          title={t("progress.title")}
          action={
            <form action={demoLoginAction}>
              <button type="submit" className={buttonClass("accent", "lg")}>
                {t("action.demoLogin")}
              </button>
            </form>
          }
        >
          {t("progress.login")}
        </EmptyState>
      </PageShell>
    );
  }

  const [impact, progress] = await Promise.all([getImpactSummary(user.id), getProgress(user.id)]);
  const earned = progress.achievements.filter((a) => a.earned);
  const next = progress.achievements.filter((a) => !a.earned).slice(0, 2);
  const hasAnything = impact.attendedEvents.length > 0 || impact.joinedProjects.length > 0 || impact.communities.length > 0;
  const titleOf = (slug: string, fallback: string) => {
    const seeded = ACTIVITIES.find((a) => a.slug === slug);
    return seeded ? localizeActivity(seeded, locale).title : fallback;
  };
  const { score } = progress;

  return (
    <PageShell className="max-w-3xl">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">{t("progress.title")}</h1>
        <p className="text-sm text-foreground-muted">{t("progress.private")}</p>
      </header>

      <HumanQuest progress={progress} />

      <section aria-labelledby="ach-title" className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
        <h2 id="ach-title" className="font-display text-lg font-semibold text-foreground">
          {t("ach.title")}
        </h2>
        {earned.length === 0 ? (
          <p className="text-sm text-foreground-muted">{t("ach.none")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {earned.map((a) => (
              <li key={a.key} className="flex items-start gap-3 rounded-xl bg-success-tint p-3">
                <CheckIcon size={18} className="mt-0.5 shrink-0 text-success" />
                <span>
                  <span className="block text-sm font-semibold text-foreground">{t(`ach.${a.key}.title`)}</span>
                  <span className="block text-xs text-foreground-muted">{t(`ach.${a.key}.body`)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
        {next.length > 0 && (
          <>
            <h3 className="mt-1 text-xs font-semibold uppercase tracking-wide text-foreground-muted">{t("ach.next")}</h3>
            <ul className="flex flex-col gap-2">
              {next.map((a) => (
                <li key={a.key} className="rounded-xl border border-dashed border-border p-3">
                  <span className="block text-sm font-semibold text-foreground">{t(`ach.${a.key}.title`)}</span>
                  <span className="block text-xs text-foreground-muted">{t(`ach.${a.key}.body`)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section aria-labelledby="score-title" className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="score-title" className="font-display text-lg font-semibold text-foreground">
            {t("score.title")}
          </h2>
          <p className="font-display text-2xl font-semibold text-brand-strong">{t("score.of", { n: score.total, max: MAX_SCORE })}</p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-muted" role="progressbar" aria-label={t("score.title")} aria-valuemin={0} aria-valuemax={MAX_SCORE} aria-valuenow={score.total}>
          <div className="h-full rounded-full bg-brand" style={{ width: `${score.total}%` }} />
        </div>
        <p className="text-sm text-foreground-muted">{t("score.about")}</p>
        {(["verified", "commitment"] as const).map((kind) => (
          <div key={kind}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">{t(kind === "verified" ? "score.verified" : "score.commitments")}</h3>
            <ul className="mt-1 flex flex-col divide-y divide-border text-sm">
              {score.parts
                .filter((p) => p.kind === kind)
                .map((p) => (
                  <li key={p.key} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
                    <span className="text-foreground">{t(`score.part.${p.key}`)}</span>
                    <span className="text-foreground-muted">{t("score.row", { count: p.count, each: p.pointsEach, points: p.points, cap: p.cap })}</span>
                  </li>
                ))}
            </ul>
          </div>
        ))}
        <p className="text-xs text-foreground-muted">{t("score.never")}</p>
      </section>

      {!hasAnything && <EmptyState title={t("progress.title")}>{t("impact.nothing")}</EmptyState>}

      {impact.communities.length > 0 && (
        <Section title={t("impact.communities")}>
          <ul className="flex flex-col gap-2">
            {impact.communities.map((c) => (
              <li key={c.communitySlug} className="flex items-center justify-between text-sm">
                <Link href={`/communities/${c.communitySlug}`} className="font-medium text-brand-strong underline underline-offset-2">
                  {c.name}
                </Link>
                <Pill tone="neutral">{t(`impact.role.${c.role}`)}</Pill>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {impact.attendedEvents.length > 0 && (
        <Section title={t("impact.attended")}>
          <p className="mb-2 text-xs text-foreground-muted">{t("impact.attendedNote")}</p>
          <ul className="flex flex-col gap-2">
            {impact.attendedEvents.map((e) => (
              <li key={e.activitySlug} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <Link href={`/discover/${e.activitySlug}`} className="font-medium text-brand-strong underline underline-offset-2">
                  {titleOf(e.activitySlug, e.title)}
                </Link>
                <span className="text-xs text-foreground-muted">
                  {shortDate(e.date)} · {t("impact.confirmedBy", { name: e.confirmedByName })}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {impact.joinedProjects.length > 0 && (
        <Section title={t("impact.projects")}>
          <ul className="flex flex-col gap-2">
            {impact.joinedProjects.map((p) => (
              <li key={p.projectSlug} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <Link href={`/projects/${p.projectSlug}`} className="font-medium text-brand-strong underline underline-offset-2">
                  {localizeText(p.title, locale)}
                </Link>
                <span className="text-xs text-foreground-muted">
                  {p.communityName} · {t("community.volunteers", { n: p.volunteerCount, total: p.volunteersNeeded })}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </PageShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}
