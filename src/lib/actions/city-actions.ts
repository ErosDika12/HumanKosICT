"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { errorParam } from "@/lib/i18n/errors";
import { followNeighborhood, unfollowNeighborhood } from "@/lib/data/follows";
import { archiveNotice, createNotice, createService, setServiceStatus } from "@/lib/data/city";
import { countSimilarOpenIssues, createIssue, updateIssueStatus } from "@/lib/data/issues";
import { createProposal, hideProposal, toggleProposalSupport } from "@/lib/data/proposals";
import { isIssueCategory, ISSUE_STATUSES, type IssueStatusName } from "@/lib/city-config";
import { neighborhoodBySlug } from "@/lib/neighborhoods";

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "");

/** Only ever redirect to our own neighborhood pages, never to a caller-supplied address. */
function neighborhoodPath(slug: string): string {
  return neighborhoodBySlug(slug) ? `/neighborhoods/${slug}` : "/neighborhoods";
}

export async function followNeighborhoodAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const slug = text(formData, "slug");
  let error: string | null = null;
  try {
    await followNeighborhood(user.id, slug);
  } catch (err) {
    error = errorParam(err);
  }
  revalidatePath("/neighborhoods");
  revalidatePath("/profile");
  revalidatePath("/");
  redirect(error ? `${neighborhoodPath(slug)}?error=${error}` : neighborhoodPath(slug));
}

export async function unfollowNeighborhoodAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const slug = text(formData, "slug");
  await unfollowNeighborhood(user.id, slug);
  revalidatePath("/neighborhoods");
  revalidatePath("/profile");
  revalidatePath("/");
  redirect(neighborhoodPath(slug));
}

/**
 * Duplicate handling: if similar open reports exist and the person has not confirmed, nothing is
 * created yet; they are sent back to the form with the count and a "send anyway" box.
 */
export async function reportIssueAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const category = text(formData, "category");
  const areaSlug = text(formData, "areaSlug");
  const description = text(formData, "description");
  const acknowledged = formData.get("acknowledgedSimilar") === "on";

  if (!acknowledged && isIssueCategory(category) && neighborhoodBySlug(areaSlug)) {
    const similar = await countSimilarOpenIssues(category, areaSlug);
    if (similar > 0) {
      const params = new URLSearchParams({ category, area: areaSlug, similar: String(similar), description: description.slice(0, 1000) });
      redirect(`/city/report?${params.toString()}#report-form`);
    }
  }

  let id: string;
  try {
    id = await createIssue(user, { category, areaSlug, description });
  } catch (err) {
    redirect(`/city/report?error=${errorParam(err)}`);
  }
  revalidatePath("/city/report");
  redirect(`/city/report/${id}?submitted=1`);
}

export async function createProposalAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  try {
    await createProposal(user, { title: text(formData, "title"), body: text(formData, "body"), areaSlug: text(formData, "areaSlug") });
  } catch (err) {
    redirect(`/city/proposals?error=${errorParam(err)}`);
  }
  revalidatePath("/city/proposals");
  redirect("/city/proposals?created=1");
}

export async function toggleProposalSupportAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  try {
    await toggleProposalSupport(user.id, text(formData, "proposalId"));
  } catch (err) {
    redirect(`/city/proposals?error=${errorParam(err)}`);
  }
  revalidatePath("/city/proposals");
  redirect("/city/proposals");
}

// ---------------------------------------------------------------------------
// Moderator tools — the data layer re-checks the role; these only call it.
// ---------------------------------------------------------------------------

function manageRedirect(error: string | null): never {
  revalidatePath("/city/manage");
  revalidatePath("/city/services");
  revalidatePath("/city/notices");
  redirect(error ? `/city/manage?error=${error}` : "/city/manage?saved=1");
}

export async function updateIssueStatusAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const raw = text(formData, "status");
  let error: string | null = null;
  try {
    if (!(ISSUE_STATUSES as readonly string[]).includes(raw)) throw new Error("This status change is not allowed.");
    await updateIssueStatus(user, text(formData, "issueId"), raw as IssueStatusName, {
      note: text(formData, "note"),
      duplicateOfId: text(formData, "duplicateOfId") || undefined,
    });
  } catch (err) {
    error = errorParam(err);
  }
  manageRedirect(error);
}

export async function createServiceAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  let error: string | null = null;
  try {
    await createService(user, {
      name: text(formData, "name"),
      nameSq: text(formData, "nameSq"),
      description: text(formData, "description"),
      descriptionSq: text(formData, "descriptionSq"),
      category: text(formData, "category"),
      officialUrl: text(formData, "officialUrl"),
      sourceName: text(formData, "sourceName"),
      reviewedAt: new Date(text(formData, "reviewedAt")),
      publish: formData.get("publish") === "on",
    });
  } catch (err) {
    error = errorParam(err);
  }
  manageRedirect(error);
}

export async function setServiceStatusAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const status = text(formData, "status");
  let error: string | null = null;
  try {
    if (status !== "DRAFT" && status !== "PUBLISHED" && status !== "ARCHIVED") throw new Error("This status change is not allowed.");
    await setServiceStatus(user, text(formData, "serviceId"), status);
  } catch (err) {
    error = errorParam(err);
  }
  manageRedirect(error);
}

export async function createNoticeAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const expires = text(formData, "expiresAt");
  let error: string | null = null;
  try {
    await createNotice(user, {
      title: text(formData, "title"),
      titleSq: text(formData, "titleSq"),
      body: text(formData, "body"),
      bodySq: text(formData, "bodySq"),
      sourceName: text(formData, "sourceName"),
      sourceUrl: text(formData, "sourceUrl"),
      publishedAt: new Date(),
      expiresAt: expires ? new Date(expires) : null,
    });
  } catch (err) {
    error = errorParam(err);
  }
  manageRedirect(error);
}

export async function archiveNoticeAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  let error: string | null = null;
  try {
    await archiveNotice(user, text(formData, "noticeId"));
  } catch (err) {
    error = errorParam(err);
  }
  manageRedirect(error);
}

export async function hideProposalAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  let error: string | null = null;
  try {
    await hideProposal(user, text(formData, "proposalId"));
  } catch (err) {
    error = errorParam(err);
  }
  revalidatePath("/city/proposals");
  manageRedirect(error);
}
