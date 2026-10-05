import type { Catalog } from "../catalog";

/** Shared UI vocabulary: navigation, buttons, states, categories, areas, accessibility tags. */
export const common = {
  // Brand + shell
  "brand.name": { en: "Human Network", sq: "Human Network" },
  "brand.tagline": { en: "Prishtina 2036 · demo", sq: "Prishtina 2036 · demo" },
  "shell.skip": { en: "Skip to main content", sq: "Kalo te përmbajtja kryesore" },
  "shell.openMenu": { en: "Open menu", sq: "Hap menynë" },
  "shell.closeMenu": { en: "Close menu", sq: "Mbyll menynë" },
  "shell.more": { en: "More", sq: "Më shumë" },
  "shell.mainNav": { en: "Main", sq: "Kryesore" },
  "shell.mobileNav": { en: "Main navigation", sq: "Navigimi kryesor" },
  "shell.language": { en: "Language", sq: "Gjuha" },
  "shell.demoBadge": { en: "Simulated demo — Prishtina 2036", sq: "Demonstrim i simuluar — Prishtina 2036" },
  "shell.unread": { en: "{n} unread", sq: "{n} të palexuara" },

  "meta.title": { en: "Human Network — Prishtina 2036 (demo)", sq: "Human Network — Prishtina 2036 (demo)" },
  "meta.description": {
    en: "Find something to do in Prishtina, go with a friend, make a plan and help your city through BRIDGE. A fictional 2036 demo — all people and events are simulated.",
    sq: "Gjej diçka për të bërë në Prishtinë, shko me një mik, bëj një plan dhe ndihmo qytetin përmes BRIDGE. Demo fiktive e vitit 2036 — të gjithë personat dhe ngjarjet janë të simuluara.",
  },

  // Navigation
  "nav.discover": { en: "Discover", sq: "Zbulo" },
  "nav.friends": { en: "Friends", sq: "Miqtë" },
  "nav.plans": { en: "Plans", sq: "Planet" },
  "nav.communities": { en: "Communities", sq: "Komunitetet" },
  "nav.bridge": { en: "BRIDGE", sq: "BRIDGE" },
  "nav.assistant": { en: "Assistant", sq: "Ndihmësi" },
  "nav.messages": { en: "Messages", sq: "Mesazhet" },
  "nav.inbox": { en: "Inbox", sq: "Njoftimet" },
  "nav.progress": { en: "My progress", sq: "Progresi im" },
  "nav.needs": { en: "Community needs", sq: "Nevojat e komunitetit" },
  "nav.credits": { en: "Photo credits", sq: "Kreditet e fotove" },
  "nav.staff": { en: "Staff tools", sq: "Mjetet e stafit" },
  "nav.moderation": { en: "Moderation", sq: "Moderimi" },
  "nav.municipality": { en: "Municipality view", sq: "Pamja e komunës" },
  "nav.staffSignIn": { en: "Staff sign in", sq: "Hyrje stafi" },
  "nav.signOut": { en: "Sign out", sq: "Dil" },
  "nav.devPersonas": { en: "Dev personas", sq: "Personat e zhvillimit" },
  "nav.demoLabel": { en: "demo", sq: "demo" },

  // Actions
  "action.demoLogin": { en: "Log in as demo", sq: "Hyr si demo" },
  "action.explore": { en: "Explore activities", sq: "Shfleto aktivitetet" },
  "action.view": { en: "View", sq: "Shiko" },
  "action.viewActivity": { en: "View activity", sq: "Shiko aktivitetin" },
  "action.rsvp": { en: "RSVP", sq: "Konfirmo ardhjen" },
  "action.rsvpAccept": { en: "Accept & RSVP", sq: "Prano dhe konfirmo" },
  "action.cancelRsvp": { en: "Cancel RSVP", sq: "Anulo konfirmimin" },
  "action.invite": { en: "Invite {name}", sq: "Fto {name}" },
  "action.addFriend": { en: "Add friend", sq: "Shto mik" },
  "action.removeFriend": { en: "Remove friend", sq: "Hiq mikun" },
  "action.join": { en: "Join", sq: "Bashkohu" },
  "action.leave": { en: "Leave", sq: "Largohu" },
  "action.joinProject": { en: "Join the project", sq: "Bashkohu me projektin" },
  "action.leaveProject": { en: "Leave the project", sq: "Largohu nga projekti" },
  "action.send": { en: "Send", sq: "Dërgo" },
  "action.save": { en: "Save", sq: "Ruaj" },
  "action.cancel": { en: "Cancel", sq: "Anulo" },
  "action.back": { en: "Back", sq: "Prapa" },
  "action.clear": { en: "Clear", sq: "Pastro" },
  "action.clearAll": { en: "Clear all filters", sq: "Pastro të gjitha filtrat" },
  "action.seeAll": { en: "See all", sq: "Shiko të gjitha" },
  "action.openMap": { en: "Open the map", sq: "Hap hartën" },
  "action.tryAgain": { en: "Try again", sq: "Provo përsëri" },
  "action.continue": { en: "Continue", sq: "Vazhdo" },
  "action.show": { en: "Show", sq: "Shfaq" },
  "action.hide": { en: "Hide", sq: "Fshih" },

  // Activity facts
  "fact.free": { en: "Free", sq: "Falas" },
  "fact.paid": { en: "Paid", sq: "Me pagesë" },
  "fact.indoor": { en: "Indoor", sq: "Brenda" },
  "fact.outdoor": { en: "Outdoor", sq: "Jashtë" },
  "fact.spotsLeft.one": { en: "{n} spot left", sq: "{n} vend i lirë" },
  "fact.spotsLeft.other": { en: "{n} spots left", sq: "{n} vende të lira" },
  "fact.full": { en: "Full", sq: "I plotë" },
  "fact.kmAway": { en: "{km} km away", sq: "{km} km larg" },
  "fact.past": { en: "Already happened", sq: "Ka ndodhur tashmë" },
  "fact.today": { en: "Today", sq: "Sot" },
  "fact.tomorrow": { en: "Tomorrow", sq: "Nesër" },
  "fact.thisWeekend": { en: "This weekend", sq: "Këtë fundjavë" },
  "fact.nextWeekend": { en: "Next weekend", sq: "Fundjavën tjetër" },
  "fact.illustrative": { en: "Illustrative photo · fictional event", sq: "Foto ilustruese · ngjarje fiktive" },

  // Categories
  "category.sports": { en: "Sports", sq: "Sport" },
  "category.education": { en: "Education", sq: "Edukim" },
  "category.culture": { en: "Culture", sq: "Kulturë" },
  "category.community": { en: "Community", sq: "Komunitet" },
  "category.technology": { en: "Technology", sq: "Teknologji" },
  "category.environment": { en: "Environment", sq: "Mjedis" },

  // Areas (proper place names stay; only the district word is shared)
  "area.Prishtina — Center": { en: "Center", sq: "Qendër" },
  "area.Prishtina — Dardania": { en: "Dardania", sq: "Dardania" },
  "area.Prishtina — Germia": { en: "Germia", sq: "Gërmia" },
  "area.Prishtina — Lakrishtë": { en: "Lakrishtë", sq: "Lakrishtë" },
  "area.Prishtina — Sunny Hill": { en: "Sunny Hill", sq: "Kodra e Diellit" },
  "area.Prishtina — Ulpiana": { en: "Ulpiana", sq: "Ulpiana" },

  // Accessibility tags
  "access.wheelchair-accessible": { en: "wheelchair accessible", sq: "e qasshme me karrocë" },
  "access.captioned": { en: "captioned", sq: "me titra" },
  "access.quiet-space-available": { en: "quiet space available", sq: "hapësirë e qetë në dispozicion" },

  // Eligibility / difficulty
  "age.all-ages": { en: "All ages", sq: "Të gjitha moshat" },
  "age.adults-only": { en: "Adults only", sq: "Vetëm të rritur" },
  "age.supervised-minors": { en: "Supervised minors", sq: "Të mitur nën mbikëqyrje" },
  "difficulty.beginner": { en: "Beginner", sq: "Fillestar" },
  "difficulty.intermediate": { en: "Intermediate", sq: "Mesatar" },
  "difficulty.advanced": { en: "Advanced", sq: "I avancuar" },
  "difficulty.all-levels": { en: "All levels", sq: "Të gjitha nivelet" },

  // States
  "state.loading": { en: "Loading…", sq: "Duke ngarkuar…" },
  "state.empty": { en: "Nothing here yet", sq: "Ende asgjë këtu" },
  "state.error.title": { en: "Something went wrong", sq: "Diçka shkoi keq" },
  "state.error.body": {
    en: "The page could not be loaded. Please try again in a moment.",
    sq: "Faqja nuk u ngarkua. Provo përsëri pas pak.",
  },
  "state.demoExample": { en: "demo example", sq: "shembull demo" },
  "state.simulated": { en: "simulated", sq: "i simuluar" },
  "state.fictional": { en: "fictional", sq: "fiktiv" },

  // Footer
  "footer.disclosure": {
    en: "Everyone and everything here is fictional. “Today” is simulated: {date}.",
    sq: "Gjithçka dhe të gjithë këtu janë fiktivë. “Sot” është i simuluar: {date}.",
  },
  "footer.nav": { en: "Footer", sq: "Fundi i faqes" },
} as const satisfies Catalog;
