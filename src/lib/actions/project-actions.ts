"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { createProject, joinProject, withdrawProject, type ProjectInput } from "@/lib/data/projects";
import { prisma } from "@/lib/prisma";

async function slugOf(projectId: string): Promise<string> {
  const p = await prisma.project.findUniqueOrThrow({ where: { id: projectId }, select: { slug: true } });
  return p.slug;
}

export async function joinProjectAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const projectId = String(formData.get("projectId") ?? "");
  await joinProject(user.id, projectId);
  const slug = await slugOf(projectId);
  revalidatePath(`/projects/${slug}`);
  redirect(`/projects/${slug}`);
}

export async function withdrawProjectAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const projectId = String(formData.get("projectId") ?? "");
  await withdrawProject(user.id, projectId);
  const slug = await slugOf(projectId);
  revalidatePath(`/projects/${slug}`);
  redirect(`/projects/${slug}`);
}

export async function createProjectAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const communitySlug = String(formData.get("communitySlug") ?? "");
  const input: ProjectInput = {
    title: String(formData.get("title") ?? ""),
    titleSq: String(formData.get("titleSq") ?? ""),
    description: String(formData.get("description") ?? ""),
    descriptionSq: String(formData.get("descriptionSq") ?? ""),
    volunteersNeeded: Number(formData.get("volunteersNeeded")),
  };

  let slug: string;
  try {
    slug = await createProject(user.id, communitySlug, input);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create project.";
    redirect(`/communities/${communitySlug}/projects/new?error=${encodeURIComponent(message)}`);
  }
  redirect(`/projects/${slug}?created=1`);
}
