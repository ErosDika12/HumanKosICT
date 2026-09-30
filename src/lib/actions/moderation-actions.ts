"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/current-user";
import { resolveReport } from "@/lib/data/reports";
import { publishActivity, publishCommunity } from "@/lib/data/moderation";

export async function resolveReportAction(formData: FormData): Promise<void> {
  const moderator = await requireRole("MODERATOR");
  const reportId = String(formData.get("reportId") ?? "");
  const note = String(formData.get("note") ?? "");
  await resolveReport(moderator.id, reportId, note || undefined);
  revalidatePath("/moderation");
}

export async function publishCommunityAction(formData: FormData): Promise<void> {
  await requireRole("MODERATOR");
  const communityId = String(formData.get("communityId") ?? "");
  await publishCommunity(communityId);
  revalidatePath("/moderation");
  revalidatePath("/communities");
}

export async function publishActivityAction(formData: FormData): Promise<void> {
  await requireRole("MODERATOR");
  const activityId = String(formData.get("activityId") ?? "");
  await publishActivity(activityId);
  revalidatePath("/moderation");
  revalidatePath("/discover");
}
