import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCommunityBySlug, listPendingMembers } from "@/lib/data/communities";
import { ensureBridgeProposals, listBridgeProposalsForCommunity } from "@/lib/data/bridge";
import { getCurrentUser } from "@/lib/auth/current-user";
import { demoLoginAction } from "@/lib/auth/actions";
import { buttonClass } from "@/components/ui";
import { PinIcon } from "@/components/icons";
import { joinCommunityAction, leaveCommunityAction, decideMembershipAction } from "@/lib/actions/community-actions";
import { getI18n } from "@/lib/i18n/server";
import { areaFromSq } from "@/lib/i18n/areas";
import { localizeCommunityDescription, localizeActivity, localizeText } from "@/lib/i18n/content";
import { ACTIVITIES } from "@/lib/demo-data";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  return { title: community?.name };
}

export default async function CommunityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ joined?: string; created?: string }>;
}) {
  const { slug } = await params;
  const { joined, created } = await searchParams;
  const { t, locale, shortDate } = await getI18n();
  const user = await getCurrentUser();
  const community = await getCommunityBySlug(slug, user?.id);
  if (!community) notFound();

  const canManage = community.viewerMembership === "organizer" || user?.role === "MODERATOR";
  if (community.status === "draft" && !canManage) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-10 sm:px-6">
        <p className="text-sm text-foreground-muted">{t("community.draftPage")}</p>
      </div>
    );
  }

  const pendingMembers = canManage && community.visibility === "restricted" ? await listPendingMembers(user!.id, community.id) : [];

  await ensureBridgeProposals();
  const bridgeProposals = await listBridgeProposalsForCommunity(community.id);
  const titleOf = (a: { slug: string; title: string }) => {
    const seeded = ACTIVITIES.find((x) => x.slug === a.slug);
    return seeded ? localizeActivity(seeded, locale).title : a.title;
  };
  const btnPrimary = "min-h-10 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-strong";
  const btnSecondary = "inline-flex min-h-10 items-center rounded-full border border-border px-5 py-2 text-sm font-medium text-foreground hover:bg-surface-muted";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <Link href="/communities" className="text-sm font-medium text-brand-strong underline underline-offset-2">
        ← {t("community.back")}
      </Link>

      <div className="flex flex-col gap-2">
        {community.status === "draft" && (
          <span className="inline-flex w-fit rounded-full bg-accent-tint px-3 py-1 text-xs font-medium text-accent-strong">{t("community.draftBadge")}</span>
        )}
        {created && <p className="text-sm text-success">{t("community.created")}</p>}
        {joined === "pending" && <p className="text-sm text-foreground-muted">{t("community.joinPending")}</p>}
        {joined === "member" && <p className="text-sm text-success">{t("community.joined")}</p>}
        <h1 className="font-display text-3xl font-semibold text-foreground">
          {community.name} {community.verified && <span className="text-base font-medium text-brand">✓ {t("communities.verified")}</span>}
        </h1>
        <p className="flex flex-wrap items-center gap-x-2 text-sm text-foreground-muted">
          <span className="inline-flex items-center gap-1">
            <PinIcon size={14} />
            {areaFromSq(community.areaSq, t)}
          </span>
          <span>· {t("communities.members", { n: community.memberCount })}</span>
          <span>· {t("community.organizedBy", { name: community.organizerName })}</span>
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-display text-sm font-semibold text-foreground">{t("community.purpose")}</h2>
        <p className="mt-2 text-sm text-foreground-muted">{localizeCommunityDescription(community, locale)}</p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {community.language && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-foreground-muted">{t("community.language")}</dt>
              <dd className="text-sm text-foreground">{community.language}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs uppercase tracking-wide text-foreground-muted">{t("community.visibility")}</dt>
            <dd className="text-sm text-foreground">{t(`community.visibility.${community.visibility}`)}</dd>
          </div>
          {community.rules && (
            <div className="mt-4 sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-foreground-muted">{t("community.rules")}</dt>
              <dd className="mt-1 text-sm text-foreground-muted">{localizeText(community.rules, locale)}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!user ? (
          <form action={demoLoginAction}>
            <button type="submit" className={buttonClass("accent", "md")}>
              {t("community.signInToJoin")}
            </button>
          </form>
        ) : community.viewerMembership === "organizer" ? (
          <Link href={`/communities/${slug}/edit`} className={btnSecondary}>
            {t("community.edit")}
          </Link>
        ) : community.viewerMembership === "pending" ? (
          <span className="rounded-full border border-border px-5 py-2 text-sm text-foreground-muted">{t("community.requestPending")}</span>
        ) : community.viewerMembership === "member" ? (
          <form action={leaveCommunityAction}>
            <input type="hidden" name="communityId" value={community.id} />
            <button type="submit" className={btnSecondary}>
              {t("community.leave")}
            </button>
          </form>
        ) : (
          <form action={joinCommunityAction}>
            <input type="hidden" name="communityId" value={community.id} />
            <button type="submit" className={btnPrimary}>
              {community.visibility === "restricted" ? t("community.requestJoin") : t("community.join")}
            </button>
          </form>
        )}
        {user && (
          <>
            <Link href={`/communities/${slug}/activities/new`} className={btnSecondary}>
              {community.viewerMembership === "organizer" ? t("community.newEvent") : t("community.proposeEvent")}
            </Link>
            {community.viewerMembership === "organizer" && (
              <Link href={`/communities/${slug}/projects/new`} className={btnSecondary}>
                {t("community.newProject")}
              </Link>
            )}
          </>
        )}
      </div>

      {canManage && pendingMembers.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-display text-sm font-semibold text-foreground">{t("community.pending")}</h2>
          <div className="mt-2 flex flex-col gap-2">
            {pendingMembers.map((m) => (
              <div key={m.membershipId} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-foreground">{m.name}</span>
                <div className="flex gap-2">
                  {(["approve", "deny"] as const).map((decision) => (
                    <form key={decision} action={decideMembershipAction}>
                      <input type="hidden" name="membershipId" value={m.membershipId} />
                      <input type="hidden" name="decision" value={decision} />
                      <input type="hidden" name="communitySlug" value={slug} />
                      <button type="submit" className="min-h-9 rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground-muted hover:bg-surface-muted">
                        {t(decision === "approve" ? "community.approve" : "community.deny")}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-display text-sm font-semibold text-foreground">{t("community.upcoming")}</h2>
        {community.upcomingActivities.length === 0 ? (
          <p className="mt-2 text-sm text-foreground-muted">{t("community.noUpcoming")}</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {community.upcomingActivities.map((a) => (
              <li key={a.slug}>
                <Link href={`/discover/${a.slug}`} className="text-sm font-medium text-brand-strong underline underline-offset-2">
                  {titleOf(a)}
                </Link>
                <span className="ml-2 text-xs text-foreground-muted">
                  {shortDate(a.date)} · {a.startTime}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {community.pastActivities.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-display text-sm font-semibold text-foreground">{t("community.recent")}</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {community.pastActivities.map((a) => (
              <li key={a.slug}>
                <Link href={`/discover/${a.slug}`} className="text-sm text-brand-strong underline underline-offset-2">
                  {titleOf(a)}
                </Link>
                <span className="ml-2 text-xs text-foreground-muted">
                  {shortDate(a.date)} · {a.startTime}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-display text-sm font-semibold text-foreground">{t("community.projects")}</h2>
        {community.projects.length === 0 ? (
          <p className="mt-2 text-sm text-foreground-muted">{t("community.noProjects")}</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {community.projects.map((p) => (
              <li key={p.slug} className="flex items-center justify-between gap-3 text-sm">
                <Link href={`/projects/${p.slug}`} className="font-medium text-brand-strong underline underline-offset-2">
                  {locale === "sq" ? p.titleSq : localizeText(p.title, locale)}
                </Link>
                <span className="shrink-0 text-xs text-foreground-muted">{t("community.volunteers", { n: p.volunteerCount, total: p.volunteersNeeded })}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {bridgeProposals.length > 0 && (
        <div className="rounded-2xl border border-brand bg-brand-tint p-5">
          <h2 className="font-display text-sm font-semibold text-brand-strong">{t("community.bridge")}</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {bridgeProposals.map((p) => (
              <li key={p.id} className="text-sm">
                <Link href={`/bridge/${p.id}`} className="text-brand-strong underline underline-offset-2">
                  {p.communityAName} × {p.communityBName}
                </Link>{" "}
                <span className="text-xs text-foreground-muted">({t(`bridge.status.${p.status}`)})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
