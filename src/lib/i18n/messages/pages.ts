import type { Catalog } from "../catalog";

/** Needs, login, account, credits, projects, onboarding. */
export const pages = {
  // Needs
  "needs.title": { en: "Community needs", sq: "Nevojat e komunitetit" },
  "needs.lead": { en: "What neighbors say is missing. Each need shows its area and topic — never who wrote it.", sq: "Çfarë thonë fqinjët se mungon. Çdo nevojë tregon zonën dhe temën — kurrë kush e ka shkruar." },
  "needs.submitted": { en: "Need submitted — thanks for flagging it.", sq: "Nevoja u dërgua — faleminderit që e raportove." },
  "needs.reported": { en: "Thanks — a moderator will review this report.", sq: "Faleminderit — një moderator do ta shqyrtojë këtë raportim." },
  "needs.submit": { en: "Submit a need", sq: "Dërgo një nevojë" },
  "needs.category": { en: "Topic", sq: "Tema" },
  "needs.area": { en: "Approximate area", sq: "Zona përafërsisht" },
  "needs.description": { en: "Description", sq: "Përshkrimi" },
  "needs.similar": { en: "A similar open need already exists for this topic and area ({n} supporters): “{text}”. Consider supporting it instead.", sq: "Ekziston tashmë një nevojë e ngjashme e hapur për këtë temë dhe zonë ({n} mbështetës): “{text}”. Mendo ta mbështetësh atë." },
  "needs.similarAnyway": { en: "This is a genuinely different need — submit it anyway", sq: "Kjo është një nevojë vërtet ndryshe — dërgoje gjithsesi" },
  "needs.send": { en: "Submit", sq: "Dërgo" },
  "needs.login": { en: "Log in as demo to submit or support a need.", sq: "Hyr si demo për të dërguar ose mbështetur një nevojë." },
  "needs.none": { en: "No needs submitted yet.", sq: "Ende nuk është dërguar asnjë nevojë." },
  "needs.status.open": { en: "Open", sq: "E hapur" },
  "needs.status.in_progress": { en: "In progress", sq: "Në vijim" },
  "needs.status.resolved": { en: "Resolved", sq: "E zgjidhur" },
  "needs.bridgeLink": { en: "See the BRIDGE proposal for this need →", sq: "Shiko propozimin BRIDGE për këtë nevojë →" },
  "needs.support": { en: "I also need this", sq: "Edhe unë e kam nevojë" },
  "needs.supported": { en: "Supported ✓", sq: "Mbështetur ✓" },
  "needs.supporters.one": { en: "{n} supporter", sq: "{n} mbështetës" },
  "needs.supporters.other": { en: "{n} supporters", sq: "{n} mbështetës" },
  "needs.reportReason": { en: "Report reason", sq: "Arsyeja e raportimit" },
  "needs.reportAria": { en: "Reason for reporting: {text}", sq: "Arsyeja e raportimit: {text}" },
  "needs.report": { en: "Report", sq: "Raporto" },

  // Login
  "login.title": { en: "Sign in", sq: "Hyrje" },
  "login.lead": { en: "The quickest way in is the demo. Staff sign-in is only for the seeded organizer, moderator and analyst accounts.", sq: "Mënyra më e shpejtë është demoja. Hyrja e stafit është vetëm për llogaritë organizator, moderator dhe analist." },
  "login.demo.title": { en: "Log in as demo", sq: "Hyr si demo" },
  "login.demo.body": { en: "One click, no password. You get your own temporary account with example friends. Everything you do stays on it, and it is removed after a day.", sq: "Një klikim, pa fjalëkalim. Merr llogarinë tënde të përkohshme me miq shembull. Gjithçka që bën mbetet te ajo dhe fshihet pas një dite." },
  "login.staff.title": { en: "Staff sign in", sq: "Hyrje për stafin" },
  "login.staff.body": { en: "For maintainers reviewing moderation and the municipality view.", sq: "Për mirëmbajtësit që shqyrtojnë moderimin dhe pamjen e komunës." },
  "login.staff.prod": { en: "These accounts use a private password that is not published on this site.", sq: "Këto llogari përdorin një fjalëkalim privat që nuk publikohet në këtë faqe." },
  "login.staff.dev": { en: "Local development: every seeded persona shares the password Demo-2036! (see the persona list).", sq: "Zhvillim lokal: çdo person i paracaktuar ka fjalëkalimin Demo-2036! (shiko listën e personave)." },
  "login.email": { en: "Email", sq: "Email" },
  "login.password": { en: "Password", sq: "Fjalëkalimi" },
  "login.personas": { en: "the persona list", sq: "listën e personave" },
  "login.personasSee": { en: "See {link} (development only) for exact emails and roles.", sq: "Shiko {link} (vetëm zhvillim) për email-et dhe rolet e sakta." },

  // Account
  "account.title": { en: "Your account", sq: "Llogaria jote" },
  "account.login": { en: "Log in as demo to view your account.", sq: "Hyr si demo për të parë llogarinë tënde." },
  "account.meta": { en: "{name} · {email} · role: {role}", sq: "{name} · {email} · roli: {role}" },
  "account.bio": { en: "Bio (English)", sq: "Biografia (anglisht)" },
  "account.bioSq": { en: "Bio (Albanian)", sq: "Biografia (shqip)" },
  "account.discoverable": { en: "Let other members find my name and bio (off by default).", sq: "Lejo anëtarët e tjerë të gjejnë emrin dhe biografinë time (e çaktivizuar si parazgjedhje)." },
  "account.save": { en: "Save", sq: "Ruaj" },

  // Credits
  "credits.title": { en: "Photo credits", sq: "Kreditet e fotove" },
  "credits.lead": { en: "All photos come from Wikimedia Commons under open licenses (CC0, CC BY, CC BY-SA or public domain) and were resized for mobile. They only illustrate a place or a kind of activity; the events, people and communities here are fictional.", sq: "Të gjitha fotot vijnë nga Wikimedia Commons me licenca të hapura (CC0, CC BY, CC BY-SA ose domen publik) dhe janë ridimensionuar për celular. Ato vetëm ilustrojnë një vend ose një lloj aktiviteti; ngjarjet, personat dhe komunitetet këtu janë fiktive." },
  "credits.source": { en: "Source: Wikimedia Commons", sq: "Burimi: Wikimedia Commons" },

  // Project
  "project.back": { en: "Back to {name}", sq: "Kthehu te {name}" },
  "project.created": { en: "Project created.", sq: "Projekti u krijua." },
  "project.filled": { en: "{n} of {total} volunteer spots filled", sq: "{n} nga {total} vende vullnetarësh të plotësuara" },
  "project.completed": { en: " — project completed", sq: " — projekti përfundoi" },
  "project.realOnly": { en: "Only real sign-ups are counted — no invented hours or impact figures.", sq: "Numërohen vetëm regjistrimet reale — pa orë ose shifra ndikimi të shpikura." },
  "project.login": { en: "Log in as demo to volunteer", sq: "Hyr si demo për t'u bërë vullnetar" },
  "project.withdraw": { en: "Withdraw", sq: "Tërhiqu" },
  "project.volunteer": { en: "Volunteer", sq: "Bëhu vullnetar" },
  "project.volunteerMore": { en: "Volunteer (the target is reached, more are welcome)", sq: "Bëhu vullnetar (objektivi u arrit, të tjerët janë të mirëpritur)" },

  // Onboarding
  "onboarding.title": { en: "What do you want to do?", sq: "Çfarë dëshiron të bësh?" },
  "onboarding.lead": { en: "Pick as many interests as you like. We use them to put the most relevant activities first. You can change them any time.", sq: "Zgjidh sa interesa të duash. I përdorim për t'i vendosur aktivitetet më të përshtatshme në krye. Mund t'i ndryshosh kurdo." },
  "onboarding.savedAccount": { en: "Saved to your account.", sq: "Ruhet në llogarinë tënde." },
  "onboarding.savedBrowser": { en: "Log in as demo to keep this on your account; for now it stays in this browser.", sq: "Hyr si demo për ta mbajtur në llogari; tani qëndron vetëm në këtë shfletues." },
  "onboarding.choose": { en: "Choose your interests", sq: "Zgjidh interesat e tua" },
  "onboarding.toggleHelp": { en: "Toggle each interest to select or deselect it.", sq: "Shtyp çdo interes për ta zgjedhur ose hequr." },
  "onboarding.none": { en: "Nothing selected yet — you can still continue.", sq: "Ende pa zgjedhje — mund të vazhdosh gjithsesi." },
  "onboarding.selected.one": { en: "{n} selected", sq: "{n} e zgjedhur" },
  "onboarding.selected.other": { en: "{n} selected", sq: "{n} të zgjedhura" },
  "onboarding.continue": { en: "Continue to Discover", sq: "Vazhdo te Zbulo" },
} as const satisfies Catalog;
