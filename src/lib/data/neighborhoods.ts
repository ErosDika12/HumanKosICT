import "server-only";
import { listActivities } from "@/lib/data/activities";
import { listCommunities, type CommunitySummary } from "@/lib/data/communities";
import { listNeeds, type NeedItem } from "@/lib/data/needs";
import { isSimulatedPast } from "@/lib/simulated-clock";
import { NEIGHBORHOODS, neighborhoodByArea, type Neighborhood } from "@/lib/neighborhoods";
import type { DemoActivity } from "@/lib/types";

export interface NeighborhoodOverview {
  neighborhood: Neighborhood;
  activities: DemoActivity[];
  communities: CommunitySummary[];
  /** Open or in-progress needs only; resolved ones are history, not an invitation. */
  needs: NeedItem[];
}

/** Everything the app knows, grouped by neighborhood. One pass over each source. */
export async function listNeighborhoodOverviews(viewerId?: string): Promise<NeighborhoodOverview[]> {
  const [activities, communities, needs] = await Promise.all([listActivities(), listCommunities(), listNeeds(viewerId)]);
  return NEIGHBORHOODS.map((neighborhood) => ({
    neighborhood,
    activities: activities.filter(
      (a) => !isSimulatedPast(a.date) && neighborhoodByArea(a.areaEn)?.slug === neighborhood.slug
    ),
    communities: communities.filter((c) => neighborhoodByArea(c.areaSq)?.slug === neighborhood.slug),
    needs: needs.filter((n) => n.status !== "resolved" && neighborhoodByArea(n.areaSq)?.slug === neighborhood.slug),
  }));
}

export async function getNeighborhoodOverview(slug: string, viewerId?: string): Promise<NeighborhoodOverview | null> {
  return (await listNeighborhoodOverviews(viewerId)).find((o) => o.neighborhood.slug === slug) ?? null;
}
