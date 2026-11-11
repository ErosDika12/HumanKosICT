"use client";

import { useEffect } from "react";
import { useI18n } from "@/components/LocaleProvider";

/** Page-level error boundary: the header and footer stay usable, only the page body is replaced. */
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { t } = useI18n();
  useEffect(() => {
    console.error("[page error]", error.digest ?? error.name);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6" role="alert">
      <h1 className="font-display text-2xl font-semibold text-foreground">{t("state.error.title")}</h1>
      <p className="mt-2 text-foreground-muted">{t("state.error.body")}</p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-5 inline-flex min-h-11 items-center rounded-full bg-brand px-5 font-semibold text-white hover:bg-brand-strong"
      >
        {t("state.retry")}
      </button>
    </div>
  );
}
