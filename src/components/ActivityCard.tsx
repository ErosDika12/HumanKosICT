import Link from "next/link";
import type { DemoActivity } from "@/lib/types";

const CATEGORY_LABEL: Record<DemoActivity["category"], string> = {
  sports: "Sports",
  education: "Education",
  culture: "Culture",
  community: "Community",
  technology: "Technology",
  environment: "Environment",
};

export function ActivityCard({ activity }: { activity: DemoActivity }) {
  const spotsLeft = activity.capacity - activity.rsvpCount;
  const isFull = spotsLeft <= 0;

  return (
    <Link
      href={`/discover/${activity.slug}`}
      className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4 shadow-sm transition-colors hover:bg-surface-muted focus-visible:bg-surface-muted"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-full bg-brand-tint px-2.5 py-1 text-xs font-medium text-brand-strong">
          {CATEGORY_LABEL[activity.category]}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            isFull ? "bg-danger-tint text-danger" : "bg-success-tint text-success"
          }`}
        >
          {isFull ? "Full" : `${spotsLeft} spots left`}
        </span>
      </div>
      <h3 className="font-display text-lg font-semibold text-foreground">{activity.title}</h3>
      <p className="text-xs text-foreground-muted">{activity.titleSq}</p>
      <p className="text-sm text-foreground-muted">{activity.summary}</p>
      <dl className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-foreground-muted">
        <div>
          <dt className="sr-only">Date</dt>
          <dd>
            📅 {activity.date} · {activity.startTime}
          </dd>
        </div>
        <div>
          <dt className="sr-only">Location</dt>
          <dd>📍 {activity.areaEn}</dd>
        </div>
        <div>
          <dt className="sr-only">Cost</dt>
          <dd>{activity.cost === "free" ? "💚 Free" : `💶 ${activity.costDetail ?? "Paid"}`}</dd>
        </div>
        <div>
          <dt className="sr-only">Setting</dt>
          <dd>{activity.indoor ? "🏠 Indoor" : "🌤 Outdoor"}</dd>
        </div>
      </dl>
    </Link>
  );
}
