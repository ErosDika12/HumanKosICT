import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";
import { makeI18n } from "./make";
import type { I18nLite } from "./make";

export async function getLocale(): Promise<Locale> {
  const jar = await cookies();
  const value = jar.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export type I18n = I18nLite;

/** Server-component translator: `const { t, locale, shortDate } = await getI18n();` */
export async function getI18n(): Promise<I18n> {
  return makeI18n(await getLocale());
}
