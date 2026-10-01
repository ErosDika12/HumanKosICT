import "server-only";
import { prisma } from "@/lib/prisma";
import { SIMULATED_NOW_LABEL, isSimulatedPast } from "@/lib/simulated-clock";
import { listActivities } from "@/lib/data/activities";
import { scoreActivities } from "@/lib/data/recommendations";
import { getUserInterests } from "@/lib/data/interests";
import {
  listDemoFriendNames,
  listFriends,
  listFriendSuggestions,
  suitableActivities,
  type FriendCard,
} from "@/lib/data/friends";
import { listPlans } from "@/lib/data/invites";
import { getBridgeShowcase, getFeaturedBridgeId, ensureBridgeProposals } from "@/lib/data/bridge";
import { SLOT_LABEL, slotOfActivity } from "@/lib/demo-social";
import type { DemoActivity } from "@/lib/types";
import { parseTurn } from "./conversation-parser";
import {
  RELAXABLE,
  describeConstraints,
  extractConstraints,
  isRefinement,
  mergeConstraints,
  satisfies,
  type SearchConstraints,
} from "./constraints";
import { generateGroundedText, getAiProviderConfig, AiProviderError } from "./ai-provider";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Small state the browser sends back each turn; every id in it is re-validated server-side. */
export interface ChatState {
  focusFriendId?: string;
  shownSlugs: string[];
  /** The active activity-search constraints, carried across follow-up turns ("Only in Dardania, please"). */
  constraints?: SearchConstraints;
}

export type ChatCard =
  | {
      kind: "activity";
      slug: string;
      activityId: string;
      title: string;
      when: string;
      area: string;
      reasons: string[];
      spotsLeft: number;
      alreadyGoing: boolean;
      canAct: boolean;
      invite: { friendId: string; friendName: string; alreadyInvited: boolean } | null;
    }
  | {
      kind: "friend";
      id: string;
      name: string;
      area: string | null;
      reasons: string[];
      isFriend: boolean;
    }
  | {
      kind: "bridge";
      id: string;
      title: string;
      stage: string;
      need: string;
      projectId: string | null;
      canJoin: boolean;
      alreadyJoined: boolean;
      nextLabel: string;
      nextHref: string;
    }
  | { kind: "plan"; slug: string; title: string; when: string; note: string }
  | { kind: "login" };

export interface ChatReply {
  text: string;
  cards: ChatCard[];
  suggestions: string[];
  /** "rules" = deterministic and grounded; "ai" = the configured model phrased the text from the same facts. */
  source: "rules" | "ai";
  notice?: string;
  state: ChatState;
}

export interface ChatInput {
  messages: ChatMessage[];
  state: ChatState;
  viewerId?: string;
  /** Whether this turn may call the AI provider (usage limit not exhausted). */
  aiAllowed: boolean;
}

const DEFAULT_SUGGESTIONS = [
  "What can I do this weekend?",
  "Which activity could I attend with Arta?",
  "How do I join the BRIDGE project?",
  "What are my plans?",
];

function niceDate(date: string, time: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return `${d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })} at ${time}`;
}

function toActivityCard(
  a: DemoActivity,
  reasons: string[],
  going: Set<string>,
  signedIn: boolean,
  invite: { friendId: string; friendName: string; alreadyInvited: boolean } | null = null
): ChatCard {
  return {
    kind: "activity",
    slug: a.slug,
    activityId: a.id,
    title: a.title,
    when: niceDate(a.date, a.startTime),
    area: a.areaEn.replace("Prishtina — ", ""),
    reasons,
    spotsLeft: Math.max(0, a.capacity - a.rsvpCount),
    alreadyGoing: going.has(a.id),
    canAct: signedIn,
    invite,
  };
}

function friendCard(f: FriendCard): ChatCard {
  return { kind: "friend", id: f.id, name: f.name, area: f.areaSq, reasons: f.reasons, isFriend: f.isFriend };
}

/**
 * The assistant's brain: deterministic, grounded and multi-turn. Every card
 * comes from a stored record; the optional AI provider only re-phrases the
 * text from the same facts. It never performs an action — buttons on the
 * cards do, and only when the visitor clicks them.
 */
export async function respondToChat(input: ChatInput): Promise<ChatReply> {
  const { viewerId } = input;
  const lastUser = [...input.messages].reverse().find((m) => m.role === "user")?.content ?? "";

  const [friends, allFriendNames] = await Promise.all([
    viewerId ? listFriends(viewerId) : Promise.resolve([] as FriendCard[]),
    listDemoFriendNames(),
  ]);
  const turn = parseTurn(lastUser, allFriendNames);
  const validFocus = input.state.focusFriendId && allFriendNames.some((f) => f.id === input.state.focusFriendId)
    ? input.state.focusFriendId
    : undefined;
  const friendIdForTurn = turn.friendId ?? (turn.isFollowUp && !turn.intent.category ? validFocus : undefined);
  const topic = friendIdForTurn && (turn.topic === "with-friend" || turn.topic === "activities" || turn.topic === "unknown")
    ? "with-friend"
    : turn.topic;

  const shown = new Set(input.state.shownSlugs.slice(-40));
  const going = new Set<string>();
  if (viewerId) {
    const rows = await prisma.rsvp.findMany({ where: { userId: viewerId, status: "CONFIRMED" }, select: { activityId: true } });
    rows.forEach((r) => going.add(r.activityId));
  }

  let reply: ChatReply;
  switch (topic) {
    case "with-friend":
      reply = await withFriend({ viewerId, friendId: friendIdForTurn, friends, allFriendNames, shown, going, isFollowUp: turn.isFollowUp });
      break;
    case "bridge-join":
    case "bridge-info":
      reply = await bridgeAnswer(viewerId, topic === "bridge-join");
      break;
    case "my-plans":
      reply = await plansAnswer(viewerId);
      break;
    case "find-friends":
      reply = await findFriendsAnswer(viewerId);
      break;
    case "activities":
      reply = await activitiesAnswer({ text: lastUser, viewerId, shown, going, turn, previous: input.state.constraints });
      break;
    case "greeting":
      reply = {
        text: `Hi! I'm the Human Network demo helper. I can look up activities, suggest what fits you and a friend, explain the BRIDGE project and summarise your plans — using only the records stored in this demo. Today in the scenario is ${SIMULATED_NOW_LABEL}.`,
        cards: [],
        suggestions: DEFAULT_SUGGESTIONS,
        source: "rules",
        state: input.state,
      };
      break;
    default:
      reply = {
        text: "I'm not sure what you're after. I can find activities (try “What can I do this weekend?”), suggest something to do with a friend (“Which activity could I attend with Arta?”), explain the BRIDGE project, or summarise your plans.",
        cards: [],
        suggestions: DEFAULT_SUGGESTIONS,
        source: "rules",
        state: input.state,
      };
  }

  reply.state = {
    focusFriendId: reply.state.focusFriendId ?? (topic === "with-friend" ? friendIdForTurn : validFocus),
    constraints: reply.state.constraints,
    shownSlugs: [...new Set([...shown, ...reply.cards.flatMap((c) => (c.kind === "activity" ? [c.slug] : []))])].slice(-40),
  };

  // Optional AI phrasing: text only, from the same facts; falls back honestly.
  if (input.aiAllowed && getAiProviderConfig() && reply.cards.length + reply.text.length > 0) {
    try {
      const text = await generateGroundedText({
        history: input.messages.slice(-6).map((m) => ({ role: m.role, content: m.content.slice(0, 500) })),
        facts: { simulatedToday: SIMULATED_NOW_LABEL, rulesAnswer: reply.text, records: reply.cards },
      });
      reply = { ...reply, text, source: "ai" };
    } catch (err) {
      reply.notice =
        err instanceof AiProviderError
          ? `The AI provider was unavailable (${err.message}) — showing the rules-based answer instead.`
          : "The AI provider was unavailable — showing the rules-based answer instead.";
    }
  }
  return reply;
}

// ---------------------------------------------------------------------------

async function activitiesAnswer(args: {
  text: string;
  viewerId?: string;
  shown: Set<string>;
  going: Set<string>;
  turn: ReturnType<typeof parseTurn>;
  previous?: SearchConstraints;
}): Promise<ChatReply> {
  const { text, viewerId, shown, going, turn, previous } = args;

  // A short follow-up refines the previous search; a fresh request replaces it.
  const stated = extractConstraints(text);
  const carries = Boolean(previous) && (turn.isFollowUp || isRefinement(text));
  const constraints = carries ? mergeConstraints(previous, stated) : stated;
  const described = describeConstraints(constraints);
  const filterText = described ? ` (${described})` : "";

  const interestIds = viewerId ? await getUserInterests(viewerId) : [];
  // Location, date, cost, accessibility and eligibility are filtered here, in code — never left to ranking.
  const all = await listActivities({ category: constraints.category });
  const open = all.filter((a) => !isSimulatedPast(a.date) && a.status !== "canceled" && a.capacity - a.rsvpCount > 0);
  const matching = open.filter((a) => satisfies(a, constraints));
  const scored = scoreActivities(matching, { interestIds, when: constraints.window });
  const fresh = scored.filter((a) => !shown.has(a.slug));
  const chosen = (turn.isFollowUp ? fresh : scored).slice(0, 3);
  const stateOut: ChatState = { shownSlugs: [], constraints: described ? constraints : undefined };
  const loginHint = viewerId ? "" : " Log in as demo for picks based on your interests.";

  if (chosen.length > 0) {
    return {
      text: `${turn.isFollowUp ? "Here's another option" : "Here's what I found"}${filterText}: ${chosen.map((a) => a.title).join("; ")}.${loginHint}`,
      cards: chosen.map((a) =>
        toActivityCard(a, a.matchReasons?.length ? a.matchReasons : [`${SLOT_LABEL[slotOfActivity(a.date, a.startTime)]}`], going, Boolean(viewerId))
      ),
      suggestions: ["Show me another", "Which activity could I attend with Arta?", "How do I join the BRIDGE project?"],
      source: "rules",
      state: stateOut,
    };
  }

  if (turn.isFollowUp && scored.length > 0) {
    return {
      text: `That's every matching activity I have${filterText} — you've seen all ${scored.length}.`,
      cards: [],
      suggestions: ["What can I do this weekend?", "Show me something accessible"],
      source: "rules",
      state: stateOut,
    };
  }

  // Nothing matches. Offer ONE clearly labelled alternative that relaxes location, date or cost —
  // never accessibility or eligibility — and say exactly which requirement it does not meet.
  const unmet = (key: keyof SearchConstraints): string =>
    key === "window" ? "the date" : key === "area" ? "the area" : "the price";
  for (const key of RELAXABLE) {
    if (constraints[key] === undefined) continue;
    const alternatives = scoreActivities(open.filter((a) => satisfies(a, constraints, [key])), { interestIds }).slice(0, 2);
    if (alternatives.length === 0) continue;
    return {
      text: `Nothing matches everything you asked for${filterText}. Below ${alternatives.length === 1 ? "is the closest alternative" : "are the closest alternatives"}: ${alternatives.length === 1 ? "it keeps" : "they keep"} your other requirements but ${alternatives.length === 1 ? "does" : "do"} not match ${unmet(key)} you asked for.`,
      cards: alternatives.map((a) =>
        toActivityCard(a, [`Alternative — not a match on ${unmet(key)}`, ...(a.matchReasons ?? [])], going, Boolean(viewerId))
      ),
      suggestions: ["Show me something accessible", "What can I do this weekend?"],
      source: "rules",
      state: stateOut,
    };
  }
  return {
    text: `I couldn't find an open upcoming activity${filterText}, and nothing close enough to suggest as an alternative. Try changing the day or area, or browse the full list on Discover.`,
    cards: [],
    suggestions: ["What can I do this weekend?", "Show me something accessible", "Find a technology activity"],
    source: "rules",
    state: stateOut,
  };
}

async function withFriend(args: {
  viewerId?: string;
  friendId?: string;
  friends: FriendCard[];
  allFriendNames: { id: string; name: string }[];
  shown: Set<string>;
  going: Set<string>;
  isFollowUp: boolean;
}): Promise<ChatReply> {
  const { viewerId, friendId, friends, allFriendNames, shown, going, isFollowUp } = args;
  if (!viewerId) {
    return {
      text: "Friends live on your demo account. Log in as demo (one click, no password) and I can suggest activities that suit you and a friend.",
      cards: [{ kind: "login" }],
      suggestions: ["What can I do this weekend?"],
      source: "rules",
      state: { shownSlugs: [] },
    };
  }
  if (!friendId) {
    const names = friends.map((f) => f.name.split(" ")[0]);
    return {
      text: names.length
        ? `Who would you like to go with? Your friends: ${names.join(", ")}.`
        : "You don't have any friends yet — add a demo friend first and I'll find something that fits you both.",
      cards: [],
      suggestions: names.slice(0, 3).map((n) => `Which activity could I attend with ${n}?`).concat(names.length ? [] : ["Find friends who like what I like"]),
      source: "rules",
      state: { shownSlugs: [] },
    };
  }
  const name = allFriendNames.find((f) => f.id === friendId)?.name ?? "them";
  const first = name.split(" ")[0];
  const friend = friends.find((f) => f.id === friendId);
  if (!friend) {
    const suggestions = await listFriendSuggestions(viewerId);
    const card = suggestions.find((s) => s.id === friendId);
    return {
      text: `${name} isn't one of your friends yet. Add them and I can look for something that suits you both.`,
      cards: card ? [friendCard(card)] : [{ kind: "friend", id: friendId, name, area: null, reasons: [], isFriend: false }],
      suggestions: ["What can I do this weekend?"],
      source: "rules",
      state: { focusFriendId: friendId, shownSlugs: [] },
    };
  }
  const all = await suitableActivities(viewerId, friendId, 8);
  const fresh = all.filter((s) => !shown.has(s.activity.slug));
  const chosen = (isFollowUp ? fresh : all).slice(0, 3);
  if (chosen.length === 0) {
    const slots = friend.availability.map((s) => SLOT_LABEL[s]).join(", ");
    return {
      text: isFollowUp && all.length > 0
        ? `That's every activity I can match for you and ${first} — you've seen all ${all.length}.`
        : `I couldn't find an open upcoming activity that fits both ${first}'s availability (${slots}) and shared interests. Browse Discover for other ideas.`,
      cards: [],
      suggestions: ["What can I do this weekend?", "Find friends who like what I like"],
      source: "rules",
      state: { focusFriendId: friendId, shownSlugs: [] },
    };
  }
  return {
    text: `${isFollowUp ? "Another one" : "Good options"} for you and ${first}: ${chosen.map((c) => c.activity.title).join("; ")}. I can't send the invitation for you — use the Invite button.`,
    cards: chosen.map((c) =>
      toActivityCard(c.activity, c.reasons, going, true, { friendId, friendName: name, alreadyInvited: c.alreadyInvited })
    ),
    suggestions: [`Show me another with ${first}`, "What are my plans?", "How do I join the BRIDGE project?"],
    source: "rules",
    state: { focusFriendId: friendId, shownSlugs: [] },
  };
}

async function bridgeAnswer(viewerId: string | undefined, join: boolean): Promise<ChatReply> {
  await ensureBridgeProposals();
  const id = await getFeaturedBridgeId();
  const showcase = id ? await getBridgeShowcase(id, viewerId) : null;
  if (!showcase) {
    return { text: "There is no BRIDGE proposal to show right now.", cards: [], suggestions: DEFAULT_SUGGESTIONS, source: "rules", state: { shownSlugs: [] } };
  }
  const current = showcase.stages.find((s) => s.state === "current") ?? showcase.stages[showcase.stages.length - 1];
  const joined = showcase.project?.viewerIsVolunteer ?? false;
  const steps: string[] = [];
  if (showcase.project && !joined) steps.push(`join the project “${showcase.project.title}”`);
  if (showcase.kickoff && !showcase.kickoff.isPast) steps.push(`RSVP to the first session, ${showcase.kickoff.title} (${showcase.kickoff.date})`);
  const howTo = joined
    ? `You have already joined the project.${showcase.kickoff && !showcase.kickoff.viewerHasRsvp ? ` Next, RSVP to ${showcase.kickoff.title} on ${showcase.kickoff.date}.` : ""}`
    : steps.length
      ? `To take part: ${steps.join(", then ")}. I can't do it for you — use the buttons.`
      : "This proposal is still being reviewed, so there is nothing to join yet.";
  return {
    text: `${showcase.communityA.name} and ${showcase.communityB.name} are working together on this need: “${showcase.need.description}” Current step: ${current.label} — ${current.detail}. ${join ? howTo : `Open BRIDGE to explore each step. ${howTo}`}${viewerId ? "" : " Log in as demo to join."}`,
    cards: [
      {
        kind: "bridge",
        id: showcase.id,
        title: `${showcase.communityA.name} × ${showcase.communityB.name}`,
        stage: `${current.label} — ${current.detail}`,
        need: showcase.need.description,
        projectId: showcase.project?.id ?? null,
        canJoin: Boolean(viewerId) && Boolean(showcase.project) && !joined,
        alreadyJoined: joined,
        nextLabel: showcase.nextStep.label,
        nextHref: showcase.nextStep.href,
      },
      ...(viewerId ? [] : [{ kind: "login" } as ChatCard]),
    ],
    suggestions: ["What are my plans?", "Which activity could I attend with Arta?"],
    source: "rules",
    state: { shownSlugs: [] },
  };
}

async function plansAnswer(viewerId?: string): Promise<ChatReply> {
  if (!viewerId) {
    return { text: "Your plans are stored on your demo account. Log in as demo to see them.", cards: [{ kind: "login" }], suggestions: ["What can I do this weekend?"], source: "rules", state: { shownSlugs: [] } };
  }
  const plans = (await listPlans(viewerId)).filter((p) => !p.activity.isPast && !p.activity.isCanceled).slice(0, 4);
  if (plans.length === 0) {
    return { text: "You have no upcoming plans yet. RSVP to an activity or invite a friend and it will appear here.", cards: [], suggestions: ["What can I do this weekend?"], source: "rules", state: { shownSlugs: [] } };
  }
  return {
    text: `You have ${plans.length} upcoming plan${plans.length === 1 ? "" : "s"}: ${plans.map((p) => p.activity.title).join("; ")}.`,
    cards: plans.map((p) => ({
      kind: "plan" as const,
      slug: p.activity.slug,
      title: p.activity.title,
      when: niceDate(p.activity.date, p.activity.startTime),
      note: [
        p.myRsvp === "confirmed" ? "You're going" : "Not RSVP'd yet",
        ...p.invites.map((i) => `${i.direction === "sent" ? "you invited" : "invited by"} ${i.otherName} (${i.status}${i.isSimulatedReply ? ", simulated reply" : ""})`),
      ].join(" · "),
    })),
    suggestions: ["Which activity could I attend with Arta?", "What can I do this weekend?"],
    source: "rules",
    state: { shownSlugs: [] },
  };
}

async function findFriendsAnswer(viewerId?: string): Promise<ChatReply> {
  if (!viewerId) {
    return { text: "Log in as demo and I can show demo friends who share your interests.", cards: [{ kind: "login" }], suggestions: [], source: "rules", state: { shownSlugs: [] } };
  }
  const suggestions = (await listFriendSuggestions(viewerId)).slice(0, 3);
  return {
    text: suggestions.length
      ? `These demo friends share something with you: ${suggestions.map((s) => s.name).join(", ")}. They are fictional and never reply live.`
      : "You already have every demo friend who shares something with you.",
    cards: suggestions.map(friendCard),
    suggestions: suggestions[0] ? [`Which activity could I attend with ${suggestions[0].name.split(" ")[0]}?`] : ["What can I do this weekend?"],
    source: "rules",
    state: { shownSlugs: [] },
  };
}
