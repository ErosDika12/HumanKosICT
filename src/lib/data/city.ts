import "server-only";
import { prisma } from "@/lib/prisma";
import { assertRole, type Actor } from "@/lib/auth/roles";
import { isHttpUrl } from "@/lib/city-config";
import { assertBoundedText, MAX_LONG_TEXT, MAX_SHORT_TEXT } from "@/lib/validation";

export interface CityServiceView {
  id: string;
  slug: string;
  name: string;
  nameSq: string;
  description: string;
  descriptionSq: string;
  category: string;
  officialUrl: string;
  sourceName: string;
  reviewedAt: Date;
}

export interface CityNoticeView {
  id: string;
  title: string;
  titleSq: string;
  body: string;
  bodySq: string;
  sourceName: string;
  sourceUrl: string | null;
  publishedAt: Date;
  expiresAt: Date | null;
}

/** A service entry older than this is shown as "needs re-checking" instead of looking current. */
export const STALE_REVIEW_DAYS = 180;

export function isReviewStale(reviewedAt: Date, now: Date = new Date()): boolean {
  return now.getTime() - reviewedAt.getTime() > STALE_REVIEW_DAYS * 24 * 60 * 60 * 1000;
}

function required(value: string | undefined | null, field: string): string {
  const v = (value ?? "").trim();
  if (!v) throw new Error(`${field} is required.`);
  return v;
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "service"
  );
}

// ---------------------------------------------------------------------------
// Service directory
// ---------------------------------------------------------------------------

/** Only PUBLISHED entries; each one always carries its source and review date. */
export async function listPublishedServices(): Promise<CityServiceView[]> {
  return prisma.cityService.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      nameSq: true,
      description: true,
      descriptionSq: true,
      category: true,
      officialUrl: true,
      sourceName: true,
      reviewedAt: true,
    },
  });
}

export interface ServiceInput {
  name: string;
  nameSq: string;
  description: string;
  descriptionSq: string;
  category: string;
  officialUrl: string;
  sourceName: string;
  reviewedAt: Date;
  publish: boolean;
}

/** Moderator-only. A service must name its source and an official http(s) link — nothing is published unverified. */
export async function createService(actor: Actor, input: ServiceInput): Promise<string> {
  assertRole(actor, "MODERATOR");
  const name = required(input.name, "Name");
  const nameSq = required(input.nameSq, "Name (Albanian)");
  const description = required(input.description, "Description");
  const descriptionSq = required(input.descriptionSq, "Description (Albanian)");
  const category = required(input.category, "Category");
  const sourceName = required(input.sourceName, "Source");
  const officialUrl = required(input.officialUrl, "Official link");
  if (!isHttpUrl(officialUrl)) throw new Error("Enter a valid http(s) link.");
  assertBoundedText(description, MAX_LONG_TEXT, "Description");
  assertBoundedText(descriptionSq, MAX_LONG_TEXT, "Description (Albanian)");
  assertBoundedText(name, MAX_SHORT_TEXT, "Name");
  if (Number.isNaN(input.reviewedAt.getTime()) || input.reviewedAt.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
    throw new Error("Review date must be a valid date that is not in the future.");
  }

  const base = slugify(name);
  let slug = base;
  let n = 1;
  while (await prisma.cityService.findUnique({ where: { slug } })) slug = `${base}-${++n}`;

  const created = await prisma.cityService.create({
    data: {
      slug,
      name,
      nameSq,
      description,
      descriptionSq,
      category,
      officialUrl,
      sourceName,
      reviewedAt: input.reviewedAt,
      status: input.publish ? "PUBLISHED" : "DRAFT",
      createdById: actor.id,
    },
  });
  return created.id;
}

export async function setServiceStatus(actor: Actor, id: string, status: "DRAFT" | "PUBLISHED" | "ARCHIVED"): Promise<void> {
  assertRole(actor, "MODERATOR");
  await prisma.cityService.update({ where: { id }, data: { status } });
}

export async function listAllServicesForStaff(actor: Actor) {
  assertRole(actor, "MODERATOR");
  return prisma.cityService.findMany({ orderBy: { createdAt: "desc" } });
}

// ---------------------------------------------------------------------------
// Notices
// ---------------------------------------------------------------------------

/** Published, already started, and not expired. Expired notices disappear without anyone deleting them. */
export async function listActiveNotices(now: Date = new Date()): Promise<CityNoticeView[]> {
  return prisma.cityNotice.findMany({
    where: {
      status: "PUBLISHED",
      publishedAt: { lte: now },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      titleSq: true,
      body: true,
      bodySq: true,
      sourceName: true,
      sourceUrl: true,
      publishedAt: true,
      expiresAt: true,
    },
  });
}

export interface NoticeInput {
  title: string;
  titleSq: string;
  body: string;
  bodySq: string;
  sourceName: string;
  sourceUrl?: string;
  publishedAt: Date;
  expiresAt?: Date | null;
}

export async function createNotice(actor: Actor, input: NoticeInput): Promise<string> {
  assertRole(actor, "MODERATOR");
  const title = required(input.title, "Title");
  const titleSq = required(input.titleSq, "Title (Albanian)");
  const body = required(input.body, "Text");
  const bodySq = required(input.bodySq, "Text (Albanian)");
  const sourceName = required(input.sourceName, "Source");
  const sourceUrl = (input.sourceUrl ?? "").trim();
  if (sourceUrl && !isHttpUrl(sourceUrl)) throw new Error("Enter a valid http(s) link.");
  assertBoundedText(body, MAX_LONG_TEXT, "Text");
  assertBoundedText(bodySq, MAX_LONG_TEXT, "Text (Albanian)");
  if (Number.isNaN(input.publishedAt.getTime())) throw new Error("Publication date must be a valid date.");
  if (input.expiresAt && input.expiresAt.getTime() <= input.publishedAt.getTime()) {
    throw new Error("Expiry must be after the publication date.");
  }

  const created = await prisma.cityNotice.create({
    data: {
      title,
      titleSq,
      body,
      bodySq,
      sourceName,
      sourceUrl: sourceUrl || null,
      publishedAt: input.publishedAt,
      expiresAt: input.expiresAt ?? null,
      status: "PUBLISHED",
      createdById: actor.id,
    },
  });
  return created.id;
}

export async function archiveNotice(actor: Actor, id: string): Promise<void> {
  assertRole(actor, "MODERATOR");
  await prisma.cityNotice.update({ where: { id }, data: { status: "ARCHIVED" } });
}
