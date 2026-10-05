import type { Locale } from "./config";
import { ENGLISH_TABLE, tableFor } from "./catalog";
import { makeFormatters, makeTranslate, type Formatters, type Translate } from "./translate";

export interface I18nLite extends Formatters {
  locale: Locale;
  t: Translate;
}

/** The translator without any request context — used by the assistant engine and tests. */
export function makeI18n(locale: Locale): I18nLite {
  return { locale, t: makeTranslate(locale, tableFor(locale), ENGLISH_TABLE), ...makeFormatters(locale) };
}
