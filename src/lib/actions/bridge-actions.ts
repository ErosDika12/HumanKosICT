"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import {
  saveBridgeProposal,
  updateBridgeProposal,
  declineBridgeProposal,
  acceptBridgeProposal,
} from "@/lib/data/bridge";

export async function saveBridgeProposalAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await saveBridgeProposal(user.id, id);
  revalidatePath(`/bridge/${id}`);
  revalidatePath("/bridge");
  redirect(`/bridge/${id}`);
}

export async function updateBridgeProposalAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await updateBridgeProposal(user.id, id, {
    mutualBenefit: String(formData.get("mutualBenefit") ?? ""),
    requiredResources: String(formData.get("requiredResources") ?? ""),
    suggestedNextAction: String(formData.get("suggestedNextAction") ?? ""),
  });
  revalidatePath(`/bridge/${id}`);
  redirect(`/bridge/${id}?updated=1`);
}

export async function declineBridgeProposalAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await declineBridgeProposal(user.id, id);
  revalidatePath(`/bridge/${id}`);
  revalidatePath("/bridge");
  redirect(`/bridge/${id}`);
}

export async function acceptBridgeProposalAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const projectSlug = await acceptBridgeProposal(user.id, id);
  revalidatePath(`/bridge/${id}`);
  revalidatePath("/bridge");
  revalidatePath("/impact");
  redirect(`/projects/${projectSlug}?created=1`);
}
