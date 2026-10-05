import "server-only";
import { prisma } from "@/lib/prisma";
import { SIMULATED_NOW_ISO, isSimulatedPast } from "@/lib/simulated-clock";
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
import { slotOfActivity } from "@/lib/demo-social";
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
import type { Locale } from "@/lib/i18n/config";
import { makeI18n, type I18nLite } from "@/lib/i18n/make";
import { localizeActivity, localizeText } from "@/lib/i18n/content";
import { areaFromSq } from "@/lib/i18n/areas";
import { localizeReason } from "@/lib/i18n/reasons";

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
  /** Language of the replies (default English). */
  locale?: Locale;
}

const NEXT_KEY = { review: "review", "join-project": "join", "rsvp-kickoff": "rsvp", "view-plan": "plan", explore: "explore" } as const;

function defaultSuggestions(i: I18nLite): string[] {
  const { t } = i;
  return [t("assistant.s.weekend"), t("assistant.s.withFriend", { name: "Arta" }), t("assistant.s.bridge"), t("assistant.s.plans")];
}

function niceDate(i: I18nLite, date: string, time: string): string {
  return i.t("assistant.at", { day: i.longDate(date).replace(/\s+\d{4}$/, ""), time });
}

function titleOf(i: I18nLite, a: DemoActivity): string {
  return localizeActivity(a, i.locale).title;
}

function toActivityCard(
  i: I18nLite,
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
    title: titleOf(i, a),
    when: niceDate(i, a.date, a.startTime),
    area: i.t(`area.${a.areaEn}`),
    reasons,
    spotsLeft: Math.max(0, a.capacity - a.rsvpCount),
    alreadyGoing: going.has(a.id),
    canAct: signedIn,
    invite,
  };
}

function friendCard(i: I18nLite, f: FriendCard): ChatCard {
  return {
    kind: "friend",
    id: f.id,
    name: f.name,
    area: f.areaSq ? areaFromSq(f.areaSq, i.t) : null,
    reasons: f.reasons.map((r) => localizeReason(r, i.t, i.locale)),
    isFriend: f.isFriend,
  };
}

/**
 * The assistant's brain: deterministic, grounded and multi-turn. Every card
 * comes from a stored record; the optional AI provider only re-phrases the
 * text from the same facts. It never performs an action — buttons on the
 * cards do, and only when the visitor clicks them.
 */
export async function respondToChat(input: ChatInput): Promise<ChatReply> {
  const { viewerId } = input;
  const i = makeI18n(input.locale ?? "en");
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
      reply = await withFriend({ i, viewerId, friendId: friendIdForTurn, friends, allFriendNames, shown, going, isFollowUp: turn.isFollowUp });
      break;
    case "bridge-join":
    case "bridge-info":
      reply = await bridgeAnswer(i, viewerId, topic === "bridge-join");
      break;
    case "my-plans":
      reply = await plansAnswer(i, viewerId);
      break;
    case "find-friends":
      reply = await findFriendsAnswer(i, viewerId);
      break;
    case "activities":
      reply = await activitiesAnswer({ i, text: lastUser, viewerId, shown, going, turn, previous: input.state.constraints });
      break;
    case "greeting":
      reply = {
        text: i.t("assistant.greeting", { date: i.longDate(SIMULATED_NOW_ISO) }),
        cards: [],
        suggestions: defaultSuggestions(i),
        source: "rules",
        state: input.state,
      };
      break;
    default:
      reply = {
        text: i.t("assistant.unknown"),
        cards: [],
        suggestions: defaultSuggestions(i),
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
        facts: { simulatedToday: i.longDate(SIMULATED_NOW_ISO), rulesAnswer: reply.text, records: reply.cards },
      });
      reply = { ...reply, text, source: "ai" };
    } catch (err) {
      reply.notice = err instanceof AiProviderError ? i.t("assistant.aiUnavailableNamed", { why: err.message }) : i.t("assistant.aiUnavailable");
    }
  }
  return reply;
}

// ---------------------------------------------------------------------------

async function activitiesAnswer(args: {
  i: I18nLite;
  text: string;
  viewerId?: string;
  shown: Set<string>;
  going: Set<string>;
  turn: ReturnType<typeof parseTurn>;
  previous?: SearchConstraints;
}): Promise<ChatReply> {
  const { i, text, viewerId, shown, going, turn, previous } = args;
  const { t, locale } = i;

  // A short follow-up refines the previous search; a fresh request replaces it.
  const stated = extractConstraints(text);
  const carries = Boolean(previous) && (turn.isFollowUp || isRefinement(text));
  const constraints = carries ? mergeConstraints(previous, stated) : stated;
  const described = describeConstraints(constraints, i);
  const filterText = described ? ` (${described})` : "";

  const interestIds = viewerId ? await getUserInterests(viewerId) : [];
  // Location, date, cost, accessibility and eligibility are filtered here, in code — never left to ranking.
  const all = await listActivities({ category: constraints.category });
  const open = all.filter((a) => !isSimulatedPast(a.date) && a.status !== "canceled" && a.capacity - a.rsvpCount > 0);
  const matching = open.filter((a) => satisfies(a, constraints));
  const scored = scoreActivities(matching, { interestIds, when: constraints.window, locale });
  const fresh = scored.filter((a) => !shown.has(a.slug));
  const chosen = (turn.isFollowUp ? fresh : scored).slice(0, 3);
  const stateOut: ChatState = { shownSlugs: [], constraints: described ? constraints : undefined };
  const loginHint = viewerId ? "" : t("assistant.loginHintShort");
  const slotReason = (a: DemoActivity) => t(`slot.${slotOfActivity(a.date, a.startTime)}`);

  if (chosen.length > 0) {
    return {
      text: t(turn.isFollowUp ? "assistant.foundAnother" : "assistant.found", {
        filters: filterText,
        list: chosen.map((a) => titleOf(i, a)).join("; "),
        login: loginHint,
      }),
      cards: chosen.map((a) => toActivityCard(i, a, a.matchReasons?.length ? a.matchReasons : [slotReason(a)], going, Boolean(viewerId))),
      suggestions: [t("assistant.s.another"), t("assistant.s.withFriend", { name: "Arta" }), t("assistant.s.bridge")],
      source: "rules",
      state: stateOut,
    };
  }

  if (turn.isFollowUp && scored.length > 0) {
    return {
      text: t("assistant.everyMatch", { filters: filterText, n: scored.length }),
      cards: [],
      suggestions: [t("assistant.s.weekend"), t("assistant.s.accessible")],
      source: "rules",
      state: stateOut,
    };
  }

  // Nothing matches. Offer a clearly labelled alternative that relaxes location, date or cost —
  // never accessibility or eligibility — and say exactly which requirement it does not meet.
  const unmet = (key: keyof SearchConstraints): string =>
    t(key === "window" ? "assistant.unmet.window" : key === "area" ? "assistant.unmet.area" : "assistant.unmet.cost");
  for (const key of RELAXABLE) {
    if (constraints[key] === undefined) continue;
    const alternatives = scoreActivities(open.filter((a) => satisfies(a, constraints, [key])), { interestIds, locale }).slice(0, 2);
    if (alternatives.length === 0) continue;
    return {
      text: t(alternatives.length === 1 ? "assistant.noMatchAlt" : "assistant.noMatchAlts", { filters: filterText, what: unmet(key) }),
      cards: alternatives.map((a) =>
        toActivityCard(i, a, [t("assistant.altLabel", { what: unmet(key) }), ...(a.matchReasons ?? [])], going, Boolean(viewerId))
      ),
      suggestions: [t("assistant.s.accessible"), t("assistant.s.weekend")],
      source: "rules",
      state: stateOut,
    };
  }
  return {
    text: t("assistant.noMatch", { filters: filterText }),
    cards: [],
    suggestions: [t("assistant.s.weekend"), t("assistant.s.accessible"), t("assistant.s.tech")],
    source: "rules",
    state: stateOut,
  };
}

async function withFriend(args: {
  i: I18nLite;
  viewerId?: string;
  friendId?: string;
  friends: FriendCard[];
  allFriendNames: { id: string; name: string }[];
  shown: Set<string>;
  going: Set<string>;
  isFollowUp: boolean;
}): Promise<ChatReply> {
  const { i, viewerId, friendId, friends, allFriendNames, shown, going, isFollowUp } = args;
  const { t } = i;
  if (!viewerId) {
    return {
      text: t("assistant.friend.login"),
      cards: [{ kind: "login" }],
      suggestions: [t("assistant.s.weekend")],
      source: "rules",
      state: { shownSlugs: [] },
    };
  }
  if (!friendId) {
    const names = friends.map((f) => f.name.split(" ")[0]);
    return {
      text: names.length ? t("assistant.friend.who", { names: names.join(", ") }) : t("assistant.friend.none"),
      cards: [],
      suggestions: names.slice(0, 3).map((n) => t("assistant.s.withFriend", { name: n })).concat(names.length ? [] : [t("assistant.s.findFriends")]),
      source: "rules",
      state: { shownSlugs: [] },
    };
  }
  const name = allFriendNames.find((f) => f.id === friendId)?.name ?? "—";
  const first = name.split(" ")[0];
  const friend = friends.find((f) => f.id === friendId);
  if (!friend) {
    const suggestions = await listFriendSuggestions(viewerId);
    const card = suggestions.find((s) => s.id === friendId);
    return {
      text: t("assistant.friend.notYet", { name }),
      cards: card ? [friendCard(i, card)] : [{ kind: "friend", id: friendId, name, area: null, reasons: [], isFriend: false }],
      suggestions: [t("assistant.s.weekend")],
      source: "rules",
      state: { focusFriendId: friendId, shownSlugs: [] },
    };
  }
  const all = await suitableActivities(viewerId, friendId, 8);
  const fresh = all.filter((s) => !shown.has(s.activity.slug));
  const chosen = (isFollowUp ? fresh : all).slice(0, 3);
  if (chosen.length === 0) {
    const slots = friend.availability.map((s) => t(`slotNoun.${s}`)).join(", ");
    return {
      text: isFollowUp && all.length > 0 ? t("assistant.friend.exhausted", { first, n: all.length }) : t("assistant.friend.nothing", { first, slots }),
      cards: [],
      suggestions: [t("assistant.s.weekend"), t("assistant.s.findFriends")],
      source: "rules",
      state: { focusFriendId: friendId, shownSlugs: [] },
    };
  }
  return {
    text: t(isFollowUp ? "assistant.friend.another" : "assistant.friend.good", { first, list: chosen.map((c) => titleOf(i, c.activity)).join("; ") }),
    cards: chosen.map((c) =>
      toActivityCard(i, c.activity, c.reasons.map((r) => localizeReason(r, t, i.locale)), going, true, { friendId, friendName: name, alreadyInvited: c.alreadyInvited })
    ),
    suggestions: [t("assistant.s.anotherWith", { name: first }), t("assistant.s.plans"), t("assistant.s.bridge")],
    source: "rules",
    state: { focusFriendId: friendId, shownSlugs: [] },
  };
}

async function bridgeAnswer(i: I18nLite, viewerId: string | undefined, join: boolean): Promise<ChatReply> {
  const { t, locale } = i;
  await ensureBridgeProposals();
  const id = await getFeaturedBridgeId();
  const showcase = id ? await getBridgeShowcase(id, viewerId) : null;
  if (!showcase) {
    return { text: t("assistant.bridge.none"), cards: [], suggestions: defaultSuggestions(i), source: "rules", state: { shownSlugs: [] } };
  }
  const current = showcase.stages.find((s) => s.state === "current") ?? showcase.stages[showcase.stages.length - 1];
  const joined = showcase.project?.viewerIsVolunteer ?? false;
  const kickoffTitle = showcase.kickoff ? localizeText(showcase.kickoff.title, locale) : "";
  const steps: string[] = [];
  if (showcase.project && !joined) steps.push(t("assistant.bridge.stepJoin", { title: locale === "sq" ? showcase.communityA.name + " × " + showcase.communityB.name : showcase.project.title }));
  if (showcase.kickoff && !showcase.kickoff.isPast) steps.push(t("assistant.bridge.stepRsvp", { title: kickoffTitle, date: i.shortDate(showcase.kickoff.date) }));
  const howTo = joined
    ? t("assistant.bridge.joinedAlready") +
      (showcase.kickoff && !showcase.kickoff.viewerHasRsvp ? t("assistant.bridge.rsvpNext", { title: kickoffTitle, date: i.shortDate(showcase.kickoff.date) }) : "")
    : steps.length
      ? t("assistant.bridge.steps", { steps: steps.join(t("assistant.bridge.stepsJoiner")) })
      : t("assistant.bridge.review");
  const stageText = locale === "en" ? t("assistant.bridge.stage", { label: current.label, detail: current.detail }) : t(`bridge.step.${current.key}`);
  return {
    text: t("assistant.bridge.text", {
      a: showcase.communityA.name,
      b: showcase.communityB.name,
      need: localizeText(showcase.need.description, locale),
      step: stageText,
      rest: join ? howTo : `${t("assistant.bridge.openHint")} ${howTo}`,
      login: viewerId ? "" : t("assistant.bridge.loginHint"),
    }),
    cards: [
      {
        kind: "bridge",
        id: showcase.id,
        title: `${showcase.communityA.name} × ${showcase.communityB.name}`,
        stage: stageText,
        need: localizeText(showcase.need.description, locale),
        projectId: showcase.project?.id ?? null,
        canJoin: Boolean(viewerId) && Boolean(showcase.project) && !joined,
        alreadyJoined: joined,
        nextLabel: t(`bridge.next.${NEXT_KEY[showcase.nextStep.kind]}`),
        nextHref: showcase.nextStep.href,
      },
      ...(viewerId ? [] : [{ kind: "login" } as ChatCard]),
    ],
    suggestions: [t("assistant.s.plans"), t("assistant.s.withFriend", { name: "Arta" })],
    source: "rules",
    state: { shownSlugs: [] },
  };
}

async function plansAnswer(i: I18nLite, viewerId?: string): Promise<ChatReply> {
  const { t, locale } = i;
  if (!viewerId) {
    return { text: t("assistant.plans.login"), cards: [{ kind: "login" }], suggestions: [t("assistant.s.weekend")], source: "rules", state: { shownSlugs: [] } };
  }
  const plans = (await listPlans(viewerId)).filter((p) => !p.activity.isPast && !p.activity.isCanceled).slice(0, 4);
  if (plans.length === 0) {
    return { text: t("assistant.plans.none"), cards: [], suggestions: [t("assistant.s.weekend")], source: "rules", state: { shownSlugs: [] } };
  }
  const all = await listActivities();
  const bySlug = new Map(all.map((a) => [a.slug, localizeActivity(a, locale).title]));
  const titleFor = (p: (typeof plans)[number]) => bySlug.get(p.activity.slug) ?? p.activity.title;
  return {
    text: t("assistant.plans.some", { n: plans.length, list: plans.map(titleFor).join("; ") }),
    cards: plans.map((p) => ({
      kind: "plan" as const,
      slug: p.activity.slug,
      title: titleFor(p),
      when: niceDate(i, p.activity.date, p.activity.startTime),
      note: [
        p.myRsvp === "confirmed" ? t("assistant.plans.rsvp") : t("assistant.plans.noRsvp"),
        ...p.invites.map(
          (inv) =>
            `${inv.direction === "sent" ? t("assistant.plans.youInvited", { name: inv.otherName }) : t("assistant.plans.invitedBy", { name: inv.otherName })} (${t(`invite.${inv.status}`)}${inv.isSimulatedReply ? t("assistant.plans.simulated") : ""})`
        ),
      ].join(" · "),
    })),
    suggestions: [t("assistant.s.withFriend", { name: "Arta" }), t("assistant.s.weekend")],
    source: "rules",
    state: { shownSlugs: [] },
  };
}

async function findFriendsAnswer(i: I18nLite, viewerId?: string): Promise<ChatReply> {
  const { t } = i;
  if (!viewerId) {
    return { text: t("assistant.people.login"), cards: [{ kind: "login" }], suggestions: [], source: "rules", state: { shownSlugs: [] } };
  }
  const suggestions = (await listFriendSuggestions(viewerId)).slice(0, 3);
  return {
    text: suggestions.length ? t("assistant.people.some", { names: suggestions.map((s) => s.name).join(", ") }) : t("assistant.people.none"),
    cards: suggestions.map((s) => friendCard(i, s)),
    suggestions: suggestions[0] ? [t("assistant.s.withFriend", { name: suggestions[0].name.split(" ")[0] })] : [t("assistant.s.weekend")],
    source: "rules",
    state: { shownSlugs: [] },
  };
}
