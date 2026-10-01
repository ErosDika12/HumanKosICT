import "server-only";
import { prisma } from "@/lib/prisma";
import { CATEGORY_FROM_DB } from "./mappers";
import { assertCommunityOrganizer, CommunityAuthorizationError } from "./communities";
import { SIMULATED_NOW_ISO, isSimulatedPast } from "@/lib/simulated-clock";
import {
  computeBridgeNextStep,
  computeBridgeStages,
  type BridgeNextStep,
  type BridgeStage,
} from "./bridge-stages";
import {
  generateBridgeCandidates,
  type BridgeCommunityInput,
  type BridgeNeedInput,
} from "./bridge-scoring";

/**
 * Regenerates SUGGESTED BRIDGE proposals from live data. Called at the top
 * of /bridge's page load (cheap at this dataset's scale — a handful of
 * communities and needs) so proposals are always current: "recompute or
 * invalidate when inputs change" without needing scattered event hooks on
 * every community/need/activity mutation.
 *
 * Never touches a proposal an organizer has already decided on (SAVED,
 * ACCEPTED, DECLINED) — only SUGGESTED/INVALIDATED rows are written here.
 */
export async function regenerateBridgeProposals(): Promise<void> {
  const communityRows = await prisma.community.findMany({
    orderBy: { id: "asc" },
    include: {
      organizer: { select: { name: true } },
      activities: {
        select: { status: true, date: true, interests: { select: { interestId: true } } },
      },
    },
  });

  const communities: BridgeCommunityInput[] = communityRows.map((c) => ({
    id: c.id,
    name: c.name,
    category: CATEGORY_FROM_DB[c.category],
    areaSq: c.areaSq,
    status: c.status === "PUBLISHED" ? "published" : "draft",
    organizerName: c.organizer.name,
    activityInterestTags: Array.from(
      new Set(c.activities.flatMap((a) => a.interests.map((i) => i.interestId)))
    ),
    hasUpcomingActivity: c.activities.some(
      (a) => a.status === "PUBLISHED" && a.date >= SIMULATED_NOW_ISO
    ),
  }));

  const needRows = await prisma.communityNeed.findMany();
  const needs: BridgeNeedInput[] = needRows.map((n) => ({
    id: n.id,
    category: CATEGORY_FROM_DB[n.category],
    areaSq: n.areaSq,
    description: n.description,
    status: n.status === "IN_PROGRESS" ? "in_progress" : n.status === "RESOLVED" ? "resolved" : "open",
  }));

  const candidates = generateBridgeCandidates(communities, needs);
  const communityById = new Map(communities.map((c) => [c.id, c]));
  const needById = new Map(needs.map((n) => [n.id, n]));

  // Invalidate any SUGGESTED row whose exact (pair, need) is no longer the
  // fresh top candidate — the need resolved, a different need now wins for
  // that pair, or the score fell below threshold.
  const suggested = await prisma.bridgeProposal.findMany({ where: { status: "SUGGESTED" } });
  for (const row of suggested) {
    const stillValid = candidates.some(
      (c) =>
        c.communityAId === row.communityAId &&
        c.communityBId === row.communityBId &&
        c.needId === row.needId
    );
    if (!stillValid) {
      await prisma.bridgeProposal.update({ where: { id: row.id }, data: { status: "INVALIDATED" } });
    }
  }

  for (const candidate of candidates) {
    const a = communityById.get(candidate.communityAId)!;
    const b = communityById.get(candidate.communityBId)!;
    const need = needById.get(candidate.needId)!;

    const existing = await prisma.bridgeProposal.findUnique({
      where: {
        communityAId_communityBId_needId: {
          communityAId: candidate.communityAId,
          communityBId: candidate.communityBId,
          needId: candidate.needId,
        },
      },
    });
    // A human decision is permanent — never overwritten by regeneration.
    if (existing && existing.status !== "SUGGESTED" && existing.status !== "INVALIDATED") continue;

    const { mutualBenefit, requiredResources, suggestedNextAction } = composeNarrative(a, b, need);
    const reason = candidate.reasons.join("; ");
    // Unchanged SUGGESTED rows need no write — keeps this cheap on a remote database.
    if (
      existing &&
      existing.status === "SUGGESTED" &&
      existing.score === candidate.score &&
      existing.reason === reason &&
      existing.mutualBenefit === mutualBenefit &&
      existing.requiredResources === requiredResources &&
      existing.suggestedNextAction === suggestedNextAction
    ) {
      continue;
    }
    await prisma.bridgeProposal.upsert({
      where: {
        communityAId_communityBId_needId: {
          communityAId: candidate.communityAId,
          communityBId: candidate.communityBId,
          needId: candidate.needId,
        },
      },
      create: {
        communityAId: candidate.communityAId,
        communityBId: candidate.communityBId,
        needId: candidate.needId,
        score: candidate.score,
        reason: candidate.reasons.join("; "),
        mutualBenefit,
        requiredResources,
        suggestedNextAction,
        status: "SUGGESTED",
      },
      update: {
        score: candidate.score,
        reason: candidate.reasons.join("; "),
        mutualBenefit,
        requiredResources,
        suggestedNextAction,
        status: "SUGGESTED",
      },
    });
  }
}

const ENSURE_TTL_MS = 60_000;
let ensureInFlight: Promise<void> | null = null;
let ensuredAt = 0;

/**
 * Page-render entry point: regenerates at most once per minute per server
 * instance and shares one in-flight run between concurrent requests. Before
 * this, every homepage / BRIDGE / needs request ran dozens of sequential
 * writes, which exhausted the database connection pool under light traffic.
 * Mutations (and tests) that need an immediate refresh call
 * `regenerateBridgeProposals` directly.
 */
export async function ensureBridgeProposals(): Promise<void> {
  if (Date.now() - ensuredAt < ENSURE_TTL_MS) return;
  if (!ensureInFlight) {
    ensureInFlight = regenerateBridgeProposals()
      .then(() => {
        ensuredAt = Date.now();
      })
      .finally(() => {
        ensureInFlight = null;
      });
  }
  await ensureInFlight;
}

function composeNarrative(
  a: BridgeCommunityInput,
  b: BridgeCommunityInput,
  need: BridgeNeedInput
): { mutualBenefit: string; requiredResources: string; suggestedNextAction: string } {
  const scheduledCommunity = a.hasUpcomingActivity ? a.name : b.hasUpcomingActivity ? b.name : null;
  return {
    mutualBenefit: `${a.name} brings ${a.category} expertise; ${b.name} brings ${b.category} reach in ${need.areaSq}. Together they can directly address: "${need.description}"`,
    requiredResources: `A shared venue in ${need.areaSq}, volunteer time from both communities, and coordination between ${a.organizerName} (${a.name}) and ${b.organizerName} (${b.name}).`,
    suggestedNextAction: scheduledCommunity
      ? `${a.organizerName} and ${b.organizerName} meet to scope a joint workshop or project, building on ${scheduledCommunity}'s already-scheduled activity.`
      : `${a.organizerName} and ${b.organizerName} meet to scope a joint workshop or project addressing the need.`,
  };
}

export interface BridgeProposalSummary {
  id: string;
  communityAId: string;
  communityASlug: string;
  communityAName: string;
  communityBId: string;
  communityBSlug: string;
  communityBName: string;
  needId: string;
  needDescription: string;
  needAreaSq: string;
  score: number;
  reason: string;
  status: "suggested" | "saved" | "accepted" | "declined";
}

/** Active proposals only — INVALIDATED rows are excluded (kept for audit, not display). */
export async function listBridgeProposals(): Promise<BridgeProposalSummary[]> {
  const rows = await prisma.bridgeProposal.findMany({
    where: { status: { in: ["SUGGESTED", "SAVED", "ACCEPTED", "DECLINED"] } },
    include: {
      communityA: { select: { id: true, slug: true, name: true } },
      communityB: { select: { id: true, slug: true, name: true } },
      need: { select: { id: true, description: true, areaSq: true } },
    },
    orderBy: [{ score: "desc" }, { createdAt: "asc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    communityAId: r.communityA.id,
    communityASlug: r.communityA.slug,
    communityAName: r.communityA.name,
    communityBId: r.communityB.id,
    communityBSlug: r.communityB.slug,
    communityBName: r.communityB.name,
    needId: r.need.id,
    needDescription: r.need.description,
    needAreaSq: r.need.areaSq,
    score: r.score,
    reason: r.reason,
    status: r.status.toLowerCase() as BridgeProposalSummary["status"],
  }));
}

export interface BridgeProposalDetail extends BridgeProposalSummary {
  mutualBenefit: string;
  requiredResources: string;
  suggestedNextAction: string;
  draftProjectSlug: string | null;
  decidedByName: string | null;
  viewerCanDecide: boolean;
}

export async function getBridgeProposal(id: string, viewerId?: string): Promise<BridgeProposalDetail | null> {
  const r = await prisma.bridgeProposal.findUnique({
    where: { id },
    include: {
      communityA: { select: { id: true, slug: true, name: true } },
      communityB: { select: { id: true, slug: true, name: true } },
      need: { select: { id: true, description: true, areaSq: true } },
      draftProject: { select: { slug: true } },
      decidedBy: { select: { name: true } },
    },
  });
  if (!r) return null;

  let viewerCanDecide = false;
  if (viewerId) {
    viewerCanDecide = await Promise.all([
      assertCommunityOrganizer(viewerId, r.communityAId).then(() => true).catch(() => false),
      assertCommunityOrganizer(viewerId, r.communityBId).then(() => true).catch(() => false),
    ]).then(([isA, isB]) => isA || isB);
  }

  return {
    id: r.id,
    communityAId: r.communityA.id,
    communityASlug: r.communityA.slug,
    communityAName: r.communityA.name,
    communityBId: r.communityB.id,
    communityBSlug: r.communityB.slug,
    communityBName: r.communityB.name,
    needId: r.need.id,
    needDescription: r.need.description,
    needAreaSq: r.need.areaSq,
    score: r.score,
    reason: r.reason,
    status: r.status.toLowerCase() as BridgeProposalSummary["status"],
    mutualBenefit: r.mutualBenefit,
    requiredResources: r.requiredResources,
    suggestedNextAction: r.suggestedNextAction,
    draftProjectSlug: r.draftProject?.slug ?? null,
    decidedByName: r.decidedBy?.name ?? null,
    viewerCanDecide,
  };
}

async function assertBridgeOrganizer(actorId: string, proposalId: string) {
  const proposal = await prisma.bridgeProposal.findUniqueOrThrow({ where: { id: proposalId } });
  const isA = await assertCommunityOrganizer(actorId, proposal.communityAId).then(() => true).catch(() => false);
  if (isA) return proposal;
  const isB = await assertCommunityOrganizer(actorId, proposal.communityBId).then(() => true).catch(() => false);
  if (isB) return proposal;
  throw new CommunityAuthorizationError(
    "Only an organizer of one of the two proposed communities can act on this proposal."
  );
}

export async function saveBridgeProposal(actorId: string, proposalId: string): Promise<void> {
  await assertBridgeOrganizer(actorId, proposalId);
  await prisma.bridgeProposal.update({ where: { id: proposalId }, data: { status: "SAVED" } });
}

export interface BridgeProposalEdit {
  mutualBenefit?: string;
  requiredResources?: string;
  suggestedNextAction?: string;
}

export async function updateBridgeProposal(
  actorId: string,
  proposalId: string,
  edit: BridgeProposalEdit
): Promise<void> {
  await assertBridgeOrganizer(actorId, proposalId);
  await prisma.bridgeProposal.update({
    where: { id: proposalId },
    data: {
      ...(edit.mutualBenefit !== undefined ? { mutualBenefit: edit.mutualBenefit.trim() } : {}),
      ...(edit.requiredResources !== undefined ? { requiredResources: edit.requiredResources.trim() } : {}),
      ...(edit.suggestedNextAction !== undefined
        ? { suggestedNextAction: edit.suggestedNextAction.trim() }
        : {}),
    },
  });
}

export async function declineBridgeProposal(actorId: string, proposalId: string): Promise<void> {
  await assertBridgeOrganizer(actorId, proposalId);
  await prisma.bridgeProposal.update({
    where: { id: proposalId },
    data: { status: "DECLINED", decidedById: actorId, decidedAt: new Date() },
  });
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "collaboration"
  );
}

/**
 * "Only a human organizer can accept ... a proposal" and no automated
 * partnership: accepting is the one action that materializes a real
 * Project row (status ACTIVE), always requiring an explicit organizer
 * click — nothing here runs on its own.
 */
export async function acceptBridgeProposal(actorId: string, proposalId: string): Promise<string> {
  const proposal = await assertBridgeOrganizer(actorId, proposalId);
  if (proposal.status === "ACCEPTED") {
    const existing = await prisma.project.findUniqueOrThrow({ where: { id: proposal.draftProjectId! } });
    return existing.slug;
  }

  const [communityA, communityB, need] = await Promise.all([
    prisma.community.findUniqueOrThrow({ where: { id: proposal.communityAId } }),
    prisma.community.findUniqueOrThrow({ where: { id: proposal.communityBId } }),
    prisma.communityNeed.findUniqueOrThrow({ where: { id: proposal.needId } }),
  ]);

  const title = `Collaboration: ${communityA.name} × ${communityB.name}`;
  const base = slugify(title);
  let slug = base;
  let suffix = 1;
  while (await prisma.project.findUnique({ where: { slug } })) {
    slug = `${base}-${++suffix}`;
  }

  // The draft project belongs to the need's own community when it has one
  // (the side that raised the need), otherwise community A by convention.
  const homeCommunityId = need.communityId ?? communityA.id;

  await prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        slug,
        communityId: homeCommunityId,
        title,
        titleSq: title,
        description: `${proposal.mutualBenefit} ${proposal.suggestedNextAction}`,
        descriptionSq: `${proposal.mutualBenefit} ${proposal.suggestedNextAction}`,
        volunteersNeeded: 10,
      },
    });
    await tx.bridgeProposal.update({
      where: { id: proposalId },
      data: {
        status: "ACCEPTED",
        draftProjectId: project.id,
        decidedById: actorId,
        decidedAt: new Date(),
      },
    });
  });

  const created = await prisma.project.findUniqueOrThrow({ where: { slug } });
  return created.slug;
}

/** For the "link it naturally from the relevant community" requirement — shown on community detail pages. */
export async function listBridgeProposalsForCommunity(communityId: string): Promise<BridgeProposalSummary[]> {
  const all = await listBridgeProposals();
  return all.filter((p) => p.communityAId === communityId || p.communityBId === communityId);
}

export interface BridgeGraph {
  nodes: { id: string; label: string; kind: "community" | "need" }[];
  edges: { from: string; to: string; label: string }[];
}

/** Only the entities that appear in an active proposal — never the whole community graph. */
export async function getBridgeGraph(): Promise<BridgeGraph> {
  const proposals = await listBridgeProposals();
  const nodes = new Map<string, { id: string; label: string; kind: "community" | "need" }>();
  const edges: BridgeGraph["edges"] = [];

  for (const p of proposals) {
    nodes.set(p.communityAId, { id: p.communityAId, label: p.communityAName, kind: "community" });
    nodes.set(p.communityBId, { id: p.communityBId, label: p.communityBName, kind: "community" });
    nodes.set(p.needId, { id: p.needId, label: p.needDescription, kind: "need" });
    edges.push({ from: p.communityAId, to: p.communityBId, label: p.status });
    edges.push({ from: p.needId, to: p.communityAId, label: "relevant to" });
  }

  return { nodes: Array.from(nodes.values()), edges };
}

// ---------------------------------------------------------------------------
// Phase 9: BRIDGE showcase — the whole story (need -> match -> decision ->
// project -> first session) for one proposal, derived from stored rows only.
// ---------------------------------------------------------------------------

export interface BridgeShowcase {
  id: string;
  status: BridgeProposalSummary["status"];
  score: number;
  communityA: { slug: string; name: string; areaSq: string; category: string };
  communityB: { slug: string; name: string; areaSq: string; category: string };
  need: { description: string; areaSq: string; category: string; supporters: number };
  reason: string;
  mutualBenefit: string;
  requiredResources: string;
  suggestedNextAction: string;
  project: {
    id: string;
    slug: string;
    title: string;
    volunteerCount: number;
    volunteersNeeded: number;
    viewerIsVolunteer: boolean;
  } | null;
  kickoff: {
    slug: string;
    title: string;
    date: string;
    startTime: string;
    venueName: string;
    spotsLeft: number;
    isPast: boolean;
    viewerHasRsvp: boolean;
  } | null;
  stages: BridgeStage[];
  nextStep: BridgeNextStep & { href: string };
  viewerCanDecide: boolean;
}

export async function getFeaturedBridgeId(): Promise<string | null> {
  const accepted = await prisma.bridgeProposal.findFirst({
    where: { status: "ACCEPTED" },
    orderBy: [{ score: "desc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  if (accepted) return accepted.id;
  const top = await prisma.bridgeProposal.findFirst({
    where: { status: { in: ["SAVED", "SUGGESTED"] } },
    orderBy: [{ score: "desc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  return top?.id ?? null;
}

export async function getBridgeShowcase(proposalId: string, viewerId?: string): Promise<BridgeShowcase | null> {
  const r = await prisma.bridgeProposal.findUnique({
    where: { id: proposalId },
    include: {
      communityA: { select: { id: true, slug: true, name: true, areaSq: true, category: true } },
      communityB: { select: { id: true, slug: true, name: true, areaSq: true, category: true } },
      need: {
        select: {
          description: true,
          areaSq: true,
          category: true,
          submittedBy: { select: { isDemoVisitor: true } },
          supports: { where: { user: { isDemoVisitor: false } }, select: { userId: true } },
        },
      },
      draftProject: { select: { id: true, slug: true, title: true, volunteersNeeded: true } },
      kickoffActivity: {
        select: { id: true, slug: true, title: true, date: true, startTime: true, venueName: true, capacity: true, simulatedRsvpBaseline: true },
      },
    },
  });
  if (!r) return null;

  const [projectVolunteers, viewerVolunteer, viewerUser, kickoffRsvps, viewerRsvp] = await Promise.all([
    r.draftProject
      ? prisma.projectVolunteer.count({
          where: { projectId: r.draftProject.id, status: "ACTIVE", user: { isDemoVisitor: false } },
        })
      : Promise.resolve(0),
    viewerId && r.draftProject
      ? prisma.projectVolunteer.findUnique({ where: { userId_projectId: { userId: viewerId, projectId: r.draftProject.id } } })
      : Promise.resolve(null),
    viewerId ? prisma.user.findUnique({ where: { id: viewerId }, select: { isDemoVisitor: true } }) : Promise.resolve(null),
    r.kickoffActivity
      ? prisma.rsvp.count({ where: { activityId: r.kickoffActivity.id, status: "CONFIRMED", user: { isDemoVisitor: false } } })
      : Promise.resolve(0),
    viewerId && r.kickoffActivity
      ? prisma.rsvp.findUnique({ where: { userId_activityId: { userId: viewerId, activityId: r.kickoffActivity.id } } })
      : Promise.resolve(null),
  ]);

  const status = r.status.toLowerCase() as BridgeProposalSummary["status"];
  const viewerIsVolunteer = viewerVolunteer?.status === "ACTIVE";
  const volunteerCount = projectVolunteers + (viewerUser?.isDemoVisitor && viewerIsVolunteer ? 1 : 0);
  const supporters = r.need.supports.length + (r.need.submittedBy.isDemoVisitor ? 0 : 1);
  const kickoffIsPast = r.kickoffActivity ? isSimulatedPast(r.kickoffActivity.date) : false;

  const stageInput = {
    status,
    communityAName: r.communityA.name,
    communityBName: r.communityB.name,
    needSupporters: supporters,
    project: r.draftProject ? { volunteerCount, volunteersNeeded: r.draftProject.volunteersNeeded } : null,
    kickoff: r.kickoffActivity ? { title: r.kickoffActivity.title, date: r.kickoffActivity.date, isPast: kickoffIsPast } : null,
  } as const;
  const viewerHasKickoffRsvp = viewerRsvp?.status === "CONFIRMED";
  const next = computeBridgeNextStep(stageInput, { isVolunteer: viewerIsVolunteer, hasKickoffRsvp: viewerHasKickoffRsvp });
  const hrefByKind: Record<BridgeNextStep["kind"], string> = {
    review: `/bridge/${r.id}`,
    "join-project": r.draftProject ? `/projects/${r.draftProject.slug}` : `/bridge/${r.id}`,
    "rsvp-kickoff": r.kickoffActivity ? `/discover/${r.kickoffActivity.slug}` : `/bridge/${r.id}`,
    "view-plan": "/plans",
    explore: "/bridge",
  };

  let viewerCanDecide = false;
  if (viewerId) {
    viewerCanDecide = await Promise.all([
      assertCommunityOrganizer(viewerId, r.communityAId).then(() => true).catch(() => false),
      assertCommunityOrganizer(viewerId, r.communityBId).then(() => true).catch(() => false),
    ]).then(([a, b]) => a || b);
  }

  return {
    id: r.id,
    status,
    score: r.score,
    communityA: { slug: r.communityA.slug, name: r.communityA.name, areaSq: r.communityA.areaSq, category: r.communityA.category.toLowerCase() },
    communityB: { slug: r.communityB.slug, name: r.communityB.name, areaSq: r.communityB.areaSq, category: r.communityB.category.toLowerCase() },
    need: { description: r.need.description, areaSq: r.need.areaSq, category: r.need.category.toLowerCase(), supporters },
    reason: r.reason,
    mutualBenefit: r.mutualBenefit,
    requiredResources: r.requiredResources,
    suggestedNextAction: r.suggestedNextAction,
    project: r.draftProject
      ? {
          id: r.draftProject.id,
          slug: r.draftProject.slug,
          title: r.draftProject.title,
          volunteerCount,
          volunteersNeeded: r.draftProject.volunteersNeeded,
          viewerIsVolunteer,
        }
      : null,
    kickoff: r.kickoffActivity
      ? {
          slug: r.kickoffActivity.slug,
          title: r.kickoffActivity.title,
          date: r.kickoffActivity.date,
          startTime: r.kickoffActivity.startTime,
          venueName: r.kickoffActivity.venueName,
          spotsLeft: Math.max(0, r.kickoffActivity.capacity - r.kickoffActivity.simulatedRsvpBaseline - kickoffRsvps),
          isPast: kickoffIsPast,
          viewerHasRsvp: viewerHasKickoffRsvp,
        }
      : null,
    stages: computeBridgeStages(stageInput),
    nextStep: { ...next, href: hrefByKind[next.kind] },
    viewerCanDecide,
  };
}
