/**
 * Free-text search over activities by name or topic. Pure (no database, no
 * `server-only`) and unit-tested. Matches the title, summary, category,
 * area and interest labels in ALL three languages, so a visitor can type
 * "poetry", "poezi" or "kulturë" regardless of the interface language.
 * Diacritics are ignored ("gjelber" finds "gjelbër").
 */
import type { DemoActivity } from "@/lib/types";
import { INTERESTS } from "@/lib/types";
import { localizeActivity } from "@/lib/i18n/content";
import { LOCALES } from "@/lib/i18n/config";

const CATEGORY_WORDS: Record<DemoActivity["category"], string[]> = {
  sports: ["sports", "sport", "sporte"],
  education: ["education", "edukim", "obrazovanje", "learning", "mesim", "nastava"],
  culture: ["culture", "kulture", "kultura", "arts", "art"],
  community: ["community", "komunitet", "zajednica", "neighborhood", "lagje"],
  technology: ["technology", "tech", "teknologji", "tehnologija", "coding", "programming", "programim"],
  environment: ["environment", "mjedis", "zivotna sredina", "green", "nature", "natyre", "priroda"],
};

export function normalizeSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N} ]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function haystack(a: DemoActivity): string {
  const parts: string[] = [a.areaEn, a.areaSq, a.venueName, a.organizer.name, ...CATEGORY_WORDS[a.category]];
  for (const locale of LOCALES) {
    const text = localizeActivity(a, locale);
    parts.push(text.title, text.summary);
  }
  for (const tag of a.interestTags) {
    const interest = INTERESTS.find((i) => i.id === tag);
    if (interest) parts.push(interest.labelEn, interest.labelSq);
  }
  return normalizeSearch(parts.join(" "));
}

/** Every word of the query must appear somewhere in the activity's searchable text. */
export function matchesQuery(a: DemoActivity, query: string): boolean {
  const words = normalizeSearch(query).split(" ").filter(Boolean);
  if (words.length === 0) return true;
  const text = haystack(a);
  return words.every((w) => text.includes(w));
}
