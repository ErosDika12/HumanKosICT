import Link from "next/link";
import { notFound } from "next/navigation";
import { getCommunityBySlug } from "@/lib/data/communities";
import { getCurrentUser } from "@/lib/auth/current-user";
import { updateCommunityAction } from "@/lib/actions/community-actions";

export default async function EditCommunityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const community = await getCommunityBySlug(slug, user?.id);
  if (!community) notFound();

  if (!user || community.viewerMembership !== "organizer") {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-10 sm:px-6">
        <p className="text-sm text-foreground-muted">
          Only this community&apos;s organizer can edit it.{" "}
          <Link href={`/communities/${slug}`} className="underline underline-offset-2">
            Back to community
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-foreground">Edit {community.name}</h1>

      <form action={updateCommunityAction} className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
        <input type="hidden" name="slug" value={slug} />
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Description (English)</span>
          <textarea name="description" defaultValue={community.description} rows={3} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Description (Albanian)</span>
          <textarea name="descriptionSq" defaultValue={community.descriptionSq} rows={3} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Language(s)</span>
          <input type="text" name="language" defaultValue={community.language ?? ""} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Rules</span>
          <textarea name="rules" defaultValue={community.rules ?? ""} rows={2} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="visibility" value="restricted" defaultChecked={community.visibility === "restricted"} />
          <span>Restricted — new members need my approval before joining</span>
        </label>
        <button type="submit" className="inline-flex w-fit items-center justify-center rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong">
          Save changes
        </button>
      </form>
    </div>
  );
}
