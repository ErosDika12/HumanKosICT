import Link from "next/link";
import { DemoBadge } from "@/components/DemoBadge";
import { DiscoverExplorer } from "@/components/DiscoverExplorer";
import { listActivities } from "@/lib/data/activities";
import { getInterest, type ActivityCategory, type InterestId } from "@/lib/types";

const CATEGORIES: { id: ActivityCategory; label: string }[] = [
  { id: "sports", label: "Sports" },
  { id: "education", label: "Education" },
  { id: "culture", label: "Culture" },
  { id: "technology", label: "Technology" },
  { id: "environment", label: "Environment" },
];

function buildHref(base: URLSearchParams, key: string, value: string | undefined) {
  const params = new URLSearchParams(base);
  if (value === undefined) {
    params.delete(key);
  } else if (params.get(key) === value) {
    params.delete(key);
  } else {
    params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/discover?${qs}` : "/discover";
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ interests?: string; category?: string }>;
}) {
  const resolved = await searchParams;
  const interestIds = (resolved.interests?.split(",").filter(Boolean) ?? []) as InterestId[];
  const category = resolved.category as ActivityCategory | undefined;

  const [filtered, allActivities] = await Promise.all([
    listActivities({ category, interestIds }),
    listActivities(),
  ]);

  const currentParams = new URLSearchParams();
  if (resolved.interests) currentParams.set("interests", resolved.interests);
  if (resolved.category) currentParams.set("category", resolved.category);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2">
        <DemoBadge className="self-start" />
        <h1 className="font-display text-3xl font-semibold text-foreground">
          What can you do in Prishtina this weekend?
        </h1>
        <p className="text-sm text-foreground-muted">
          Çfarë mund të bësh në Prishtinë këtë fundjavë? Showing {filtered.length} of{" "}
          {allActivities.length} seeded demo activities.
        </p>
      </div>

      {interestIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-foreground-muted">Personalized for:</span>
          {interestIds.map((id) => {
            try {
              const interest = getInterest(id);
              return (
                <span
                  key={id}
                  className="rounded-full bg-brand-tint px-3 py-1 text-brand-strong"
                >
                  {interest.emoji} {interest.labelEn}
                </span>
              );
            } catch {
              return null;
            }
          })}
          <Link href="/onboarding" className="text-brand underline underline-offset-2">
            Edit interests
          </Link>
        </div>
      )}

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        {CATEGORIES.map((c) => {
          const active = category === c.id;
          return (
            <Link
              key={c.id}
              href={buildHref(currentParams, "category", c.id)}
              aria-pressed={active}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-surface text-foreground-muted hover:bg-surface-muted"
              }`}
            >
              {c.label}
            </Link>
          );
        })}
        {category && (
          <Link
            href={buildHref(currentParams, "category", undefined)}
            className="rounded-full border border-transparent px-3 py-1.5 text-sm text-foreground-muted underline underline-offset-2"
          >
            Clear category
          </Link>
        )}
      </div>

      <DiscoverExplorer activities={filtered} />
    </div>
  );
}
