/**
 * Typed search-intent parser (Phase 6) — deterministic keyword matching,
 * not natural-language understanding. Pure, no `server-only` import, so
 * it's directly unit-tested (tests/assistant-intent.test.ts). This is the
 * always-available baseline the brief requires: "existing map search and
 * BRIDGE must remain fully functional without an AI provider key," and
 * this parser needs no provider at all.
 *
 * Deliberately basic keyword/substring matching for English and a small
 * set of Albanian phrasings for the three demonstration journeys — not
 * broad multilingual or grammatical understanding. That limitation is
 * stated here and in the assistant UI, never hidden.
 */
import type { ActivityCategory } from "@/lib/types";
import type { DayBucket } from "@/lib/data/recommendations";

export type AssistantIntentType = "find-activities" | "find-people" | "bridge-question" | "unknown";

export interface CommunityMention {
  slug: string;
  matchedPhrase: string;
}

export interface AssistantIntent {
  type: AssistantIntentType;
  category?: ActivityCategory;
  when?: DayBucket;
  accessibility?: string[];
  nearMe: boolean;
  /** A city/place mentioned that isn't Prishtina — signals "no seeded records for that location." */
  outOfScopeLocation?: string;
  communityMentions: CommunityMention[];
  rawQuery: string;
}

const CATEGORY_KEYWORDS: Record<ActivityCategory, string[]> = {
  technology: ["programming", "coding", "code", "tech", "technology", "ai", "programim", "teknologji", "kodim"],
  environment: ["environment", "environmental", "green", "clean-up", "cleanup", "mjedis", "mjedisor", "gjelber", "gjelbër"],
  sports: ["sports", "sport", "basketball", "basketboll"],
  education: ["education", "learning", "class", "edukim", "mesim", "mësim"],
  culture: ["culture", "cultural", "music", "art", "kulture", "kulturë", "muzike", "muzikë"],
  community: ["community", "neighborhood", "komunitet", "lagje"],
};

const WEEKEND_KEYWORDS = [
  "saturday",
  "sunday",
  "weekend",
  "e shtune",
  "e shtunë",
  "e diel",
  "fundjave",
  "fundjavë",
];
const WEEKDAY_KEYWORDS = ["weekday", "monday", "tuesday", "wednesday", "thursday", "friday"];

const ACCESSIBILITY_KEYWORDS = ["accessible", "accessibility", "wheelchair", "aksesib", "karroce", "karrocë"];

const NEAR_ME_KEYWORDS = ["near me", "nearby", "close to me", "prane meje", "pranë meje", "afer meje", "afër meje"];

const PEOPLE_KEYWORDS = ["meet people", "meet someone", "njerez", "njerëz", "takoj"];

const BRIDGE_KEYWORDS = [
  "collaborate",
  "collaboration",
  "partner",
  "partnership",
  "work together",
  "bashkepunim",
  "bashkëpunim",
  "bashkepunoj",
  "bashkëpunoj",
];

/** Real seeded community names/nicknames only — never a fabricated community. */
const COMMUNITY_KEYWORDS: { slug: string; phrases: string[] }[] = [
  { slug: "prishtina-ai-klub", phrases: ["ai klub", "ai club", "tech club", "technology community", "prishtina ai"] },
  { slug: "gjelber-per-prishtinen", phrases: ["environmental group", "environment group", "green group", "gjelber", "gjelbër"] },
  { slug: "rinia-basketboll-lakrishte", phrases: ["basketball community", "basketball club", "basketboll"] },
  { slug: "kolektivi-kulturor-prizreni-i-vjeter", phrases: ["cultural collective", "culture collective", "kulturor"] },
];

/** A small, honest denylist for the "unknown location" demo case — not exhaustive. */
const OTHER_KNOWN_CITIES = ["tirana", "skopje", "belgrade", "new york", "london", "paris", "berlin"];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, ""); // strip diacritics so "ë"/"ç" match ASCII keyword variants too
}

function includesAny(haystack: string, needles: string[]): string | undefined {
  return needles.find((n) => haystack.includes(normalize(n)));
}

export function parseAssistantIntent(rawQuery: string): AssistantIntent {
  const q = normalize(rawQuery);

  let category: ActivityCategory | undefined;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [ActivityCategory, string[]][]) {
    if (includesAny(q, keywords)) {
      category = cat;
      break;
    }
  }

  const when: DayBucket | undefined = includesAny(q, WEEKEND_KEYWORDS)
    ? "weekend"
    : includesAny(q, WEEKDAY_KEYWORDS)
      ? "weekday"
      : undefined;

  const accessibility = includesAny(q, ACCESSIBILITY_KEYWORDS) ? ["wheelchair-accessible"] : undefined;
  const nearMe = Boolean(includesAny(q, NEAR_ME_KEYWORDS));

  const outOfScopeLocation = OTHER_KNOWN_CITIES.find((city) => q.includes(city));

  const communityMentions: CommunityMention[] = [];
  for (const { slug, phrases } of COMMUNITY_KEYWORDS) {
    const matched = phrases.find((p) => q.includes(normalize(p)));
    if (matched) communityMentions.push({ slug, matchedPhrase: matched });
  }

  const isBridgeQuestion = Boolean(includesAny(q, BRIDGE_KEYWORDS)) && communityMentions.length >= 2;
  const isPeopleQuery = Boolean(includesAny(q, PEOPLE_KEYWORDS));
  const hasAnySignal = Boolean(
    category || when || accessibility || nearMe || outOfScopeLocation || communityMentions.length > 0
  );
  // Only genuinely ambiguous input (empty, a bare greeting, or otherwise no
  // extractable signal at all) asks for clarification — a longer query with
  // no matched keyword still runs as a general activity search rather than
  // refusing outright.
  const GREETINGS = ["hi", "hello", "hey", "test", "help", "pershendetje", "përshëndetje"];
  const isBareGreeting = GREETINGS.includes(q.trim());

  let type: AssistantIntentType;
  if (isBridgeQuestion) {
    type = "bridge-question";
  } else if (isPeopleQuery) {
    type = "find-people";
  } else if (!hasAnySignal && (q.trim().length === 0 || isBareGreeting)) {
    type = "unknown";
  } else {
    type = "find-activities";
  }

  return {
    type,
    category,
    when,
    accessibility,
    nearMe,
    outOfScopeLocation,
    communityMentions,
    rawQuery,
  };
}
