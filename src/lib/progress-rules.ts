/**
 * Personal progress — achievements, a private contribution score and a small
 * optional "Human Quest". Pure and deterministic (no database, no clock):
 * everything is computed from FACTS that the data layer reads from stored
 * rows, so the same facts always give the same result. That is what makes it
 * idempotent: nothing is "awarded" by an action handler, so a duplicate
 * request, a double click or an RSVP that is canceled and made again can
 * never grant anything twice.
 *
 * What the score is NOT: it never counts opening the app, clicking, sending
 * messages, inviting people or login streaks; it has no ranking, no tiers and
 * is shown only to its owner. It is an explanation of participation, not a
 * judgement of a person. Unit-tested in tests/progress.test.ts.
 */

export interface ProgressFacts {
  /** Any RSVP row ever made (even if later canceled) or any invitation sent — "a plan was made". */
  everMadePlan: boolean;
  /** Distinct upcoming-or-past activities with a CONFIRMED RSVP right now (canceled ones excluded). */
  confirmedPlans: number;
  /** Distinct activities where an ORGANIZER confirmed the visitor's attendance. */
  confirmedAttendances: number;
  /** Of those, how many were at a community whose project the visitor volunteers on. */
  confirmedVolunteerAttendances: number;
  /** ACTIVE community memberships (distinct). */
  communities: number;
  /** ACTIVE project volunteer sign-ups (distinct). */
  projects: number;
  /** Of those, projects that came out of an accepted BRIDGE proposal. */
  bridgeProjects: number;
  /** Needs the visitor has backed (distinct). */
  supportedNeeds: number;
  /** Invitations to friends the visitor has sent. */
  invitesSent: number;
}

export const EMPTY_FACTS: ProgressFacts = {
  everMadePlan: false,
  confirmedPlans: 0,
  confirmedAttendances: 0,
  confirmedVolunteerAttendances: 0,
  communities: 0,
  projects: 0,
  bridgeProjects: 0,
  supportedNeeds: 0,
  invitesSent: 0,
};

// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------
export type AchievementKey =
  | "first-plan"
  | "first-attendance"
  | "first-community"
  | "first-volunteering"
  | "first-bridge";

export interface AchievementState {
  key: AchievementKey;
  earned: boolean;
}

/** Display/priority order. Each is earned at most once because it is a boolean over stored facts. */
export const ACHIEVEMENT_KEYS: readonly AchievementKey[] = [
  "first-plan",
  "first-community",
  "first-bridge",
  "first-attendance",
  "first-volunteering",
];

export function computeAchievements(f: ProgressFacts): AchievementState[] {
  const earned: Record<AchievementKey, boolean> = {
    // A plan or an RSVP — explicitly NOT attendance.
    "first-plan": f.everMadePlan || f.confirmedPlans > 0 || f.confirmedAttendances > 0,
    // Only an organizer's confirmation counts here.
    "first-attendance": f.confirmedAttendances > 0,
    "first-community": f.communities > 0,
    // Confirmed participation at a community the visitor volunteers for.
    "first-volunteering": f.confirmedVolunteerAttendances > 0,
    // Joined a project that came out of a BRIDGE collaboration.
    "first-bridge": f.bridgeProjects > 0,
  };
  return ACHIEVEMENT_KEYS.map((key) => ({ key, earned: earned[key] }));
}

// ---------------------------------------------------------------------------
// Contribution score (0–100)
// ---------------------------------------------------------------------------
export type ScoreKey = "attendance" | "volunteering" | "plans" | "communities" | "projects" | "bridge" | "needs";

export interface ScorePart {
  key: ScoreKey;
  /** "verified" = an organizer confirmed it; "commitment" = something the visitor signed up for. */
  kind: "verified" | "commitment";
  count: number;
  pointsEach: number;
  cap: number;
  points: number;
}

/** Each source counts DISTINCT things once, up to a cap, so no behaviour can be farmed. */
const RULES: { key: ScoreKey; kind: ScorePart["kind"]; pointsEach: number; cap: number; pick: (f: ProgressFacts) => number }[] = [
  { key: "attendance", kind: "verified", pointsEach: 15, cap: 45, pick: (f) => f.confirmedAttendances },
  { key: "volunteering", kind: "verified", pointsEach: 10, cap: 20, pick: (f) => f.confirmedVolunteerAttendances },
  { key: "plans", kind: "commitment", pointsEach: 3, cap: 9, pick: (f) => f.confirmedPlans },
  { key: "communities", kind: "commitment", pointsEach: 4, cap: 8, pick: (f) => f.communities },
  { key: "projects", kind: "commitment", pointsEach: 4, cap: 8, pick: (f) => f.projects },
  { key: "bridge", kind: "commitment", pointsEach: 5, cap: 5, pick: (f) => f.bridgeProjects },
  { key: "needs", kind: "commitment", pointsEach: 1, cap: 4, pick: (f) => f.supportedNeeds },
];

export const MAX_SCORE = 100;

export interface ContributionScore {
  total: number;
  parts: ScorePart[];
  verifiedPoints: number;
  commitmentPoints: number;
}

export function computeScore(f: ProgressFacts): ContributionScore {
  const parts: ScorePart[] = RULES.map((r) => {
    const count = Math.max(0, Math.floor(r.pick(f)));
    return { key: r.key, kind: r.kind, count, pointsEach: r.pointsEach, cap: r.cap, points: Math.min(r.cap, count * r.pointsEach) };
  });
  const verifiedPoints = parts.filter((p) => p.kind === "verified").reduce((s, p) => s + p.points, 0);
  const commitmentPoints = parts.filter((p) => p.kind === "commitment").reduce((s, p) => s + p.points, 0);
  return { total: Math.min(MAX_SCORE, verifiedPoints + commitmentPoints), parts, verifiedPoints, commitmentPoints };
}

// ---------------------------------------------------------------------------
// Human Quest — at most three useful next steps, with genuine completion
// ---------------------------------------------------------------------------
export type QuestKey = "plan" | "friend" | "community" | "bridge";

export interface QuestStep {
  key: QuestKey;
  done: boolean;
}

export interface Quest {
  steps: QuestStep[];
  doneCount: number;
  total: number;
  /** Up to three steps still open, most useful first. */
  next: QuestKey[];
}

export const QUEST_MAX_NEXT = 3;

export function computeQuest(f: ProgressFacts): Quest {
  const steps: QuestStep[] = [
    { key: "plan", done: f.confirmedPlans > 0 || f.confirmedAttendances > 0 },
    { key: "friend", done: f.invitesSent > 0 },
    { key: "community", done: f.communities > 0 },
    { key: "bridge", done: f.bridgeProjects > 0 },
  ];
  const open = steps.filter((s) => !s.done);
  // Inviting a friend only makes sense once there is a plan to invite them to.
  const planDone = steps[0].done;
  const next = open.filter((s) => s.key !== "friend" || planDone).slice(0, QUEST_MAX_NEXT).map((s) => s.key);
  return { steps, doneCount: steps.length - open.length, total: steps.length, next };
}
