"use client";

import { useEffect, useRef, useState } from "react";
import { Map as MapLibreMap, Marker, NavigationControl, Popup, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { DemoActivity } from "@/lib/types";

/**
 * MapLibre's published ESM build resolves its worker script relative to its
 * own `import.meta.url` at runtime. Bundlers (webpack/Turbopack) rewrite that
 * URL to a chunk path with no sibling worker file, so the default lookup
 * 404s and the map silently loses tile parsing. We ship the worker script
 * verbatim as a static asset and point MapLibre at it explicitly instead.
 * The file is copied from node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs
 * to public/maplibre-gl-worker.mjs — see docs/ARCHITECTURE.md.
 */
if (typeof window !== "undefined") {
  setWorkerUrl("/maplibre-gl-worker.mjs");
}

const PRISHTINA_CENTER: [number, number] = [21.1655, 42.6629];

const CATEGORY_COLOR: Record<DemoActivity["category"], string> = {
  sports: "#e08a2c",
  education: "#1d4e89",
  culture: "#8a4baf",
  community: "#2f7d4f",
  technology: "#1d4e89",
  environment: "#2f7d4f",
};

/**
 * Uses MapLibre's public demo vector style (no API key or tile provider
 * account required). If this style ever becomes unreachable, the component
 * falls back to an inline notice while Discover's list view keeps working.
 */
const DEMO_STYLE_URL = "https://demotiles.maplibre.org/style.json";

export function ActivityMap({
  activities,
  activeSlug,
  onSelect,
}: {
  activities: DemoActivity[];
  activeSlug?: string;
  onSelect?: (slug: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;
    try {
      const map = new MapLibreMap({
        container: containerRef.current,
        style: DEMO_STYLE_URL,
        center: PRISHTINA_CENTER,
        zoom: 12.2,
        attributionControl: { compact: true },
      });
      map.addControl(new NavigationControl({ showCompass: false }), "top-right");
      map.on("error", () => {
        if (cancelled) return;
        setFailed(true);
        map.remove();
        if (mapRef.current === map) mapRef.current = null;
      });
      mapRef.current = map;
    } catch {
      // Synchronous construction failure of an external library (not
      // reactive state), so a direct setState here is the correct sync point.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFailed(true);
    }

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || failed) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    activities.forEach((activity) => {
      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", `${activity.title} — ${activity.areaEn}`);
      const isActive = activity.slug === activeSlug;
      el.style.width = isActive ? "20px" : "16px";
      el.style.height = isActive ? "20px" : "16px";
      el.style.borderRadius = "999px";
      el.style.border = "2px solid white";
      el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.35)";
      el.style.background = CATEGORY_COLOR[activity.category];
      el.style.cursor = "pointer";

      const marker = new Marker({ element: el })
        .setLngLat([activity.lng, activity.lat])
        .setPopup(
          new Popup({ offset: 14, closeButton: false }).setHTML(
            `<strong>${activity.title}</strong><br/><span style="font-size:12px">${activity.areaEn} · ${activity.date}</span>`
          )
        )
        .addTo(map);

      el.addEventListener("click", () => onSelect?.(activity.slug));
      markersRef.current.set(activity.slug, marker);
    });
  }, [activities, activeSlug, onSelect, failed]);

  if (failed) {
    return (
      <div
        role="status"
        className="flex h-full min-h-[320px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface-muted p-6 text-center"
      >
        <p className="font-medium text-foreground">Map tiles unavailable right now</p>
        <p className="max-w-sm text-sm text-foreground-muted">
          The map view couldn&apos;t reach its tile source. The list view below shows the exact
          same seeded activities, fully filterable, with no functionality lost.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full min-h-[320px] w-full overflow-hidden rounded-xl border border-border"
      role="application"
      aria-label="Map of Prishtina 2036 demo activities. Use the list view for a fully keyboard-accessible alternative."
    />
  );
}
