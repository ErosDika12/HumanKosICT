import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoBadge } from "@/components/DemoBadge";
import { ActivityForm } from "@/components/ActivityForm";
import { getActivityBySlug } from "@/lib/data/activities";
import { getCommunityBySlug } from "@/lib/data/communities";
import { getCurrentUser } from "@/lib/auth/current-user";
import { updateActivityAction, cancelActivityAction } from "@/lib/actions/organizer-activity-actions";

export default async function EditActivityPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;
  const activity = await getActivityBySlug(slug);
  if (!activity) notFound();

  const user = await getCurrentUser();
  // A UX-only shortcut for the warning banner below — the authoritative
  // check happens server-side in assertCommunityOrganizer on submit
  // regardless of what this page shows.
  const community = user ? await getCommunityBySlug(activity.communitySlug, user.id) : null;
  const isOrganizer = community?.viewerMembership === "organizer";
  if (!user) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-10 sm:px-6">
        <DemoBadge className="self-start" />
        <p className="text-sm text-foreground-muted">
          <Link href={`/login?next=${encodeURIComponent(`/discover/${slug}/edit`)}`} className="underline underline-offset-2">
            Sign in
          </Link>{" "}
          as this activity&apos;s organizer to edit it.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <DemoBadge className="self-start" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-foreground">Edit {activity.title}</h1>
        <form action={cancelActivityAction}>
          <input type="hidden" name="slug" value={slug} />
          <button type="submit" className="rounded-lg border border-danger px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger-tint">
            Cancel this event
          </button>
        </form>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {!isOrganizer && (
        <p className="text-sm text-foreground-muted">
          If you&apos;re not this event&apos;s organizer, saving will be refused server-side.
        </p>
      )}
      <ActivityForm
        action={updateActivityAction}
        activitySlug={slug}
        defaults={{
          title: activity.title,
          titleSq: activity.titleSq,
          summary: activity.summary,
          summarySq: activity.summarySq,
          category: activity.category,
          areaSq: activity.areaSq,
          areaEn: activity.areaEn,
          venueName: activity.venueName,
          lat: activity.lat,
          lng: activity.lng,
          date: activity.date,
          startTime: activity.startTime,
          capacity: activity.capacity,
          cost: activity.cost,
          costDetail: activity.costDetail,
          indoor: activity.indoor,
          accessibility: activity.accessibility,
          ageEligibility: activity.ageEligibility,
          difficulty: activity.difficulty,
          description: activity.description,
          descriptionSq: activity.descriptionSq,
          interestTags: activity.interestTags,
        }}
      />
    </div>
  );
}
