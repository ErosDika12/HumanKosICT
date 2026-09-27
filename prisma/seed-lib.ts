/**
 * Deterministic seed data for KOSOVO 2036 — HUMAN NETWORK.
 *
 * Kept independent of anything importing the "server-only" marker package
 * (src/lib/data/*) so this file runs equally well from the CLI seed script
 * (via tsx, plain Node — no bundler "react-server" export condition) and
 * from vitest.
 *
 * Source of truth for content is src/lib/demo-data.ts (Phase 1) — this file
 * only converts that fictional content into Prisma rows, per
 * docs/DEMO_DATA.md "What Phase 2 must preserve."
 */
import type { PrismaClient, Role } from "@prisma/client";
import { ACTIVITIES, COMMUNITIES } from "../src/lib/demo-data";
import { INTERESTS } from "../src/lib/types";
import bcrypt from "bcryptjs";

const CATEGORY_TO_DB = {
  sports: "SPORTS",
  education: "EDUCATION",
  culture: "CULTURE",
  community: "COMMUNITY",
  technology: "TECHNOLOGY",
  environment: "ENVIRONMENT",
} as const;

const COST_TO_DB = { free: "FREE", paid: "PAID" } as const;

const AGE_TO_DB = {
  "all-ages": "ALL_AGES",
  "adults-only": "ADULTS_ONLY",
  "supervised-minors": "SUPERVISED_MINORS",
} as const;

const DIFFICULTY_TO_DB = {
  beginner: "BEGINNER",
  intermediate: "INTERMEDIATE",
  advanced: "ADVANCED",
  "all-levels": "ALL_LEVELS",
} as const;

/** Documented, shared demo-only credential — never a production password. */
export const DEMO_PERSONA_PASSWORD = "Demo-2036!";

interface DemoPersonaSeed {
  id: string;
  email: string;
  name: string;
  nameSq: string;
  role: Role;
  isDiscoverable: boolean;
  bio?: string;
}

export const DEMO_PERSONAS: DemoPersonaSeed[] = [
  {
    id: "user-arta",
    email: "arta.krasniqi@demo.humannetwork.example",
    name: "Arta Krasniqi",
    nameSq: "Arta Krasniqi",
    role: "MEMBER",
    isDiscoverable: true,
    bio: "Loves Saturday workshops and photography walks around the city center.",
  },
  {
    id: "user-blerta",
    email: "blerta.hoxha@demo.humannetwork.example",
    name: "Blerta Hoxha",
    nameSq: "Blerta Hoxha",
    role: "MEMBER",
    isDiscoverable: false,
  },
  {
    id: "user-drin",
    email: "drin.gashi@demo.humannetwork.example",
    name: "Drin Gashi",
    nameSq: "Drin Gashi",
    role: "ORGANIZER",
    isDiscoverable: true,
    bio: "Organizes Prishtina AI Klub's weekly workshops.",
  },
  {
    id: "user-fatlume",
    email: "fatlume.berisha@demo.humannetwork.example",
    name: "Fatlume Berisha",
    nameSq: "Fatlume Berisha",
    role: "ORGANIZER",
    isDiscoverable: true,
    bio: "Coordinates Gjelbër për Prishtinën's neighborhood clean-ups.",
  },
  {
    id: "user-njomeza",
    email: "njomeza.krasniqi@demo.humannetwork.example",
    name: "Njomëza Krasniqi",
    nameSq: "Njomëza Krasniqi",
    role: "ORGANIZER",
    isDiscoverable: false,
  },
  {
    id: "user-yll",
    email: "yll.morina@demo.humannetwork.example",
    name: "Yll Morina",
    nameSq: "Yll Morina",
    role: "ORGANIZER",
    isDiscoverable: true,
    bio: "Runs Sunny Hill's monthly cultural evenings.",
  },
  {
    id: "user-elmedina",
    email: "elmedina.tahiri@demo.humannetwork.example",
    name: "Elmedina Tahiri",
    nameSq: "Elmedina Tahiri",
    role: "MODERATOR",
    isDiscoverable: false,
  },
  {
    id: "user-agron",
    email: "agron.sylaj@demo.humannetwork.example",
    name: "Agron Sylaj",
    nameSq: "Agron Sylaj",
    role: "MUNICIPALITY_ANALYST",
    isDiscoverable: false,
  },
];

const COMMUNITY_ORGANIZER: Record<string, string> = {
  "prishtina-ai-klub": "user-drin",
  "gjelber-per-prishtinen": "user-fatlume",
  "rinia-basketboll-lakrishte": "user-njomeza",
  "kolektivi-kulturor-prizreni-i-vjeter": "user-yll",
};

export async function seedDatabase(prisma: PrismaClient): Promise<void> {
  const passwordHash = await bcrypt.hash(DEMO_PERSONA_PASSWORD, 12);

  for (const persona of DEMO_PERSONAS) {
    await prisma.user.upsert({
      where: { id: persona.id },
      create: {
        id: persona.id,
        email: persona.email,
        passwordHash,
        role: persona.role,
        name: persona.name,
        nameSq: persona.nameSq,
        bio: persona.bio,
        isDiscoverable: persona.isDiscoverable,
        isDemoPersona: true,
      },
      update: {
        email: persona.email,
        role: persona.role,
        name: persona.name,
        nameSq: persona.nameSq,
        bio: persona.bio,
        isDiscoverable: persona.isDiscoverable,
      },
    });
  }

  for (const interest of INTERESTS) {
    await prisma.interest.upsert({
      where: { id: interest.id },
      create: { id: interest.id, labelEn: interest.labelEn, labelSq: interest.labelSq, emoji: interest.emoji },
      update: { labelEn: interest.labelEn, labelSq: interest.labelSq, emoji: interest.emoji },
    });
  }

  for (const community of COMMUNITIES) {
    const organizerId = COMMUNITY_ORGANIZER[community.slug];
    if (!organizerId) throw new Error(`No seeded organizer mapped for community ${community.slug}`);
    // The two verified community organizers in Phase 1's demo data are the
    // AI club and the environment group; basketball's organizer is
    // unverified — preserved here from the original per-activity flag.
    const verified = community.slug !== "rinia-basketboll-lakrishte";
    await prisma.community.upsert({
      where: { slug: community.slug },
      create: {
        slug: community.slug,
        name: community.name,
        category: CATEGORY_TO_DB[community.category],
        description: community.description,
        descriptionSq: community.descriptionSq,
        areaSq: community.areaSq,
        verified,
        organizerId,
      },
      update: {
        name: community.name,
        category: CATEGORY_TO_DB[community.category],
        description: community.description,
        descriptionSq: community.descriptionSq,
        areaSq: community.areaSq,
        verified,
        organizerId,
      },
    });
  }

  // Every organizer persona is also a member of the community they organize.
  for (const [slug, organizerId] of Object.entries(COMMUNITY_ORGANIZER)) {
    const community = await prisma.community.findUniqueOrThrow({ where: { slug } });
    await prisma.membership.upsert({
      where: { userId_communityId: { userId: organizerId, communityId: community.id } },
      create: { userId: organizerId, communityId: community.id, role: "ORGANIZER" },
      update: { role: "ORGANIZER" },
    });
  }
  // Arta is a member of the AI club (used to demonstrate a real cross-page
  // membership + RSVP journey without any fabricated identity).
  const aiClub = await prisma.community.findUniqueOrThrow({
    where: { slug: "prishtina-ai-klub" },
  });
  await prisma.membership.upsert({
    where: { userId_communityId: { userId: "user-arta", communityId: aiClub.id } },
    create: { userId: "user-arta", communityId: aiClub.id, role: "MEMBER" },
    update: {},
  });

  for (const activity of ACTIVITIES) {
    const community = await prisma.community.findUniqueOrThrow({
      where: { slug: activity.communitySlug },
    });
    await prisma.activity.upsert({
      where: { slug: activity.slug },
      create: {
        slug: activity.slug,
        title: activity.title,
        titleSq: activity.titleSq,
        summary: activity.summary,
        summarySq: activity.summarySq,
        category: CATEGORY_TO_DB[activity.category],
        areaSq: activity.areaSq,
        areaEn: activity.areaEn,
        venueName: activity.venueName,
        lat: activity.lat,
        lng: activity.lng,
        date: activity.date,
        startTime: activity.startTime,
        timezone: activity.timezone,
        capacity: activity.capacity,
        simulatedRsvpBaseline: activity.rsvpCount,
        cost: COST_TO_DB[activity.cost],
        costDetail: activity.costDetail,
        indoor: activity.indoor,
        accessibility: activity.accessibility.join(","),
        ageEligibility: AGE_TO_DB[activity.ageEligibility],
        difficulty: DIFFICULTY_TO_DB[activity.difficulty],
        description: activity.description,
        descriptionSq: activity.descriptionSq,
        organizerId: community.organizerId,
        communityId: community.id,
        interests: {
          create: activity.interestTags.map((interestId) => ({ interestId })),
        },
      },
      update: {
        title: activity.title,
        titleSq: activity.titleSq,
        summary: activity.summary,
        summarySq: activity.summarySq,
        capacity: activity.capacity,
        simulatedRsvpBaseline: activity.rsvpCount,
        description: activity.description,
        descriptionSq: activity.descriptionSq,
      },
    });
  }

  // A real RSVP by a real seeded account, so "refresh and see the same
  // state" has a genuine fixture (see docs/PHASE_STATUS.md verification).
  const aiWorkshop = await prisma.activity.findUniqueOrThrow({
    where: { slug: "punetori-ai-fillestare" },
  });
  await prisma.rsvp.upsert({
    where: { userId_activityId: { userId: "user-arta", activityId: aiWorkshop.id } },
    create: { userId: "user-arta", activityId: aiWorkshop.id, status: "CONFIRMED" },
    update: { status: "CONFIRMED" },
  });

  // One open community need + one open report, so the moderator and
  // (future Phase 7) municipality views have a real fixture immediately.
  const environmentCommunity = await prisma.community.findUniqueOrThrow({
    where: { slug: "gjelber-per-prishtinen" },
  });
  const existingNeed = await prisma.communityNeed.findFirst({
    where: { communityId: environmentCommunity.id },
  });
  if (!existingNeed) {
    await prisma.communityNeed.create({
      data: {
        communityId: environmentCommunity.id,
        category: "ENVIRONMENT",
        areaSq: "Prishtinë — Dardania",
        description:
          "Neighbors have asked for a second monthly clean-up session — the current one fills up within a day.",
        submittedById: "user-fatlume",
      },
    });
  }
}
