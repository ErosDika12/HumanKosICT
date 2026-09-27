"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { createRsvp, cancelRsvp, RsvpError } from "@/lib/data/rsvp";
import { fileReport } from "@/lib/data/reports";
import { prisma } from "@/lib/prisma";

async function resolveActivityPath(activityId: string): Promise<string> {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { slug: true },
  });
  return activity ? `/discover/${activity.slug}` : "/discover";
}

export async function rsvpAction(formData: FormData): Promise<void> {
  const activityId = String(formData.get("activityId") ?? "");
  const path = await resolveActivityPath(activityId);

  let user;
  try {
    user = await requireUser();
  } catch {
    redirect(`/login?next=${encodeURIComponent(path)}`);
  }

  try {
    await createRsvp(user.id, activityId);
  } catch (err) {
    const message = err instanceof RsvpError ? err.message : "Could not complete RSVP.";
    redirect(`${path}?rsvpError=${encodeURIComponent(message)}`);
  }

  revalidatePath(path);
  redirect(path);
}

export async function cancelRsvpAction(formData: FormData): Promise<void> {
  const activityId = String(formData.get("activityId") ?? "");
  const path = await resolveActivityPath(activityId);
  const user = await requireUser();

  await cancelRsvp(user.id, activityId);
  revalidatePath(path);
  redirect(path);
}

export async function reportActivityAction(formData: FormData): Promise<void> {
  const activityId = String(formData.get("activityId") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const path = await resolveActivityPath(activityId);

  let user;
  try {
    user = await requireUser();
  } catch {
    redirect(`/login?next=${encodeURIComponent(path)}`);
  }

  await fileReport(user.id, activityId, reason);
  redirect(`${path}?reported=1`);
}
