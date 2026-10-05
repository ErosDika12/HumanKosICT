/**
 * BRIDGE proposal text is generated in English from stored facts
 * (bridge.ts composeNarrative, bridge-scoring.ts). This pure module renders the
 * same sentence shapes in the visitor's language, and falls back to an exact
 * text table for the hand-written flagship proposal. Anything unmatched is
 * returned unchanged.
 */
import { INTERESTS, interestLabel } from "@/lib/types";
import type { Locale } from "./config";
import type { Translate } from "./translate";
import { areaFromSq } from "./areas";
import { localizeText } from "./content";

const CATEGORY_IDS = ["technology", "environment", "sports", "education", "culture", "community"];

function cat(raw: string, t: Translate, locale: Locale): string {
  const id = raw.trim().toLowerCase();
  return CATEGORY_IDS.includes(id) ? t(`category.${id}`).toLocaleLowerCase(locale) : raw;
}

function interests(raw: string, locale: Locale): string {
  return raw
    .split(/,\s*/)
    .map((id) => {
      const i = INTERESTS.find((x) => x.id === id.trim());
      return i ? interestLabel(i, locale).toLocaleLowerCase(locale) : id;
    })
    .join(", ");
}

export function localizeBridgeText(text: string, t: Translate, locale: Locale): string {
  if (locale === "en" || !text) return text;
  const exact = localizeText(text, locale);
  if (exact !== text) return exact;
  let m: RegExpMatchArray | null;

  // composeNarrative
  if ((m = text.match(/^(.+) brings (\w+) expertise; (.+) brings (\w+) reach in (.+)\. Together they can directly address: "([\s\S]+)"$/))) {
    return t("bridgeText.mutual", {
      a: m[1],
      ca: cat(m[2], t, locale),
      b: m[3],
      cb: cat(m[4], t, locale),
      area: areaFromSq(m[5], t),
      need: localizeText(m[6], locale),
    });
  }
  if ((m = text.match(/^A shared venue in (.+), volunteer time from both communities, and coordination between (.+) \((.+)\) and (.+) \((.+)\)\.$/))) {
    return t("bridgeText.resources", { area: areaFromSq(m[1], t), orgA: m[2], a: m[3], orgB: m[4], b: m[5] });
  }
  if ((m = text.match(/^(.+) and (.+) meet to scope a joint workshop or project, building on (.+)'s already-scheduled activity\.$/))) {
    return t("bridgeText.nextWithActivity", { orgA: m[1], orgB: m[2], community: m[3] });
  }
  if ((m = text.match(/^(.+) and (.+) meet to scope a joint workshop or project addressing the need\.$/))) {
    return t("bridgeText.nextPlain", { orgA: m[1], orgB: m[2] });
  }

  // bridge-scoring reasons
  if ((m = text.match(/^Complementary categories \((\w+) \+ (\w+)\)$/))) return t("bridgeText.complementary", { a: cat(m[1], t, locale), b: cat(m[2], t, locale) });
  if ((m = text.match(/^Both can act locally in (.+)$/))) return t("bridgeText.local", { area: areaFromSq(m[1], t) });
  if ((m = text.match(/^(.+) directly works in this need's category \((\w+)\)$/))) return t("bridgeText.category", { name: m[1], category: cat(m[2], t, locale) });
  if (text === "At least one community has an upcoming scheduled activity to build on") return t("bridgeText.upcoming");
  if ((m = text.match(/^Shared audience interest: (.+)$/))) return t("bridgeText.audience", { list: interests(m[1], locale) });
  return text;
}

/** The stored reason is a "; "-joined list — split, translate each, return the list. */
export function localizeBridgeReasons(reason: string, t: Translate, locale: Locale): string[] {
  return reason
    .split(";")
    .map((r) => r.trim())
    .filter(Boolean)
    .map((r) => localizeBridgeText(r, t, locale));
}
