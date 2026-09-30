"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import {
  blockUser,
  unblockUser,
  reportUser,
  requestConnection,
  decideConnectionRequest,
} from "@/lib/data/people";

export async function requestConnectionAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const targetId = String(formData.get("targetId") ?? "");
  const reason = String(formData.get("reason") ?? "");
  try {
    await requestConnection(user.id, targetId, reason);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not send request.";
    redirect(`/people?error=${encodeURIComponent(message)}`);
  }
  revalidatePath("/people");
  redirect("/people?requested=1");
}

export async function decideConnectionRequestAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const requestId = String(formData.get("requestId") ?? "");
  const decision = String(formData.get("decision") ?? "") as "accept" | "decline";
  await decideConnectionRequest(user.id, requestId, decision);
  revalidatePath("/people");
  redirect("/people");
}

export async function blockUserAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const targetId = String(formData.get("targetId") ?? "");
  await blockUser(user.id, targetId);
  revalidatePath("/people");
  redirect("/people?blocked=1");
}

export async function unblockUserAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const targetId = String(formData.get("targetId") ?? "");
  await unblockUser(user.id, targetId);
  revalidatePath("/people");
  redirect("/people");
}

export async function reportUserAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const targetId = String(formData.get("targetId") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "/people");
  const base = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/people";
  try {
    await reportUser(user.id, targetId, reason);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not file the report.";
    redirect(`${base}?error=${encodeURIComponent(message)}`);
  }
  redirect(`${base}?reported=1`);
}
