import "server-only";
import { prisma } from "@/lib/prisma";

export interface AttendedEvent {
  activitySlug: string;
  title: string;
  date: string;
  confirmedByName: string;
}

export interface JoinedProject {
  projectSlug: string;
  title: string;
  communityName: string;
  volunteersNeeded: number;
  volunteerCount: number;
}

export interface JoinedCommunity {
  communitySlug: string;
  name: string;
  role: "member" | "organizer";
}

export interface ImpactSummary {
  attendedEvents: AttendedEvent[];
  joinedProjects: JoinedProject[];
  communities: JoinedCommunity[];
}

/**
 * Every field here comes directly from a stored action — Attendance rows
 * (organizer-confirmed, never self-reported), ProjectVolunteer rows, and
 * Membership rows. No hours, no follower/popularity count, nothing
 * derived or estimated (Phase 4 brief: "avoid fabricated impact hours").
 */
export async function getImpactSummary(userId: string): Promise<ImpactSummary> {
  const [attendances, volunteering, memberships] = await Promise.all([
    prisma.attendance.findMany({
      where: { userId },
      include: { activity: { select: { slug: true, title: true, date: true } }, confirmedBy: { select: { name: true } } },
      orderBy: { activity: { date: "desc" } },
    }),
    prisma.projectVolunteer.findMany({
      where: { userId, status: "ACTIVE" },
      include: {
        project: {
          select: {
            slug: true,
            title: true,
            volunteersNeeded: true,
            community: { select: { name: true } },
            _count: { select: { volunteers: { where: { status: "ACTIVE" } } } },
          },
        },
      },
    }),
    prisma.membership.findMany({
      where: { userId, status: "ACTIVE" },
      include: { community: { select: { slug: true, name: true } } },
    }),
  ]);

  return {
    attendedEvents: attendances.map((a) => ({
      activitySlug: a.activity.slug,
      title: a.activity.title,
      date: a.activity.date,
      confirmedByName: a.confirmedBy.name,
    })),
    joinedProjects: volunteering.map((v) => ({
      projectSlug: v.project.slug,
      title: v.project.title,
      communityName: v.project.community.name,
      volunteersNeeded: v.project.volunteersNeeded,
      volunteerCount: v.project._count.volunteers,
    })),
    communities: memberships.map((m) => ({
      communitySlug: m.community.slug,
      name: m.community.name,
      role: m.role === "ORGANIZER" ? "organizer" : "member",
    })),
  };
}
