import Link from "next/link";
import { notFound } from "next/navigation";
import { getCommunityBySlug } from "@/lib/data/communities";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createActivityAction } from "@/lib/actions/organizer-activity-actions";
import { ActivityForm } from "@/components/ActivityForm";
import type { ActivityCategory } from "@/lib/types";

export default async function NewActivityPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; title?: string; titleSq?: string; category?: string }>;
}) {
  const { slug } = await params;
  const { error, title, titleSq, category } = await searchParams;
  const user = await getCurrentUser();
  const community = await getCommunityBySlug(slug, user?.id);
  if (!community) notFound();

  if (!user) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-10 sm:px-6">
        <p className="text-sm text-foreground-muted">
          <Link href={`/login?next=${encodeURIComponent(`/communities/${slug}/activities/new`)}`} className="underline underline-offset-2">
            Sign in
          </Link>{" "}
          to propose an event for {community.name}.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          New event for {community.name}
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          New events start hidden (pending moderator review) — they won&apos;t appear in Discover
          until published.
        </p>
      </div>
      {(title || category) && (
        <p className="rounded-lg border border-brand bg-brand-tint p-3 text-xs text-brand-strong">
          Prefilled from the assistant (/assistant) — review and edit everything before creating.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <ActivityForm
        action={createActivityAction}
        communitySlug={slug}
        defaults={
          title || titleSq || category
            ? { title, titleSq, category: category as ActivityCategory | undefined }
            : undefined
        }
      />
    </div>
  );
}
