"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { LOCALES, LOCALE_NAME, type Locale } from "@/lib/i18n/config";
import { useI18n } from "@/components/LocaleProvider";

/**
 * Plain links to `?lang=xx` — the proxy stores the choice in a cookie and
 * returns to the same page, so it works without JavaScript and is shareable.
 */
function Switcher({ className = "" }: { className?: string }) {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const params = useSearchParams();

  const hrefFor = (target: Locale) => {
    const next = new URLSearchParams(params.toString());
    next.set("lang", target);
    return `${pathname}?${next.toString()}`;
  };

  return (
    <nav aria-label={t("shell.language")} className={`inline-flex items-center rounded-full border border-border bg-surface p-0.5 ${className}`}>
      {LOCALES.map((code) => {
        const active = code === locale;
        return (
          <a
            key={code}
            href={hrefFor(code)}
            lang={code === "sr" ? "sr-Latn" : code}
            hrefLang={code}
            aria-current={active ? "true" : undefined}
            title={LOCALE_NAME[code]}
            className={`inline-flex min-h-8 min-w-9 items-center justify-center rounded-full px-2.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
              active ? "bg-brand text-white" : "text-foreground-muted hover:bg-surface-muted hover:text-foreground"
            }`}
          >
            <span aria-hidden="true">{code}</span>
            <span className="sr-only">{LOCALE_NAME[code]}</span>
          </a>
        );
      })}
    </nav>
  );
}

export function LanguageSwitcher(props: { className?: string }) {
  return (
    <Suspense fallback={null}>
      <Switcher {...props} />
    </Suspense>
  );
}
