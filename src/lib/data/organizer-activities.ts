import "server-only";
import { prisma } from "@/lib/prisma";
import type { ActivityCategory, DemoActivity, InterestId } from "@/lib/types";
import { AGE_TO_DB, CATEGORY_TO_DB, COST_TO_DB, DIFFICULTY_TO_DB } from "./mappers";
import { assertCommunityOrganizer } from "./communities";
import { notifyRsvpHolders } from "./notifications";
import { assertBoundedText, MAX_LONG_TEXT, MAX_SHORT_TEXT } from "@/lib/validation";

export class ActivityValidationError extends Error {}

export interface ActivityInput {
  title: string;
  titleSq: string;
  summary: string;
  summarySq: string;
  category: ActivityCategory;
  areaSq: string;
  areaEn: string;
  venueName: string;
  lat: number;
  lng: number;
  date: string; // "2036-06-13"
  startTime: string; // "18:00"
  capacity: number;
  cost: DemoActivity["cost"];
  costDetail?: string;
  indoor: boolean;
  accessibility: string[];
  ageEligibility: DemoActivity["ageEligibility"];
  difficulty: DemoActivity["difficulty"];
  description: string;
  descriptionSq: string;
  interestTags: InterestId[];
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

function validate(input: ActivityInput): void {
  const required: (keyof ActivityInput)[] = [
    "title",
    "titleSq",
    "summary",
    "summarySq",
    "areaSq",
    "areaEn",
    "venueName",
    "description",
    "descriptionSq",
  ];
  for (const field of required) {
    if (!String(input[field] ?? "").trim()) {
      throw new ActivityValidationError(`${field} is required.`);
    }
  }
  if (!DATE_RE.test(input.date)) throw new ActivityValidationError("Date must be in YYYY-MM-DD format.");
  if (!TIME_RE.test(input.startTime)) throw new ActivityValidationError("Start time must be in HH:MM format.");
  if (!Number.isFinite(input.capacity) || input.capacity < 1) {
    throw new ActivityValidationError("Capacity must be at least 1.");
  }
  if (!Number.isFinite(input.lat) || !Number.isFinite(input.lng)) {
    throw new ActivityValidationError("Location coordinates are required.");
  }
  if (input.cost === "paid" && !input.costDetail?.trim()) {
    throw new ActivityValidationError("Paid activities need a cost detail (e.g. \"€2 at the door\").");
  }
  assertBoundedText(input.description, MAX_LONG_TEXT, "Description");
  assertBoundedText(input.descriptionSq, MAX_LONG_TEXT, "Description (Albanian)");
  assertBoundedText(input.summary, MAX_SHORT_TEXT, "Summary");
  assertBoundedText(input.summarySq, MAX_SHORT_TEXT, "Summary (Albanian)");
}

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "activity"
  );
}

/**
 * Organizer-only, checked server-side via assertCommunityOrganizer.
 * New activities start DRAFT (never PUBLISHED by default) — a moderator
 * must publish before it appears in Discover. See CommunityStatus.DRAFT
 * for the same policy applied to new communities.
 */
export async function createActivity(
  actorId: string,
  communitySlug: string,
  input: ActivityInput
): Promise<string> {
  validate(input);
  const community = await prisma.community.findUniqueOrThrow({ where: { slug: communitySlug } });
  await assertCommunityOrganizer(actorId, community.id);

  const base = slugify(input.title);
  let slug = base;
  let suffix = 1;
  while (await prisma.activity.findUnique({ where: { slug } })) {
    slug = `${base}-${++suffix}`;
  }

  await prisma.activity.create({
    data: {
      slug,
      title: input.title.trim(),
      titleSq: input.titleSq.trim(),
      summary: input.summary.trim(),
      summarySq: input.summarySq.trim(),
      category: CATEGORY_TO_DB[input.category],
      areaSq: input.areaSq.trim(),
      areaEn: input.areaEn.trim(),
      venueName: input.venueName.trim(),
      lat: input.lat,
      lng: input.lng,
      date: input.date,
      startTime: input.startTime,
      capacity: input.capacity,
      simulatedRsvpBaseline: 0,
      cost: COST_TO_DB[input.cost],
      costDetail: input.cost === "paid" ? input.costDetail?.trim() : null,
      indoor: input.indoor,
      accessibility: input.accessibility.join(","),
      ageEligibility: AGE_TO_DB[input.ageEligibility],
      difficulty: DIFFICULTY_TO_DB[input.difficulty],
      description: input.description.trim(),
      descriptionSq: input.descriptionSq.trim(),
      status: "DRAFT",
      organizerId: actorId,
      communityId: community.id,
      interests: { create: input.interestTags.map((interestId) => ({ interestId })) },
    },
  });
  return slug;
}

export async function updateActivity(
  actorId: string,
  activitySlug: string,
  input: ActivityInput
): Promise<void> {
  validate(input);
  const existing = await prisma.activity.findUniqueOrThrow({ where: { slug: activitySlug } });
  await assertCommunityOrganizer(actorId, existing.communityId);

  const scheduleChanged =
    existing.date !== input.date || existing.startTime !== input.startTime || existing.venueName !== input.venueName.trim();

  await prisma.$transaction([
    prisma.activityInterest.deleteMany({ where: { activityId: existing.id } }),
    prisma.activity.update({
      where: { id: existing.id },
      data: {
        title: input.title.trim(),
        titleSq: input.titleSq.trim(),
        summary: input.summary.trim(),
        summarySq: input.summarySq.trim(),
        category: CATEGORY_TO_DB[input.category],
        areaSq: input.areaSq.trim(),
        areaEn: input.areaEn.trim(),
        venueName: input.venueName.trim(),
        lat: input.lat,
        lng: input.lng,
        date: input.date,
        startTime: input.startTime,
        capacity: input.capacity,
        cost: COST_TO_DB[input.cost],
        costDetail: input.cost === "paid" ? input.costDetail?.trim() : null,
        indoor: input.indoor,
        accessibility: input.accessibility.join(","),
        ageEligibility: AGE_TO_DB[input.ageEligibility],
        difficulty: DIFFICULTY_TO_DB[input.difficulty],
        description: input.description.trim(),
        descriptionSq: input.descriptionSq.trim(),
        interests: { create: input.interestTags.map((interestId) => ({ interestId })) },
      },
    }),
  ]);

  if (scheduleChanged) {
    await notifyRsvpHolders(
      existing.id,
      `"${input.title.trim()}" changed its date, time, or venue — check the activity page for the new details.`
    );
  }
}

export async function cancelActivity(actorId: string, activitySlug: string): Promise<void> {
  const existing = await prisma.activity.findUniqueOrThrow({ where: { slug: activitySlug } });
  await assertCommunityOrganizer(actorId, existing.communityId);
  await prisma.activity.update({ where: { id: existing.id }, data: { status: "CANCELED" } });
  await notifyRsvpHolders(existing.id, `"${existing.title}" was canceled by its organizer.`);
}
