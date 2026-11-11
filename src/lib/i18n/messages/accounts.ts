import type { Catalog } from "../catalog";

/** Real accounts: sign-up, deletion, safety and support. */
export const accounts = {
  "register.title": { en: "Create an account", sq: "Krijo një llogari" },
  "register.lead": {
    en: "An account lets you join activities, follow neighborhoods and report city issues. Human Network is for adults (18+).",
    sq: "Një llogari të lejon të bashkohesh në aktivitete, të ndjekësh lagje dhe të raportosh probleme të qytetit. Human Network është për të rritur (18+).",
  },
  "register.name": { en: "Name (shown to others)", sq: "Emri (shfaqet te të tjerët)" },
  "register.email": { en: "Email", sq: "Email" },
  "register.password": { en: "Password (at least 10 characters)", sq: "Fjalëkalimi (të paktën 10 karaktere)" },
  "register.adult": { en: "I confirm I am 18 or older.", sq: "Konfirmoj se jam 18 vjeç ose më i madh." },
  "register.rules": {
    en: "I will follow the community rules: be respectful, no harassment, no sharing others' private details.",
    sq: "Do t'i respektoj rregullat e komunitetit: respekt, pa ngacmime, pa ndarë të dhëna private të të tjerëve.",
  },
  "register.submit": { en: "Create account", sq: "Krijo llogari" },
  "register.noVerify": {
    en: "Your email is not verified yet and is used only to sign in. Your profile stays private until you choose to make it discoverable.",
    sq: "Emaili yt nuk është verifikuar ende dhe përdoret vetëm për hyrje. Profili yt mbetet privat derisa të zgjedhësh ta bësh të zbulueshëm.",
  },
  "register.haveAccount": { en: "Already have an account? Sign in", sq: "Ke tashmë llogari? Hyr" },
  "login.create": { en: "No account yet? Create one", sq: "Nuk ke llogari? Krijo një" },
  "login.help": { en: "Safety and help", sq: "Siguria dhe ndihma" },

  "account.delete.title": { en: "Delete my account", sq: "Fshi llogarinë time" },
  "account.delete.body": {
    en: "This permanently removes your account and the things attached to it (RSVPs, follows, messages, reports you made). It cannot be undone.",
    sq: "Kjo heq përgjithmonë llogarinë tënde dhe gjërat e lidhura me të (konfirmime, ndjekje, mesazhe, raportime). Nuk kthehet mbrapa.",
  },
  "account.delete.confirm": { en: "Type DELETE to confirm", sq: "Shkruaj DELETE për të konfirmuar" },
  "account.delete.submit": { en: "Delete account permanently", sq: "Fshi llogarinë përgjithmonë" },
  "account.delete.staff": {
    en: "Staff accounts cannot be deleted from here.",
    sq: "Llogaritë e stafit nuk mund të fshihen që këtu.",
  },
  "account.signOut": { en: "Sign out", sq: "Dil" },

  "safety.title": { en: "Safety and help", sq: "Siguria dhe ndihma" },
  "safety.lead": {
    en: "How to stay safe, report a concern and reach a person.",
    sq: "Si të qëndrosh i sigurt, si të raportosh një shqetësim dhe si të kontaktosh një person.",
  },
  "safety.meet.title": { en: "Meeting people", sq: "Takimi me njerëz" },
  "safety.meet.body": {
    en: "Meet in public places first, tell someone where you are going, and leave if anything feels wrong. Nobody can see your profile unless you make it discoverable.",
    sq: "Takohu fillimisht në vende publike, thuaji dikujt ku po shkon dhe largohu nëse diçka të duket e gabuar. Askush nuk e sheh profilin tënd nëse nuk e bën të zbulueshëm.",
  },
  "safety.report.title": { en: "Report or block", sq: "Raporto ose blloko" },
  "safety.report.body": {
    en: "You can report an activity, a need or a person, and block a person, from their page. Moderators review open reports.",
    sq: "Mund të raportosh një aktivitet, një nevojë ose një person, dhe të bllokosh një person, nga faqja e tij. Moderatorët shqyrtojnë raportimet e hapura.",
  },
  "safety.emergency.title": { en: "Emergencies", sq: "Urgjenca" },
  "safety.emergency.body": {
    en: "Human Network is not an emergency service. In danger, call your local emergency number (112).",
    sq: "Human Network nuk është shërbim urgjence. Në rrezik, thirr numrin lokal të urgjencës (112).",
  },
  "safety.contact.title": { en: "Contact", sq: "Kontakti" },
  "safety.contact.body": { en: "Write to us at", sq: "Na shkruaj te" },
  "safety.contact.none": {
    en: "No support contact is set up yet. Use Report on any page and a moderator will see it.",
    sq: "Ende nuk ka kontakt mbështetjeje. Përdor Raporto në çdo faqe dhe një moderator do ta shohë.",
  },
  "safety.youth": { en: "Human Network is for adults (18+). There are no youth accounts.", sq: "Human Network është për të rritur (18+). Nuk ka llogari për të mitur." },

  "err.bad_email": { en: "Enter a valid email address.", sq: "Shkruaj një adresë emaili të vlefshme." },
  "err.weak_password": { en: "Choose a password of at least 10 characters.", sq: "Zgjidh një fjalëkalim me të paktën 10 karaktere." },
  "err.need_adult": { en: "Please confirm you are 18 or older.", sq: "Konfirmo se je 18 vjeç ose më i madh." },
  "err.need_rules": { en: "Please accept the community rules.", sq: "Pranoji rregullat e komunitetit." },
  "err.register_failed": {
    en: "We could not create this account. If you already have one, sign in instead.",
    sq: "Nuk e krijuam dot këtë llogari. Nëse e ke tashmë, hyr.",
  },
  "err.delete_confirm": { en: "Type DELETE exactly to confirm.", sq: "Shkruaj saktësisht DELETE për të konfirmuar." },
  "err.delete_not_allowed": { en: "This account cannot be deleted here.", sq: "Kjo llogari nuk mund të fshihet këtu." },
} satisfies Catalog;
