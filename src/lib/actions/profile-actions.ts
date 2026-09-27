"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/current-user";
import { updateOwnProfile } from "@/lib/data/profile";

export async function updateProfileAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  await updateOwnProfile(user.id, user.id, {
    bio: String(formData.get("bio") ?? ""),
    bioSq: String(formData.get("bioSq") ?? ""),
    isDiscoverable: formData.get("isDiscoverable") === "on",
  });
  revalidatePath("/account");
}
