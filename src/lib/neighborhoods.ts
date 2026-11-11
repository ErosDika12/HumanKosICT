/**
 * Prishtina neighborhoods as the app already stores them (Activity.areaEn /
 * areaSq, Community.areaSq, Need.areaSq). Pure and shared by server + client.
 * URL slugs are stable and ASCII so links survive copy/paste.
 */
export interface Neighborhood {
  slug: string;
  /** Stored English form, e.g. "Prishtina — Center" (Activity.areaEn). */
  areaEn: string;
  /** Stored Albanian form, e.g. "Prishtinë — Qendër" (Community/Need.areaSq, Activity.areaSq). */
  areaSq: string;
}

export const NEIGHBORHOODS: readonly Neighborhood[] = [
  { slug: "qender", areaEn: "Prishtina — Center", areaSq: "Prishtinë — Qendër" },
  { slug: "dardania", areaEn: "Prishtina — Dardania", areaSq: "Prishtinë — Dardania" },
  { slug: "germia", areaEn: "Prishtina — Germia", areaSq: "Prishtinë — Gërmia" },
  { slug: "lakrishte", areaEn: "Prishtina — Lakrishtë", areaSq: "Prishtinë — Lakrishtë" },
  { slug: "sunny-hill", areaEn: "Prishtina — Sunny Hill", areaSq: "Prishtinë — Sunny Hill" },
  { slug: "ulpiana", areaEn: "Prishtina — Ulpiana", areaSq: "Prishtinë — Ulpiana" },
];

export function neighborhoodBySlug(slug: string): Neighborhood | null {
  return NEIGHBORHOODS.find((n) => n.slug === slug) ?? null;
}

/** Looks a neighborhood up by either stored form; null when the stored area is not one we know. */
export function neighborhoodByArea(area: string | null | undefined): Neighborhood | null {
  if (!area) return null;
  return NEIGHBORHOODS.find((n) => n.areaEn === area || n.areaSq === area) ?? null;
}
