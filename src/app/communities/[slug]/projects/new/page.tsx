import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoBadge } from "@/components/DemoBadge";
import { getCommunityBySlug } from "@/lib/data/communities";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createProjectAction } from "@/lib/actions/project-actions";

export default async function NewProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;
  const user = await getCurrentUser();
  const community = await getCommunityBySlug(slug, user?.id);
  if (!community) notFound();

  if (!user || community.viewerMembership !== "organizer") {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-10 sm:px-6">
        <DemoBadge className="self-start" />
        <p className="text-sm text-foreground-muted">
          Only {community.name}&apos;s organizer can start a project.{" "}
          <Link href={`/communities/${slug}`} className="underline underline-offset-2">
            Back to community
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <DemoBadge className="self-start" />
      <h1 className="font-display text-2xl font-semibold text-foreground">
        New project for {community.name}
      </h1>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <form action={createProjectAction} className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
        <input type="hidden" name="communitySlug" value={slug} />
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Title (English)</span>
          <input type="text" name="title" required className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Title (Albanian)</span>
          <input type="text" name="titleSq" required className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Description (English)</span>
          <textarea name="description" required rows={3} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Description (Albanian)</span>
          <textarea name="descriptionSq" required rows={3} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Volunteers needed</span>
          <input type="number" name="volunteersNeeded" min={1} defaultValue={5} required className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
        </label>
        <button type="submit" className="inline-flex w-fit items-center justify-center rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong">
          Create project
        </button>
      </form>
    </div>
  );
}
