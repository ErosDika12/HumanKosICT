import Link from "next/link";
import { DemoBadge } from "@/components/DemoBadge";
import { JourneyChecklist } from "@/components/JourneyChecklist";
import { Eyebrow } from "@/components/ui";
import { DiscoverExplorer } from "@/components/DiscoverExplorer";
import { NearMeButton } from "@/components/NearMeButton";
import { listActivities, listDiscoveryFacets, type ActivityFilters } from "@/lib/data/activities";
import { scoreActivities, type DayBucket } from "@/lib/data/recommendations";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getUserInterests } from "@/lib/data/interests";
import { getInterest, type ActivityCategory, type InterestId } from "@/lib/types";
import { SIMULATED_NOW_LABEL, isSimulatedPast } from "@/lib/simulated-clock";

const CATEGORIES: { id: ActivityCategory; label: string }[] = [
  { id: "sports", label: "Sports" },
  { id: "education", label: "Education" },
  { id: "culture", label: "Culture" },
  { id: "technology", label: "Technology" },
  { id: "environment", label: "Environment" },
  { id: "community", label: "Community" },
];

const AGE_ELIGIBILITY: { id: NonNullable<ActivityFilters["ageEligibility"]>; label: string }[] = [
  { id: "all-ages", label: "All ages" },
  { id: "adults-only", label: "Adults only" },
  { id: "supervised-minors", label: "Supervised minors" },
];

const DIFFICULTIES: { id: NonNullable<ActivityFilters["difficulty"]>; label: string }[] = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
  { id: "all-levels", label: "All levels" },
];

interface DiscoverSearchParams {
  interests?: string;
  category?: string;
  area?: string;
  cost?: string;
  indoor?: string;
  accessibility?: string;
  ageEligibility?: string;
  difficulty?: string;
  when?: string;
  lat?: string;
  lng?: string;
  all?: string;
  view?: string;
  welcome?: string;
  past?: string;
}

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

function toggleInList(base: URLSearchParams, key: string, value: string) {
  const params = new URLSearchParams(base);
  const current = (params.get(key)?.split(",").filter(Boolean) ?? []) as string[];
  const next = current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];
  if (next.length > 0) params.set(key, next.join(","));
  else params.delete(key);
  const qs = params.toString();
  return qs ? `/discover?${qs}` : "/discover";
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<DiscoverSearchParams>;
}) {
  const resolved = await searchParams;
  const category = resolved.category as ActivityCategory | undefined;
  const area = resolved.area;
  const cost = resolved.cost as ActivityFilters["cost"] | undefined;
  const indoor =
    resolved.indoor === "indoor" ? true : resolved.indoor === "outdoor" ? false : undefined;
  const accessibility = resolved.accessibility?.split(",").filter(Boolean) ?? [];
  const ageEligibility = resolved.ageEligibility as ActivityFilters["ageEligibility"] | undefined;
  const difficulty = resolved.difficulty as ActivityFilters["difficulty"] | undefined;
  const when = resolved.when as DayBucket | undefined;
  const lat = resolved.lat ? Number(resolved.lat) : undefined;
  const lng = resolved.lng ? Number(resolved.lng) : undefined;
  const origin = lat !== undefined && lng !== undefined && !Number.isNaN(lat) && !Number.isNaN(lng)
    ? { lat, lng }
    : undefined;

  const user = await getCurrentUser();
  const explicitInterests = resolved.interests?.split(",").filter(Boolean) as
    | InterestId[]
    | undefined;
  // No explicit ?interests= on the URL and signed in → use the member's own
  // saved preferences as the recommendation input (Phase 2 persistence,
  // reused here). Still just a starting point: adjusting any filter below
  // changes the URL, which the visitor can share or bookmark either way.
  const showAll = resolved.all === "1";
  const interestIds =
    explicitInterests ?? (user && !showAll ? await getUserInterests(user.id) : []);

  const filters: ActivityFilters = {
    category,
    interestIds: interestIds.length > 0 ? interestIds : undefined,
    area,
    cost,
    indoor,
    accessibility: accessibility.length > 0 ? accessibility : undefined,
    ageEligibility,
    difficulty,
    when,
  };

  const [filteredRaw, allActivities, facets] = await Promise.all([
    listActivities(filters),
    listActivities(),
    listDiscoveryFacets(),
  ]);

  // Activities that already happened on the simulated clock are hidden unless asked for.
  const includePast = resolved.past === "1";
  const visibleRaw = includePast ? filteredRaw : filteredRaw.filter((a) => !isSimulatedPast(a.date));
  const hiddenPastCount = filteredRaw.length - visibleRaw.length;
  const filtered = scoreActivities(visibleRaw, { interestIds, when, origin });

  const currentParams = new URLSearchParams();
  if (resolved.interests) currentParams.set("interests", resolved.interests);
  if (resolved.category) currentParams.set("category", resolved.category);
  if (resolved.area) currentParams.set("area", resolved.area);
  if (resolved.cost) currentParams.set("cost", resolved.cost);
  if (resolved.indoor) currentParams.set("indoor", resolved.indoor);
  if (resolved.accessibility) currentParams.set("accessibility", resolved.accessibility);
  if (resolved.ageEligibility) currentParams.set("ageEligibility", resolved.ageEligibility);
  if (resolved.difficulty) currentParams.set("difficulty", resolved.difficulty);
  if (resolved.when) currentParams.set("when", resolved.when);
  if (resolved.lat) currentParams.set("lat", resolved.lat);
  if (resolved.lng) currentParams.set("lng", resolved.lng);
  if (resolved.all) currentParams.set("all", resolved.all);
  if (resolved.view) currentParams.set("view", resolved.view);
  if (resolved.past) currentParams.set("past", resolved.past);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      {user?.isDemoVisitor && <JourneyChecklist userId={user.id} name={user.name} welcome={resolved.welcome === "1"} />}
      <div className="flex flex-col gap-2">
        <DemoBadge className="self-start" />
        <Eyebrow>Discover · Prishtina, {SIMULATED_NOW_LABEL}</Eyebrow>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          What can you do in Prishtina this weekend?
        </h1>
        <p className="text-sm text-foreground-muted">
          Çfarë mund të bësh në Prishtinë këtë fundjavë? Showing {filtered.length} of {allActivities.length} fictional demo
          activities.
        </p>
      </div>

      {(interestIds.length > 0 || (user && showAll)) && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {interestIds.length > 0 ? (
            <>
              <span className="text-foreground-muted">
                {explicitInterests ? "Personalized for:" : "Using your saved interests:"}
              </span>
              {interestIds.map((id) => {
                try {
                  const interest = getInterest(id);
                  return (
                    <span key={id} className="rounded-full bg-brand-tint px-3 py-1 text-brand-strong">
                      {interest.emoji} {interest.labelEn}
                    </span>
                  );
                } catch {
                  return null;
                }
              })}
              <Link href="/onboarding" className="text-brand-strong underline underline-offset-2">
                Edit interests
              </Link>
              <Link href={buildHref(currentParams, "all", "1")} className="font-semibold text-brand-strong underline underline-offset-2">
                Show all activities
              </Link>
            </>
          ) : (
            <>
              <span className="text-foreground-muted">Showing everything, not just your interests.</span>
              <Link href={buildHref(currentParams, "all", undefined)} className="font-semibold text-brand-strong underline underline-offset-2">
                Use my interests
              </Link>
            </>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by category">
          <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            Category
          </span>
          {CATEGORIES.map((c) => (
            <FilterChip
              key={c.id}
              href={buildHref(currentParams, "category", c.id)}
              active={category === c.id}
              label={c.label}
            />
          ))}
          {category && <ClearLink href={buildHref(currentParams, "category", undefined)} />}
        </div>

        {facets.areas.length > 1 && (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by area">
            <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
              Area
            </span>
            {facets.areas.map((a) => (
              <FilterChip key={a} href={buildHref(currentParams, "area", a)} active={area === a} label={a} />
            ))}
            {area && <ClearLink href={buildHref(currentParams, "area", undefined)} />}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by when">
          <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            When
          </span>
          <FilterChip href={buildHref(currentParams, "when", "weekday")} active={when === "weekday"} label="Weekday" />
          <FilterChip href={buildHref(currentParams, "when", "weekend")} active={when === "weekend"} label="Weekend" />
          {when && <ClearLink href={buildHref(currentParams, "when", undefined)} />}
        </div>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by cost">
          <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            Cost
          </span>
          <FilterChip href={buildHref(currentParams, "cost", "free")} active={cost === "free"} label="Free" />
          <FilterChip href={buildHref(currentParams, "cost", "paid")} active={cost === "paid"} label="Paid" />
          {cost && <ClearLink href={buildHref(currentParams, "cost", undefined)} />}
        </div>

        <details className="group rounded-2xl border border-border bg-surface p-3" open={Boolean(resolved.indoor || resolved.ageEligibility || resolved.difficulty || resolved.accessibility)}>
          <summary className="cursor-pointer text-sm font-semibold text-foreground">More filters (setting, eligibility, difficulty, accessibility)</summary>
          <div className="mt-3 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by setting">
          <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            Setting
          </span>
          <FilterChip href={buildHref(currentParams, "indoor", "indoor")} active={indoor === true} label="Indoor" />
          <FilterChip href={buildHref(currentParams, "indoor", "outdoor")} active={indoor === false} label="Outdoor" />
          {resolved.indoor && <ClearLink href={buildHref(currentParams, "indoor", undefined)} />}
        </div>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by age eligibility">
          <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            Eligibility
          </span>
          {AGE_ELIGIBILITY.map((a) => (
            <FilterChip
              key={a.id}
              href={buildHref(currentParams, "ageEligibility", a.id)}
              active={ageEligibility === a.id}
              label={a.label}
            />
          ))}
          {ageEligibility && <ClearLink href={buildHref(currentParams, "ageEligibility", undefined)} />}
        </div>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by difficulty">
          <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            Difficulty
          </span>
          {DIFFICULTIES.map((d) => (
            <FilterChip
              key={d.id}
              href={buildHref(currentParams, "difficulty", d.id)}
              active={difficulty === d.id}
              label={d.label}
            />
          ))}
          {difficulty && <ClearLink href={buildHref(currentParams, "difficulty", undefined)} />}
        </div>

        {facets.accessibilityTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by accessibility">
            <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
              Accessibility
            </span>
            {facets.accessibilityTags.map((tag) => (
              <FilterChip
                key={tag}
                href={toggleInList(currentParams, "accessibility", tag)}
                active={accessibility.includes(tag)}
                label={tag.replace(/-/g, " ")}
              />
            ))}
          </div>
        )}

          </div>
        </details>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            Distance
          </span>
          <NearMeButton />
        </div>
      </div>

      {(hiddenPastCount > 0 || includePast) && (
        <p className="text-sm text-foreground-muted">
          {includePast ? "Including activities that already happened. " : `${hiddenPastCount} activit${hiddenPastCount === 1 ? "y" : "ies"} that already happened are hidden. `}
          <Link href={buildHref(currentParams, "past", includePast ? undefined : "1")} className="font-semibold text-brand-strong underline underline-offset-2">
            {includePast ? "Hide past activities" : "Show them"}
          </Link>
        </p>
      )}

      <DiscoverExplorer activities={filtered} initialView={resolved.view === "map" ? "map" : "list"} />
    </div>
  );
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
        active
          ? "border-brand bg-brand text-white"
          : "border-border bg-surface text-foreground-muted hover:bg-surface-muted"
      }`}
    >
      {label}
    </Link>
  );
}

function ClearLink({ href }: { href: string }) {
  return (
    <Link href={href} className="rounded-full border border-transparent px-2 py-1 text-xs text-foreground-muted underline underline-offset-2">
      Clear
    </Link>
  );
}
