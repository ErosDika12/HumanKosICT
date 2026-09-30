import Link from "next/link";
import { DemoBadge } from "@/components/DemoBadge";
import { listCommunities } from "@/lib/data/communities";
import { getCurrentUser } from "@/lib/auth/current-user";

const CATEGORY_LABEL: Record<string, string> = {
  sports: "Sports",
  education: "Education",
  culture: "Culture",
  community: "Community",
  technology: "Technology",
  environment: "Environment",
};

export default async function CommunitiesPage() {
  const [communities, user] = await Promise.all([listCommunities(), getCurrentUser()]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2">
        <DemoBadge className="self-start" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl font-semibold text-foreground">Communities</h1>
          {user && (
            <Link
              href="/communities/new"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong"
            >
              Start a community
            </Link>
          )}
        </div>
        <p className="text-sm text-foreground-muted">
          Komunitetet — {communities.length} published, fictional 2036 demo communities.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {communities.map((c) => (
          <Link
            key={c.id}
            href={`/communities/${c.slug}`}
            className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4 shadow-sm transition-colors hover:bg-surface-muted"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-brand-tint px-2.5 py-1 text-xs font-medium text-brand-strong">
                {CATEGORY_LABEL[c.category] ?? c.category}
              </span>
              {c.visibility === "restricted" && (
                <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-foreground-muted">
                  Restricted — join requires approval
                </span>
              )}
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              {c.name} {c.verified && <span className="text-brand">✓</span>}
            </h3>
            <p className="text-xs text-foreground-muted">📍 {c.areaSq}</p>
            <p className="text-xs text-foreground-muted">{c.memberCount} members</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
