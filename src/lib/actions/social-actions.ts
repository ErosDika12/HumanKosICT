"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { addDemoFriend, removeFriend, SocialError } from "@/lib/data/friends";
import { respondToInvite, sendInvite } from "@/lib/data/invites";
import { sendMessage } from "@/lib/data/messages";
import { ValidationError } from "@/lib/validation";
import { RsvpError } from "@/lib/data/rsvp";
import { errorCodeOf } from "@/lib/i18n/errors";

/** Only same-site paths may be used as a return target. */
function safeReturn(raw: FormDataEntryValue | null, fallback: string): string {
  const value = String(raw ?? "");
  return value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

function withParam(path: string, key: string, value: string): string {
  const [base, hash] = path.split("#");
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}${key}=${encodeURIComponent(value)}${hash ? `#${hash}` : ""}`;
}

/** Expected, user-facing failures become a friendly message on the page instead of an error screen. */
async function run(returnTo: string, fn: () => Promise<void>, okKey?: string): Promise<never> {
  try {
    await fn();
  } catch (err) {
    if (err instanceof SocialError || err instanceof ValidationError || err instanceof RsvpError) {
      redirect(withParam(returnTo, "error", errorCodeOf(err)));
    }
    throw err;
  }
  revalidatePath("/", "layout");
  redirect(okKey ? withParam(returnTo, "ok", okKey) : returnTo);
}

export async function addFriendAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const friendId = String(formData.get("friendId") ?? "");
  const returnTo = safeReturn(formData.get("returnTo"), "/people");
  await run(returnTo, () => addDemoFriend(user.id, friendId), "friend-added");
}

export async function removeFriendAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const friendId = String(formData.get("friendId") ?? "");
  await run(safeReturn(formData.get("returnTo"), "/people"), () => removeFriend(user.id, friendId), "friend-removed");
}

export async function sendInviteAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const friendId = String(formData.get("friendId") ?? "");
  const activityId = String(formData.get("activityId") ?? "");
  const message = String(formData.get("message") ?? "");
  const returnTo = safeReturn(formData.get("returnTo"), "/plans");
  await run(returnTo, () => sendInvite(user.id, friendId, activityId, message), "invited");
}

export async function respondInviteAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const inviteId = String(formData.get("inviteId") ?? "");
  const accept = String(formData.get("decision") ?? "") === "accept";
  const returnTo = safeReturn(formData.get("returnTo"), "/plans");
  await run(returnTo, () => respondToInvite(user.id, inviteId, accept), accept ? "invite-accepted" : "invite-declined");
}

export async function sendMessageAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const friendId = String(formData.get("friendId") ?? "");
  const body = String(formData.get("body") ?? "");
  const returnTo = safeReturn(formData.get("returnTo"), `/messages/${friendId}`);
  await run(returnTo, () => sendMessage(user.id, friendId, body), "sent");
}
