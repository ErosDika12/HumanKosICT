import Link from "next/link";
import type { DemoActivity } from "@/lib/types";
import { photoForActivity } from "@/lib/photos";
import { Photo } from "@/components/Photo";
import { Pill } from "@/components/ui";

export const CATEGORY_LABEL: Record<DemoActivity["category"], string> = {
  sports: "Sports",
  education: "Education",
  culture: "Culture",
  community: "Community",
  technology: "Technology",
  environment: "Environment",
};

export function formatActivityDate(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

export function ActivityCard({
  activity,
  compact = false,
  headingLevel = 3,
}: {
  activity: DemoActivity;
  compact?: boolean;
  headingLevel?: 2 | 3;
}) {
  const spotsLeft = activity.capacity - activity.rsvpCount;
  const isFull = spotsLeft <= 0;
  const photo = photoForActivity(activity.slug, activity.category);
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-shadow hover:shadow-md focus-within:shadow-md">
      {!compact && <Photo photo={photo} small illustrative className="relative aspect-[16/9] w-full bg-surface-muted" />}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="brand">{CATEGORY_LABEL[activity.category]}</Pill>
          <Pill tone={isFull ? "danger" : spotsLeft <= 3 ? "accent" : "success"}>
            {isFull ? "Full" : `${spotsLeft} spots left`}
          </Pill>
          {activity.cost === "paid" && <Pill tone="neutral">{activity.costDetail ?? "Paid"}</Pill>}
        </div>
        <Heading className="font-display text-lg font-semibold leading-snug text-foreground">
          <Link
            href={`/discover/${activity.slug}`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-offset-4"
          >
            {activity.title}
          </Link>
        </Heading>
        <p className="line-clamp-2 text-sm text-foreground-muted">{activity.summary}</p>
        <dl className="mt-auto grid grid-cols-2 gap-x-3 gap-y-1 pt-1 text-xs text-foreground-muted">
          <div>
            <dt className="sr-only">Date</dt>
            <dd>
              📅 {formatActivityDate(activity.date)} · {activity.startTime}
            </dd>
          </div>
          <div>
            <dt className="sr-only">Location</dt>
            <dd>📍 {activity.areaEn.replace("Prishtina — ", "")}</dd>
          </div>
          <div>
            <dt className="sr-only">Setting</dt>
            <dd>{activity.indoor ? "🏠 Indoor" : "🌤 Outdoor"}</dd>
          </div>
          <div>
            <dt className="sr-only">Cost</dt>
            <dd>{activity.cost === "free" ? "💚 Free" : "💶 Paid"}</dd>
          </div>
          {activity.distanceKm !== undefined && (
            <div className="col-span-2">
              <dt className="sr-only">Distance</dt>
              <dd>📍 {activity.distanceKm.toFixed(1)} km away</dd>
            </div>
          )}
        </dl>
        {activity.matchReasons && activity.matchReasons.length > 0 && (
          <p className="text-xs font-medium text-brand-strong">
            <span className="sr-only">Why this is recommended: </span>✨ {activity.matchReasons.join(" · ")}
          </p>
        )}
        <span className="mt-1 text-sm font-semibold text-brand-strong group-hover:underline">View activity →</span>
      </div>
    </article>
  );
}
