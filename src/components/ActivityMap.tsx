"use client";

import { useEffect, useRef, useState } from "react";
import { LngLatBounds, Map as MapLibreMap, Marker, NavigationControl, Popup, setWorkerUrl } from "maplibre-gl";
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
  sports: "#8f5406",
  education: "#1d4e89",
  culture: "#8a4baf",
  community: "#2f7d4f",
  technology: "#1d4e89",
  environment: "#2f7d4f",
};

// Markers are never distinguished by color alone (WCAG — color-only
// encoding fails for colorblind users). Each category also gets a short,
// distinct text glyph rendered inside its marker, and the same glyph
// labels the legend below the map.
const CATEGORY_GLYPH: Record<DemoActivity["category"], string> = {
  sports: "SP",
  education: "ED",
  culture: "CU",
  community: "CO",
  technology: "TE",
  environment: "EN",
};

export const CATEGORY_LEGEND: { category: DemoActivity["category"]; label: string }[] = [
  { category: "technology", label: "Technology" },
  { category: "environment", label: "Environment" },
  { category: "sports", label: "Sports" },
  { category: "education", label: "Education" },
  { category: "culture", label: "Culture" },
  { category: "community", label: "Community" },
];

/**
 * Uses OpenFreeMap's public OpenStreetMap-based vector style by default (no
 * API key or account required; attribution shown on the map), but the source is configurable per the Phase
 * 3 brief — set NEXT_PUBLIC_MAP_STYLE_URL to point at a different
 * permitted style/tile source without a code change. If the style is
 * unreachable, the component falls back to an inline notice while
 * Discover's list view keeps working.
 */
const DEMO_STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "https://tiles.openfreemap.org/styles/liberty";

/** Built with DOM APIs (textContent), never HTML strings — activity titles are organizer-authored. */
function buildPopup(activity: DemoActivity): HTMLElement {
  const box = document.createElement("div");
  box.style.color = "#1c1b1a";
  const title = document.createElement("strong");
  title.textContent = activity.title;
  const meta = document.createElement("div");
  meta.style.fontSize = "12px";
  meta.textContent = `${activity.areaEn} · ${activity.date} · ${activity.startTime}`;
  const link = document.createElement("a");
  link.href = `/discover/${encodeURIComponent(activity.slug)}`;
  link.textContent = "View activity →";
  link.style.fontSize = "12px";
  link.style.fontWeight = "600";
  link.style.color = "#163c6b";
  link.style.textDecoration = "underline";
  box.append(title, meta, link);
  return box;
}

export function ActivityMap({
  activities,
  activeSlug,
  onSelect,
  heightClass = "min-h-[280px]",
  showLegend = true,
}: {
  activities: DemoActivity[];
  activeSlug?: string;
  onSelect?: (slug: string) => void;
  heightClass?: string;
  showLegend?: boolean;
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
      // Only give up when the base style itself cannot load. A single missed
      // tile, glyph or sprite must not blank an otherwise working map.
      let styleLoaded = false;
      const giveUp = () => {
        if (cancelled || styleLoaded) return;
        setFailed(true);
        map.remove();
        if (mapRef.current === map) mapRef.current = null;
      };
      map.on("load", () => {
        styleLoaded = true;
        window.clearTimeout(timer);
      });
      map.on("error", (event) => {
        const status = (event as { error?: { status?: number } }).error?.status;
        const sourceId = (event as { sourceId?: string }).sourceId;
        // Errors tied to a tile source or a late asset are non-fatal.
        if (styleLoaded || sourceId || status === 404) return;
        giveUp();
      });
      const timer = window.setTimeout(giveUp, 15_000);
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
      el.setAttribute(
        "aria-label",
        `${activity.title} — ${activity.areaEn}, ${CATEGORY_LEGEND.find((c) => c.category === activity.category)?.label ?? activity.category}`
      );
      const isActive = activity.slug === activeSlug;
      const size = isActive ? 32 : 28; // WCAG 2.2 target size: at least 24x24 CSS px
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.borderRadius = "999px";
      el.style.border = "2px solid white";
      el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.35)";
      el.style.background = CATEGORY_COLOR[activity.category];
      el.style.cursor = "pointer";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.padding = "0";
      el.style.fontSize = "10px";
      el.style.fontWeight = "700";
      el.style.color = "white";
      el.style.lineHeight = "1";
      el.textContent = CATEGORY_GLYPH[activity.category];

      const marker = new Marker({ element: el })
        .setLngLat([activity.lng, activity.lat])
        .setPopup(new Popup({ offset: 14, closeButton: false }).setDOMContent(buildPopup(activity)))
        .addTo(map);

      el.addEventListener("click", () => onSelect?.(activity.slug));
      markersRef.current.set(activity.slug, marker);
    });

    if (activities.length > 0) {
      const bounds = new LngLatBounds();
      activities.forEach((a) => bounds.extend([a.lng, a.lat]));
      map.fitBounds(bounds, { padding: 48, maxZoom: 15, duration: 0 });
    }

    // Nearby venues would otherwise overlap (unclickable, and below WCAG 2.2's
    // 24x24px target size). Push markers apart in pixel space — a purely visual
    // offset; the coordinates themselves never change. Re-run on every zoom.
    const relax = () => {
      const MIN_DISTANCE = 32;
      const items = [...markersRef.current.values()].map((marker) => {
        const p = map.project(marker.getLngLat());
        return { marker, x: p.x, y: p.y, dx: 0, dy: 0 };
      });
      for (let iteration = 0; iteration < 30; iteration++) {
        let moved = false;
        for (let i = 0; i < items.length; i++) {
          for (let j = i + 1; j < items.length; j++) {
            const a = items[i];
            const b = items[j];
            const vx = b.x + b.dx - (a.x + a.dx);
            const vy = b.y + b.dy - (a.y + a.dy);
            const d = Math.hypot(vx, vy);
            if (d >= MIN_DISTANCE) continue;
            const angle = d > 0.5 ? Math.atan2(vy, vx) : ((i - j) * 2.399963) % (2 * Math.PI);
            const push = (MIN_DISTANCE - d) / 2 + 0.5;
            a.dx -= Math.cos(angle) * push;
            a.dy -= Math.sin(angle) * push;
            b.dx += Math.cos(angle) * push;
            b.dy += Math.sin(angle) * push;
            moved = true;
          }
        }
        if (!moved) break;
      }
      items.forEach((it) => it.marker.setOffset([Math.round(it.dx), Math.round(it.dy)]));
    };
    relax();
    map.on("zoomend", relax);
    return () => {
      map.off("zoomend", relax);
    };
  }, [activities, activeSlug, onSelect, failed]);

  if (failed) {
    return (
      <div role="status" className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-muted p-4">
        <div>
          <p className="font-medium text-foreground">The map couldn&apos;t load right now</p>
          <p className="text-sm text-foreground-muted">Here are the same activities as a list, grouped by area.</p>
        </div>
        <ul className="grid max-h-[360px] gap-2 overflow-y-auto sm:grid-cols-2">
          {activities.slice(0, 12).map((a) => (
            <li key={a.slug}>
              <a
                href={`/discover/${encodeURIComponent(a.slug)}`}
                className="flex min-h-11 flex-col rounded-xl border border-border bg-surface px-3 py-2 text-sm hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <span className="font-medium text-foreground">{a.title}</span>
                <span className="text-xs text-foreground-muted">
                  {a.areaEn} · {a.date} · {a.startTime}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const categoriesShown = new Set(activities.map((a) => a.category));

  return (
    <div className="flex h-full min-h-[320px] flex-col gap-2">
      <div
        ref={containerRef}
        className={`relative ${heightClass} flex-1 overflow-hidden rounded-2xl border border-border`}
        role="application"
        aria-label="Map of Prishtina 2036 demo activities. Use the list view for a fully keyboard-accessible alternative."
      />
      {showLegend && categoriesShown.size > 0 && (
        <ul
          aria-label="Map marker legend — category and letter code (color is never the only signal)"
          className="flex flex-wrap gap-x-3 gap-y-1 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground-muted"
        >
          {CATEGORY_LEGEND.filter((c) => categoriesShown.has(c.category)).map((c) => (
            <li key={c.category} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white"
                style={{ background: CATEGORY_COLOR[c.category] }}
              >
                {CATEGORY_GLYPH[c.category]}
              </span>
              {c.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
