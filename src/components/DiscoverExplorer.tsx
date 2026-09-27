"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ActivityCard } from "@/components/ActivityCard";
import type { DemoActivity } from "@/lib/types";

const ActivityMap = dynamic(
  () => import("@/components/ActivityMap").then((m) => m.ActivityMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[320px] items-center justify-center rounded-xl border border-border bg-surface-muted text-sm text-foreground-muted">
        Loading map…
      </div>
    ),
  }
);

export function DiscoverExplorer({ activities }: { activities: DemoActivity[] }) {
  const [view, setView] = useState<"list" | "map">("list");
  const [activeSlug, setActiveSlug] = useState<string | undefined>(undefined);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div
        role="tablist"
        aria-label="Discover view"
        className="inline-flex w-fit gap-1 rounded-lg border border-border bg-surface p-1"
      >
        <button
          role="tab"
          aria-selected={view === "list"}
          onClick={() => setView("list")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            view === "list" ? "bg-brand text-white" : "text-foreground-muted hover:bg-surface-muted"
          }`}
        >
          List
        </button>
        <button
          role="tab"
          aria-selected={view === "map"}
          onClick={() => setView("map")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            view === "map" ? "bg-brand text-white" : "text-foreground-muted hover:bg-surface-muted"
          }`}
        >
          Map
        </button>
      </div>

      {activities.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface-muted p-8 text-center">
          <p className="font-medium text-foreground">No seeded activities match these filters</p>
          <p className="mt-1 text-sm text-foreground-muted">
            Try clearing a filter — this demo currently seeds a small, fixed set of Prishtina
            activities rather than an unlimited catalog.
          </p>
        </div>
      ) : view === "list" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      ) : (
        <div className="grid flex-1 gap-4 lg:grid-cols-[1.1fr_1fr]">
          <ActivityMap activities={activities} activeSlug={activeSlug} onSelect={setActiveSlug} />
          <div className="flex max-h-[520px] flex-col gap-3 overflow-y-auto pr-1">
            {activities.map((activity) => (
              <div
                key={activity.id}
                onMouseEnter={() => setActiveSlug(activity.slug)}
                className={activity.slug === activeSlug ? "ring-2 ring-brand rounded-xl" : ""}
              >
                <ActivityCard activity={activity} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
