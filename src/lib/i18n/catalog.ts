import type { Locale } from "./config";

/** One entry per message, all three languages side by side so a missing translation is a type error. */
export interface Entry {
  en: string;
  sq: string;
}
export type Catalog = Record<string, Entry>;

import { common } from "./messages/common";
import { discover } from "./messages/discover";
import { errors } from "./messages/errors";
import { activity } from "./messages/activity";
import { home } from "./messages/home";
import { social } from "./messages/social";
import { community } from "./messages/community";
import { bridge } from "./messages/bridge";
import { pages } from "./messages/pages";
import { assistant } from "./messages/assistant";
import { progress } from "./messages/progress";
import { forms } from "./messages/forms";
import { staff } from "./messages/staff";

export const CATALOG = { ...common, ...discover, ...errors, ...activity, ...home, ...social, ...community, ...bridge, ...pages, ...assistant, ...progress, ...forms, ...staff } satisfies Catalog;

export type MessageKey = keyof typeof CATALOG;

export function tableFor(locale: Locale): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, entry] of Object.entries(CATALOG as Catalog)) out[key] = entry[locale];
  return out;
}

export const ENGLISH_TABLE: Record<string, string> = tableFor("en");
