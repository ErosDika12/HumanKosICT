import "server-only";
import type { AssistantIntent } from "./intent-parser";
import { listActivities } from "@/lib/data/activities";
import { scoreActivities } from "@/lib/data/recommendations";
import { isSimulatedPast } from "@/lib/simulated-clock";
import { listMatches } from "@/lib/data/people";
import { ensureBridgeProposals, listBridgeProposals } from "@/lib/data/bridge";
import type { ActivityCategory } from "@/lib/types";
import { prisma } from "@/lib/prisma";

const CATEGORY_LABEL: Record<ActivityCategory, string> = {
  sports: "Sports",
  education: "Education",
  culture: "Culture",
  community: "Community",
  technology: "Technology",
  environment: "Environment",
};

export interface AssistantActivityResult {
  slug: string;
  title: string;
  date: string;
  startTime: string;
  areaEn: string;
  isPast: boolean;
  matchReasons: string[];
}

export interface AssistantPersonResult {
  id: string;
  name: string;
  reasons: string[];
}

export interface AssistantResponse {
  intentType: AssistantIntent["type"];
  summary: string;
  activities: AssistantActivityResult[];
  people: AssistantPersonResult[];
  peopleNote?: string;
  bridgeProposalId?: string;
  discoverLink?: string;
  /**
   * Organizer draft-event helper (Phase 6 brief): only present when the
   * signed-in viewer organizes a real community. Prefills
   * /communities/[slug]/activities/new with the parsed category/title —
   * the organizer still reviews and submits it themselves (it starts
   * DRAFT and needs moderator publish either way, per Phase 4). Never
   * auto-creates or auto-publishes anything.
   */
  draftEventLink?: string;
  /** Always false in this build — no AI provider is configured. See src/lib/assistant/ai-provider.ts. */
  providerUsed: boolean;
}

async function findOrganizedCommunitySlug(viewerId: string): Promise<string | null> {
  const owned = await prisma.community.findFirst({
    where: { organizerId: viewerId, status: "PUBLISHED" },
    select: { slug: true },
  });
  if (owned) return owned.slug;
  const membership = await prisma.membership.findFirst({
    where: { userId: viewerId, role: "ORGANIZER", status: "ACTIVE" },
    select: { community: { select: { slug: true } } },
  });
  return membership?.community.slug ?? null;
}

/**
 * Deterministic, grounded, always-available response generation — the
 * baseline the brief requires regardless of whether an AI provider is
 * configured (see ai-provider.ts). Every fact here comes from a real query
 * against the same data modules Discover/BRIDGE/People already use —
 * nothing is invented, and eligibility/authorization are re-checked by
 * those modules themselves, never assumed from the parsed query.
 */
export async function buildAssistantResponse(
  intent: AssistantIntent,
  viewerId?: string
): Promise<AssistantResponse> {
  const base: AssistantResponse = {
    intentType: intent.type,
    summary: "",
    activities: [],
    people: [],
    providerUsed: false,
  };

  if (intent.outOfScopeLocation) {
    return {
      ...base,
      summary: `This demo only covers Prishtina — there are no seeded records for "${intent.outOfScopeLocation}".`,
    };
  }

  if (intent.type === "unknown") {
    return {
      ...base,
      summary:
        "I couldn't tell what you're looking for. Try mentioning a category (technology, environment, sports…), a day (Saturday), \"accessible\", \"near me\", or two communities you'd like to see collaborate.",
    };
  }

  if (intent.type === "bridge-question") {
    await ensureBridgeProposals();
    const proposals = await listBridgeProposals();
    const slugs = new Set(intent.communityMentions.map((m) => m.slug));
    const match = proposals.find(
      (p) => slugs.has(p.communityASlug) && slugs.has(p.communityBSlug)
    );
    if (!match) {
      const names = intent.communityMentions.map((m) => m.slug).join(" and ");
      return {
        ...base,
        summary: `No computed BRIDGE proposal exists between ${names || "those communities"} right now. Visit /bridge to see every current suggestion, each generated from real stored needs.`,
      };
    }
    return {
      ...base,
      summary: `${match.communityAName} and ${match.communityBName} have a real BRIDGE proposal: ${match.reason}.`,
      bridgeProposalId: match.id,
    };
  }

  if (intent.type === "find-people") {
    if (!viewerId) {
      return {
        ...base,
        summary:
          "Sign in to see real people-matches based on your shared interests, communities, or projects — matching is opt-in and never shown to signed-out visitors.",
        peopleNote: "Meanwhile, here are real upcoming activities where you could meet people in person:",
        activities: await searchActivities(intent),
      };
    }
    const matches = await listMatches(viewerId);
    const activities = await searchActivities(intent);
    const categoryLabel = intent.category ? CATEGORY_LABEL[intent.category] : undefined;
    return {
      ...base,
      summary:
        matches.length > 0
          ? `${matches.length} discoverable member${matches.length === 1 ? "" : "s"} share a real interest, community, or project with you.`
          : `No opted-in matches yet${categoryLabel ? ` for ${categoryLabel}` : ""} — matching only shows people who turned on "discoverable" and share something real with you.`,
      people: matches.map((m) => ({ id: m.id, name: m.name, reasons: m.reasons })),
      peopleNote: "Real upcoming activities where you could meet people with this interest:",
      activities,
    };
  }

  // find-activities
  const activities = await searchActivities(intent);
  const filterDescription = describeFilters(intent);
  const organizedSlug = viewerId ? await findOrganizedCommunitySlug(viewerId) : null;
  const draftEventLink = organizedSlug
    ? buildDraftEventLink(organizedSlug, intent)
    : undefined;
  return {
    ...base,
    summary:
      activities.length > 0
        ? `${activities.length} seeded ${activities.length === 1 ? "activity matches" : "activities match"}${filterDescription}.`
        : `No seeded activities match${filterDescription} right now — try clearing a filter on /discover.`,
    activities,
    discoverLink: buildDiscoverLink(intent),
    draftEventLink,
  };
}

function buildDraftEventLink(communitySlug: string, intent: AssistantIntent): string {
  const params = new URLSearchParams();
  if (intent.category) {
    params.set("category", intent.category);
    const label = CATEGORY_LABEL[intent.category];
    params.set("title", `${label} workshop`);
    params.set("titleSq", `Punëtori ${label}`);
  }
  const qs = params.toString();
  return qs
    ? `/communities/${communitySlug}/activities/new?${qs}`
    : `/communities/${communitySlug}/activities/new`;
}

async function searchActivities(intent: AssistantIntent): Promise<AssistantActivityResult[]> {
  const all = await listActivities({
    category: intent.category,
    when: intent.when,
    accessibility: intent.accessibility,
  });
  const scored = scoreActivities(all, { when: intent.when });
  // Prefer upcoming activities; a past one is only ever shown labeled honestly.
  const upcoming = scored.filter((a) => !isSimulatedPast(a.date));
  const chosen = (upcoming.length > 0 ? upcoming : scored).slice(0, 5);
  return chosen.map((a) => ({
    slug: a.slug,
    title: a.title,
    date: a.date,
    startTime: a.startTime,
    areaEn: a.areaEn,
    isPast: isSimulatedPast(a.date),
    matchReasons: a.matchReasons ?? [],
  }));
}

function describeFilters(intent: AssistantIntent): string {
  const parts: string[] = [];
  if (intent.category) parts.push(CATEGORY_LABEL[intent.category]);
  if (intent.when) parts.push(intent.when === "weekend" ? "this weekend" : "on a weekday");
  if (intent.accessibility?.length) parts.push("accessible");
  return parts.length > 0 ? ` for ${parts.join(", ")}` : "";
}

function buildDiscoverLink(intent: AssistantIntent): string {
  const params = new URLSearchParams();
  if (intent.category) params.set("category", intent.category);
  if (intent.when) params.set("when", intent.when);
  if (intent.accessibility?.length) params.set("accessibility", intent.accessibility.join(","));
  const qs = params.toString();
  return qs ? `/discover?${qs}` : "/discover";
}
