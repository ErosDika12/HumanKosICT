"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/current-user";
import { resolveReport } from "@/lib/data/reports";

export async function resolveReportAction(formData: FormData): Promise<void> {
  const moderator = await requireRole("MODERATOR");
  const reportId = String(formData.get("reportId") ?? "");
  const note = String(formData.get("note") ?? "");
  await resolveReport(moderator.id, reportId, note || undefined);
  revalidatePath("/moderation");
}
