"use client";

import dynamic from "next/dynamic";
import type { DemoActivity } from "@/lib/types";

const ActivityMap = dynamic(() => import("@/components/ActivityMap").then((m) => m.ActivityMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl border border-border bg-surface-muted text-sm text-foreground-muted">
      Loading map…
    </div>
  ),
});

/** A compact, real map of the seeded activities for the homepage. */
export function MapPreview({ activities }: { activities: DemoActivity[] }) {
  return (
    <div className="h-[340px] sm:h-[400px]">
      <ActivityMap activities={activities} heightClass="min-h-[300px]" showLegend={false} />
    </div>
  );
}
