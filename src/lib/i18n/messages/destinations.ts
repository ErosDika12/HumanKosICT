import type { Catalog } from "../catalog";

/** The five main destinations (Home, Explore, Neighborhoods, City, Profile) and their pages. */
export const destinations = {
  "nav.home": { en: "Home", sq: "Ballina" },
  "nav.explore": { en: "Explore", sq: "Eksploro" },
  "nav.neighborhoods": { en: "Neighborhoods", sq: "Lagjet" },
  "nav.city": { en: "City", sq: "Qyteti" },
  "nav.profile": { en: "Profile", sq: "Profili" },

  // Explore hub (links shown above the activity search)
  "explore.activities": { en: "Activities", sq: "Aktivitete" },
  "explore.communities": { en: "Communities", sq: "Komunitete" },
  "explore.help": { en: "Help your neighborhood", sq: "Ndihmo lagjen tënde" },

  // Neighborhoods
  "neighborhoods.title": { en: "Neighborhoods", sq: "Lagjet" },
  "neighborhoods.lead": {
    en: "See what is happening in each part of Prishtina: activities, communities and ways to help.",
    sq: "Shiko çfarë ndodh në çdo pjesë të Prishtinës: aktivitete, komunitete dhe mënyra për të ndihmuar.",
  },
  "neighborhoods.activities": { en: "Activities", sq: "Aktivitete" },
  "neighborhoods.communities": { en: "Communities", sq: "Komunitete" },
  "neighborhoods.needs": { en: "Needs", sq: "Nevoja" },
  "neighborhoods.open": { en: "Open", sq: "Hap" },
  "neighborhoods.noActivities": { en: "No upcoming activities here yet.", sq: "Ende pa aktivitete të ardhshme këtu." },
  "neighborhoods.noCommunities": { en: "No communities listed here yet.", sq: "Ende pa komunitete të listuara këtu." },
  "neighborhoods.noNeeds": { en: "No open needs here right now.", sq: "Asnjë nevojë e hapur këtu tani." },
  "neighborhoods.helpAll": { en: "See all needs and help your neighborhood", sq: "Shiko të gjitha nevojat dhe ndihmo lagjen tënde" },
  "neighborhoods.demoNote": {
    en: "Demo content: the activities, communities and needs shown here are fictional examples.",
    sq: "Përmbajtje demo: aktivitetet, komunitetet dhe nevojat këtu janë shembuj fiktivë.",
  },
  "neighborhoods.back": { en: "All neighborhoods", sq: "Të gjitha lagjet" },

  // City
  "city.title": { en: "City", sq: "Qyteti" },
  "city.lead": {
    en: "Services, notices and ways to improve Prishtina. These tools are being added in stages.",
    sq: "Shërbime, njoftime dhe mënyra për të përmirësuar Prishtinën. Këto mjete po shtohen në faza.",
  },
  "city.independent": {
    en: "Human Network is an independent community platform. It is not run or endorsed by the municipality.",
    sq: "Human Network është platformë e pavarur komunitare. Nuk drejtohet dhe nuk miratohet nga komuna.",
  },
  "city.status.unavailable": { en: "Not available yet", sq: "Ende nuk është i disponueshëm" },
  "city.services.title": { en: "Service directory", sq: "Drejtoria e shërbimeve" },
  "city.services.body": {
    en: "Verified descriptions of city services, with official links, sources and review dates.",
    sq: "Përshkrime të verifikuara të shërbimeve të qytetit, me lidhje zyrtare, burime dhe data rishikimi.",
  },
  "city.report.title": { en: "Report an issue", sq: "Raporto një problem" },
  "city.report.body": {
    en: "Describe a problem in your area and follow what happens to your report.",
    sq: "Përshkruaj një problem në zonën tënde dhe ndiq çfarë ndodh me raportimin.",
  },
  "city.notices.title": { en: "City notices", sq: "Njoftime të qytetit" },
  "city.notices.body": {
    en: "Dated, sourced updates that expire when they are no longer relevant.",
    sq: "Njoftime me datë dhe burim, që skadojnë kur nuk janë më të rëndësishme.",
  },
  "city.transport.title": { en: "Transport and environment", sq: "Transporti dhe mjedisi" },
  "city.transport.body": {
    en: "Shown only from reliable, permitted data sources, with the source and update time.",
    sq: "Shfaqet vetëm nga burime të besueshme dhe të lejuara, me burimin dhe kohën e përditësimit.",
  },
  "city.participate.title": { en: "Have your say", sq: "Thuaj mendimin tënd" },
  "city.participate.body": {
    en: "Community proposals and feedback. These are not official municipal consultations.",
    sq: "Propozime dhe komente të komunitetit. Këto nuk janë konsultime zyrtare të komunës.",
  },
  "city.meanwhile": { en: "Meanwhile, help your neighborhood", sq: "Ndërkohë, ndihmo lagjen tënde" },

  // Profile
  "profile.title": { en: "Profile", sq: "Profili" },
  "profile.signIn": {
    en: "Sign in to see your plans, friends and progress.",
    sq: "Hyr për të parë planet, miqtë dhe progresin tënd.",
  },
  "profile.plans": { en: "Your plans", sq: "Planet e tua" },
  "profile.noPlans": { en: "No upcoming plans yet.", sq: "Ende pa plane të ardhshme." },
  "profile.allPlans": { en: "All plans and invitations", sq: "Të gjitha planet dhe ftesat" },
  "profile.people": { en: "Friends and messages", sq: "Miqtë dhe mesazhet" },
  "profile.friends": { en: "Friends", sq: "Miqtë" },
  "profile.messages": { en: "Messages", sq: "Mesazhet" },
  "profile.notifications": { en: "Notifications", sq: "Njoftimet" },
  "profile.progress": { en: "Your progress", sq: "Progresi yt" },
  "profile.progressLink": { en: "Progress and achievements", sq: "Progresi dhe arritjet" },
  "profile.account": { en: "Account and privacy", sq: "Llogaria dhe privatësia" },
  "profile.communities": { en: "Communities", sq: "Komunitetet" },
  "profile.help": { en: "Help your neighborhood", sq: "Ndihmo lagjen tënde" },
  "profile.unavailable": {
    en: "Some of your information could not be loaded right now.",
    sq: "Disa nga informacionet e tua nuk u ngarkuan tani.",
  },

  // Home additions
  "home.today.title": { en: "Today and this weekend", sq: "Sot dhe këtë fundjavë" },
  "home.free.title": { en: "Free and beginner-friendly", sq: "Falas dhe për fillestarë" },
  "home.communities.title": { en: "Communities welcoming new members", sq: "Komunitete që mirëpresin anëtarë të rinj" },
  "home.communities.all": { en: "All communities", sq: "Të gjitha komunitetet" },
  "home.neighborhoods.title": { en: "Your neighborhoods", sq: "Lagjet e tua" },
  "home.neighborhoods.all": { en: "All neighborhoods", sq: "Të gjitha lagjet" },
  "home.help.title": { en: "Help your neighborhood", sq: "Ndihmo lagjen tënde" },
  "home.help.cta": { en: "See what is needed", sq: "Shiko çfarë nevojitet" },
  "home.empty": { en: "Nothing to show here yet.", sq: "Ende nuk ka çfarë të shfaqet këtu." },
  "home.demoNote": {
    en: "Demo content: activities, dates and communities are fictional examples.",
    sq: "Përmbajtje demo: aktivitetet, datat dhe komunitetet janë shembuj fiktivë.",
  },
} satisfies Catalog;
