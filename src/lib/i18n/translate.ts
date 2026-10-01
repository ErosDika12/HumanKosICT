import { INTL_LOCALE, pluralCategory, type Locale } from "./config";

export type Vars = Record<string, string | number>;

export type Translate = (key: string, vars?: Vars) => string;

/** {name} placeholders only — no HTML, so translated text can never inject markup. */
export function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

/**
 * Looks a key up in a flat message table. Plural keys are written
 * "key.one" / "key.few" / "key.other" and chosen by `vars.n`. A missing key
 * never renders raw: it falls back to the English text, and only as a last
 * resort to a neutral dash (a test guarantees this path is never hit).
 */
export function makeTranslate(locale: Locale, table: Record<string, string>, fallback: Record<string, string>): Translate {
  return (key, vars) => {
    let found: string | undefined;
    if (vars && typeof vars.n === "number") {
      const cat = pluralCategory(locale, vars.n);
      found = table[`${key}.${cat}`] ?? table[`${key}.other`];
      if (found === undefined) found = fallback[`${key}.${cat}`] ?? fallback[`${key}.other`];
    }
    if (found === undefined) found = table[key] ?? fallback[key];
    return found === undefined ? "–" : interpolate(found, vars);
  };
}

export interface Formatters {
  /** "Sat 21 Jun" style. Dates are calendar dates (UTC), never shifted by the visitor's timezone. */
  shortDate: (isoDate: string) => string;
  longDate: (isoDate: string) => string;
  weekdayLong: (isoDate: string) => string;
  number: (n: number) => string;
}

/**
 * Dates are formatted from fixed name tables, NOT Intl.DateTimeFormat: the
 * server's ICU and the visitor's browser spell Albanian and Serbian months
 * differently, which made server-rendered text mismatch on hydration.
 */
const NAMES: Record<Locale, { weekday: string[]; weekdayShort: string[]; month: string[]; monthShort: string[] }> = {
  en: {
    weekday: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    weekdayShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    month: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    monthShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  },
  sq: {
    weekday: ["e diel", "e hënë", "e martë", "e mërkurë", "e enjte", "e premte", "e shtunë"],
    weekdayShort: ["die", "hën", "mar", "mër", "enj", "pre", "sht"],
    month: ["janar", "shkurt", "mars", "prill", "maj", "qershor", "korrik", "gusht", "shtator", "tetor", "nëntor", "dhjetor"],
    monthShort: ["jan", "shk", "mar", "pri", "maj", "qer", "kor", "gus", "sht", "tet", "nën", "dhj"],
  },
  sr: {
    weekday: ["nedelja", "ponedeljak", "utorak", "sreda", "četvrtak", "petak", "subota"],
    weekdayShort: ["ned", "pon", "uto", "sre", "čet", "pet", "sub"],
    month: ["januar", "februar", "mart", "april", "maj", "jun", "jul", "avgust", "septembar", "oktobar", "novembar", "decembar"],
    monthShort: ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "avg", "sep", "okt", "nov", "dec"],
  },
};

export function makeFormatters(locale: Locale): Formatters {
  const n = NAMES[locale];
  const parts = (iso: string) => {
    const d = new Date(`${iso}T00:00:00Z`);
    return { dow: d.getUTCDay(), day: d.getUTCDate(), month: d.getUTCMonth(), year: d.getUTCFullYear() };
  };
  const dot = locale === "sr" ? "." : "";
  const num = new Intl.NumberFormat(INTL_LOCALE[locale]);
  return {
    shortDate: (iso) => {
      const p = parts(iso);
      return `${n.weekdayShort[p.dow]} ${p.day}${dot} ${n.monthShort[p.month]}`;
    },
    longDate: (iso) => {
      const p = parts(iso);
      const sep = locale === "en" ? " " : ", ";
      return `${n.weekday[p.dow]}${sep}${p.day}${dot} ${n.month[p.month]} ${p.year}`;
    },
    weekdayLong: (iso) => n.weekday[parts(iso).dow],
    number: (value) => num.format(value),
  };
}
