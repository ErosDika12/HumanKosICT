import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/lib/data/projects";
import { getCurrentUser } from "@/lib/auth/current-user";
import { demoLoginAction } from "@/lib/auth/actions";
import { joinProjectAction, withdrawProjectAction } from "@/lib/actions/project-actions";
import { Notice, Pill, buttonClass } from "@/components/ui";
import { addProjectUpdateAction, completeProjectAction, planProjectAction, startProjectAction } from "@/lib/actions/project-workflow-actions";
import { errorMessage } from "@/lib/i18n/errors";
import { isHttpUrl } from "@/lib/city-config";
import { getI18n } from "@/lib/i18n/server";
import { localizeText } from "@/lib/i18n/content";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = await getI18n();
  const project = await getProjectBySlug(slug);
  return { title: project ? (locale === "sq" ? project.titleSq : project.title) : undefined };
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  const { slug } = await params;
  const { created, error } = await searchParams;
  const { t, locale, shortDate } = await getI18n();
  const user = await getCurrentUser();
  const project = await getProjectBySlug(slug, user?.id);
  if (!project) notFound();

  const spotsLeft = Math.max(0, project.volunteersNeeded - project.volunteerCount);
  const title = locale === "sq" ? project.titleSq : localizeText(project.title, locale);
  const description = locale === "sq" ? project.descriptionSq : project.description;
  const err = errorMessage(t, error);
  const box = "rounded-lg border border-border bg-background px-3 py-2 text-base text-foreground";
  const day = (d: Date) => shortDate(d.toISOString().slice(0, 10));
  const done = project.stage === "completed_confirmed" || project.stage === "completed_unconfirmed";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <Link href={`/communities/${project.communitySlug}`} className="inline-block py-2 text-sm font-medium text-brand-strong underline underline-offset-2">
        ← {t("project.back", { name: project.communityName })}
      </Link>

      <div className="flex flex-col gap-2">
        {created && <p className="text-sm text-success">{t("project.created")}</p>}
        <h1 className="font-display text-3xl font-semibold text-foreground">{title}</h1>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="text-sm leading-relaxed text-foreground-muted">{description}</p>
        <p className="mt-4 text-sm font-medium text-foreground">
          {t("project.filled", { n: project.volunteerCount, total: project.volunteersNeeded })}
        </p>
        <p className="mt-1 text-xs text-foreground-muted">{t("project.realOnly")}</p>
      </div>

      {err && <Notice kind="error">{err}</Notice>}

      <section aria-labelledby="workflow-title" className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="workflow-title" className="sr-only">
            {t("project.updates")}
          </h2>
          <Pill tone={project.stage === "completed_confirmed" ? "brand" : "neutral"}>{t(`project.stage.${project.stage}`)}</Pill>
        </div>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-foreground-muted">{t("project.responsible")}</dt>
            <dd className="font-medium text-foreground">{project.responsibleOrganizerName ?? t("project.noResponsible")}</dd>
          </div>
          {project.scheduledFor && (
            <div>
              <dt className="text-foreground-muted">{t("project.when")}</dt>
              <dd className="font-medium text-foreground">{day(project.scheduledFor)}</dd>
            </div>
          )}
          {project.skillsNeeded && (
            <div>
              <dt className="text-foreground-muted">{t("project.skills")}</dt>
              <dd className="font-medium text-foreground">{project.skillsNeeded}</dd>
            </div>
          )}
          {project.materialsNeeded && (
            <div>
              <dt className="text-foreground-muted">{t("project.materials")}</dt>
              <dd className="font-medium text-foreground">{project.materialsNeeded}</dd>
            </div>
          )}
        </dl>

        {done && (
          <div className="flex flex-col gap-1 border-t border-border pt-3 text-sm">
            {project.completedAt && <p className="text-foreground-muted">{t("project.completedOn", { date: day(project.completedAt) })}</p>}
            {project.completionNote && (
              <p>
                <span className="text-foreground-muted">{t("project.completionNote")}: </span>
                <span className="text-foreground">{project.completionNote}</span>
              </p>
            )}
            {project.completionEvidence && (
              <p>
                <span className="text-foreground-muted">{t("project.evidence")}: </span>
                {isHttpUrl(project.completionEvidence) ? (
                  <a href={project.completionEvidence} rel="noopener noreferrer" target="_blank" className="break-all text-brand-strong underline underline-offset-2">
                    {project.completionEvidence}
                  </a>
                ) : (
                  <span className="text-foreground">{project.completionEvidence}</span>
                )}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <h3 className="font-display text-lg font-semibold text-foreground">{t("project.updates")}</h3>
          {project.updates.length === 0 ? (
            <p className="text-sm text-foreground-muted">{t("project.noUpdates")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {project.updates.map((u) => (
                <li key={u.id} className="text-sm">
                  <span className="text-foreground-muted">{day(u.createdAt)} · </span>
                  <span className="text-foreground">{u.body}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {project.canManage && !done && (
        <section aria-labelledby="manage-title" className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-5">
          <h2 id="manage-title" className="font-display text-xl font-semibold text-foreground">
            {t("project.manage")}
          </h2>

          <form action={planProjectAction} className="flex flex-col gap-3">
            <input type="hidden" name="projectId" value={project.id} />
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground">{t("project.plan.date")}</span>
              <input type="date" name="scheduledFor" defaultValue={project.scheduledFor ? project.scheduledFor.toISOString().slice(0, 10) : ""} className={box} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground">{t("project.skills")}</span>
              <input name="skillsNeeded" maxLength={500} defaultValue={project.skillsNeeded ?? ""} className={box} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground">{t("project.materials")}</span>
              <input name="materialsNeeded" maxLength={500} defaultValue={project.materialsNeeded ?? ""} className={box} />
            </label>
            <button type="submit" className={buttonClass("secondary", "sm", "w-fit")}>
              {t("project.plan.save")}
            </button>
          </form>

          {project.stage === "proposed" && (
            <form action={startProjectAction} className="flex flex-col gap-2">
              <input type="hidden" name="projectId" value={project.id} />
              <p className="text-sm text-foreground-muted">{t("project.start.help")}</p>
              <button type="submit" className={buttonClass("primary", "md", "w-fit")}>
                {t("project.start")}
              </button>
            </form>
          )}

          {project.stage === "in_progress" && (
            <>
              <form action={addProjectUpdateAction} className="flex flex-col gap-2">
                <input type="hidden" name="projectId" value={project.id} />
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-foreground">{t("project.update.label")}</span>
                  <textarea name="body" required rows={2} maxLength={500} className={box} />
                </label>
                <button type="submit" className={buttonClass("secondary", "sm", "w-fit")}>
                  {t("project.update.add")}
                </button>
              </form>

              <form action={completeProjectAction} className="flex flex-col gap-2 border-t border-border pt-4">
                <input type="hidden" name="projectId" value={project.id} />
                <h3 className="font-display text-lg font-semibold text-foreground">{t("project.complete")}</h3>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-foreground">{t("project.complete.note")}</span>
                  <textarea name="note" required rows={2} maxLength={500} className={box} />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-foreground">{t("project.complete.evidence")}</span>
                  <input name="evidence" required maxLength={500} className={box} aria-describedby="evidence-help" />
                  <span id="evidence-help" className="text-foreground-muted">
                    {t("project.complete.evidenceHelp")}
                  </span>
                </label>
                <button type="submit" className={buttonClass("primary", "md", "w-fit")}>
                  {t("project.complete.submit")}
                </button>
              </form>
            </>
          )}
        </section>
      )}

      <div>
        {!user ? (
          <form action={demoLoginAction}>
            <button type="submit" className={buttonClass("accent", "md")}>
              {t("project.login")}
            </button>
          </form>
        ) : project.isViewerVolunteering ? (
          <form action={withdrawProjectAction}>
            <input type="hidden" name="projectId" value={project.id} />
            <button type="submit" className="min-h-10 rounded-full border border-border px-5 py-2 text-sm font-medium text-foreground hover:bg-surface-muted">
              {t("project.withdraw")}
            </button>
          </form>
        ) : (
          <form action={joinProjectAction}>
            <input type="hidden" name="projectId" value={project.id} />
            <button
              type="submit"
              disabled={project.status === "completed"}
              className="min-h-10 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-strong disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-foreground-muted"
            >
              {spotsLeft > 0 ? t("project.volunteer") : t("project.volunteerMore")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
