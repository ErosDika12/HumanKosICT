import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";
import { ENGLISH_TABLE, tableFor } from "./catalog";
import { makeFormatters, makeTranslate, type Formatters, type Translate } from "./translate";

export async function getLocale(): Promise<Locale> {
  const jar = await cookies();
  const value = jar.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export interface I18n extends Formatters {
  locale: Locale;
  t: Translate;
}

/** Server-component translator: `const { t, locale, shortDate } = await getI18n();` */
export async function getI18n(): Promise<I18n> {
  const locale = await getLocale();
  return { locale, t: makeTranslate(locale, tableFor(locale), ENGLISH_TABLE), ...makeFormatters(locale) };
}
