import type { Catalog } from "../catalog";

export const home = {
  "home.title.line1": { en: "Find something to do.", sq: "Gjej diçka për të bërë.", sr: "Pronađi šta da radiš." },
  "home.title.line2": { en: "Go with someone.", sq: "Shko me dikë.", sr: "Idi s nekim." },
  "home.lead": {
    en: "Activities in Prishtina, friends to go with, and plans in one place.",
    sq: "Aktivitete në Prishtinë, miq për të shkuar me ta dhe plane në një vend.",
    sr: "Aktivnosti u Prištini, prijatelji s kojima možete da idete i planovi na jednom mestu.",
  },
  "home.soon.title": { en: "Coming up", sq: "Së shpejti", sr: "Uskoro" },
  "home.soon.all": { en: "All activities", sq: "Të gjitha aktivitetet", sr: "Sve aktivnosti" },

  "home.entry.friends.title": { en: "Go with a friend", sq: "Shko me një mik", sr: "Idite sa prijateljem" },
  "home.entry.friends.body": { en: "Invite someone to an activity.", sq: "Fto dikë në një aktivitet.", sr: "Pozovite nekoga na aktivnost." },
  "home.entry.communities.title": { en: "Join a community", sq: "Bashkohu me një komunitet", sr: "Pridružite se zajednici" },
  "home.entry.communities.body": { en: "Groups that meet near you.", sq: "Grupe që takohen pranë teje.", sr: "Grupe koje se okupljaju blizu vas." },
  "home.entry.bridge.title": { en: "Help your neighborhood", sq: "Ndihmo lagjen tënde", sr: "Pomozite svom kraju" },
  "home.entry.bridge.body": { en: "BRIDGE: two communities, one shared need.", sq: "BRIDGE: dy komunitete, një nevojë e përbashkët.", sr: "BRIDGE: dve zajednice, jedna zajednička potreba." },

  // Personal area (after demo login)
  "home.hello": { en: "Hi, {name}", sq: "Përshëndetje, {name}", sr: "Zdravo, {name}" },
  "home.next.title": { en: "Your next plan", sq: "Plani yt i radhës", sr: "Vaš sledeći plan" },
  "home.next.none": { en: "No plans yet. Pick something this week.", sq: "Ende pa plane. Zgjidh diçka këtë javë.", sr: "Još nema planova. Izaberite nešto ove nedelje." },
  "home.next.browse": { en: "Browse this week", sq: "Shfleto këtë javë", sr: "Pregledaj ovu nedelju" },
  "home.next.viewPlans": { en: "All plans", sq: "Të gjitha planet", sr: "Svi planovi" },
  "home.next.withFriends": { en: "With {names}", sq: "Me {names}", sr: "Sa: {names}" },
  "home.suggest.title": { en: "Suggested for you", sq: "Të sugjeruara për ty", sr: "Predlozi za vas" },
} as const satisfies Catalog;
