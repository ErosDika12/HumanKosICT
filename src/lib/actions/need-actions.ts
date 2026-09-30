"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { createNeed, findSimilarOpenNeed, reportNeed, toggleNeedSupport } from "@/lib/data/needs";
import type { ActivityCategory } from "@/lib/types";

/**
 * Duplicate prevention (Phase 4 brief): on a first submit for a
 * category+area that already has an OPEN need, nothing is created yet —
 * the visitor is sent back to /needs with that exact category/area still
 * in the URL, so the page (src/app/needs/page.tsx) re-renders the
 * "similar need already exists" notice with a "submit anyway" checkbox.
 * Checking it and resubmitting creates the new need for real. This never
 * silently guesses intent, and never inflates a count with a duplicate row.
 */
export async function createNeedAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const category = String(formData.get("category") ?? "community") as ActivityCategory;
  const areaSq = String(formData.get("areaSq") ?? "").trim();
  const description = String(formData.get("description") ?? "");
  const acknowledgedSimilar = formData.get("acknowledgedSimilar") === "on";

  if (!acknowledgedSimilar) {
    const similar = await findSimilarOpenNeed(category, areaSq);
    if (similar) {
      redirect(`/needs?category=${category}&area=${encodeURIComponent(areaSq)}#submit-need`);
    }
  }

  await createNeed(user.id, {
    category,
    areaSq,
    description,
    communityId: String(formData.get("communityId") ?? "") || undefined,
  });
  revalidatePath("/needs");
  redirect("/needs?submitted=1");
}

export async function toggleNeedSupportAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const needId = String(formData.get("needId") ?? "");
  await toggleNeedSupport(user.id, needId);
  revalidatePath("/needs");
  redirect("/needs");
}

export async function reportNeedAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const needId = String(formData.get("needId") ?? "");
  const reason = String(formData.get("reason") ?? "");
  await reportNeed(user.id, needId, reason);
  redirect("/needs?reported=1");
}
