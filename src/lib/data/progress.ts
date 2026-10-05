import "server-only";
import { prisma } from "@/lib/prisma";
import {
  computeAchievements,
  computeQuest,
  computeScore,
  type AchievementState,
  type ContributionScore,
  type ProgressFacts,
  type Quest,
} from "@/lib/progress-rules";

export interface Progress {
  facts: ProgressFacts;
  achievements: AchievementState[];
  score: ContributionScore;
  quest: Quest;
  /** A published community the visitor has not joined yet, for the "join a community" step. */
  suggestedCommunity: { slug: string; name: string } | null;
}

/**
 * Reads the stored facts the progress rules need. Nothing is written here:
 * achievements and the score are recomputed from rows that already exist
 * (RSVPs, organizer-confirmed attendance, memberships, project sign-ups…), so
 * a double click, a retried request or a cancel-and-RSVP-again cannot award
 * anything twice, and the same data always gives the same result.
 */
export async function getProgress(userId: string): Promise<Progress> {
  const [rsvpsEver, confirmedPlans, invitesSent, attendances, memberships, volunteering, supportedNeeds] = await Promise.all([
    prisma.rsvp.count({ where: { userId } }),
    prisma.rsvp.count({ where: { userId, status: "CONFIRMED", activity: { status: { not: "CANCELED" } } } }),
    prisma.activityInvite.count({ where: { fromUserId: userId } }),
    prisma.attendance.findMany({ where: { userId }, select: { activity: { select: { communityId: true } } } }),
    prisma.membership.findMany({ where: { userId, status: "ACTIVE" }, select: { communityId: true } }),
    prisma.projectVolunteer.findMany({ where: { userId, status: "ACTIVE" }, select: { projectId: true, project: { select: { communityId: true } } } }),
    prisma.needSupport.count({ where: { userId } }),
  ]);

  const volunteerCommunities = new Set(volunteering.map((v) => v.project.communityId));
  const confirmedVolunteerAttendances = attendances.filter((a) => volunteerCommunities.has(a.activity.communityId)).length;
  const bridgeProjects =
    volunteering.length === 0
      ? 0
      : await prisma.bridgeProposal.count({
          where: { status: "ACCEPTED", draftProjectId: { in: volunteering.map((v) => v.projectId) } },
        });

  const facts: ProgressFacts = {
    everMadePlan: rsvpsEver > 0 || invitesSent > 0,
    confirmedPlans,
    confirmedAttendances: attendances.length,
    confirmedVolunteerAttendances,
    communities: memberships.length,
    projects: volunteering.length,
    bridgeProjects,
    supportedNeeds,
    invitesSent,
  };

  const quest = computeQuest(facts);
  let suggestedCommunity: Progress["suggestedCommunity"] = null;
  if (quest.next.includes("community")) {
    const joined = new Set(memberships.map((m) => m.communityId));
    const candidates = await prisma.community.findMany({
      where: { status: "PUBLISHED", visibility: "PUBLIC", id: { notIn: [...joined] } },
      orderBy: { name: "asc" },
      select: { slug: true, name: true },
      take: 1,
    });
    suggestedCommunity = candidates[0] ?? null;
  }

  return { facts, achievements: computeAchievements(facts), score: computeScore(facts), quest, suggestedCommunity };
}
