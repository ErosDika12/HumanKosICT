"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { INTERESTS, interestLabel, type InterestId } from "@/lib/types";
import { useI18n } from "@/components/LocaleProvider";
import { saveInterestsAction } from "@/lib/actions/onboarding-actions";

const STORAGE_KEY = "hn-demo-interests";

export function OnboardingClient({
  initialSelected,
  isAuthenticated,
}: {
  initialSelected: InterestId[];
  isAuthenticated: boolean;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [selected, setSelected] = useState<InterestId[]>(initialSelected);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Signed-in users already have their saved selection from the server
    // (initialSelected) — localStorage is only a convenience for visitors.
    // Reading a one-time snapshot from localStorage/props on mount, not
    // reacting to reactive state — the effect-cascade concern doesn't apply
    // here.
    if (isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHydrated(true);
      return;
    }
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as InterestId[];
        if (Array.isArray(parsed)) setSelected(parsed);
      }
    } catch {
      // Ignore unavailable/blocked storage — onboarding still works without it.
    } finally {
      setHydrated(true);
    }
  }, [isAuthenticated]);

  function toggle(id: InterestId) {
    setSelected((current) =>
      current.includes(id) ? current.filter((i) => i !== id) : [...current, id]
    );
  }

  async function handleContinue() {
    if (isAuthenticated) {
      await saveInterestsAction(selected);
    } else {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
      } catch {
        // Selection still passes through the URL even if storage is unavailable.
      }
    }
    const params = selected.length > 0 ? `?interests=${selected.join(",")}` : "";
    router.push(`/discover${params}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">{t("onboarding.title")}</h1>
        <p className="mt-2 max-w-xl text-sm text-foreground-muted">
          {t("onboarding.lead")} {isAuthenticated ? t("onboarding.savedAccount") : t("onboarding.savedBrowser")}
        </p>
      </div>

      <fieldset
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
        aria-describedby="interests-help"
      >
        <legend className="sr-only">{t("onboarding.choose")}</legend>
        {INTERESTS.map((interest) => {
          const isSelected = selected.includes(interest.id);
          return (
            <button
              key={interest.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggle(interest.id)}
              className={`flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-colors ${
                isSelected
                  ? "border-brand bg-brand-tint text-brand-strong"
                  : "border-border bg-surface text-foreground hover:bg-surface-muted"
              }`}
            >
              <span className="text-2xl" aria-hidden="true">
                {interest.emoji}
              </span>
              <span className="text-sm font-semibold">{interestLabel(interest, locale)}</span>
            </button>
          );
        })}
      </fieldset>
      <p id="interests-help" className="sr-only">
        {t("onboarding.toggleHelp")}
      </p>

      <div className="sticky bottom-4 flex items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4 shadow-md">
        <p className="text-sm text-foreground-muted" aria-live="polite">
          {hydrated
            ? selected.length > 0
              ? t("onboarding.selected", { n: selected.length })
              : t("onboarding.none")
            : " "}
        </p>
        <button
          type="button"
          onClick={handleContinue}
          className="inline-flex items-center justify-center rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-strong"
        >
          {t("onboarding.continue")}
        </button>
      </div>
    </div>
  );
}
