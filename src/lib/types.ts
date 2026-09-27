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
  { id: "technology", labelSq: "Teknologji", labelEn: "Technology", emoji: "💻" },
  { id: "sports", labelSq: "Sport", labelEn: "Sports", emoji: "🏀" },
  { id: "art", labelSq: "Art", labelEn: "Art", emoji: "🎨" },
  { id: "music", labelSq: "Muzikë", labelEn: "Music", emoji: "🎵" },
  { id: "education", labelSq: "Edukim", labelEn: "Education", emoji: "📚" },
  { id: "gaming", labelSq: "Video-lojëra", labelEn: "Gaming", emoji: "🎮" },
  { id: "environment", labelSq: "Mjedis", labelEn: "Environment", emoji: "🌱" },
  { id: "volunteering", labelSq: "Vullnetarizëm", labelEn: "Volunteering", emoji: "🤝" },
  { id: "photography", labelSq: "Fotografi", labelEn: "Photography", emoji: "📸" },
  { id: "cooking", labelSq: "Gatim", labelEn: "Cooking", emoji: "🍳" },
  { id: "travel", labelSq: "Udhëtime", labelEn: "Travel", emoji: "✈️" },
  { id: "science", labelSq: "Shkencë", labelEn: "Science", emoji: "🧠" },
  { id: "culture", labelSq: "Kulturë", labelEn: "Culture", emoji: "🎭" },
  { id: "books", labelSq: "Libra", labelEn: "Books", emoji: "📖" },
  { id: "entrepreneurship", labelSq: "Ndërmarrësi", labelEn: "Entrepreneurship", emoji: "💼" },
];

export function getInterest(id: InterestId): Interest {
  const found = INTERESTS.find((i) => i.id === id);
  if (!found) throw new Error(`Unknown interest id: ${id}`);
  return found;
}
