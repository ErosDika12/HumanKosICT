"use server";

import { revalidatePath } from "next/cache";
import { errorParam } from "@/lib/i18n/errors";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import {
  createCommunity,
  decideMembership,
  joinCommunity,
  leaveCommunity,
  updateCommunity,
  type CreateCommunityInput,
} from "@/lib/data/communities";
import { prisma } from "@/lib/prisma";
import type { ActivityCategory } from "@/lib/types";

async function slugOf(communityId: string): Promise<string> {
  const c = await prisma.community.findUniqueOrThrow({ where: { id: communityId }, select: { slug: true } });
  return c.slug;
}

export async function joinCommunityAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const communityId = String(formData.get("communityId") ?? "");
  const slug = await slugOf(communityId);
  const result = await joinCommunity(user.id, communityId);
  revalidatePath(`/communities/${slug}`);
  redirect(`/communities/${slug}?joined=${result}`);
}

export async function leaveCommunityAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const communityId = String(formData.get("communityId") ?? "");
  const slug = await slugOf(communityId);
  await leaveCommunity(user.id, communityId);
  revalidatePath(`/communities/${slug}`);
  redirect(`/communities/${slug}`);
}

export async function decideMembershipAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const membershipId = String(formData.get("membershipId") ?? "");
  const decision = String(formData.get("decision") ?? "") as "approve" | "deny";
  const communitySlug = String(formData.get("communitySlug") ?? "");
  await decideMembership(user.id, membershipId, decision);
  revalidatePath(`/communities/${communitySlug}`);
  redirect(`/communities/${communitySlug}`);
}

export async function createCommunityAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const input: CreateCommunityInput = {
    name: String(formData.get("name") ?? ""),
    nameSq: String(formData.get("nameSq") ?? "") || undefined,
    category: String(formData.get("category") ?? "community") as ActivityCategory,
    description: String(formData.get("description") ?? ""),
    descriptionSq: String(formData.get("descriptionSq") ?? ""),
    areaSq: String(formData.get("areaSq") ?? ""),
    language: String(formData.get("language") ?? "") || undefined,
    rules: String(formData.get("rules") ?? "") || undefined,
    visibility: formData.get("visibility") === "restricted" ? "restricted" : "public",
  };

  let slug: string;
  try {
    slug = await createCommunity(user.id, input);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create community.";
    redirect(`/communities/new?error=${errorParam(message)}`);
  }
  redirect(`/communities/${slug}?created=1`);
}

export async function updateCommunityAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const slug = String(formData.get("slug") ?? "");
  await updateCommunity(user.id, slug, {
    description: String(formData.get("description") ?? ""),
    descriptionSq: String(formData.get("descriptionSq") ?? ""),
    language: String(formData.get("language") ?? ""),
    rules: String(formData.get("rules") ?? ""),
    visibility: formData.get("visibility") === "restricted" ? "restricted" : "public",
  });
  revalidatePath(`/communities/${slug}`);
  redirect(`/communities/${slug}`);
}
