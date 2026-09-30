"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

/**
 * Opt-in only: distance/"near me" scoring never runs until the visitor
 * explicitly clicks this and grants browser geolocation permission. Nothing
 * is requested automatically, and coordinates only ever go into this page's
 * own URL (never sent anywhere else) — see docs/PRODUCT_CONTRACT.md.
 */
export function NearMeButton() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const active = searchParams.has("lat") && searchParams.has("lng");

  function useMyLocation() {
    if (!navigator.geolocation) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const params = new URLSearchParams(searchParams);
        params.set("lat", position.coords.latitude.toFixed(5));
        params.set("lng", position.coords.longitude.toFixed(5));
        setStatus("idle");
        router.push(`/discover?${params.toString()}`);
      },
      () => setStatus("error"),
      { timeout: 8000 }
    );
  }

  function clearLocation() {
    const params = new URLSearchParams(searchParams);
    params.delete("lat");
    params.delete("lng");
    const qs = params.toString();
    router.push(qs ? `/discover?${qs}` : "/discover");
  }

  if (active) {
    return (
      <button
        type="button"
        onClick={clearLocation}
        className="rounded-full border border-brand bg-brand-tint px-3 py-1.5 text-sm font-medium text-brand-strong"
      >
        📍 Sorted by distance — clear
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={useMyLocation}
        disabled={status === "loading"}
        className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-muted disabled:cursor-wait"
      >
        {status === "loading" ? "Locating…" : "📍 Near me"}
      </button>
      {status === "error" && (
        <span role="alert" className="text-xs text-danger">
          Couldn&apos;t get your location — the list still works without it.
        </span>
      )}
    </div>
  );
}
