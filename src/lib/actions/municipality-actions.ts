"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/current-user";
import { saveRecommendationNote } from "@/lib/data/municipality";
import type { ActivityCategory } from "@/lib/types";

export async function saveRecommendationNoteAction(formData: FormData): Promise<void> {
  const analyst = await requireRole("MUNICIPALITY_ANALYST");
  const areaSq = String(formData.get("areaSq") ?? "");
  const category = String(formData.get("category") ?? "") as ActivityCategory;
  const text = String(formData.get("text") ?? "");
  await saveRecommendationNote(analyst.id, areaSq, category, text);
  revalidatePath("/municipality");
}
