/**
 * Localisation of STORED content (activity, community, need, project and
 * message text). Interface strings live in the catalog; this module covers
 * the seeded records, whose canonical text is English with Albanian columns
 * for activities, communities and projects.
 *
 * Rules:
 *  - Proper names (people, places, communities, venues) are never translated.
 *  - Visitor-written text is never touched — only exact seeded strings match.
 *  - A missing translation falls back to English; tests/i18n-content.test.ts
 *    fails the build if any seeded string lacks an Albanian or Serbian version.
 */
import type { DemoActivity } from "@/lib/types";
import type { Locale } from "./config";
import { TEXT_TRANSLATIONS } from "./content/texts";

export interface ActivityText {
  title: string;
  summary: string;
  description: string;
  costDetail?: string;
}

export function localizeActivity(a: Pick<DemoActivity, "slug" | "title" | "titleSq" | "summary" | "summarySq" | "description" | "descriptionSq" | "costDetail">, locale: Locale): ActivityText {
  if (locale === "sq") {
    return {
      title: a.titleSq || a.title,
      summary: a.summarySq || a.summary,
      description: a.descriptionSq || a.description,
      costDetail: a.costDetail ? (TEXT_TRANSLATIONS[a.costDetail]?.sq ?? a.costDetail) : undefined,
    };
  }
  return { title: a.title, summary: a.summary, description: a.description, costDetail: a.costDetail };
}

/** Exact-text lookup for seeded strings (needs, project text, rules, example messages…). Anything else passes through unchanged. */
export function localizeText(text: string | null | undefined, locale: Locale): string {
  if (!text) return "";
  if (locale === "en") return text;
  return TEXT_TRANSLATIONS[text]?.[locale] ?? text;
}

/** Community description: Albanian from the stored column, Serbian from the text table. */
export function localizeCommunityDescription(c: { description: string; descriptionSq?: string | null }, locale: Locale): string {
  if (locale === "sq") return c.descriptionSq || localizeText(c.description, "sq");
  return localizeText(c.description, locale);
}
