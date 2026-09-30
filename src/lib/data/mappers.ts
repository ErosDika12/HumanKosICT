import "server-only";
import type {
  ActivityCategory as DbCategory,
  ActivityStatus as DbActivityStatus,
  AgeEligibility as DbAgeEligibility,
  Cost as DbCost,
  Difficulty as DbDifficulty,
} from "@prisma/client";
import type {
  ActivityCategory,
  DemoActivity,
  Organizer,
} from "@/lib/types";

/**
 * Every UI component (ActivityCard, DiscoverExplorer, ActivityMap) was built
 * in Phase 1 against the DemoActivity/DemoCommunity shapes in
 * src/lib/types.ts. Phase 2 keeps that UI contract stable by mapping Prisma
 * rows into the exact same shape, instead of touching every component.
 */

export const CATEGORY_TO_DB: Record<ActivityCategory, DbCategory> = {
  sports: "SPORTS",
  education: "EDUCATION",
  culture: "CULTURE",
  community: "COMMUNITY",
  technology: "TECHNOLOGY",
  environment: "ENVIRONMENT",
};

export const CATEGORY_FROM_DB: Record<DbCategory, ActivityCategory> = {
  SPORTS: "sports",
  EDUCATION: "education",
  CULTURE: "culture",
  COMMUNITY: "community",
  TECHNOLOGY: "technology",
  ENVIRONMENT: "environment",
};

const COST_FROM_DB: Record<DbCost, DemoActivity["cost"]> = {
  FREE: "free",
  PAID: "paid",
};

const AGE_FROM_DB: Record<DbAgeEligibility, DemoActivity["ageEligibility"]> = {
  ALL_AGES: "all-ages",
  ADULTS_ONLY: "adults-only",
  SUPERVISED_MINORS: "supervised-minors",
};

const DIFFICULTY_FROM_DB: Record<DbDifficulty, DemoActivity["difficulty"]> = {
  BEGINNER: "beginner",
  INTERMEDIATE: "intermediate",
  ADVANCED: "advanced",
  ALL_LEVELS: "all-levels",
};

export const COST_TO_DB: Record<DemoActivity["cost"], DbCost> = {
  free: "FREE",
  paid: "PAID",
};

export const AGE_TO_DB: Record<DemoActivity["ageEligibility"], DbAgeEligibility> = {
  "all-ages": "ALL_AGES",
  "adults-only": "ADULTS_ONLY",
  "supervised-minors": "SUPERVISED_MINORS",
};

export const DIFFICULTY_TO_DB: Record<DemoActivity["difficulty"], DbDifficulty> = {
  beginner: "BEGINNER",
  intermediate: "INTERMEDIATE",
  advanced: "ADVANCED",
  "all-levels": "ALL_LEVELS",
};

type ActivityRow = {
  id: string;
  slug: string;
  title: string;
  titleSq: string;
  summary: string;
  summarySq: string;
  category: DbCategory;
  areaSq: string;
  areaEn: string;
  venueName: string;
  lat: number;
  lng: number;
  date: string;
  startTime: string;
  timezone: string;
  capacity: number;
  simulatedRsvpBaseline: number;
  cost: DbCost;
  costDetail: string | null;
  indoor: boolean;
  accessibility: string;
  ageEligibility: DbAgeEligibility;
  difficulty: DbDifficulty;
  description: string;
  descriptionSq: string;
  organizerId: string;
  status: DbActivityStatus;
  community: { id: string; slug: string; name: string; verified: boolean };
  interests: { interestId: string }[];
  _confirmedRsvpCount: number;
};

export function toDemoActivity(row: ActivityRow): DemoActivity {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    titleSq: row.titleSq,
    summary: row.summary,
    summarySq: row.summarySq,
    category: CATEGORY_FROM_DB[row.category],
    interestTags: row.interests.map((i) => i.interestId) as DemoActivity["interestTags"],
    areaSq: row.areaSq,
    areaEn: row.areaEn,
    venueName: row.venueName,
    lat: row.lat,
    lng: row.lng,
    date: row.date,
    startTime: row.startTime,
    timezone: row.timezone,
    capacity: row.capacity,
    rsvpCount: row.simulatedRsvpBaseline + row._confirmedRsvpCount,
    cost: COST_FROM_DB[row.cost],
    costDetail: row.costDetail ?? undefined,
    indoor: row.indoor,
    accessibility: row.accessibility ? row.accessibility.split(",").filter(Boolean) : [],
    ageEligibility: AGE_FROM_DB[row.ageEligibility],
    difficulty: DIFFICULTY_FROM_DB[row.difficulty],
    organizer: toOrganizer(row.community),
    communitySlug: row.community.slug,
    description: row.description,
    descriptionSq: row.descriptionSq,
    status: row.status === "CANCELED" ? "canceled" : row.status === "DRAFT" ? "draft" : "published",
  };
}

function toOrganizer(community: { id: string; name: string; verified: boolean }): Organizer {
  return { id: community.id, name: community.name, verified: community.verified };
}
