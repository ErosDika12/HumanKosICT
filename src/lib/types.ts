/**
 * Core demo-data types for the KOSOVO 2036 — HUMAN NETWORK prototype.
 * Phase 2 will replace this in-memory layer with a persisted, migrated schema.
 */

export type InterestId =
  | "technology"
  | "sports"
  | "art"
  | "music"
  | "education"
  | "gaming"
  | "environment"
  | "volunteering"
  | "photography"
  | "cooking"
  | "travel"
  | "science"
  | "culture"
  | "books"
  | "entrepreneurship";

export interface Interest {
  id: InterestId;
  labelSq: string;
  labelEn: string;
  labelSr: string;
  emoji: string;
}

export type ActivityCategory =
  | "sports"
  | "education"
  | "culture"
  | "community"
  | "technology"
  | "environment";

export interface Organizer {
  id: string;
  name: string;
  verified: boolean;
}

export interface DemoActivity {
  id: string;
  slug: string;
  title: string;
  titleSq: string;
  summary: string;
  summarySq: string;
  category: ActivityCategory;
  interestTags: InterestId[];
  areaSq: string;
  areaEn: string;
  venueName: string;
  /** Approximate public coordinates for a public venue — never a private user location. */
  lat: number;
  lng: number;
  date: string; // ISO date, e.g. "2036-06-13"
  startTime: string; // "18:00"
  timezone: string; // "Europe/Prishtina"
  capacity: number;
  rsvpCount: number;
  cost: "free" | "paid";
  costDetail?: string;
  indoor: boolean;
  accessibility: string[];
  ageEligibility: "all-ages" | "adults-only" | "supervised-minors";
  difficulty: "beginner" | "intermediate" | "advanced" | "all-levels";
  organizer: Organizer;
  communitySlug: string;
  description: string;
  descriptionSq: string;
  /**
   * "published" for every Phase 1 seed row. "draft" is a real Phase 4 state
   * for an organizer-created activity awaiting moderator publish (never
   * shown in listActivities()'s discovery results, but visible via direct
   * link to its organizer/a moderator). "canceled" is a real Phase 2 schema
   * state, settable by an organizer as of Phase 4
   * (src/lib/data/organizer-activities.ts). Optional (defaults to
   * "published" at call sites) so src/lib/demo-data.ts's literal seed
   * content doesn't need to restate it on every entry.
   */
  status?: "draft" | "published" | "canceled";
  /**
   * Phase 3 recommendation output, attached by src/lib/data/recommendations.ts
   * when the caller asked for scoring — never persisted, never present on a
   * raw getActivityBySlug() result. Optional so every Phase 1/2 component
   * that renders a DemoActivity without knowing about recommendations keeps
   * working unchanged.
   */
  matchReasons?: string[];
  distanceKm?: number;
}

export interface DemoCommunity {
  id: string;
  slug: string;
  name: string;
  category: ActivityCategory;
  descriptionSq: string;
  description: string;
  memberCount: number;
  areaSq: string;
}

export const INTERESTS: Interest[] = [
  { id: "technology", labelSq: "Teknologji", labelEn: "Technology", labelSr: "Tehnologija", emoji: "💻" },
  { id: "sports", labelSq: "Sport", labelEn: "Sports", labelSr: "Sport", emoji: "🏀" },
  { id: "art", labelSq: "Art", labelEn: "Art", labelSr: "Umetnost", emoji: "🎨" },
  { id: "music", labelSq: "Muzikë", labelEn: "Music", labelSr: "Muzika", emoji: "🎵" },
  { id: "education", labelSq: "Edukim", labelEn: "Education", labelSr: "Obrazovanje", emoji: "📚" },
  { id: "gaming", labelSq: "Video-lojëra", labelEn: "Gaming", labelSr: "Video-igre", emoji: "🎮" },
  { id: "environment", labelSq: "Mjedis", labelEn: "Environment", labelSr: "Životna sredina", emoji: "🌱" },
  { id: "volunteering", labelSq: "Vullnetarizëm", labelEn: "Volunteering", labelSr: "Volonterizam", emoji: "🤝" },
  { id: "photography", labelSq: "Fotografi", labelEn: "Photography", labelSr: "Fotografija", emoji: "📸" },
  { id: "cooking", labelSq: "Gatim", labelEn: "Cooking", labelSr: "Kuvanje", emoji: "🍳" },
  { id: "travel", labelSq: "Udhëtime", labelEn: "Travel", labelSr: "Putovanja", emoji: "✈️" },
  { id: "science", labelSq: "Shkencë", labelEn: "Science", labelSr: "Nauka", emoji: "🧠" },
  { id: "culture", labelSq: "Kulturë", labelEn: "Culture", labelSr: "Kultura", emoji: "🎭" },
  { id: "books", labelSq: "Libra", labelEn: "Books", labelSr: "Knjige", emoji: "📖" },
  { id: "entrepreneurship", labelSq: "Ndërmarrësi", labelEn: "Entrepreneurship", labelSr: "Preduzetništvo", emoji: "💼" },
];

export function interestLabel(i: Interest, locale: "sq" | "en" | "sr"): string {
  return locale === "sq" ? i.labelSq : locale === "sr" ? i.labelSr : i.labelEn;
}

export function getInterest(id: InterestId): Interest {
  const found = INTERESTS.find((i) => i.id === id);
  if (!found) throw new Error(`Unknown interest id: ${id}`);
  return found;
}
