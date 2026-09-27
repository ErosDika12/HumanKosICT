import type { DemoActivity, DemoCommunity } from "./types";

/**
 * SIMULATED PRISHTINA 2036 DEMO DATA.
 *
 * Every person, organization, activity, and count below is fictional and
 * internally consistent for demonstration purposes only. Nothing here
 * represents a real municipal finding, a real organization, or a real
 * resident of Kosovo. See docs/DEMO_DATA.md for the full provenance note.
 */

export const DEMO_DATA_LABEL_SQ = "Demonstrim i simuluar — Prishtina 2036";
export const DEMO_DATA_LABEL_EN = "Simulated Prishtina 2036 demo data";

export const COMMUNITIES: DemoCommunity[] = [
  {
    id: "com-ai-club",
    slug: "prishtina-ai-klub",
    name: "Prishtina AI Klub",
    category: "technology",
    descriptionSq:
      "Një komunitet studentësh dhe profesionistësh që eksplorojnë inteligjencën artificiale përmes projekteve praktike javore.",
    description:
      "A community of students and professionals exploring artificial intelligence through hands-on weekly projects.",
    memberCount: 128,
    areaSq: "Prishtinë — Qendër",
  },
  {
    id: "com-environment",
    slug: "gjelber-per-prishtinen",
    name: "Gjelbër për Prishtinën",
    category: "environment",
    descriptionSq:
      "Grup fqinjësh dhe vullnetarësh që kujdesen për hapësirat publike të gjelbra dhe organizojnë pastrime periodike.",
    description:
      "A neighborhood and volunteer group caring for public green spaces and organizing periodic clean-up projects.",
    memberCount: 76,
    areaSq: "Prishtinë — Dardania",
  },
  {
    id: "com-youth-basketball",
    slug: "rinia-basketboll-lakrishte",
    name: "Rinia Basketboll Lakrishtë",
    category: "sports",
    descriptionSq:
      "Komunitet i të rinjve që organizon ndeshje dhe stërvitje basketbolli falas çdo javë.",
    description:
      "A youth community organizing free weekly basketball matches and practice sessions.",
    memberCount: 54,
    areaSq: "Prishtinë — Lakrishtë",
  },
  {
    id: "com-culture-collective",
    slug: "kolektivi-kulturor-prizreni-i-vjeter",
    name: "Kolektivi Kulturor Sunny Hill",
    category: "culture",
    descriptionSq:
      "Kolektiv artistësh dhe muzikantësh lokal që organizon mbrëmje kulturore mujore të hapura për të gjithë.",
    description:
      "A local collective of artists and musicians hosting open monthly cultural evenings.",
    memberCount: 91,
    areaSq: "Prishtinë — Sunny Hill",
  },
];

export const ACTIVITIES: DemoActivity[] = [
  {
    id: "act-ai-workshop",
    slug: "punetori-ai-fillestare",
    title: "Beginner AI & Python Workshop",
    titleSq: "Punëtori Fillestare — AI dhe Python",
    summary: "A hands-on Saturday workshop for anyone curious about programming and AI.",
    summarySq: "Punëtori praktike e së shtunës për këdo kurioz rreth programimit dhe AI-së.",
    category: "technology",
    interestTags: ["technology", "education", "science"],
    areaSq: "Prishtinë — Qendër",
    areaEn: "Prishtina — Center",
    venueName: "Qendra Rinore Prishtina",
    lat: 42.6653,
    lng: 21.1622,
    date: "2036-06-13",
    startTime: "11:00",
    timezone: "Europe/Prishtina",
    capacity: 20,
    rsvpCount: 12,
    cost: "free",
    indoor: true,
    accessibility: ["wheelchair-accessible", "quiet-space-available"],
    ageEligibility: "all-ages",
    difficulty: "beginner",
    organizer: { id: "org-ai-club", name: "Prishtina AI Klub", verified: true },
    communitySlug: "prishtina-ai-klub",
    description:
      "No experience required. Bring a laptop if you have one — a limited number of loaner devices are available. We'll build a small Python project together and talk about what a career or hobby in AI could look like.",
    descriptionSq:
      "Nuk kërkohet përvojë paraprake. Sillni laptopin tuaj nëse keni — ka një numër të kufizuar pajisjesh për huazim. Do të ndërtojmë së bashku një projekt të vogël në Python dhe do të flasim se si mund të duket një karrierë apo hobi në AI.",
  },
  {
    id: "act-park-cleanup",
    slug: "pastrim-parku-gjelber",
    title: "Neighborhood Green Space Clean-Up",
    titleSq: "Pastrimi i Hapësirës së Gjelbër të Lagjes",
    summary: "Join neighbors for a Saturday morning clean-up and tree-care session.",
    summarySq: "Bashkohuni me fqinjët për një pastrim të së shtunës në mëngjes dhe kujdes për pemët.",
    category: "environment",
    interestTags: ["environment", "volunteering"],
    areaSq: "Prishtinë — Dardania",
    areaEn: "Prishtina — Dardania",
    venueName: "Parku i Lagjes Dardania",
    lat: 42.6535,
    lng: 21.1553,
    date: "2036-06-14",
    startTime: "09:00",
    timezone: "Europe/Prishtina",
    capacity: 30,
    rsvpCount: 19,
    cost: "free",
    indoor: false,
    accessibility: ["wheelchair-accessible"],
    ageEligibility: "all-ages",
    difficulty: "all-levels",
    organizer: { id: "org-environment", name: "Gjelbër për Prishtinën", verified: true },
    communitySlug: "gjelber-per-prishtinen",
    description:
      "Gloves, bags, and tools are provided. This session directly supports the community's ongoing park-care project — see the Projects tab on the community page for the running volunteer count.",
    descriptionSq:
      "Sigurohen doreza, qese dhe vegla. Ky aktivitet mbështet drejtpërdrejt projektin e vazhdueshëm të kujdesit për parkun — shihni skedën Projekte në faqen e komunitetit për numrin e vullnetarëve.",
  },
  {
    id: "act-basketball-pickup",
    slug: "basketboll-i-hapur-lakrishte",
    title: "Open Pick-Up Basketball",
    titleSq: "Basketboll i Hapur",
    summary: "Casual weekly pick-up games, all skill levels welcome.",
    summarySq: "Ndeshje javore rastësore, mirëpriten të gjitha nivelet.",
    category: "sports",
    interestTags: ["sports"],
    areaSq: "Prishtinë — Lakrishtë",
    areaEn: "Prishtina — Lakrishtë",
    venueName: "Fusha e Hapur e Basketbollit, Lakrishtë",
    lat: 42.6701,
    lng: 21.1489,
    date: "2036-06-13",
    startTime: "18:00",
    timezone: "Europe/Prishtina",
    capacity: 16,
    rsvpCount: 16,
    cost: "free",
    indoor: false,
    accessibility: [],
    ageEligibility: "all-ages",
    difficulty: "all-levels",
    organizer: { id: "org-basketball", name: "Rinia Basketboll Lakrishtë", verified: false },
    communitySlug: "rinia-basketboll-lakrishte",
    description:
      "This session is at capacity — you can join the waiting list and you'll be notified if a spot opens up. New weekly sessions are posted every Monday.",
    descriptionSq:
      "Ky aktivitet ka arritur kapacitetin — mund të bashkoheni në listën e pritjes dhe do të njoftoheni nëse hapet një vend. Aktivitete të reja javore publikohen çdo të hënë.",
  },
  {
    id: "act-culture-evening",
    slug: "mbremje-kulturore-sunny-hill",
    title: "Open Cultural Evening",
    titleSq: "Mbrëmje Kulturore e Hapur",
    summary: "Local music, poetry, and short film — an informal monthly gathering.",
    summarySq: "Muzikë lokale, poezi dhe film i shkurtër — takim joformal mujor.",
    category: "culture",
    interestTags: ["culture", "music", "art", "books"],
    areaSq: "Prishtinë — Sunny Hill",
    areaEn: "Prishtina — Sunny Hill",
    venueName: "Salla Komunitare Sunny Hill",
    lat: 42.6482,
    lng: 21.1701,
    date: "2036-06-20",
    startTime: "19:30",
    timezone: "Europe/Prishtina",
    capacity: 60,
    rsvpCount: 33,
    cost: "paid",
    costDetail: "€2 suggested donation at the door",
    indoor: true,
    accessibility: ["wheelchair-accessible", "captioned"],
    ageEligibility: "all-ages",
    difficulty: "all-levels",
    organizer: { id: "org-culture", name: "Kolektivi Kulturor Sunny Hill", verified: true },
    communitySlug: "kolektivi-kulturor-prizreni-i-vjeter",
    description:
      "An open mic slot is available — sign up at the door. Performances are typically in Albanian with informal English translation offered by attendees.",
    descriptionSq:
      "Ka një vend të lirë për \"open mic\" — regjistrohuni në hyrje. Performancat zakonisht janë në shqip, me përkthim joformal në anglisht nga pjesëmarrësit.",
  },
  {
    id: "act-coding-teens",
    slug: "kodim-per-adoleshente",
    title: "Coding Club for Teens (Supervised)",
    titleSq: "Klub Kodimi për Adoleshentë (i Mbikëqyrur)",
    summary: "A supervised, school-linked coding club for ages 13–17.",
    summarySq: "Klub kodimi i mbikëqyrur, i lidhur me shkollën, për moshat 13–17.",
    category: "technology",
    interestTags: ["technology", "education", "gaming"],
    areaSq: "Prishtinë — Dardania",
    areaEn: "Prishtina — Dardania",
    venueName: "Shkolla e Mesme 'Xhevdet Doda' — Salla e TI",
    lat: 42.6558,
    lng: 21.1602,
    date: "2036-06-17",
    startTime: "15:00",
    timezone: "Europe/Prishtina",
    capacity: 18,
    rsvpCount: 10,
    cost: "free",
    indoor: true,
    accessibility: ["wheelchair-accessible"],
    ageEligibility: "supervised-minors",
    difficulty: "beginner",
    organizer: { id: "org-ai-club", name: "Prishtina AI Klub", verified: true },
    communitySlug: "prishtina-ai-klub",
    description:
      "Runs with a school staff supervisor present at every session. Registration requires a guardian's confirmation; there is no open messaging between participants and adult organizers outside the supervised session.",
    descriptionSq:
      "Zhvillohet gjithmonë me praninë e një stafi mbikëqyrës të shkollës. Regjistrimi kërkon konfirmimin e prindit/kujdestarit; nuk ka komunikim të hapur mes pjesëmarrësve dhe organizatorëve të rritur jashtë sesionit të mbikëqyrur.",
  },
  {
    id: "act-photography-walk",
    slug: "shetitje-fotografike-qender",
    title: "Golden Hour Photography Walk",
    titleSq: "Shëtitje Fotografike në \"Orën e Artë\"",
    summary: "A relaxed walk through the city center for photography enthusiasts.",
    summarySq: "Një shëtitje e qetë nëpër qendër të qytetit për dashamirësit e fotografisë.",
    category: "culture",
    interestTags: ["photography", "art", "travel"],
    areaSq: "Prishtinë — Qendër",
    areaEn: "Prishtina — Center",
    venueName: "Sheshi Nënë Tereza",
    lat: 42.6621,
    lng: 21.1631,
    date: "2036-06-21",
    startTime: "19:00",
    timezone: "Europe/Prishtina",
    capacity: 15,
    rsvpCount: 6,
    cost: "free",
    indoor: false,
    accessibility: ["wheelchair-accessible"],
    ageEligibility: "all-ages",
    difficulty: "all-levels",
    organizer: { id: "org-culture", name: "Kolektivi Kulturor Sunny Hill", verified: true },
    communitySlug: "kolektivi-kulturor-prizreni-i-vjeter",
    description:
      "Any camera welcome, including phones. We'll end at a nearby café for an informal photo share — attendance there is optional.",
    descriptionSq:
      "Mirëpritet çdo kamerë, përfshirë telefonat. Do të përfundojmë në një kafiteri aty pranë për shpërndarje joformale të fotove — pjesëmarrja atje është opsionale.",
  },
];

export function getActivityBySlug(slug: string): DemoActivity | undefined {
  return ACTIVITIES.find((a) => a.slug === slug);
}

export function getCommunityBySlug(slug: string): DemoCommunity | undefined {
  return COMMUNITIES.find((c) => c.slug === slug);
}
