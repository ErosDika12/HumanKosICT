import "server-only";
import { prisma } from "@/lib/prisma";
import { assertCommunityOrganizer } from "./communities";
import { assertBoundedText, MAX_LONG_TEXT, MAX_SHORT_TEXT } from "@/lib/validation";
import { PermissionError, type Actor } from "@/lib/auth/roles";
import { isHttpUrl } from "@/lib/city-config";
import { deriveProjectStage, type ProjectStage } from "@/lib/project-stage";

export interface ProjectDetail {
  id: string;
  slug: string;
  title: string;
  titleSq: string;
  description: string;
  descriptionSq: string;
  status: "active" | "completed";
  volunteersNeeded: number;
  volunteerCount: number;
  communitySlug: string;
  communityName: string;
  isViewerVolunteering: boolean;
  /** proposed -> in_progress -> completed_confirmed (only with recorded evidence). */
  stage: ProjectStage;
  responsibleOrganizerName: string | null;
  scheduledFor: Date | null;
  skillsNeeded: string | null;
  materialsNeeded: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  completionNote: string | null;
  completionEvidence: string | null;
  updates: { id: string; body: string; createdAt: Date }[];
  /** True for this community's organizer, the responsible organizer, and moderators. */
  canManage: boolean;
}

export async function getProjectBySlug(slug: string, viewerId?: string): Promise<ProjectDetail | null> {
  const project = await prisma.project.findUnique({
    where: { slug },
    include: {
      community: { select: { slug: true, name: true, organizerId: true } },
      responsibleOrganizer: { select: { name: true } },
      updates: { orderBy: { createdAt: "desc" }, take: 20, select: { id: true, body: true, createdAt: true } },
      // Shared count excludes isolated demo visitors; the viewer's own sign-up is added below.
      _count: { select: { volunteers: { where: { status: "ACTIVE", user: { isDemoVisitor: false } } } } },
    },
  });
  if (!project) return null;

  let isViewerVolunteering = false;
  let viewerIsVisitor = false;
  let canManage = false;
  if (viewerId) {
    const [volunteer, viewer] = await Promise.all([
      prisma.projectVolunteer.findUnique({
        where: { userId_projectId: { userId: viewerId, projectId: project.id } },
      }),
      prisma.user.findUnique({ where: { id: viewerId }, select: { isDemoVisitor: true } }),
    ]);
    isViewerVolunteering = volunteer?.status === "ACTIVE";
    viewerIsVisitor = viewer?.isDemoVisitor ?? false;
    const role = (await prisma.user.findUnique({ where: { id: viewerId }, select: { role: true } }))?.role;
    canManage = viewerId === project.community.organizerId || viewerId === project.responsibleOrganizerId || role === "MODERATOR";
  }

  return {
    id: project.id,
    slug: project.slug,
    title: project.title,
    titleSq: project.titleSq,
    description: project.description,
    descriptionSq: project.descriptionSq,
    status: project.status === "COMPLETED" ? "completed" : "active",
    volunteersNeeded: project.volunteersNeeded,
    volunteerCount: project._count.volunteers + (viewerIsVisitor && isViewerVolunteering ? 1 : 0),
    communitySlug: project.community.slug,
    communityName: project.community.name,
    isViewerVolunteering,
    stage: deriveProjectStage({ status: project.status, startedAt: project.startedAt, completionEvidence: project.completionEvidence }),
    responsibleOrganizerName: project.responsibleOrganizer?.name ?? null,
    scheduledFor: project.scheduledFor,
    skillsNeeded: project.skillsNeeded,
    materialsNeeded: project.materialsNeeded,
    startedAt: project.startedAt,
    completedAt: project.completedAt,
    completionNote: project.completionNote,
    completionEvidence: project.completionEvidence,
    updates: project.updates,
    canManage,
  };
}

async function loadManageable(actor: Actor, projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { community: { select: { organizerId: true } } },
  });
  if (!project) throw new Error("Project not found.");
  const allowed = actor.id === project.community.organizerId || actor.id === project.responsibleOrganizerId || actor.role === "MODERATOR";
  if (!allowed) throw new PermissionError("Only this project's organizers can do that.");
  return project;
}

export interface ProjectPlanInput {
  responsibleOrganizerId?: string | null;
  scheduledFor?: Date | null;
  skillsNeeded?: string;
  materialsNeeded?: string;
}

/** Who is responsible, when, and what is needed. The responsible person must be an organizer or moderator. */
export async function planProject(actor: Actor, projectId: string, input: ProjectPlanInput): Promise<void> {
  const project = await loadManageable(actor, projectId);
  if (project.status === "COMPLETED") throw new Error("This project is already completed.");
  const skills = (input.skillsNeeded ?? "").trim();
  const materials = (input.materialsNeeded ?? "").trim();
  assertBoundedText(skills, MAX_SHORT_TEXT, "Skills");
  assertBoundedText(materials, MAX_SHORT_TEXT, "Materials");
  if (input.scheduledFor && Number.isNaN(input.scheduledFor.getTime())) throw new Error("Date must be a valid date.");

  let responsible = project.responsibleOrganizerId;
  if (input.responsibleOrganizerId !== undefined) {
    if (input.responsibleOrganizerId === null) {
      responsible = null;
    } else {
      const user = await prisma.user.findUnique({ where: { id: input.responsibleOrganizerId }, select: { id: true, role: true } });
      if (!user || (user.role !== "ORGANIZER" && user.role !== "MODERATOR")) throw new Error("The responsible person must be an organizer.");
      responsible = user.id;
    }
  }
  await prisma.project.update({
    where: { id: projectId },
    data: {
      responsibleOrganizerId: responsible,
      scheduledFor: input.scheduledFor ?? project.scheduledFor,
      skillsNeeded: skills || null,
      materialsNeeded: materials || null,
    },
  });
}

/** Moves a proposal to "in progress". A named responsible organizer is required first. */
export async function startProject(actor: Actor, projectId: string): Promise<void> {
  const project = await loadManageable(actor, projectId);
  if (project.status === "COMPLETED" || project.startedAt) throw new Error("This status change is not allowed.");
  if (!project.responsibleOrganizerId) throw new Error("Set a responsible organizer first.");
  await prisma.project.update({ where: { id: projectId }, data: { startedAt: new Date() } });
}

export async function addProjectUpdate(actor: Actor, projectId: string, body: string): Promise<void> {
  const project = await loadManageable(actor, projectId);
  if (project.status === "COMPLETED") throw new Error("This project is already completed.");
  const text = (body ?? "").trim();
  if (!text) throw new Error("Update is required.");
  assertBoundedText(text, MAX_SHORT_TEXT, "Update");
  await prisma.projectUpdate.create({ data: { projectId, authorId: actor.id, body: text } });
}

/**
 * Records completion. Evidence (a description, or an http(s) link) is mandatory: without it
 * the project cannot be closed, so a completed outcome is always backed by something real.
 */
export async function completeProject(actor: Actor, projectId: string, input: { note: string; evidence: string }): Promise<void> {
  const project = await loadManageable(actor, projectId);
  if (project.status === "COMPLETED" || !project.startedAt) throw new Error("This status change is not allowed.");
  const note = (input.note ?? "").trim();
  const evidence = (input.evidence ?? "").trim();
  if (!note) throw new Error("Completion note is required.");
  if (!evidence) throw new Error("Evidence is required to complete a project.");
  assertBoundedText(note, MAX_SHORT_TEXT, "Completion note");
  assertBoundedText(evidence, MAX_SHORT_TEXT, "Evidence");
  if (/^[a-z][a-z0-9+.-]*:/i.test(evidence) && !isHttpUrl(evidence)) throw new Error("Enter a valid http(s) link.");
  await prisma.project.update({
    where: { id: projectId },
    data: { status: "COMPLETED", completedAt: new Date(), completionNote: note, completionEvidence: evidence },
  });
}

/** Idempotent: joining while already an active volunteer is a no-op. */
export async function joinProject(userId: string, projectId: string): Promise<void> {
  await prisma.projectVolunteer.upsert({
    where: { userId_projectId: { userId, projectId } },
    create: { userId, projectId, status: "ACTIVE" },
    update: { status: "ACTIVE" },
  });
}

export async function withdrawProject(userId: string, projectId: string): Promise<void> {
  await prisma.projectVolunteer.updateMany({
    where: { userId, projectId },
    data: { status: "WITHDRAWN" },
  });
}

export interface ProjectInput {
  title: string;
  titleSq: string;
  description: string;
  descriptionSq: string;
  volunteersNeeded: number;
  scheduledFor?: Date | null;
  skillsNeeded?: string;
  materialsNeeded?: string;
}

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "project"
  );
}

export async function createProject(
  actorId: string,
  communitySlug: string,
  input: ProjectInput
): Promise<string> {
  if (!input.title.trim() || !input.description.trim() || !input.descriptionSq.trim()) {
    throw new Error("Title and description (English and Albanian) are required.");
  }
  assertBoundedText(input.description, MAX_LONG_TEXT, "Description");
  assertBoundedText(input.descriptionSq, MAX_LONG_TEXT, "Description (Albanian)");
  if (!Number.isFinite(input.volunteersNeeded) || input.volunteersNeeded < 1) {
    throw new Error("Volunteers needed must be at least 1.");
  }
  const community = await prisma.community.findUniqueOrThrow({ where: { slug: communitySlug } });
  await assertCommunityOrganizer(actorId, community.id);

  const base = slugify(input.title);
  let slug = base;
  let suffix = 1;
  while (await prisma.project.findUnique({ where: { slug } })) {
    slug = `${base}-${++suffix}`;
  }

  await prisma.project.create({
    data: {
      slug,
      communityId: community.id,
      title: input.title.trim(),
      titleSq: input.titleSq.trim(),
      description: input.description.trim(),
      descriptionSq: input.descriptionSq.trim(),
      volunteersNeeded: input.volunteersNeeded,
      // The organizer who proposes a project is its responsible organizer until someone else is named.
      responsibleOrganizerId: actorId,
      scheduledFor: input.scheduledFor ?? null,
      skillsNeeded: input.skillsNeeded?.trim() || null,
      materialsNeeded: input.materialsNeeded?.trim() || null,
    },
  });
  return slug;
}
