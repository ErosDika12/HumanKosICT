/**
 * "Why am I seeing this?" sentences are generated in English by the matching
 * code (people-matching, friends, demo-social). This pure module turns those
 * exact sentence shapes into the visitor's language. A sentence that matches
 * no known shape is returned unchanged (and a test fails if a seeded one
 * does), so nothing is ever silently mistranslated.
 */
import { INTERESTS, interestLabel, type Interest } from "@/lib/types";
import { ACTIVITIES } from "@/lib/demo-data";
import { localizeActivity } from "./content";
import type { Locale } from "./config";
import type { Translate } from "./translate";

const SLOT_KEYS: Record<string, string> = {
  "weekday mornings": "slotNoun.weekday-mornings",
  "weekday afternoons": "slotNoun.weekday-afternoons",
  "weekday evenings": "slotNoun.weekday-evenings",
  weekends: "slotNoun.weekends",
};

function findInterest(label: string): Interest | undefined {
  const l = label.trim().toLowerCase();
  return INTERESTS.find((i) => i.labelEn.toLowerCase() === l || i.id === l);
}

function interestList(raw: string, locale: Locale, lower = false): string {
  const parts = raw.split(/,\s*/).map((p) => {
    const i = findInterest(p);
    const label = i ? interestLabel(i, locale) : p;
    return lower ? label.toLocaleLowerCase(locale) : label;
  });
  return parts.join(", ");
}

export function localizeReason(reason: string, t: Translate, locale: Locale): string {
  if (locale === "en") return reason;
  let m: RegExpMatchArray | null;

  if ((m = reason.match(/^Shares your interest in (.+)$/))) return t("reason.sharesInterest", { list: interestList(m[1], locale) });
  if ((m = reason.match(/^Both members of (.+)$/))) return t("reason.bothMembers", { list: m[1] });
  if ((m = reason.match(/^Both volunteer on (.+)$/))) return t("reason.bothVolunteer", { list: m[1] });
  if ((m = reason.match(/^You both like (.+)$/))) return t("reason.youBothLike", { list: interestList(m[1], locale, true) });
  if ((m = reason.match(/^(\S+) likes (.+)$/))) return t("reason.friendLikes", { name: m[1], list: interestList(m[2], locale, true) });
  if ((m = reason.match(/^Fits (\S+?)'s (.+)$/)) && SLOT_KEYS[m[2]]) return t("reason.fitsAvailability", { name: m[1], slot: t(SLOT_KEYS[m[2]]) });
  if (reason === "Wheelchair-accessible venue") return t("reason.accessibleVenue");
  if ((m = reason.match(/^Only (\d+) spots? left$/))) return t("reason.fewSpots", { n: Number(m[1]) });

  // Simulated friend replies stored with an invitation.
  if ((m = reason.match(/^Simulated reply: not available on (.+)\.$/)) && SLOT_KEYS[m[1]]) return t("reason.sim.declined", { slot: t(SLOT_KEYS[m[1]]) });
  if ((m = reason.match(/^Simulated reply: free on (.+) and interested in (.+)\.$/)) && SLOT_KEYS[m[1]]) {
    return t("reason.sim.accepted", { slot: t(SLOT_KEYS[m[1]]), list: interestList(m[2], locale, true) });
  }
  if ((m = reason.match(/^Simulated reply: free on (.+), but this isn't one of their listed interests/)) && SLOT_KEYS[m[1]]) {
    return t("reason.sim.pending", { slot: t(SLOT_KEYS[m[1]]) });
  }
  if (reason === "Demo example: accepted.") return t("reason.sim.exampleAccepted");
  return reason;
}

/** Activity titles inside stored notification text are English; show them in the visitor's language when they are seeded activities. */
function localizeTitle(title: string, locale: Locale): string {
  const a = ACTIVITIES.find((x) => x.title === title);
  return a ? localizeActivity(a, locale).title : title;
}

/** Stored in-app notification text → the visitor's language. Unknown text (e.g. an organizer's own words) is left as written. */
export function localizeNotification(message: string, t: Translate, locale: Locale): string {
  if (locale === "en") return message;
  let m: RegExpMatchArray | null;
  if ((m = message.match(/^You're going to "(.+)" — RSVP confirmed\.$/))) return t("notice.rsvpConfirmed", { title: localizeTitle(m[1], locale) });
  if ((m = message.match(/^Invitation sent to (.+) for "(.+)"\.$/))) return t("notice.inviteSent", { name: m[1], title: localizeTitle(m[2], locale) });
  if ((m = message.match(/^"(.+)" changed its date, time, or venue — check the activity page for the new details\.$/))) return t("notice.activityChanged", { title: localizeTitle(m[1], locale) });
  if ((m = message.match(/^"(.+)" was canceled by its organizer\.$/))) return t("notice.activityCanceled", { title: localizeTitle(m[1], locale) });
  if (message.startsWith("Welcome to the demo! Arta")) return t("notice.welcome");
  return message;
}
