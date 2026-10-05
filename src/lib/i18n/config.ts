/**
 * Language support: Albanian (default) and English.
 * Pure module — shared by server code, client components and tests.
 */
export const LOCALES = ["sq", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "sq";
export const LOCALE_COOKIE = "hn-lang";

export const LOCALE_NAME: Record<Locale, string> = {
  sq: "Shqip",
  en: "English",
};

/** BCP 47 tag for the <html lang> attribute (assistive technology picks the right voice from this). */
export const HTML_LANG: Record<Locale, string> = {
  sq: "sq",
  en: "en",
};

/** Locale used for Intl date/number formatting. */
export const INTL_LOCALE: Record<Locale, string> = {
  sq: "sq-AL",
  en: "en-GB",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function parseLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export type PluralCategory = "one" | "other";

export function pluralCategory(_locale: Locale, n: number): PluralCategory {
  return n === 1 ? "one" : "other";
}
