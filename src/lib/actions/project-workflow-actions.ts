"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { errorParam } from "@/lib/i18n/errors";
import { prisma } from "@/lib/prisma";
import { addProjectUpdate, completeProject, planProject, startProject } from "@/lib/data/projects";

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "");

async function slugOf(projectId: string): Promise<string> {
  const p = await prisma.project.findUnique({ where: { id: projectId }, select: { slug: true } });
  if (!p) redirect("/communities");
  return p.slug;
}

async function run(projectId: string, work: () => Promise<void>): Promise<never> {
  const slug = await slugOf(projectId);
  let error: string | null = null;
  try {
    await work();
  } catch (err) {
    error = errorParam(err);
  }
  revalidatePath(`/projects/${slug}`);
  redirect(error ? `/projects/${slug}?error=${error}` : `/projects/${slug}`);
}

export async function planProjectAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const projectId = text(formData, "projectId");
  const date = text(formData, "scheduledFor");
  return run(projectId, () =>
    planProject(user, projectId, {
      scheduledFor: date ? new Date(date) : null,
      skillsNeeded: text(formData, "skillsNeeded"),
      materialsNeeded: text(formData, "materialsNeeded"),
    })
  );
}

export async function startProjectAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const projectId = text(formData, "projectId");
  return run(projectId, () => startProject(user, projectId));
}

export async function addProjectUpdateAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const projectId = text(formData, "projectId");
  return run(projectId, () => addProjectUpdate(user, projectId, text(formData, "body")));
}

export async function completeProjectAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const projectId = text(formData, "projectId");
  return run(projectId, () => completeProject(user, projectId, { note: text(formData, "note"), evidence: text(formData, "evidence") }));
}
