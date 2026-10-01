/**
 * Language support: Albanian (default), English and Serbian (Latin script).
 * Pure module — shared by server code, client components and tests.
 */
export const LOCALES = ["sq", "en", "sr"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "sq";
export const LOCALE_COOKIE = "hn-lang";

export const LOCALE_NAME: Record<Locale, string> = {
  sq: "Shqip",
  en: "English",
  sr: "Srpski",
};

/** BCP 47 tag for the <html lang> attribute (assistive technology picks the right voice from this). */
export const HTML_LANG: Record<Locale, string> = {
  sq: "sq",
  en: "en",
  sr: "sr-Latn",
};

/** Locale used for Intl date/number formatting. */
export const INTL_LOCALE: Record<Locale, string> = {
  sq: "sq-AL",
  en: "en-GB",
  sr: "sr-Latn-RS",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function parseLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export type PluralCategory = "one" | "few" | "other";

export function pluralCategory(locale: Locale, n: number): PluralCategory {
  if (locale === "sr") {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return "one";
    if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return "few";
    return "other";
  }
  return n === 1 ? "one" : "other";
}
