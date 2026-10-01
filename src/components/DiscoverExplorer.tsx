"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ActivityCard } from "@/components/ActivityCard";
import { useI18n } from "@/components/LocaleProvider";
import { ListIcon, MapIcon } from "@/components/icons";
import type { DemoActivity } from "@/lib/types";

const ActivityMap = dynamic(() => import("@/components/ActivityMap").then((m) => m.ActivityMap), {
  ssr: false,
  loading: () => <MapLoading />,
});

function MapLoading() {
  const { t } = useI18n();
  return (
    <div className="flex h-full min-h-[320px] items-center justify-center rounded-xl border border-border bg-surface-muted text-sm text-foreground-muted">
      {t("map.loading")}
    </div>
  );
}

export function DiscoverExplorer({
  activities,
  initialView = "list",
  resultsLabel,
  emptyAction,
}: {
  activities: DemoActivity[];
  initialView?: "list" | "map";
  /** Already-translated "N activities" text, rendered next to the view switch. */
  resultsLabel: string;
  /** Optional translated "clear filters" control shown in the empty state. */
  emptyAction?: React.ReactNode;
}) {
  const { t } = useI18n();
  const [view, setView] = useState<"list" | "map">(initialView);
  const [activeSlug, setActiveSlug] = useState<string | undefined>(undefined);

  const tab = (id: "list" | "map", label: string, Icon: typeof ListIcon) => (
    <button
      type="button"
      role="tab"
      id={`view-tab-${id}`}
      aria-selected={view === id}
      aria-controls="discover-results"
      onClick={() => setView(id)}
      className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors ${
        view === id ? "bg-brand text-white" : "text-foreground-muted hover:bg-surface-muted"
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground" aria-live="polite">
          {resultsLabel}
        </p>
        <div role="tablist" aria-label={t("discover.view.label")} className="inline-flex gap-1 rounded-full border border-border bg-surface p-1">
          {tab("list", t("discover.view.list"), ListIcon)}
          {tab("map", t("discover.view.map"), MapIcon)}
        </div>
      </div>

      <div id="discover-results" role="tabpanel" aria-labelledby={`view-tab-${view}`}>
        {activities.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface-muted p-8 text-center">
            <p className="font-display text-lg font-semibold text-foreground">{t("discover.empty.title")}</p>
            <p className="mt-1 text-sm text-foreground-muted">{t("discover.empty.body")}</p>
            {emptyAction && <div className="mt-4 flex justify-center">{emptyAction}</div>}
          </div>
        ) : view === "list" ? (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {activities.map((activity) => (
              <li key={activity.id} className="flex">
                <div className="flex w-full">
                  <ActivityCard activity={activity} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
            <ActivityMap activities={activities} activeSlug={activeSlug} onSelect={setActiveSlug} />
            <ul className="flex max-h-[520px] flex-col gap-3 overflow-y-auto pr-1">
              {activities.map((activity) => (
                <li
                  key={activity.id}
                  onMouseEnter={() => setActiveSlug(activity.slug)}
                  onFocus={() => setActiveSlug(activity.slug)}
                  className={activity.slug === activeSlug ? "rounded-2xl ring-2 ring-brand" : ""}
                >
                  <ActivityCard activity={activity} compact />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
