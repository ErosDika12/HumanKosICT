/**
 * Multi-turn helpers for the assistant — pure and deterministic (no database,
 * no `server-only`), unit-tested in tests/assistant-conversation.test.ts.
 * They only classify what the visitor typed; every fact in a reply is looked
 * up from stored records by the engine (conversation.ts), never inferred here.
 */
import { parseAssistantIntent, type AssistantIntent } from "./intent-parser";
export { weekendRange } from "@/lib/time-window";

export type ConversationTopic =
  | "with-friend"
  | "bridge-join"
  | "bridge-info"
  | "my-plans"
  | "find-friends"
  | "activities"
  | "greeting"
  | "unknown";

export interface ParsedTurn {
  topic: ConversationTopic;
  intent: AssistantIntent;
  friendId: string | null;
  isFollowUp: boolean;
  wantsAny: boolean;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const FOLLOW_UP = ["another", "other one", "something else", "anything else", "different", "more options", "more ideas", "next one", "what else", "else?", "one more"];
const JOIN_WORDS = ["join", "volunteer", "take part", "participate", "sign up", "get involved", "contribute", "help with"];
const BRIDGE_WORDS = ["bridge", "collaboration", "collaborate", "eco-tech", "ecotech"];
const PLAN_WORDS = ["my plan", "my plans", "what am i going", "what have i", "my rsvp", "my schedule", "my calendar", "already going", "planned"];
const FRIEND_FIND_WORDS = ["find a friend", "find friends", "new friend", "meet people", "meet someone", "who shares", "who likes", "friends like"];
const WITH_FRIEND_WORDS = ["with a friend", "with my friend", "together with", "go with", "attend with", "bring a friend", "take a friend"];
const GREETINGS = ["hi", "hello", "hey", "hej", "pershendetje", "help", "start", "what can you do", "what can you help"];

export function detectFriendMention(text: string, friends: { id: string; name: string }[]): string | null {
  const q = ` ${normalize(text).replace(/[^a-z0-9 ]/g, " ")} `;
  // Prefer full-name matches, then unique first-name matches.
  for (const f of friends) {
    const full = normalize(f.name).replace(/[^a-z0-9 ]/g, " ");
    if (q.includes(` ${full} `)) return f.id;
  }
  const firstNames = friends.map((f) => ({ id: f.id, first: normalize(f.name).split(" ")[0].replace(/[^a-z0-9]/g, "") }));
  const hits = firstNames.filter((f) => f.first.length >= 3 && q.includes(` ${f.first} `));
  return hits.length === 1 ? hits[0].id : null;
}

export function parseTurn(text: string, friends: { id: string; name: string }[]): ParsedTurn {
  const q = normalize(text);
  const intent = parseAssistantIntent(text);
  const friendId = detectFriendMention(text, friends);
  const isFollowUp = FOLLOW_UP.some((w) => q.includes(w));
  const wantsAny = /\b(any|every)\b/.test(q);

  let topic: ConversationTopic = "unknown";
  if (BRIDGE_WORDS.some((w) => q.includes(w))) {
    topic = JOIN_WORDS.some((w) => q.includes(w)) ? "bridge-join" : "bridge-info";
  } else if (PLAN_WORDS.some((w) => q.includes(w))) {
    topic = "my-plans";
  } else if (friendId || WITH_FRIEND_WORDS.some((w) => q.includes(w))) {
    topic = "with-friend";
  } else if (FRIEND_FIND_WORDS.some((w) => q.includes(w))) {
    topic = "find-friends";
  } else if (
    intent.type === "find-activities" ||
    intent.category ||
    intent.when ||
    /\b(do|going|activity|activities|event|events|weekend|tonight|tomorrow|this week|free)\b/.test(q)
  ) {
    topic = "activities";
  } else if (GREETINGS.some((g) => q === g || q.startsWith(`${g} `) || q.startsWith(`${g}!`))) {
    topic = "greeting";
  }
  if (isFollowUp && topic === "unknown") topic = "activities";
  return { topic, intent, friendId, isFollowUp, wantsAny };
}

export type WeekendScope = "this" | "next" | null;

/** "this weekend" / "next weekend" (or a bare "weekend") — resolved against the simulated clock by weekendRange(). */
export function detectWeekendScope(text: string): WeekendScope {
  const q = normalize(text);
  if (q.includes("next weekend")) return "next";
  if (q.includes("this weekend") || /\bweekend\b|\bsaturday\b|\bsunday\b/.test(q)) return "this";
  return null;
}
