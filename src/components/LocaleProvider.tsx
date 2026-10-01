"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n/config";
import { makeFormatters, makeTranslate, type Formatters, type Translate } from "@/lib/i18n/translate";

interface Ctx extends Formatters {
  locale: Locale;
  t: Translate;
}

const LocaleContext = createContext<Ctx | null>(null);

/** Receives the already-resolved table for the active language only (other languages are never shipped). */
export function LocaleProvider({
  locale,
  table,
  fallback,
  children,
}: {
  locale: Locale;
  table: Record<string, string>;
  fallback: Record<string, string>;
  children: ReactNode;
}) {
  const value = useMemo<Ctx>(() => ({ locale, t: makeTranslate(locale, table, fallback), ...makeFormatters(locale) }), [locale, table, fallback]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useI18n must be used inside <LocaleProvider>.");
  return ctx;
}
