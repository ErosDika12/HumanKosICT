import type { ActivityCategory } from "@/lib/types";
import credits from "./photo-credits.json";

/**
 * A small, cohesive set of properly licensed photographs from Wikimedia
 * Commons (CC0, CC BY, CC BY-SA or public domain), resized for mobile in
 * public/photos (1280px and 640px JPEGs). Every credit — author, license and
 * source page — lives in photo-credits.json and is listed on /credits.
 *
 * The events in this app are FICTIONAL (Prishtina 2036). Photos only
 * illustrate a place or a kind of activity and are always labeled as such
 * (see PHOTO_DISCLAIMER) — they never claim to show the fictional event.
 */
export type PhotoKey = keyof typeof credits;

export interface Photo {
  key: PhotoKey;
  src: string;
  srcSm: string;
  alt: string;
  title: string;
  author: string;
  license: string;
  licenseUrl: string;
  source: string;
  place: string;
}

export const PHOTO_DISCLAIMER = "Illustrative photo — not from this fictional 2036 event.";

export function getPhoto(key: PhotoKey): Photo {
  const c = credits[key];
  return {
    key,
    src: `/photos/${key}.jpg`,
    srcSm: `/photos/${key}-sm.jpg`,
    alt: c.alt,
    title: c.title,
    author: c.author,
    license: c.license,
    licenseUrl: c.licenseUrl,
    source: c.source,
    place: c.place,
  };
}

export function listPhotos(): Photo[] {
  return (Object.keys(credits) as PhotoKey[]).map(getPhoto);
}

const CATEGORY_PHOTO: Record<ActivityCategory, PhotoKey> = {
  technology: "youthcenter",
  environment: "germia",
  sports: "basketball",
  education: "library",
  culture: "newborn",
  community: "boulevard",
};

/** Per-activity picks where a specific photo fits better than the category default. */
const ACTIVITY_PHOTO: Record<string, PhotoKey> = {
  "mbjellja-e-pemeve-dardania": "planting",
  "pastrim-parku-gjelber": "planting",
  "shetitje-natyrore-germia": "germia",
  "shetitje-fotografike-qender": "night",
  "mbremje-kulturore-sunny-hill": "newborn",
  "mbremje-poezie-dhe-muzike": "newborn",
  "rrethi-i-librit-shqip-anglisht": "library",
  "pazar-i-hapur-lokal": "boulevard",
  "darke-e-perbashket-sunny-hill": "boulevard",
  "basketboll-i-hapur-lakrishte": "basketball",
  "turne-basketbolli-3x3": "basketball",
  "ecje-me-biciklete-ulpiana": "germia",
  "laborator-ideshe-eko-teknologji": "youthcenter",
  "nate-e-te-dhenave-qytetare": "night",
  "robotike-per-familje": "library",
  "punetori-fotografie-me-telefon": "boulevard",
};

export function photoForActivity(slug: string, category: ActivityCategory): Photo {
  return getPhoto(ACTIVITY_PHOTO[slug] ?? CATEGORY_PHOTO[category]);
}

export function photoForCategory(category: ActivityCategory): Photo {
  return getPhoto(CATEGORY_PHOTO[category]);
}
