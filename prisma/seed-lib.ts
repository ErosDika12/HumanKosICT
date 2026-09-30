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
import {
  DEMO_FRIENDS,
  NEW_ORGANIZERS,
  SEEDED_CONVERSATIONS,
  SEEDED_FRIENDSHIPS,
  serializeAvailability,
} from "../src/lib/demo-social";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

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

/**
 * Local development/test default — a documented, shared demo-only credential.
 * A hosted deployment sets DEMO_STAFF_PASSWORD so the seeded organizer,
 * moderator and analyst accounts are NOT reachable with a publicly known
 * password (see docs/DEMO_RUNBOOK.md). Visitors use the one-click demo login.
 */
export const DEMO_PERSONA_PASSWORD = "Demo-2036!";
export function resolveDemoPersonaPassword(): string {
  return process.env.DEMO_STAFF_PASSWORD || DEMO_PERSONA_PASSWORD;
}

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
  "prishtina-bicikleta": "user-vlora",
  "kuzhina-e-perbashket": "user-besnik",
  "rrethi-i-librit": "user-mirlinda",
};

/**
 * Phase 4: language + rules text and join visibility for the 4 seeded
 * communities. Rinia Basketboll Lakrishtë is deliberately the one
 * RESTRICTED community (a smaller, review-based neighborhood group,
 * consistent with it already being the seed data's one unverified
 * organizer) — a real fixture for the "member must not silently join a
 * restricted group" requirement (joining creates a PENDING membership).
 */
const COMMUNITY_DETAIL: Record<string, { language: string; rules: string; visibility: "PUBLIC" | "RESTRICTED" }> = {
  "prishtina-ai-klub": {
    language: "Albanian, English",
    rules: "Be respectful; no unsolicited direct messages to the supervised teens group's participants.",
    visibility: "PUBLIC",
  },
  "gjelber-per-prishtinen": {
    language: "Albanian",
    rules: "Bring your own gloves if you have them; follow the session lead's safety instructions.",
    visibility: "PUBLIC",
  },
  "rinia-basketboll-lakrishte": {
    language: "Albanian",
    rules: "New members are reviewed by the organizer before joining, to keep sessions small and consistent.",
    visibility: "RESTRICTED",
  },
  "kolektivi-kulturor-prizreni-i-vjeter": {
    language: "Albanian, English (informal)",
    rules: "Performances are typically in Albanian; be considerate of shared equipment.",
    visibility: "PUBLIC",
  },
  "prishtina-bicikleta": {
    language: "Albanian, English",
    rules: "Helmets required on every ride; the slowest rider sets the pace.",
    visibility: "PUBLIC",
  },
  "kuzhina-e-perbashket": {
    language: "Albanian",
    rules: "Everyone helps, everyone eats. Tell us about allergies in advance.",
    visibility: "PUBLIC",
  },
  "rrethi-i-librit": {
    language: "Albanian, English",
    rules: "Be kind to beginners in either language.",
    visibility: "PUBLIC",
  },
};

export async function seedDatabase(prisma: PrismaClient): Promise<void> {
  const passwordHash = await bcrypt.hash(resolveDemoPersonaPassword(), 12);
  // Demo friends are fictional and non-loginable: nobody knows this hash's password.
  const unusableHash = await bcrypt.hash(randomBytes(24).toString("hex"), 10);
  const friendById = new Map(DEMO_FRIENDS.map((f) => [f.id, f]));

  for (const persona of DEMO_PERSONAS) {
    const friend = friendById.get(persona.id);
    const social = {
      isDemoFriend: Boolean(friend),
      areaSq: friend?.areaSq ?? null,
      availability: friend ? serializeAvailability(friend.availability, friend.needsAccessible) : null,
    };
    await prisma.user.upsert({
      where: { id: persona.id },
      create: {
        id: persona.id,
        email: persona.email,
        passwordHash,
        role: persona.role,
        name: persona.name,
        nameSq: persona.nameSq,
        bio: friend?.bio ?? persona.bio,
        isDiscoverable: persona.isDiscoverable,
        isDemoPersona: true,
        ...social,
      },
      update: {
        email: persona.email,
        passwordHash,
        role: persona.role,
        name: persona.name,
        nameSq: persona.nameSq,
        bio: friend?.bio ?? persona.bio,
        isDiscoverable: persona.isDiscoverable,
        ...social,
      },
    });
  }

  // New fictional organizers for the three additional communities.
  for (const org of NEW_ORGANIZERS) {
    await prisma.user.upsert({
      where: { id: org.id },
      create: {
        id: org.id,
        email: org.email,
        passwordHash,
        role: "ORGANIZER",
        name: org.name,
        nameSq: org.name,
        bio: org.bio,
        isDiscoverable: false,
        isDemoPersona: true,
      },
      update: { email: org.email, passwordHash, name: org.name, bio: org.bio },
    });
  }

  // New fictional demo friends: ordinary members, discoverable, non-loginable.
  for (const friend of DEMO_FRIENDS.filter((f) => f.id.startsWith("friend-"))) {
    const slug = friend.name.toLowerCase().normalize("NFKD").replace(/[^a-z]+/g, ".");
    await prisma.user.upsert({
      where: { id: friend.id },
      create: {
        id: friend.id,
        email: `${slug}@demo.humannetwork.example`,
        passwordHash: unusableHash,
        role: "MEMBER",
        name: friend.name,
        nameSq: friend.name,
        bio: friend.bio,
        isDiscoverable: true,
        isDemoPersona: true,
        isDemoFriend: true,
        areaSq: friend.areaSq,
        availability: serializeAvailability(friend.availability, friend.needsAccessible),
      },
      update: {
        name: friend.name,
        bio: friend.bio,
        isDiscoverable: true,
        isDemoFriend: true,
        areaSq: friend.areaSq,
        availability: serializeAvailability(friend.availability, friend.needsAccessible),
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

  // Phase 5: seeded interests for the two personas already marked
  // isDiscoverable — guarantees a real "shared interest" human-matching
  // fixture (Arta + Drin both have "technology") without needing a judge
  // to fill out onboarding first. See docs/DEMO_DATA.md.
  const SEEDED_USER_INTERESTS: Record<string, string[]> = {
    "user-arta": ["technology", "photography"],
    "user-drin": ["technology", "science"],
    "user-fatlume": ["environment", "volunteering"],
    "user-yll": ["culture", "music"],
    ...Object.fromEntries(
      DEMO_FRIENDS.filter((f) => f.id.startsWith("friend-")).map((f) => [f.id, f.interests as string[]])
    ),
  };
  for (const [userId, interestIds] of Object.entries(SEEDED_USER_INTERESTS)) {
    for (const interestId of interestIds) {
      await prisma.userInterest.upsert({
        where: { userId_interestId: { userId, interestId } },
        create: { userId, interestId },
        update: {},
      });
    }
  }

  for (const community of COMMUNITIES) {
    const organizerId = COMMUNITY_ORGANIZER[community.slug];
    if (!organizerId) throw new Error(`No seeded organizer mapped for community ${community.slug}`);
    // The two verified community organizers in Phase 1's demo data are the
    // AI club and the environment group; basketball's organizer is
    // unverified — preserved here from the original per-activity flag.
    const verified = community.slug !== "rinia-basketboll-lakrishte";
    const detail = COMMUNITY_DETAIL[community.slug];
    await prisma.community.upsert({
      where: { slug: community.slug },
      create: {
        slug: community.slug,
        name: community.name,
        category: CATEGORY_TO_DB[community.category],
        description: community.description,
        descriptionSq: community.descriptionSq,
        areaSq: community.areaSq,
        language: detail?.language,
        rules: detail?.rules,
        visibility: detail?.visibility ?? "PUBLIC",
        status: "PUBLISHED",
        verified,
        organizerId,
      },
      update: {
        name: community.name,
        category: CATEGORY_TO_DB[community.category],
        description: community.description,
        descriptionSq: community.descriptionSq,
        areaSq: community.areaSq,
        language: detail?.language,
        rules: detail?.rules,
        visibility: detail?.visibility ?? "PUBLIC",
        status: "PUBLISHED",
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

  // Organizer-confirmed attendance for a real past-under-the-simulated-clock
  // activity (see src/lib/simulated-clock.ts) — gives the Impact page a
  // genuine "attended" fixture without requiring a judge to click through
  // check-in first.
  await prisma.attendance.upsert({
    where: { userId_activityId: { userId: "user-arta", activityId: aiWorkshop.id } },
    create: { userId: "user-arta", activityId: aiWorkshop.id, confirmedById: "user-drin" },
    update: {},
  });

  // Community needs: one environment need (Phase 2) and one youth
  // technology need (Phase 4 brief: "at least one ... youth activity
  // need"), each with a real submitter and, for the environment one, a
  // real supporter — demonstrating "support instead of duplicating."
  const environmentCommunity = await prisma.community.findUniqueOrThrow({
    where: { slug: "gjelber-per-prishtinen" },
  });
  const environmentNeed = await prisma.communityNeed.findFirst({
    where: { communityId: environmentCommunity.id, category: "ENVIRONMENT" },
  });
  const resolvedEnvironmentNeed =
    environmentNeed ??
    (await prisma.communityNeed.create({
      data: {
        communityId: environmentCommunity.id,
        category: "ENVIRONMENT",
        areaSq: "Prishtinë — Dardania",
        description:
          "Neighbors have asked for a second monthly clean-up session — the current one fills up within a day.",
        submittedById: "user-fatlume",
      },
    }));
  // Four distinct real contributors (Fatlume submitted it; Arta, Drin,
  // and Yll support it) — deliberately at/above the Phase 7 small-cell
  // suppression threshold (MIN_DISTINCT_CONTRIBUTORS = 3), so this cell is
  // the one real demand cell shown as a real number in /municipality,
  // while the youth-technology need (1 contributor) stays suppressed —
  // demonstrating the mechanism working in both directions from real seed
  // data, not a contrived fixture. See docs/DEMO_DATA.md.
  for (const supporterId of ["user-arta", "user-drin", "user-yll"]) {
    await prisma.needSupport.upsert({
      where: { userId_needId: { userId: supporterId, needId: resolvedEnvironmentNeed.id } },
      create: { userId: supporterId, needId: resolvedEnvironmentNeed.id },
      update: {},
    });
  }

  const aiClubForNeed = await prisma.community.findUniqueOrThrow({
    where: { slug: "prishtina-ai-klub" },
  });
  const youthNeed = await prisma.communityNeed.findFirst({
    where: { communityId: aiClubForNeed.id, category: "TECHNOLOGY" },
  });
  if (!youthNeed) {
    await prisma.communityNeed.create({
      data: {
        communityId: aiClubForNeed.id,
        category: "TECHNOLOGY",
        areaSq: "Prishtinë — Dardania",
        description:
          "Parents in Dardania have asked for a second weekly youth coding session — the supervised Tuesday one is already full.",
        submittedById: "user-blerta",
      },
    });
  }

  // Projects: real volunteer sign-up counts, no fabricated hours (see
  // schema comment on Attendance and docs/PRODUCT_CONTRACT.md).
  const parkProject = await prisma.project.upsert({
    where: { slug: "kujdesi-per-parkun-dardania" },
    create: {
      slug: "kujdesi-per-parkun-dardania",
      communityId: environmentCommunity.id,
      title: "Ongoing Dardania Park Care",
      titleSq: "Kujdesi i Vazhdueshëm për Parkun në Dardania",
      description:
        "A running volunteer project maintaining the Dardania green space between monthly clean-up events.",
      descriptionSq:
        "Një projekt i vazhdueshëm vullnetar për mbajtjen e hapësirës së gjelbër në Dardania mes aktiviteteve mujore të pastrimit.",
      volunteersNeeded: 20,
    },
    update: {},
  });
  await prisma.projectVolunteer.upsert({
    where: { userId_projectId: { userId: "user-arta", projectId: parkProject.id } },
    create: { userId: "user-arta", projectId: parkProject.id },
    update: {},
  });

  const codingProject = await prisma.project.upsert({
    where: { slug: "kurrikula-kodimi-per-te-rinj" },
    create: {
      slug: "kurrikula-kodimi-per-te-rinj",
      communityId: aiClubForNeed.id,
      title: "Teens Coding Curriculum Volunteers",
      titleSq: "Vullnetarë për Kurrikulën e Kodimit për të Rinj",
      description:
        "Volunteers help prepare supervised lesson materials for the Tuesday teens coding club — no direct unsupervised contact with minors.",
      descriptionSq:
        "Vullnetarët ndihmojnë në përgatitjen e materialeve mësimore të mbikëqyrura për klubin e kodimit të të martave — pa kontakt të drejtpërdrejtë të pambikëqyrur me të miturit.",
      volunteersNeeded: 5,
    },
    update: {},
  });
  await prisma.projectVolunteer.upsert({
    where: { userId_projectId: { userId: "user-drin", projectId: codingProject.id } },
    create: { userId: "user-drin", projectId: codingProject.id },
    update: {},
  });

  // One open report on an activity, so /moderation has a real fixture from
  // the very first run (previously documented but never actually seeded).
  const basketball = await prisma.activity.findUniqueOrThrow({
    where: { slug: "basketboll-i-hapur-lakrishte" },
  });
  const existingReport = await prisma.report.findFirst({
    where: { reporterId: "user-blerta", activityId: basketball.id },
  });
  if (!existingReport) {
    await prisma.report.create({
      data: {
        reporterId: "user-blerta",
        activityId: basketball.id,
        reason: "The listed capacity seems off — more people showed up than 16 last week.",
      },
    });
  }

  // A real notification, so a judge signing in as Arta sees the in-app
  // inbox non-empty on the very first visit.
  const existingNotification = await prisma.notification.findFirst({
    where: { userId: "user-arta", activityId: aiWorkshop.id },
  });
  if (!existingNotification) {
    await prisma.notification.create({
      data: {
        userId: "user-arta",
        activityId: aiWorkshop.id,
        message: `You're going to "${aiWorkshop.title}" — RSVP confirmed.`,
      },
    });
  }

  // Phase 7: a separate, explicitly-labeled SYNTHETIC scenario dataset —
  // no relation to any User row, ever. Exists only to make "several
  // simulated requests for youth technology activities and relatively few
  // relevant events" demonstrable at a realistic scale without creating
  // many fake individual accounts. See docs/DEMO_DATA.md and
  // docs/PRODUCT_CONTRACT.md.
  const SCENARIO_DEMAND: { areaSq: string; category: keyof typeof CATEGORY_TO_DB; syntheticCount: number; note: string }[] = [
    {
      areaSq: "Prishtinë — Dardania",
      category: "technology",
      syntheticCount: 14,
      note: "Scenario assumption: simulated parent/guardian requests for youth technology activities in this area, this demo period.",
    },
    {
      areaSq: "Prishtinë — Dardania",
      category: "environment",
      syntheticCount: 6,
      note: "Scenario assumption: simulated requests for additional neighborhood environmental sessions.",
    },
    {
      areaSq: "Prishtinë — Lakrishtë",
      category: "sports",
      syntheticCount: 3,
      note: "Scenario assumption: simulated requests for additional youth sports sessions.",
    },
  ];
  for (const s of SCENARIO_DEMAND) {
    const category = CATEGORY_TO_DB[s.category];
    await prisma.municipalityScenarioDemand.upsert({
      where: { areaSq_category: { areaSq: s.areaSq, category } },
      create: { areaSq: s.areaSq, category, syntheticCount: s.syntheticCount, note: s.note },
      update: { syntheticCount: s.syntheticCount, note: s.note },
    });
  }

  // ---------------------------------------------------------------------
  // Phase 9: demo friends' memberships, friendships, example conversations,
  // example plans, real RSVPs, extra needs, and the flagship BRIDGE project.
  // Everything is fictional and idempotent (safe to re-run on every deploy).
  // ---------------------------------------------------------------------
  for (const friend of DEMO_FRIENDS) {
    for (const communitySlug of friend.communities) {
      const community = await prisma.community.findUniqueOrThrow({ where: { slug: communitySlug } });
      await prisma.membership.upsert({
        where: { userId_communityId: { userId: friend.id, communityId: community.id } },
        create: {
          userId: friend.id,
          communityId: community.id,
          role: COMMUNITY_ORGANIZER[communitySlug] === friend.id ? "ORGANIZER" : "MEMBER",
        },
        update: {},
      });
    }
  }

  for (const [a, b] of SEEDED_FRIENDSHIPS) {
    for (const [userId, friendId] of [[a, b], [b, a]]) {
      await prisma.friendship.upsert({
        where: { userId_friendId: { userId, friendId } },
        create: { userId, friendId, isSeededExample: true },
        update: {},
      });
    }
  }

  // Example conversations between seeded personas (never touches visitor-owned rows).
  await prisma.message.deleteMany({
    where: { isSeededExample: true, sender: { isDemoVisitor: false }, recipient: { isDemoVisitor: false } },
  });
  const conversationStart = Date.now() - SEEDED_CONVERSATIONS.length * 60_000;
  for (const [i, m] of SEEDED_CONVERSATIONS.entries()) {
    await prisma.message.create({
      data: {
        senderId: m.from,
        recipientId: m.to,
        body: m.body,
        isSeededExample: true,
        createdAt: new Date(conversationStart + i * 60_000),
        readAt: new Date(conversationStart + i * 60_000 + 30_000),
      },
    });
  }

  const activityBySlug = async (slug: string) => prisma.activity.findUniqueOrThrow({ where: { slug } });
  const photoWalk = await activityBySlug("shetitje-fotografike-qender");
  const dataNight = await activityBySlug("nate-e-te-dhenave-qytetare");
  const seededInvites: {
    activityId: string;
    fromUserId: string;
    toUserId: string;
    status: "ACCEPTED" | "PENDING";
    message: string;
    replyNote?: string;
  }[] = [
    {
      activityId: photoWalk.id,
      fromUserId: "user-arta",
      toUserId: "friend-era",
      status: "ACCEPTED",
      message: "Golden hour on Saturday — come shoot with me?",
      replyNote: "Demo example: accepted.",
    },
    {
      activityId: dataNight.id,
      fromUserId: "friend-lulzim",
      toUserId: "user-arta",
      status: "PENDING",
      message: "Want to pair up on the data night? I will bring the laptops.",
    },
  ];
  for (const invite of seededInvites) {
    await prisma.activityInvite.upsert({
      where: {
        activityId_fromUserId_toUserId: {
          activityId: invite.activityId,
          fromUserId: invite.fromUserId,
          toUserId: invite.toUserId,
        },
      },
      create: { ...invite, isSeededExample: true },
      update: {},
    });
  }

  // Real RSVPs by fictional friends, so activities and plans feel populated.
  const FRIEND_RSVPS: [string, string][] = [
    ["friend-era", "shetitje-fotografike-qender"],
    ["friend-lulzim", "nate-e-te-dhenave-qytetare"],
    ["friend-lulzim", "laborator-ideshe-eko-teknologji"],
    ["friend-kaltrina", "mbjellja-e-pemeve-dardania"],
    ["friend-kaltrina", "ecje-me-biciklete-ulpiana"],
    ["friend-blend", "mbremje-poezie-dhe-muzike"],
    ["friend-ilir", "mbremje-poezie-dhe-muzike"],
    ["friend-vesa", "pazar-i-hapur-lokal"],
    ["friend-diellza", "rrethi-i-librit-shqip-anglisht"],
    ["user-arta", "laborator-ideshe-eko-teknologji"],
  ];
  for (const [userId, slug] of FRIEND_RSVPS) {
    const activity = await activityBySlug(slug);
    await prisma.rsvp.upsert({
      where: { userId_activityId: { userId, activityId: activity.id } },
      create: { userId, activityId: activity.id, status: "CONFIRMED" },
      update: { status: "CONFIRMED" },
    });
  }

  // Two more real needs (one clears the small-cell threshold, one stays suppressed).
  const kitchen = await prisma.community.findUniqueOrThrow({ where: { slug: "kuzhina-e-perbashket" } });
  const cycling = await prisma.community.findUniqueOrThrow({ where: { slug: "prishtina-bicikleta" } });
  const kitchenNeed =
    (await prisma.communityNeed.findFirst({ where: { communityId: kitchen.id, category: "COMMUNITY" } })) ??
    (await prisma.communityNeed.create({
      data: {
        communityId: kitchen.id,
        category: "COMMUNITY",
        areaSq: "Prishtinë — Sunny Hill",
        description: "Older residents in Sunny Hill ask for a weekly low-cost shared meal they can walk to.",
        submittedById: "user-besnik",
      },
    }));
  for (const supporterId of ["friend-vesa", "user-yll"]) {
    await prisma.needSupport.upsert({
      where: { userId_needId: { userId: supporterId, needId: kitchenNeed.id } },
      create: { userId: supporterId, needId: kitchenNeed.id },
      update: {},
    });
  }
  const cyclingNeed =
    (await prisma.communityNeed.findFirst({ where: { communityId: cycling.id, category: "SPORTS" } })) ??
    (await prisma.communityNeed.create({
      data: {
        communityId: cycling.id,
        category: "SPORTS",
        areaSq: "Prishtinë — Ulpiana",
        description: "Riders ask for a marked, safer bike route between Ulpiana and the city center.",
        submittedById: "user-vlora",
      },
    }));
  await prisma.needSupport.upsert({
    where: { userId_needId: { userId: "friend-kaltrina", needId: cyclingNeed.id } },
    create: { userId: "friend-kaltrina", needId: cyclingNeed.id },
    update: {},
  });

  // Flagship BRIDGE example, already accepted by its organizers so the whole
  // story (need -> proposal -> project -> volunteers -> kickoff session) is
  // visible. A human decision is never overwritten by regeneration (bridge.ts).
  const [communityAId, communityBId] = [aiClubForNeed.id, environmentCommunity.id].sort();
  const flagshipProject = await prisma.project.upsert({
    where: { slug: "collaboration-prishtina-ai-klub-gjelber-per-prishtinen" },
    create: {
      slug: "collaboration-prishtina-ai-klub-gjelber-per-prishtinen",
      communityId: environmentCommunity.id,
      title: "Collaboration: Prishtina AI Klub × Gjelbër për Prishtinën",
      titleSq: "Bashkëpunim: Prishtina AI Klub × Gjelbër për Prishtinën",
      description:
        "Prototype low-cost soil-moisture and litter sensors plus a simple volunteer app for Dardania's park, then run the first joint session — the Eco-Tech Idea Lab on 25 June. Fictional demo project.",
      descriptionSq:
        "Prototipizoni sensorë të lirë për lagështinë e tokës dhe mbeturinat plus një aplikacion të thjeshtë për vullnetarë në parkun e Dardanisë, pastaj mbani sesionin e parë të përbashkët — Laboratori i Ideve Eko-Teknologji më 25 qershor. Projekt demonstrues fiktiv.",
      volunteersNeeded: 12,
    },
    update: { volunteersNeeded: 12 },
  });
  for (const volunteerId of ["user-arta", "friend-lulzim", "friend-kaltrina"]) {
    await prisma.projectVolunteer.upsert({
      where: { userId_projectId: { userId: volunteerId, projectId: flagshipProject.id } },
      create: { userId: volunteerId, projectId: flagshipProject.id },
      update: {},
    });
  }
  const ecoLab = await activityBySlug("laborator-ideshe-eko-teknologji");
  await prisma.bridgeProposal.upsert({
    where: {
      communityAId_communityBId_needId: { communityAId, communityBId, needId: resolvedEnvironmentNeed.id },
    },
    create: {
      communityAId,
      communityBId,
      needId: resolvedEnvironmentNeed.id,
      score: 8,
      reason:
        "Complementary categories (technology + environment); Both can act locally in Prishtinë — Dardania; Gjelbër për Prishtinën directly works in this need's category (environment); At least one community has an upcoming scheduled activity to build on; Shared audience interest: environment, volunteering",
      mutualBenefit:
        "Prishtina AI Klub brings technology expertise; Gjelbër për Prishtinën brings environment reach in Prishtinë — Dardania. Together they can directly address neighbors' request for a second clean-up session by making volunteer coordination and park monitoring easier.",
      requiredResources:
        "A shared room in Dardania, volunteer time from both communities, and coordination between Drin Gashi (Prishtina AI Klub) and Fatlume Berisha (Gjelbër për Prishtinën).",
      suggestedNextAction:
        "Join the Eco-Tech Idea Lab on 25 June, pick a prototype task, and volunteer on the collaboration project.",
      status: "ACCEPTED",
      draftProjectId: flagshipProject.id,
      kickoffActivityId: ecoLab.id,
      decidedById: "user-fatlume",
      decidedAt: new Date(),
    },
    update: { status: "ACCEPTED", draftProjectId: flagshipProject.id, kickoffActivityId: ecoLab.id },
  });
}
