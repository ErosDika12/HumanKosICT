"use client";

import Link from "next/link";
import type { DemoActivity } from "@/lib/types";
import { photoForActivity } from "@/lib/photos";
import { Photo } from "@/components/Photo";
import { useI18n } from "@/components/LocaleProvider";
import { localizeActivity } from "@/lib/i18n/content";
import { relativeDayLabel } from "@/lib/time-window";
import { ArrowIcon, CalendarIcon, PinIcon } from "@/components/icons";

/** Labels for the relative-day buckets that need translating; a plain date is formatted by Intl. */
const RELATIVE_KEY: Record<string, string> = {
  "Already happened": "fact.past",
  Today: "fact.today",
  Tomorrow: "fact.tomorrow",
  "This weekend": "fact.thisWeekend",
  "Next weekend": "fact.nextWeekend",
};

export function useDayLabel() {
  const { t, shortDate } = useI18n();
  return (isoDate: string) => {
    const rel = relativeDayLabel(isoDate);
    return RELATIVE_KEY[rel] ? t(RELATIVE_KEY[rel]) : shortDate(isoDate);
  };
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
  const { t, locale, shortDate } = useI18n();
  const dayLabel = useDayLabel();
  const text = localizeActivity(activity, locale);
  const spotsLeft = activity.capacity - activity.rsvpCount;
  const isFull = spotsLeft <= 0;
  const rel = relativeDayLabel(activity.date);
  const isPast = rel === "Already happened";
  const photo = photoForActivity(activity.slug, activity.category);
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const area = t(`area.${activity.areaEn}`);

  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-shadow hover:shadow-md focus-within:shadow-md">
      {!compact && <Photo photo={photo} small illustrative className="relative aspect-[16/10] w-full bg-surface-muted" />}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-brand-strong">
          <CalendarIcon size={16} />
          <span>{dayLabel(activity.date)}</span>
          <span className="font-normal text-foreground-muted">
            {rel === "Today" || rel === "Tomorrow" || rel === "This weekend" || rel === "Next weekend" || isPast
              ? `${shortDate(activity.date)} · ${activity.startTime}`
              : activity.startTime}
          </span>
        </p>
        <Heading className="font-display text-lg font-semibold leading-snug text-foreground">
          <Link href={`/discover/${activity.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-offset-4">
            {text.title}
          </Link>
        </Heading>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground-muted">
          <span className="inline-flex items-center gap-1">
            <PinIcon size={15} />
            {area}
          </span>
          <span className={activity.cost === "free" ? "font-medium text-success" : ""}>
            {activity.cost === "free" ? t("fact.free") : (text.costDetail ?? t("fact.paid"))}
          </span>
          {activity.distanceKm !== undefined && <span>{t("fact.kmAway", { km: activity.distanceKm.toFixed(1) })}</span>}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-strong group-hover:underline">
            {t("action.viewActivity")}
            <ArrowIcon size={16} />
          </span>
          {!isPast && (
            <span className={`text-xs ${isFull ? "font-semibold text-danger" : spotsLeft <= 3 ? "font-semibold text-accent-strong" : "text-foreground-muted"}`}>
              {isFull ? t("fact.full") : t("fact.spotsLeft", { n: spotsLeft })}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
