import "server-only";
import { prisma } from "@/lib/prisma";
import { assertCommunityOrganizer } from "./communities";
import { assertBoundedText, MAX_LONG_TEXT } from "@/lib/validation";

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
}

export async function getProjectBySlug(slug: string, viewerId?: string): Promise<ProjectDetail | null> {
  const project = await prisma.project.findUnique({
    where: { slug },
    include: {
      community: { select: { slug: true, name: true } },
      // Shared count excludes isolated demo visitors; the viewer's own sign-up is added below.
      _count: { select: { volunteers: { where: { status: "ACTIVE", user: { isDemoVisitor: false } } } } },
    },
  });
  if (!project) return null;

  let isViewerVolunteering = false;
  let viewerIsVisitor = false;
  if (viewerId) {
    const [volunteer, viewer] = await Promise.all([
      prisma.projectVolunteer.findUnique({
        where: { userId_projectId: { userId: viewerId, projectId: project.id } },
      }),
      prisma.user.findUnique({ where: { id: viewerId }, select: { isDemoVisitor: true } }),
    ]);
    isViewerVolunteering = volunteer?.status === "ACTIVE";
    viewerIsVisitor = viewer?.isDemoVisitor ?? false;
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
  };
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
    },
  });
  return slug;
}
