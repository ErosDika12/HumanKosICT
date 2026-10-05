/**
 * Search constraints for the assistant — pure and deterministic (no database,
 * no `server-only`), unit-tested in tests/assistant-constraints.test.ts.
 *
 * Location, date, cost, accessibility and eligibility are HARD constraints:
 * an activity that breaks one is never presented as a match. They persist
 * across follow-up turns ("Only in Dardania, please" keeps "free",
 * "wheelchair accessible" and "this weekend"). When nothing matches, the
 * engine may offer a clearly labelled alternative that relaxes ONLY location,
 * date or cost — never accessibility or eligibility.
 */
import type { ActivityCategory, DemoActivity } from "@/lib/types";
import { isTimeWindow, matchesWindow, WINDOW_LABEL, windowRange, type TimeWindow } from "@/lib/time-window";
import { makeI18n, type I18nLite } from "@/lib/i18n/make";

export type Eligibility = DemoActivity["ageEligibility"];

export interface SearchConstraints {
  category?: ActivityCategory;
  /** Exact `areaEn` value, e.g. "Prishtina — Dardania". */
  area?: string;
  cost?: "free" | "paid";
  accessibility?: string[];
  window?: TimeWindow;
  eligibility?: Eligibility;
}

export const CONSTRAINT_AREAS: { areaEn: string; label: string; phrases: string[] }[] = [
  { areaEn: "Prishtina — Dardania", label: "Dardania", phrases: ["dardania", "dardani"] },
  { areaEn: "Prishtina — Center", label: "the Center", phrases: ["center", "centre", "qender", "downtown", "city center", "city centre"] },
  { areaEn: "Prishtina — Germia", label: "Germia", phrases: ["germia", "germi"] },
  { areaEn: "Prishtina — Lakrishtë", label: "Lakrishtë", phrases: ["lakrishte", "lakrisht"] },
  { areaEn: "Prishtina — Sunny Hill", label: "Sunny Hill", phrases: ["sunny hill", "sunnyhill", "kodra e diellit"] },
  { areaEn: "Prishtina — Ulpiana", label: "Ulpiana", phrases: ["ulpiana", "ulpian"] },
];

const CATEGORY_WORDS: [ActivityCategory, string[]][] = [
  ["technology", ["programming", "coding", "code", "tech", "technology", "robotics", "ai ", "programim", "teknologji", "kodim"]],
  ["environment", ["environment", "environmental", "green", "clean-up", "cleanup", "clean up", "tree", "mjedis", "gjelber", "gjelbër"]],
  ["sports", ["sports", "sport", "basketball", "basketboll", "cycling", "bike"]],
  ["education", ["education", "learning", "class", "workshop", "edukim", "mesim", "mësim"]],
  ["culture", ["culture", "cultural", "music", "art", "poetry", "kulture", "kulturë", "muzike", "muzikë"]],
  ["community", ["community", "neighborhood", "neighbourhood", "komunitet", "lagje"]],
];

const ACCESS_WORDS: [string, string[]][] = [
  ["wheelchair-accessible", ["wheelchair", "accessible", "accessibility", "step-free", "step free", "aksesib", "karroce", "karrocë", "qasshme", "qasshem", "qasje"]],
  ["captioned", ["captioned", "captions", "subtitles", "deaf", "hard of hearing"]],
  ["quiet-space-available", ["quiet space", "quiet room", "sensory", "calm space"]],
];

function normalize(text: string): string {
  return ` ${text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\- ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
}

function hasWord(q: string, word: string): boolean {
  // Whole-word/phrase match so "art" does not fire inside "party" and "ai " needs a boundary.
  const w = normalize(word).trim();
  return q.includes(` ${w} `) || (w.length > 4 && q.includes(w));
}

/** Pulls every constraint the text states explicitly. Never guesses one that was not said. */
export function extractConstraints(text: string): SearchConstraints {
  const q = normalize(text);
  const out: SearchConstraints = {};

  for (const [category, words] of CATEGORY_WORDS) {
    if (words.some((w) => hasWord(q, w))) {
      out.category = category;
      break;
    }
  }

  const area = CONSTRAINT_AREAS.find((a) => a.phrases.some((p) => hasWord(q, p)));
  if (area) out.area = area.areaEn;

  if (/ (free|falas|no cost|for free|at no cost|gratis) /.test(q)) out.cost = "free";
  else if (/ (paid|ticketed) /.test(q)) out.cost = "paid";

  const access = ACCESS_WORDS.filter(([, words]) => words.some((w) => hasWord(q, w))).map(([tag]) => tag);
  if (access.length > 0) out.accessibility = access;

  if (q.includes(" next weekend ") || q.includes(" fundjaven tjeter ")) out.window = "next-weekend";
  else if (/ (this weekend|weekend|saturday|sunday|fundjave|fundjaven|shtune|shtunen|e diel) /.test(q)) out.window = "weekend";
  else if (/ (this week|rest of the week|next few days|kete jave) /.test(q)) out.window = "week";
  else if (/ (weekday|weekdays|monday|tuesday|wednesday|thursday|friday) /.test(q)) out.window = "weekday";

  if (/ (teen|teens|teenager|teenagers|adolescent|adolescents|adoleshent|adoleshente|kids|children|child|youth|femije) /.test(q)) out.eligibility = "supervised-minors";
  else if (/ (adults only|adults-only) /.test(q)) out.eligibility = "adults-only";

  return out;
}

const REFINEMENT_START = /^(only|just|also|and|but|instead|actually|make it|what about|how about|in |near |on |for |with |without|no |not |please|ok|okay|vetem|dhe |por |gjithashtu|po |jo |me |ne |per |pa |si per|çfarë për|cfare per)/;

/**
 * A short follow-up that adds to or narrows the previous search ("Only in
 * Dardania, please", "and free?", "what about sports") rather than starting a
 * new one. A full new request ("Find a free … activity in … this weekend")
 * replaces the earlier constraints.
 */
export function isRefinement(text: string): boolean {
  const q = normalize(text).trim();
  const words = q.split(" ").filter(Boolean);
  if (words.length === 0) return false;
  if (REFINEMENT_START.test(q)) return true;
  return words.length <= 4 && Object.keys(extractConstraints(text)).length > 0;
}

export function mergeConstraints(prev: SearchConstraints | undefined, next: SearchConstraints): SearchConstraints {
  if (!prev) return { ...next };
  const accessibility = [...new Set([...(prev.accessibility ?? []), ...(next.accessibility ?? [])])];
  return {
    ...prev,
    ...next,
    ...(accessibility.length > 0 ? { accessibility } : {}),
  };
}

/** "free, wheelchair accessible, in Dardania, this weekend (21–22 June)" — empty string when unconstrained. */
export function describeConstraints(c: SearchConstraints, i18n: I18nLite = makeI18n("en")): string {
  const { t, locale, monthLong, dayNumber } = i18n;
  const lower = (text: string) => text.toLocaleLowerCase(locale);
  const bits: string[] = [];
  if (c.category) bits.push(lower(t(`category.${c.category}`)));
  if (c.cost) bits.push(t(c.cost === "free" ? "constraint.free" : "constraint.paid"));
  if (c.accessibility?.length) bits.push(...c.accessibility.map((a) => t(`access.${a}`)));
  if (c.eligibility === "supervised-minors") bits.push(t("constraint.teens"));
  if (c.eligibility === "adults-only") bits.push(t("constraint.adults"));
  if (c.area) bits.push(t("constraint.inArea", { area: t(`area.${c.area}`) }));
  if (c.window) {
    const range = windowRange(c.window);
    const label = WINDOW_LABEL[locale][c.window];
    bits.push(
      range
        ? t("constraint.range", { window: label, from: dayNumber(range.from), to: dayNumber(range.to), month: monthLong(range.to) })
        : label
    );
  }
  return bits.join(", ");
}

export interface ConstraintFields {
  areaEn: string;
  cost: "free" | "paid";
  accessibility: string[];
  date: string;
  ageEligibility: Eligibility;
  category: ActivityCategory;
}

/** Whether a record satisfies EVERY stated constraint. `skip` lets the alternative search relax one. */
export function satisfies(a: ConstraintFields, c: SearchConstraints, skip: ReadonlyArray<keyof SearchConstraints> = []): boolean {
  if (c.category && !skip.includes("category") && a.category !== c.category) return false;
  if (c.area && !skip.includes("area") && a.areaEn !== c.area) return false;
  if (c.cost && !skip.includes("cost") && a.cost !== c.cost) return false;
  if (c.accessibility && !c.accessibility.every((t) => a.accessibility.includes(t))) return false;
  if (c.window && !skip.includes("window") && !matchesWindow(a.date, c.window)) return false;
  if (c.eligibility === "supervised-minors") {
    if (a.ageEligibility !== "supervised-minors") return false;
  } else if (c.eligibility) {
    if (a.ageEligibility !== c.eligibility) return false;
  } else if (a.ageEligibility === "supervised-minors") {
    // Without an explicit request, activities for supervised minors are not offered to an adult searching for themselves.
    return false;
  }
  return true;
}

/** Order in which an alternative may relax a constraint. Accessibility and eligibility are never relaxed. */
export const RELAXABLE: ReadonlyArray<keyof SearchConstraints> = ["window", "area", "cost"];

const CATEGORIES: ActivityCategory[] = ["sports", "education", "culture", "community", "technology", "environment"];

/** Validates constraints that came back from the browser — every field is whitelisted. */
export function sanitizeConstraints(raw: unknown): SearchConstraints | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const r = raw as Record<string, unknown>;
  const out: SearchConstraints = {};
  if (typeof r.category === "string" && (CATEGORIES as string[]).includes(r.category)) out.category = r.category as ActivityCategory;
  if (typeof r.area === "string" && CONSTRAINT_AREAS.some((a) => a.areaEn === r.area)) out.area = r.area;
  if (r.cost === "free" || r.cost === "paid") out.cost = r.cost;
  if (Array.isArray(r.accessibility)) {
    const tags = r.accessibility.filter((t): t is string => typeof t === "string" && ACCESS_WORDS.some(([tag]) => tag === t));
    if (tags.length > 0) out.accessibility = [...new Set(tags)];
  }
  if (isTimeWindow(r.window)) out.window = r.window;
  if (r.eligibility === "supervised-minors" || r.eligibility === "adults-only" || r.eligibility === "all-ages") out.eligibility = r.eligibility;
  return Object.keys(out).length > 0 ? out : undefined;
}
