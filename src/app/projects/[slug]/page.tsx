import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/lib/data/projects";
import { getCurrentUser } from "@/lib/auth/current-user";
import { demoLoginAction } from "@/lib/auth/actions";
import { joinProjectAction, withdrawProjectAction } from "@/lib/actions/project-actions";
import { buttonClass } from "@/components/ui";
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
  searchParams: Promise<{ created?: string }>;
}) {
  const { slug } = await params;
  const { created } = await searchParams;
  const { t, locale } = await getI18n();
  const user = await getCurrentUser();
  const project = await getProjectBySlug(slug, user?.id);
  if (!project) notFound();

  const spotsLeft = Math.max(0, project.volunteersNeeded - project.volunteerCount);
  const title = locale === "sq" ? project.titleSq : localizeText(project.title, locale);
  const description = locale === "sq" ? project.descriptionSq : project.description;

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
          {project.status === "completed" && t("project.completed")}
        </p>
        <p className="mt-1 text-xs text-foreground-muted">{t("project.realOnly")}</p>
      </div>

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
