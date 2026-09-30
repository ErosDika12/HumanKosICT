"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { createActivity, updateActivity, cancelActivity, type ActivityInput } from "@/lib/data/organizer-activities";
import type { ActivityCategory, DemoActivity, InterestId } from "@/lib/types";

function parseActivityInput(formData: FormData): ActivityInput {
  return {
    title: String(formData.get("title") ?? ""),
    titleSq: String(formData.get("titleSq") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    summarySq: String(formData.get("summarySq") ?? ""),
    category: String(formData.get("category") ?? "community") as ActivityCategory,
    areaSq: String(formData.get("areaSq") ?? ""),
    areaEn: String(formData.get("areaEn") ?? ""),
    venueName: String(formData.get("venueName") ?? ""),
    lat: Number(formData.get("lat")),
    lng: Number(formData.get("lng")),
    date: String(formData.get("date") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
    capacity: Number(formData.get("capacity")),
    cost: formData.get("cost") === "paid" ? "paid" : "free",
    costDetail: String(formData.get("costDetail") ?? "") || undefined,
    indoor: formData.get("indoor") === "on",
    accessibility: formData.getAll("accessibility").map(String),
    ageEligibility: String(formData.get("ageEligibility") ?? "all-ages") as DemoActivity["ageEligibility"],
    difficulty: String(formData.get("difficulty") ?? "all-levels") as DemoActivity["difficulty"],
    description: String(formData.get("description") ?? ""),
    descriptionSq: String(formData.get("descriptionSq") ?? ""),
    interestTags: formData.getAll("interestTags").map(String) as InterestId[],
  };
}

export async function createActivityAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const communitySlug = String(formData.get("communitySlug") ?? "");
  const input = parseActivityInput(formData);

  let slug: string;
  try {
    slug = await createActivity(user.id, communitySlug, input);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create activity.";
    redirect(`/communities/${communitySlug}/activities/new?error=${encodeURIComponent(message)}`);
  }
  redirect(`/discover/${slug}?created=1`);
}

export async function updateActivityAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const slug = String(formData.get("slug") ?? "");
  const input = parseActivityInput(formData);

  try {
    await updateActivity(user.id, slug, input);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not update activity.";
    redirect(`/discover/${slug}/edit?error=${encodeURIComponent(message)}`);
  }
  revalidatePath(`/discover/${slug}`);
  revalidatePath("/discover");
  redirect(`/discover/${slug}?updated=1`);
}

export async function cancelActivityAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const slug = String(formData.get("slug") ?? "");
  await cancelActivity(user.id, slug);
  revalidatePath(`/discover/${slug}`);
  revalidatePath("/discover");
  redirect(`/discover/${slug}`);
}
