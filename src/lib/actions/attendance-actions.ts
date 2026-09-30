"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { markAttendance, unmarkAttendance } from "@/lib/data/attendance";
import { prisma } from "@/lib/prisma";

async function slugOf(activityId: string): Promise<string> {
  const a = await prisma.activity.findUniqueOrThrow({ where: { id: activityId }, select: { slug: true } });
  return a.slug;
}

export async function markAttendanceAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const activityId = String(formData.get("activityId") ?? "");
  const attendeeUserId = String(formData.get("userId") ?? "");
  await markAttendance(user.id, activityId, attendeeUserId);
  const slug = await slugOf(activityId);
  revalidatePath(`/discover/${slug}`);
  redirect(`/discover/${slug}`);
}

export async function unmarkAttendanceAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const activityId = String(formData.get("activityId") ?? "");
  const attendeeUserId = String(formData.get("userId") ?? "");
  await unmarkAttendance(user.id, activityId, attendeeUserId);
  const slug = await slugOf(activityId);
  revalidatePath(`/discover/${slug}`);
  redirect(`/discover/${slug}`);
}
