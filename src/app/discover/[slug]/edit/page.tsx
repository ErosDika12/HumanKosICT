import { notFound } from "next/navigation";
import { ActivityForm } from "@/components/ActivityForm";
import { getActivityBySlug } from "@/lib/data/activities";
import { getCommunityBySlug } from "@/lib/data/communities";
import { getCurrentUser } from "@/lib/auth/current-user";
import { demoLoginAction } from "@/lib/auth/actions";
import { updateActivityAction, cancelActivityAction } from "@/lib/actions/organizer-activity-actions";
import { buttonClass } from "@/components/ui";
import { getI18n } from "@/lib/i18n/server";
import { errorMessage } from "@/lib/i18n/errors";
import { localizeActivity } from "@/lib/i18n/content";

export default async function EditActivityPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;
  const { t, locale } = await getI18n();
  const activity = await getActivityBySlug(slug);
  if (!activity) notFound();

  const user = await getCurrentUser();
  // A UX-only hint — the authoritative organizer check happens server-side on submit.
  const community = user ? await getCommunityBySlug(activity.communitySlug, user.id) : null;
  const isOrganizer = community?.viewerMembership === "organizer";
  const errText = errorMessage(t, error);
  if (!user) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-10 sm:px-6">
        <form action={demoLoginAction}>
          <button type="submit" className={buttonClass("accent", "md")}>
            {t("form.loginToContinue")}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-foreground">{t("form.editEvent.title", { name: localizeActivity(activity, locale).title })}</h1>
        <form action={cancelActivityAction}>
          <input type="hidden" name="slug" value={slug} />
          <button type="submit" className="min-h-10 rounded-full border border-danger px-4 py-1.5 text-sm font-medium text-danger hover:bg-danger-tint">
            {t("form.editEvent.cancel")}
          </button>
        </form>
      </div>
      {errText && (
        <p role="alert" className="text-sm text-danger">
          {errText}
        </p>
      )}
      {!isOrganizer && <p className="text-sm text-foreground-muted">{t("form.editEvent.notOrganizer")}</p>}
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
