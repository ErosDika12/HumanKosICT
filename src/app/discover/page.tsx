import Link from "next/link";
import type { Metadata } from "next";
import { DiscoverExplorer } from "@/components/DiscoverExplorer";
import { NearMeButton } from "@/components/NearMeButton";
import { SearchIcon, CloseIcon } from "@/components/icons";
import { listActivities, listDiscoveryFacets, type ActivityFilters } from "@/lib/data/activities";
import { scoreActivities } from "@/lib/data/recommendations";
import { matchesQuery } from "@/lib/data/search";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getUserInterests } from "@/lib/data/interests";
import type { ActivityCategory, InterestId } from "@/lib/types";
import { SIMULATED_NOW_ISO, isSimulatedPast } from "@/lib/simulated-clock";
import { isTimeWindow, type TimeWindow } from "@/lib/time-window";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("nav.discover") };
}

const CATEGORIES: ActivityCategory[] = ["technology", "environment", "sports", "education", "culture", "community"];
const AGE: NonNullable<ActivityFilters["ageEligibility"]>[] = ["all-ages", "adults-only", "supervised-minors"];
const DIFFICULTY: NonNullable<ActivityFilters["difficulty"]>[] = ["beginner", "intermediate", "advanced", "all-levels"];

interface DiscoverSearchParams {
  q?: string;
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
  view?: string;
  past?: string;
}

const PARAM_KEYS = ["q", "interests", "category", "area", "cost", "indoor", "accessibility", "ageEligibility", "difficulty", "when", "lat", "lng", "view", "past"] as const;

function hrefWith(base: URLSearchParams, key: string, value: string | undefined): string {
  const params = new URLSearchParams(base);
  if (value === undefined || params.get(key) === value) params.delete(key);
  else params.set(key, value);
  const qs = params.toString();
  return qs ? `/discover?${qs}` : "/discover";
}

function toggleInList(base: URLSearchParams, key: string, value: string): string {
  const params = new URLSearchParams(base);
  const current = params.get(key)?.split(",").filter(Boolean) ?? [];
  const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
  if (next.length > 0) params.set(key, next.join(","));
  else params.delete(key);
  const qs = params.toString();
  return qs ? `/discover?${qs}` : "/discover";
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-pressed={active}
      className={`inline-flex min-h-10 items-center rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active ? "border-brand bg-brand text-white" : "border-border bg-surface text-foreground hover:bg-surface-muted"
      }`}
    >
      {children}
    </Link>
  );
}

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<DiscoverSearchParams> }) {
  const sp = await searchParams;
  const { t, locale, longDate } = await getI18n();

  const q = (sp.q ?? "").slice(0, 80).trim();
  const category = CATEGORIES.includes(sp.category as ActivityCategory) ? (sp.category as ActivityCategory) : undefined;
  const area = sp.area;
  const cost = sp.cost === "free" || sp.cost === "paid" ? sp.cost : undefined;
  const indoor = sp.indoor === "indoor" ? true : sp.indoor === "outdoor" ? false : undefined;
  const accessibility = sp.accessibility?.split(",").filter(Boolean) ?? [];
  const ageEligibility = AGE.includes(sp.ageEligibility as (typeof AGE)[number]) ? (sp.ageEligibility as (typeof AGE)[number]) : undefined;
  const difficulty = DIFFICULTY.includes(sp.difficulty as (typeof DIFFICULTY)[number]) ? (sp.difficulty as (typeof DIFFICULTY)[number]) : undefined;
  const when: TimeWindow | undefined = isTimeWindow(sp.when) ? sp.when : undefined;
  const lat = sp.lat ? Number(sp.lat) : undefined;
  const lng = sp.lng ? Number(sp.lng) : undefined;
  const origin = lat !== undefined && lng !== undefined && !Number.isNaN(lat) && !Number.isNaN(lng) ? { lat, lng } : undefined;

  const user = await getCurrentUser();
  const explicitInterests = sp.interests?.split(",").filter(Boolean) as InterestId[] | undefined;
  // Interests only RANK results (never hide them): the list always shows everything that matches the filters.
  const interestIds = explicitInterests ?? (user ? await getUserInterests(user.id) : []);

  const filters: ActivityFilters = {
    category,
    area,
    cost,
    indoor,
    accessibility: accessibility.length > 0 ? accessibility : undefined,
    ageEligibility,
    difficulty,
    when,
  };

  const [filteredRaw, facets] = await Promise.all([listActivities(filters), listDiscoveryFacets()]);
  const searched = q ? filteredRaw.filter((a) => matchesQuery(a, q)) : filteredRaw;
  const includePast = sp.past === "1";
  const visible = includePast ? searched : searched.filter((a) => !isSimulatedPast(a.date));
  const hiddenPast = searched.length - visible.length;
  const results = scoreActivities(visible, { interestIds, when, origin, locale });

  const current = new URLSearchParams();
  for (const key of PARAM_KEYS) {
    const v = sp[key];
    if (v) current.set(key, v);
  }

  // Active-filter chips with a one-tap remove.
  const active: { label: string; href: string }[] = [];
  if (q) active.push({ label: t("filter.query", { q }), href: hrefWith(current, "q", undefined) });
  if (when) active.push({ label: t(when === "week" ? "filter.week" : when === "weekend" ? "filter.weekend" : when === "next-weekend" ? "filter.nextWeekend" : "filter.weekday"), href: hrefWith(current, "when", undefined) });
  if (cost) active.push({ label: t(cost === "free" ? "filter.free" : "filter.paid"), href: hrefWith(current, "cost", undefined) });
  if (category) active.push({ label: t(`category.${category}`), href: hrefWith(current, "category", undefined) });
  if (area) active.push({ label: t(`area.${area}`), href: hrefWith(current, "area", undefined) });
  if (indoor !== undefined) active.push({ label: t(indoor ? "fact.indoor" : "fact.outdoor"), href: hrefWith(current, "indoor", undefined) });
  if (ageEligibility) active.push({ label: t(`age.${ageEligibility}`), href: hrefWith(current, "ageEligibility", undefined) });
  if (difficulty) active.push({ label: t(`difficulty.${difficulty}`), href: hrefWith(current, "difficulty", undefined) });
  for (const tag of accessibility) active.push({ label: t(`access.${tag}`), href: toggleInList(current, "accessibility", tag) });

  const detailedActive = Boolean(category || area || indoor !== undefined || ageEligibility || difficulty || accessibility.length > 0 || when === "next-weekend" || when === "weekday" || cost === "paid" || includePast);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{t("discover.title")}</h1>
        <p className="text-sm text-foreground-muted">{t("discover.today", { date: longDate(SIMULATED_NOW_ISO) })}</p>
      </div>

      <form action="/discover" method="get" role="search" className="flex gap-2">
        {PARAM_KEYS.filter((k) => k !== "q" && sp[k]).map((k) => (
          <input key={k} type="hidden" name={k} value={sp[k]} />
        ))}
        <label htmlFor="q" className="sr-only">
          {t("discover.searchLabel")}
        </label>
        <div className="relative flex-1">
          <SearchIcon size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            maxLength={80}
            placeholder={t("discover.searchPlaceholder")}
            className="h-12 w-full rounded-full border border-border bg-surface pl-11 pr-4 text-base text-foreground placeholder:text-foreground-muted"
          />
        </div>
        <button type="submit" className="inline-flex h-12 items-center rounded-full bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-strong">
          {t("discover.search")}
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("discover.quickFilters")}>
        <Chip href={hrefWith(current, "when", "week")} active={when === "week"}>{t("filter.week")}</Chip>
        <Chip href={hrefWith(current, "when", "weekend")} active={when === "weekend"}>{t("filter.weekend")}</Chip>
        <Chip href={hrefWith(current, "cost", "free")} active={cost === "free"}>{t("filter.free")}</Chip>
        <NearMeButton />
      </div>

      <details className="group rounded-2xl border border-border bg-surface" open={detailedActive}>
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2 text-sm font-semibold text-foreground">
          <span>
            {t("filter.more")}
            <span className="ml-2 hidden font-normal text-foreground-muted sm:inline">{t("filter.moreHint")}</span>
          </span>
          <span aria-hidden="true" className="text-foreground-muted transition-transform group-open:rotate-180">⌄</span>
        </summary>
        <div className="flex flex-col gap-4 border-t border-border p-4">
          <FilterRow label={t("filter.category")}>
            {CATEGORIES.map((c) => (
              <Chip key={c} href={hrefWith(current, "category", c)} active={category === c}>{t(`category.${c}`)}</Chip>
            ))}
          </FilterRow>
          {facets.areas.length > 1 && (
            <FilterRow label={t("filter.area")}>
              {facets.areas.map((a) => (
                <Chip key={a} href={hrefWith(current, "area", a)} active={area === a}>{t(`area.${a}`)}</Chip>
              ))}
            </FilterRow>
          )}
          <FilterRow label={t("filter.when")}>
            <Chip href={hrefWith(current, "when", "next-weekend")} active={when === "next-weekend"}>{t("filter.nextWeekend")}</Chip>
            <Chip href={hrefWith(current, "when", "weekday")} active={when === "weekday"}>{t("filter.weekday")}</Chip>
          </FilterRow>
          <FilterRow label={t("filter.cost")}>
            <Chip href={hrefWith(current, "cost", "paid")} active={cost === "paid"}>{t("filter.paid")}</Chip>
          </FilterRow>
          <FilterRow label={t("filter.setting")}>
            <Chip href={hrefWith(current, "indoor", "indoor")} active={indoor === true}>{t("fact.indoor")}</Chip>
            <Chip href={hrefWith(current, "indoor", "outdoor")} active={indoor === false}>{t("fact.outdoor")}</Chip>
          </FilterRow>
          <FilterRow label={t("filter.eligibility")}>
            {AGE.map((a) => (
              <Chip key={a} href={hrefWith(current, "ageEligibility", a)} active={ageEligibility === a}>{t(`age.${a}`)}</Chip>
            ))}
          </FilterRow>
          <FilterRow label={t("filter.difficulty")}>
            {DIFFICULTY.map((d) => (
              <Chip key={d} href={hrefWith(current, "difficulty", d)} active={difficulty === d}>{t(`difficulty.${d}`)}</Chip>
            ))}
          </FilterRow>
          {facets.accessibilityTags.length > 0 && (
            <FilterRow label={t("filter.accessibility")}>
              {facets.accessibilityTags.map((tag) => (
                <Chip key={tag} href={toggleInList(current, "accessibility", tag)} active={accessibility.includes(tag)}>
                  {t(`access.${tag}`)}
                </Chip>
              ))}
            </FilterRow>
          )}
          <div>
            <Link href={hrefWith(current, "past", includePast ? undefined : "1")} scroll={false} className="text-sm font-medium text-brand-strong underline underline-offset-2">
              {includePast ? t("discover.hidePast") : t("filter.includePast")}
            </Link>
          </div>
        </div>
      </details>

      {active.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" aria-label={t("filter.active")}>
          {active.map((f) => (
            <Link
              key={f.label}
              href={f.href}
              scroll={false}
              aria-label={t("filter.remove", { name: f.label })}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-brand-tint px-3 py-1 text-sm font-medium text-brand-strong hover:bg-brand-tint/70"
            >
              {f.label}
              <CloseIcon size={14} />
            </Link>
          ))}
          <Link href="/discover" className="text-sm font-medium text-foreground-muted underline underline-offset-2">
            {t("action.clearAll")}
          </Link>
        </div>
      )}

      <DiscoverExplorer
        activities={results}
        initialView={sp.view === "map" ? "map" : "list"}
        resultsLabel={t("discover.results", { n: results.length })}
        emptyAction={
          <Link href="/discover" className="inline-flex min-h-10 items-center rounded-full bg-brand px-5 text-sm font-semibold text-white">
            {t("action.clearAll")}
          </Link>
        }
      />

      {hiddenPast > 0 && !includePast && (
        <p className="text-sm text-foreground-muted">
          {t("discover.pastHidden", { n: hiddenPast })}{" "}
          <Link href={hrefWith(current, "past", "1")} scroll={false} className="font-semibold text-brand-strong underline underline-offset-2">
            {t("discover.showPast")}
          </Link>
        </p>
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <span className="w-28 shrink-0 text-xs font-semibold uppercase tracking-wide text-foreground-muted">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
