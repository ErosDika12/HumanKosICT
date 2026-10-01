"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/components/LocaleProvider";
import { PinIcon } from "@/components/icons";

/**
 * Opt-in only: distance/"nearby" scoring never runs until the visitor
 * explicitly clicks this and grants browser geolocation permission. Nothing
 * is requested automatically, and coordinates only ever go into this page's
 * own URL (never sent anywhere else) — see docs/PRODUCT_CONTRACT.md.
 */
export function NearMeButton({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const active = searchParams.has("lat") && searchParams.has("lng");
  const chip = `inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${className}`;

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
      <button type="button" onClick={clearLocation} className={`${chip} border-brand bg-brand-tint text-brand-strong`}>
        <PinIcon size={16} />
        {t("nearMe.active")}
      </button>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={useMyLocation}
        disabled={status === "loading"}
        className={`${chip} border-border bg-surface text-foreground hover:bg-surface-muted disabled:cursor-wait`}
      >
        <PinIcon size={16} />
        {status === "loading" ? t("nearMe.locating") : t("nearMe.label")}
      </button>
      {status === "error" && (
        <span role="alert" className="text-xs text-danger">
          {t("nearMe.error")}
        </span>
      )}
    </span>
  );
}
