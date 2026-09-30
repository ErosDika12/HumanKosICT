/**
 * Transparent, deterministic relevance scoring for Discover (Phase 3).
 *
 * Deliberately NOT `import "server-only"` — this module has no database or
 * request dependency, so it can be unit-tested directly with plain Node
 * (see tests/recommendations.test.ts), unlike the rest of src/lib/data/*.
 *
 * Documented scoring formula (per docs/PRODUCT_CONTRACT.md — every score
 * must be explainable, never an opaque "AI says 95% match"):
 *
 *   score = 2 * (number of matched interests)
 *         + 1                          if the activity falls on the
 *                                      requested weekday/weekend bucket
 *         + max(0, 3 - distanceKm/5)   if the user opted into their location
 *
 * Accessibility and age-eligibility are HARD constraints applied earlier as
 * ordinary filters in src/lib/data/activities.ts — they exclude an activity
 * outright, they never lower its score. Ties break by soonest date, then
 * title, so results are deterministic and reproducible for the same inputs
 * regardless of the order activities were passed in. With no interests, no
 * weekday preference, and no location, every score is 0, so that same
 * date/title tie-break becomes the fallback ordering: soonest first, never
 * a fabricated ranking.
 */
import type { DemoActivity, InterestId } from "@/lib/types";
import { getInterest } from "@/lib/types";

export type DayBucket = "weekday" | "weekend";

export function dayBucketOf(isoDate: string): DayBucket {
  const day = new Date(`${isoDate}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6 ? "weekend" : "weekday";
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface RecommendationContext {
  interestIds?: InterestId[];
  when?: DayBucket;
  origin?: GeoPoint;
}

export interface ScoredActivity extends DemoActivity {
  score: number;
}

export function scoreActivities(
  activities: DemoActivity[],
  ctx: RecommendationContext
): ScoredActivity[] {
  const interestIds = ctx.interestIds ?? [];

  const scored = activities.map((activity): ScoredActivity => {
    const reasons: string[] = [];
    let score = 0;

    const matchedInterests = activity.interestTags.filter((tag) => interestIds.includes(tag));
    if (matchedInterests.length > 0) {
      score += matchedInterests.length * 2;
      const labels = matchedInterests.map((id) => getInterest(id).labelEn);
      reasons.push(
        `Matches your interest in ${labels.join(" and ")}`
      );
    }

    if (ctx.when && dayBucketOf(activity.date) === ctx.when) {
      score += 1;
      reasons.push(ctx.when === "weekend" ? "Happening this weekend" : "Happening on a weekday");
    }

    // Distance itself is rendered as a structured field (ActivityCard's
    // "km away" row), not repeated as a text reason — it already appears
    // right next to this list.
    let distanceKm: number | undefined;
    if (ctx.origin) {
      distanceKm = haversineKm(ctx.origin, { lat: activity.lat, lng: activity.lng });
      score += Math.max(0, 3 - distanceKm / 5);
    }

    return {
      ...activity,
      matchReasons: reasons,
      distanceKm,
      score,
    };
  });

  // Equal-score activities are ordered by date then title, regardless of
  // input order — with no interests/when/origin every score is 0, so this
  // tie-break IS the documented fallback: soonest-first, deterministic
  // regardless of what order the caller passed activities in.
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return a.title.localeCompare(b.title);
  });

  return scored;
}
