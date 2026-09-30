/**
 * BRIDGE progress stages — pure and deterministic, derived only from stored
 * facts (proposal status, whether a project exists, volunteer counts, the
 * kickoff session's date). Unit-tested in tests/bridge-stages.test.ts. Not
 * `server-only`, so it can be shared by pages and tests alike.
 */
export type BridgeStageState = "done" | "current" | "upcoming" | "blocked";

export interface BridgeStage {
  key: "need" | "match" | "decision" | "project" | "session";
  label: string;
  detail: string;
  state: BridgeStageState;
}

export interface BridgeStageInput {
  status: "suggested" | "saved" | "accepted" | "declined";
  communityAName: string;
  communityBName: string;
  needSupporters: number;
  project: { volunteerCount: number; volunteersNeeded: number } | null;
  kickoff: { title: string; date: string; isPast: boolean } | null;
}

export type BridgeNextStepKind = "review" | "join-project" | "rsvp-kickoff" | "view-plan" | "explore";

export interface BridgeViewerState {
  isVolunteer: boolean;
  hasKickoffRsvp: boolean;
}

export interface BridgeNextStep {
  kind: BridgeNextStepKind;
  label: string;
  description: string;
}

export function computeBridgeStages(input: BridgeStageInput): BridgeStage[] {
  const { status } = input;
  const decided = status === "accepted" || status === "declined";

  const stages: BridgeStage[] = [
    {
      key: "need",
      label: "Need raised",
      detail:
        input.needSupporters > 0
          ? `${input.needSupporters} neighbor${input.needSupporters === 1 ? "" : "s"} back this need`
          : "A neighbor raised this need",
      state: "done",
    },
    {
      key: "match",
      label: "Communities matched",
      detail: `${input.communityAName} + ${input.communityBName}`,
      state: "done",
    },
    {
      key: "decision",
      label: "Organizers decide",
      detail:
        status === "accepted"
          ? "Accepted by an organizer"
          : status === "declined"
            ? "Declined by an organizer"
            : status === "saved"
              ? "Saved — under review"
              : "Waiting for an organizer",
      state: status === "declined" ? "blocked" : decided ? "done" : "upcoming",
    },
    {
      key: "project",
      label: "Project starts",
      detail: input.project
        ? `${input.project.volunteerCount} of ${input.project.volunteersNeeded} volunteers joined`
        : "Created when an organizer accepts",
      state: status === "accepted" && input.project ? "done" : "upcoming",
    },
    {
      key: "session",
      label: "First joint session",
      detail: input.kickoff ? `${input.kickoff.title} · ${input.kickoff.date}` : "Not scheduled yet",
      state:
        status === "accepted" && input.kickoff
          ? input.kickoff.isPast
            ? "done"
            : "upcoming"
          : "upcoming",
    },
  ];

  // The first stage that is not done becomes the "current" one (unless the proposal was declined).
  if (status !== "declined") {
    const firstOpen = stages.findIndex((s) => s.state === "upcoming");
    if (firstOpen !== -1) stages[firstOpen] = { ...stages[firstOpen], state: "current" };
  }
  return stages;
}

export function computeBridgeNextStep(input: BridgeStageInput, viewer: BridgeViewerState): BridgeNextStep {
  if (input.status === "declined") {
    return { kind: "explore", label: "See other proposals", description: "This one was declined — BRIDGE keeps other matches open." };
  }
  if (input.status !== "accepted") {
    return {
      kind: "review",
      label: "See why this match works",
      description: `An organizer of ${input.communityAName} or ${input.communityBName} decides. You can read the reasoning and follow along.`,
    };
  }
  if (input.project && !viewer.isVolunteer) {
    return { kind: "join-project", label: "Join the project", description: "Volunteer with both communities — it takes one click and you can leave any time." };
  }
  if (input.kickoff && !input.kickoff.isPast && !viewer.hasKickoffRsvp) {
    return { kind: "rsvp-kickoff", label: "RSVP to the first session", description: `Meet both communities at ${input.kickoff.title}.` };
  }
  return { kind: "view-plan", label: "View your plan", description: "You are in — see your upcoming plans and who is going with you." };
}
