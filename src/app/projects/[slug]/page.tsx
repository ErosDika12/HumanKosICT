import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/lib/data/projects";
import { getCurrentUser } from "@/lib/auth/current-user";
import { joinProjectAction, withdrawProjectAction } from "@/lib/actions/project-actions";

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { slug } = await params;
  const { created } = await searchParams;
  const user = await getCurrentUser();
  const project = await getProjectBySlug(slug, user?.id);
  if (!project) notFound();

  const spotsLeft = Math.max(0, project.volunteersNeeded - project.volunteerCount);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <Link href={`/communities/${project.communitySlug}`} className="text-sm text-brand underline underline-offset-2">
        ← Back to {project.communityName}
      </Link>

      <div className="flex flex-col gap-2">
        {created && <p className="text-sm text-success">Project created.</p>}
        <h1 className="font-display text-3xl font-semibold text-foreground">{project.title}</h1>
        <p className="text-sm text-foreground-muted">{project.titleSq}</p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="text-sm text-foreground-muted">{project.description}</p>
        <p className="mt-2 text-sm text-foreground-muted" lang="sq">
          {project.descriptionSq}
        </p>
        <p className="mt-4 text-sm font-medium text-foreground">
          {project.volunteerCount} of {project.volunteersNeeded} volunteer spots filled
          {project.status === "completed" && " — project completed"}
        </p>
        <p className="mt-1 text-xs text-foreground-muted">
          This count reflects real sign-ups only — no fabricated hours or impact figures are tracked.
        </p>
      </div>

      <div>
        {!user ? (
          <Link
            href={`/login?next=${encodeURIComponent(`/projects/${slug}`)}`}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong"
          >
            Sign in to volunteer
          </Link>
        ) : project.isViewerVolunteering ? (
          <form action={withdrawProjectAction}>
            <input type="hidden" name="projectId" value={project.id} />
            <button type="submit" className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground-muted hover:bg-surface-muted">
              Withdraw
            </button>
          </form>
        ) : (
          <form action={joinProjectAction}>
            <input type="hidden" name="projectId" value={project.id} />
            <button
              type="submit"
              disabled={project.status === "completed"}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-foreground-muted"
            >
              {spotsLeft > 0 ? "Volunteer" : "Volunteer (project is at its target, more welcome)"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
