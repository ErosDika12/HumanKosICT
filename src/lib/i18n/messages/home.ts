import type { Catalog } from "../catalog";

export const home = {
  "home.title.line1": { en: "Find something to do.", sq: "Gjej diçka për të bërë." },
  "home.title.line2": { en: "Go with someone.", sq: "Shko me dikë." },
  "home.lead": {
    en: "Activities in Prishtina, friends to go with, and plans in one place.",
    sq: "Aktivitete në Prishtinë, miq për të shkuar me ta dhe plane në një vend.",
  },
  "home.soon.title": { en: "Coming up", sq: "Së shpejti" },
  "home.soon.all": { en: "All activities", sq: "Të gjitha aktivitetet" },

  "home.entry.friends.title": { en: "Go with a friend", sq: "Shko me një mik" },
  "home.entry.friends.body": { en: "Invite someone to an activity.", sq: "Fto dikë në një aktivitet." },
  "home.entry.communities.title": { en: "Join a community", sq: "Bashkohu me një komunitet" },
  "home.entry.communities.body": { en: "Groups that meet near you.", sq: "Grupe që takohen pranë teje." },
  "home.entry.bridge.title": { en: "Help your neighborhood", sq: "Ndihmo lagjen tënde" },
  "home.entry.bridge.body": { en: "BRIDGE: two communities, one shared need.", sq: "BRIDGE: dy komunitete, një nevojë e përbashkët." },

  // Personal area (after demo login)
  "home.hello": { en: "Hi, {name}", sq: "Përshëndetje, {name}" },
  "home.next.title": { en: "Your next plan", sq: "Plani yt i radhës" },
  "home.next.none": { en: "No plans yet. Pick something this week.", sq: "Ende pa plane. Zgjidh diçka këtë javë." },
  "home.next.browse": { en: "Browse this week", sq: "Shfleto këtë javë" },
  "home.next.viewPlans": { en: "All plans", sq: "Të gjitha planet" },
  "home.next.withFriends": { en: "With {names}", sq: "Me {names}" },
  "home.suggest.title": { en: "Suggested for you", sq: "Të sugjeruara për ty" },
} as const satisfies Catalog;
