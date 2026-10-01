import type { Catalog } from "../catalog";

/** Shared UI vocabulary: navigation, buttons, states, categories, areas, accessibility tags. */
export const common = {
  // Brand + shell
  "brand.name": { en: "Human Network", sq: "Human Network", sr: "Human Network" },
  "brand.tagline": { en: "Prishtina 2036 · demo", sq: "Prishtina 2036 · demo", sr: "Priština 2036 · demo" },
  "shell.skip": { en: "Skip to main content", sq: "Kalo te përmbajtja kryesore", sr: "Pređi na glavni sadržaj" },
  "shell.openMenu": { en: "Open menu", sq: "Hap menynë", sr: "Otvori meni" },
  "shell.closeMenu": { en: "Close menu", sq: "Mbyll menynë", sr: "Zatvori meni" },
  "shell.more": { en: "More", sq: "Më shumë", sr: "Više" },
  "shell.mainNav": { en: "Main", sq: "Kryesore", sr: "Glavna" },
  "shell.mobileNav": { en: "Main navigation", sq: "Navigimi kryesor", sr: "Glavna navigacija" },
  "shell.language": { en: "Language", sq: "Gjuha", sr: "Jezik" },
  "shell.demoBadge": { en: "Simulated demo — Prishtina 2036", sq: "Demonstrim i simuluar — Prishtina 2036", sr: "Simulirana demonstracija — Priština 2036" },
  "shell.unread": { en: "{n} unread", sq: "{n} të palexuara", sr: "{n} nepročitano" },

  "meta.title": { en: "Human Network — Prishtina 2036 (demo)", sq: "Human Network — Prishtina 2036 (demo)", sr: "Human Network — Priština 2036 (demo)" },
  "meta.description": {
    en: "Find something to do in Prishtina, go with a friend, make a plan and help your city through BRIDGE. A fictional 2036 demo — all people and events are simulated.",
    sq: "Gjej diçka për të bërë në Prishtinë, shko me një mik, bëj një plan dhe ndihmo qytetin përmes BRIDGE. Demo fiktive e vitit 2036 — të gjithë personat dhe ngjarjet janë të simuluara.",
    sr: "Pronađite šta da radite u Prištini, idite sa prijateljem, napravite plan i pomozite svom gradu kroz BRIDGE. Izmišljena demonstracija iz 2036 — sve osobe i događaji su simulirani.",
  },

  // Navigation
  "nav.discover": { en: "Discover", sq: "Zbulo", sr: "Otkrij" },
  "nav.friends": { en: "Friends", sq: "Miqtë", sr: "Prijatelji" },
  "nav.plans": { en: "Plans", sq: "Planet", sr: "Planovi" },
  "nav.communities": { en: "Communities", sq: "Komunitetet", sr: "Zajednice" },
  "nav.bridge": { en: "BRIDGE", sq: "BRIDGE", sr: "BRIDGE" },
  "nav.assistant": { en: "Assistant", sq: "Ndihmësi", sr: "Pomoćnik" },
  "nav.messages": { en: "Messages", sq: "Mesazhet", sr: "Poruke" },
  "nav.inbox": { en: "Inbox", sq: "Njoftimet", sr: "Obaveštenja" },
  "nav.progress": { en: "My progress", sq: "Progresi im", sr: "Moj napredak" },
  "nav.needs": { en: "Community needs", sq: "Nevojat e komunitetit", sr: "Potrebe zajednice" },
  "nav.credits": { en: "Photo credits", sq: "Kreditet e fotove", sr: "Zasluge za fotografije" },
  "nav.staff": { en: "Staff tools", sq: "Mjetet e stafit", sr: "Alati za osoblje" },
  "nav.moderation": { en: "Moderation", sq: "Moderimi", sr: "Moderacija" },
  "nav.municipality": { en: "Municipality view", sq: "Pamja e komunës", sr: "Pregled opštine" },
  "nav.staffSignIn": { en: "Staff sign in", sq: "Hyrje stafi", sr: "Prijava za osoblje" },
  "nav.signOut": { en: "Sign out", sq: "Dil", sr: "Odjavi se" },
  "nav.devPersonas": { en: "Dev personas", sq: "Personat e zhvillimit", sr: "Razvojne persone" },
  "nav.demoLabel": { en: "demo", sq: "demo", sr: "demo" },

  // Actions
  "action.demoLogin": { en: "Log in as demo", sq: "Hyr si demo", sr: "Prijavi se kao demo" },
  "action.explore": { en: "Explore activities", sq: "Shfleto aktivitetet", sr: "Istraži aktivnosti" },
  "action.view": { en: "View", sq: "Shiko", sr: "Pogledaj" },
  "action.viewActivity": { en: "View activity", sq: "Shiko aktivitetin", sr: "Pogledaj aktivnost" },
  "action.rsvp": { en: "RSVP", sq: "Konfirmo ardhjen", sr: "Potvrdi dolazak" },
  "action.rsvpAccept": { en: "Accept & RSVP", sq: "Prano dhe konfirmo", sr: "Prihvati i potvrdi" },
  "action.cancelRsvp": { en: "Cancel RSVP", sq: "Anulo konfirmimin", sr: "Otkaži dolazak" },
  "action.invite": { en: "Invite {name}", sq: "Fto {name}", sr: "Pozovi {name}" },
  "action.addFriend": { en: "Add friend", sq: "Shto mik", sr: "Dodaj prijatelja" },
  "action.removeFriend": { en: "Remove friend", sq: "Hiq mikun", sr: "Ukloni prijatelja" },
  "action.join": { en: "Join", sq: "Bashkohu", sr: "Pridruži se" },
  "action.leave": { en: "Leave", sq: "Largohu", sr: "Napusti" },
  "action.joinProject": { en: "Join the project", sq: "Bashkohu me projektin", sr: "Pridruži se projektu" },
  "action.leaveProject": { en: "Leave the project", sq: "Largohu nga projekti", sr: "Napusti projekat" },
  "action.send": { en: "Send", sq: "Dërgo", sr: "Pošalji" },
  "action.save": { en: "Save", sq: "Ruaj", sr: "Sačuvaj" },
  "action.cancel": { en: "Cancel", sq: "Anulo", sr: "Otkaži" },
  "action.back": { en: "Back", sq: "Prapa", sr: "Nazad" },
  "action.clear": { en: "Clear", sq: "Pastro", sr: "Obriši" },
  "action.clearAll": { en: "Clear all filters", sq: "Pastro të gjitha filtrat", sr: "Obriši sve filtere" },
  "action.seeAll": { en: "See all", sq: "Shiko të gjitha", sr: "Prikaži sve" },
  "action.openMap": { en: "Open the map", sq: "Hap hartën", sr: "Otvori mapu" },
  "action.tryAgain": { en: "Try again", sq: "Provo përsëri", sr: "Pokušaj ponovo" },
  "action.continue": { en: "Continue", sq: "Vazhdo", sr: "Nastavi" },
  "action.show": { en: "Show", sq: "Shfaq", sr: "Prikaži" },
  "action.hide": { en: "Hide", sq: "Fshih", sr: "Sakrij" },

  // Activity facts
  "fact.free": { en: "Free", sq: "Falas", sr: "Besplatno" },
  "fact.paid": { en: "Paid", sq: "Me pagesë", sr: "Uz naplatu" },
  "fact.indoor": { en: "Indoor", sq: "Brenda", sr: "U zatvorenom" },
  "fact.outdoor": { en: "Outdoor", sq: "Jashtë", sr: "Napolju" },
  "fact.spotsLeft.one": { en: "{n} spot left", sq: "{n} vend i lirë", sr: "{n} slobodno mesto" },
  "fact.spotsLeft.few": { en: "{n} spots left", sq: "{n} vende të lira", sr: "{n} slobodna mesta" },
  "fact.spotsLeft.other": { en: "{n} spots left", sq: "{n} vende të lira", sr: "{n} slobodnih mesta" },
  "fact.full": { en: "Full", sq: "I plotë", sr: "Popunjeno" },
  "fact.kmAway": { en: "{km} km away", sq: "{km} km larg", sr: "{km} km daleko" },
  "fact.past": { en: "Already happened", sq: "Ka ndodhur tashmë", sr: "Već se dogodilo" },
  "fact.today": { en: "Today", sq: "Sot", sr: "Danas" },
  "fact.tomorrow": { en: "Tomorrow", sq: "Nesër", sr: "Sutra" },
  "fact.thisWeekend": { en: "This weekend", sq: "Këtë fundjavë", sr: "Ovog vikenda" },
  "fact.nextWeekend": { en: "Next weekend", sq: "Fundjavën tjetër", sr: "Sledećeg vikenda" },
  "fact.illustrative": { en: "Illustrative photo · fictional event", sq: "Foto ilustruese · ngjarje fiktive", sr: "Ilustrativna fotografija · izmišljen događaj" },

  // Categories
  "category.sports": { en: "Sports", sq: "Sport", sr: "Sport" },
  "category.education": { en: "Education", sq: "Edukim", sr: "Obrazovanje" },
  "category.culture": { en: "Culture", sq: "Kulturë", sr: "Kultura" },
  "category.community": { en: "Community", sq: "Komunitet", sr: "Zajednica" },
  "category.technology": { en: "Technology", sq: "Teknologji", sr: "Tehnologija" },
  "category.environment": { en: "Environment", sq: "Mjedis", sr: "Životna sredina" },

  // Areas (proper place names stay; only the district word is shared)
  "area.Prishtina — Center": { en: "Center", sq: "Qendër", sr: "Centar" },
  "area.Prishtina — Dardania": { en: "Dardania", sq: "Dardania", sr: "Dardanija" },
  "area.Prishtina — Germia": { en: "Germia", sq: "Gërmia", sr: "Germija" },
  "area.Prishtina — Lakrishtë": { en: "Lakrishtë", sq: "Lakrishtë", sr: "Lakrište" },
  "area.Prishtina — Sunny Hill": { en: "Sunny Hill", sq: "Kodra e Diellit", sr: "Sunčani breg" },
  "area.Prishtina — Ulpiana": { en: "Ulpiana", sq: "Ulpiana", sr: "Ulpijana" },

  // Accessibility tags
  "access.wheelchair-accessible": { en: "wheelchair accessible", sq: "e qasshme me karrocë", sr: "pristupačno invalidskim kolicima" },
  "access.captioned": { en: "captioned", sq: "me titra", sr: "sa titlovima" },
  "access.quiet-space-available": { en: "quiet space available", sq: "hapësirë e qetë në dispozicion", sr: "dostupan miran prostor" },

  // Eligibility / difficulty
  "age.all-ages": { en: "All ages", sq: "Të gjitha moshat", sr: "Svi uzrasti" },
  "age.adults-only": { en: "Adults only", sq: "Vetëm të rritur", sr: "Samo za odrasle" },
  "age.supervised-minors": { en: "Supervised minors", sq: "Të mitur nën mbikëqyrje", sr: "Maloletnici pod nadzorom" },
  "difficulty.beginner": { en: "Beginner", sq: "Fillestar", sr: "Početnik" },
  "difficulty.intermediate": { en: "Intermediate", sq: "Mesatar", sr: "Srednji nivo" },
  "difficulty.advanced": { en: "Advanced", sq: "I avancuar", sr: "Napredni" },
  "difficulty.all-levels": { en: "All levels", sq: "Të gjitha nivelet", sr: "Svi nivoi" },

  // States
  "state.loading": { en: "Loading…", sq: "Duke ngarkuar…", sr: "Učitavanje…" },
  "state.empty": { en: "Nothing here yet", sq: "Ende asgjë këtu", sr: "Još nema ničega" },
  "state.error.title": { en: "Something went wrong", sq: "Diçka shkoi keq", sr: "Nešto je pošlo naopako" },
  "state.error.body": {
    en: "The page could not be loaded. Please try again in a moment.",
    sq: "Faqja nuk u ngarkua. Provo përsëri pas pak.",
    sr: "Stranica nije učitana. Pokušajte ponovo za trenutak.",
  },
  "state.demoExample": { en: "demo example", sq: "shembull demo", sr: "primer za demo" },
  "state.simulated": { en: "simulated", sq: "i simuluar", sr: "simulirano" },
  "state.fictional": { en: "fictional", sq: "fiktiv", sr: "izmišljen" },

  // Footer
  "footer.disclaimer": {
    en: "All activities, communities, organizers and city data in this prototype are fictional and exist only for demonstration. Nothing represents real municipal findings or real people.",
    sq: "Të gjitha aktivitetet, komunitetet, organizatorët dhe të dhënat e qytetit në këtë prototip janë fiktive dhe shërbejnë vetëm për demonstrim. Asgjë nuk përfaqëson gjetje reale komunale apo persona realë.",
    sr: "Sve aktivnosti, zajednice, organizatori i podaci o gradu u ovom prototipu su izmišljeni i služe samo za demonstraciju. Ništa ne predstavlja stvarne nalaze opštine niti stvarne osobe.",
  },
  "footer.clock": {
    en: "Simulated “today” in this 2036 scenario: {date} — not the real date.",
    sq: "“Sot” i simuluar në këtë skenar të vitit 2036: {date} — jo data reale.",
    sr: "Simulirano „danas“ u ovom scenariju iz 2036: {date} — nije stvarni datum.",
  },
  "footer.nav": { en: "Footer", sq: "Fundi i faqes", sr: "Podnožje" },
} as const satisfies Catalog;
