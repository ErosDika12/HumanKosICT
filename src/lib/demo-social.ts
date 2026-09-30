/**
 * FICTIONAL demo friends, seeded friendships and example conversations for
 * the simulated Prishtina 2036 scenario. Pure data + pure helpers (no
 * `server-only`, no database) so the seed script, the one-click demo-login
 * flow and the unit tests all share one source of truth.
 *
 * Every person below is fictional. Demo friends are non-loginable and are
 * never live: their "replies" are either seeded example messages or the
 * transparent availability rule in `decideSimulatedReply` — always labeled.
 */
import type { InterestId } from "./types";

export type AvailabilitySlot = "weekday-mornings" | "weekday-afternoons" | "weekday-evenings" | "weekends";

export interface DemoFriendSeed {
  id: string;
  name: string;
  bio: string;
  interests: InterestId[];
  areaSq: string;
  availability: AvailabilitySlot[];
  needsAccessible?: boolean;
  communities: string[]; // community slugs (active membership)
}

/** Everyone a visitor can befriend. The first four already exist as seeded personas (user-*). */
export const DEMO_FRIENDS: DemoFriendSeed[] = [
  {
    id: "user-arta",
    name: "Arta Krasniqi",
    bio: "Loves Saturday workshops and photography walks around the city center.",
    interests: ["technology", "photography"],
    areaSq: "Prishtinë — Qendër",
    availability: ["weekends", "weekday-evenings"],
    communities: ["prishtina-ai-klub"],
  },
  {
    id: "user-drin",
    name: "Drin Gashi",
    bio: "Organizes Prishtina AI Klub's weekly workshops.",
    interests: ["technology", "science"],
    areaSq: "Prishtinë — Qendër",
    availability: ["weekday-evenings", "weekends"],
    communities: ["prishtina-ai-klub"],
  },
  {
    id: "user-fatlume",
    name: "Fatlume Berisha",
    bio: "Coordinates Gjelbër për Prishtinën's neighborhood clean-ups.",
    interests: ["environment", "volunteering"],
    areaSq: "Prishtinë — Dardania",
    availability: ["weekends", "weekday-mornings"],
    communities: ["gjelber-per-prishtinen"],
  },
  {
    id: "user-yll",
    name: "Yll Morina",
    bio: "Runs Sunny Hill's monthly cultural evenings.",
    interests: ["culture", "music"],
    areaSq: "Prishtinë — Sunny Hill",
    availability: ["weekday-evenings", "weekends"],
    communities: ["kolektivi-kulturor-prizreni-i-vjeter"],
  },
  {
    id: "friend-lulzim",
    name: "Lulzim Bytyqi",
    bio: "Game developer by night. Always up for a hackathon, a robot build, or a long debugging session.",
    interests: ["technology", "gaming", "science"],
    areaSq: "Prishtinë — Dardania",
    availability: ["weekday-evenings"],
    communities: ["prishtina-ai-klub"],
  },
  {
    id: "friend-era",
    name: "Era Shala",
    bio: "Street photographer chasing golden hour. Happy to walk slowly and talk about framing.",
    interests: ["photography", "art", "travel"],
    areaSq: "Prishtinë — Qendër",
    availability: ["weekends"],
    communities: ["kolektivi-kulturor-prizreni-i-vjeter"],
  },
  {
    id: "friend-kaltrina",
    name: "Kaltrina Morina",
    bio: "Plants trees on Sundays and cycles everywhere else. Bring water, she brings snacks.",
    interests: ["environment", "volunteering", "sports"],
    areaSq: "Prishtinë — Ulpiana",
    availability: ["weekends", "weekday-mornings"],
    communities: ["gjelber-per-prishtinen", "prishtina-bicikleta"],
  },
  {
    id: "friend-blend",
    name: "Blend Rexhepi",
    bio: "Plays guitar, reads too much poetry, and collects secondhand books.",
    interests: ["music", "culture", "books"],
    areaSq: "Prishtinë — Sunny Hill",
    availability: ["weekday-evenings", "weekends"],
    communities: ["kolektivi-kulturor-prizreni-i-vjeter", "rrethi-i-librit"],
  },
  {
    id: "friend-vesa",
    name: "Vesa Gashi",
    bio: "Runs a tiny food stall and cooks for twenty whenever she can. Loves meeting new neighbors.",
    interests: ["cooking", "entrepreneurship", "volunteering"],
    areaSq: "Prishtinë — Sunny Hill",
    availability: ["weekends"],
    communities: ["kuzhina-e-perbashket"],
  },
  {
    id: "friend-arbnor",
    name: "Arbnor Kastrati",
    bio: "Point guard on weeknights, cheering from the sideline on weekends.",
    interests: ["sports", "gaming"],
    areaSq: "Prishtinë — Lakrishtë",
    availability: ["weekday-evenings"],
    communities: ["rinia-basketboll-lakrishte"],
  },
  {
    id: "friend-diellza",
    name: "Diellza Hoti",
    bio: "Teacher who never leaves a library without a new book. Loves teaching and learning languages.",
    interests: ["education", "books", "science"],
    areaSq: "Prishtinë — Qendër",
    availability: ["weekday-afternoons", "weekday-evenings"],
    communities: ["rrethi-i-librit", "prishtina-ai-klub"],
  },
  {
    id: "friend-ilir",
    name: "Ilir Ahmeti",
    bio: "Illustrator and wheelchair user — he checks accessibility first and appreciates venues that get it right.",
    interests: ["art", "photography", "culture"],
    areaSq: "Prishtinë — Qendër",
    availability: ["weekends"],
    needsAccessible: true,
    communities: ["kolektivi-kulturor-prizreni-i-vjeter"],
  },
];

export const NEW_DEMO_FRIEND_IDS = DEMO_FRIENDS.filter((f) => f.id.startsWith("friend-")).map((f) => f.id);

/** Extra fictional organizers for the three new communities (privileged role, non-public login). */
export const NEW_ORGANIZERS = [
  { id: "user-vlora", email: "vlora.kelmendi@demo.humannetwork.example", name: "Vlora Kelmendi", bio: "Leads the Prishtina Cycling Collective.", communitySlug: "prishtina-bicikleta" },
  { id: "user-besnik", email: "besnik.rexhepi@demo.humannetwork.example", name: "Besnik Rexhepi", bio: "Cooks for the Community Kitchen every Thursday.", communitySlug: "kuzhina-e-perbashket" },
  { id: "user-mirlinda", email: "mirlinda.dedushaj@demo.humannetwork.example", name: "Mirlinda Dedushaj", bio: "Hosts the Book & Language Circle.", communitySlug: "rrethi-i-librit" },
] as const;

/** Friendships between the seeded personas themselves (mutual, all clearly demo examples). */
export const SEEDED_FRIENDSHIPS: [string, string][] = [
  ["user-arta", "user-drin"],
  ["user-arta", "friend-era"],
  ["user-arta", "friend-lulzim"],
  ["friend-era", "friend-blend"],
  ["friend-kaltrina", "user-fatlume"],
  ["friend-vesa", "user-yll"],
  ["friend-diellza", "user-drin"],
];

export interface SeededMessage {
  from: string; // user id, or "VISITOR"
  to: string; // user id, or "VISITOR"
  body: string;
}

/** Example conversations between seeded personas — always labeled "demo example" in the UI. */
export const SEEDED_CONVERSATIONS: SeededMessage[] = [
  { from: "friend-era", to: "user-arta", body: "Are you coming to the Golden Hour walk on the 21st?" },
  { from: "user-arta", to: "friend-era", body: "Yes! I'll bring my old film camera." },
  { from: "friend-era", to: "user-arta", body: "Perfect — see you at Mother Teresa Square." },
  { from: "user-drin", to: "user-arta", body: "Thanks for coming to the AI workshop, Arta. Want to help with the teens curriculum?" },
  { from: "user-arta", to: "user-drin", body: "Happy to help with materials. Send me the outline." },
];

/** Example lines every one-click demo visitor starts with (their own isolated copy). */
export const VISITOR_STARTER_CONVERSATIONS: SeededMessage[] = [
  { from: "user-arta", to: "VISITOR", body: "Hi! I noticed we both like photography and technology." },
  { from: "VISITOR", to: "user-arta", body: "Hi Arta! What are you up to this weekend?" },
  { from: "user-arta", to: "VISITOR", body: "I'm thinking about the Golden Hour Photography Walk on Saturday the 21st — want to come along?" },
  { from: "friend-era", to: "VISITOR", body: "Welcome! The Phone Photography Workshop on the 28th is very beginner friendly." },
];

export const VISITOR_STARTER_FRIEND_IDS = ["user-arta", "friend-era"] as const;
export const VISITOR_STARTER_INVITE = {
  fromFriendId: "user-arta",
  activitySlug: "shetitje-fotografike-qender",
  message: "Want to come along? Golden hour is the best light of the week.",
} as const;

export const VISITOR_DEFAULT_INTERESTS: InterestId[] = ["technology", "photography", "environment"];
export const VISITOR_DEFAULT_AREA = "Prishtinë — Qendër";
export const VISITOR_DEFAULT_AVAILABILITY: AvailabilitySlot[] = ["weekends", "weekday-evenings"];

// ---------------------------------------------------------------------------
// Pure helpers: availability slot and the transparent simulated-reply rule.
// ---------------------------------------------------------------------------

export function serializeAvailability(slots: AvailabilitySlot[], needsAccessible = false): string {
  return [...slots, ...(needsAccessible ? ["needs-accessible"] : [])].join(",");
}

export function parseAvailability(raw: string | null | undefined): { slots: AvailabilitySlot[]; needsAccessible: boolean } {
  const parts = (raw ?? "").split(",").map((p) => p.trim()).filter(Boolean);
  return {
    slots: parts.filter((p): p is AvailabilitySlot => p !== "needs-accessible"),
    needsAccessible: parts.includes("needs-accessible"),
  };
}

export const SLOT_LABEL: Record<AvailabilitySlot, string> = {
  "weekday-mornings": "weekday mornings",
  "weekday-afternoons": "weekday afternoons",
  "weekday-evenings": "weekday evenings",
  weekends: "weekends",
};

/** Which availability slot an activity (ISO date + "HH:MM" local time) falls in. */
export function slotOfActivity(date: string, startTime: string): AvailabilitySlot {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 = Sunday, 6 = Saturday
  if (day === 0 || day === 6) return "weekends";
  const hour = Number(startTime.split(":")[0]);
  if (hour < 12) return "weekday-mornings";
  if (hour < 17) return "weekday-afternoons";
  return "weekday-evenings";
}

export interface ReplyInput {
  friend: { name: string; interests: string[]; availability: string | null };
  activity: { title: string; date: string; startTime: string; category: string; interestTags: string[]; accessibility: string[]; isFull: boolean };
}

export interface SimulatedReply {
  status: "ACCEPTED" | "DECLINED" | "PENDING";
  note: string;
}

/**
 * The ONLY way a fictional friend "responds" to an invitation — a
 * transparent rule over the friend's stored availability, interests and
 * accessibility preference. Never an AI, never a live person; the UI always
 * shows the note and the "simulated reply" label.
 */
export function decideSimulatedReply({ friend, activity }: ReplyInput): SimulatedReply {
  const { slots, needsAccessible } = parseAvailability(friend.availability);
  const slot = slotOfActivity(activity.date, activity.startTime);
  if (activity.isFull) {
    return { status: "DECLINED", note: "Simulated reply: this activity is full." };
  }
  if (needsAccessible && !activity.accessibility.includes("wheelchair-accessible")) {
    return { status: "DECLINED", note: "Simulated reply: this venue isn't listed as wheelchair-accessible, which they need." };
  }
  if (!slots.includes(slot)) {
    return { status: "DECLINED", note: `Simulated reply: not available on ${SLOT_LABEL[slot]}.` };
  }
  const shared = friend.interests.filter((i) => activity.interestTags.includes(i));
  if (shared.length > 0) {
    return { status: "ACCEPTED", note: `Simulated reply: free on ${SLOT_LABEL[slot]} and interested in ${shared.join(", ")}.` };
  }
  return { status: "PENDING", note: `Simulated reply: free on ${SLOT_LABEL[slot]}, but this isn't one of their listed interests — the invitation stays open.` };
}
