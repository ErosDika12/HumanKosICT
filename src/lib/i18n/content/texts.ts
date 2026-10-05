/**
 * Exact English seeded string → Albanian. Only the fixed demo content lives
 * here (friend bios, example conversations, needs, rules, prices, the flagship
 * BRIDGE text). Anything a visitor writes never matches and is shown as typed.
 * tests/i18n-content.test.ts fails if a seeded string is missing from this table.
 */
export const TEXT_TRANSLATIONS: Record<string, { sq: string }> = {
  // Friend bios
  "Loves Saturday workshops and photography walks around the city center.": { sq: "Pëlqen punëtoritë e së shtunës dhe shëtitjet fotografike nëpër qendër të qytetit." },
  "Organizes Prishtina AI Klub's weekly workshops.": { sq: "Organizon punëtoritë javore të Prishtina AI Klub." },
  "Coordinates Gjelbër për Prishtinën's neighborhood clean-ups.": { sq: "Koordinon pastrimet e lagjes të Gjelbër për Prishtinën." },
  "Runs Sunny Hill's monthly cultural evenings.": { sq: "Drejton mbrëmjet mujore kulturore të Kodrës së Diellit." },
  "Game developer by night. Always up for a hackathon, a robot build, or a long debugging session.": { sq: "Zhvillues lojërash gjatë natës. Gjithmonë gati për një hakaton, ndërtim roboti ose një seancë të gjatë korrigjimi." },
  "Street photographer chasing golden hour. Happy to walk slowly and talk about framing.": { sq: "Fotografe rruge që ndjek orën e artë. Shëtit ngadalë dhe flet me kënaqësi për kuadrimin." },
  "Plants trees on Sundays and cycles everywhere else. Bring water, she brings snacks.": { sq: "Mbjell pemë të dielave dhe ngas biçikletën kudo tjetër. Ti sill ujë, ajo sjell diçka për të ngrënë." },
  "Plays guitar, reads too much poetry, and collects secondhand books.": { sq: "Luan kitarë, lexon shumë poezi dhe mbledh libra të përdorur." },
  "Runs a tiny food stall and cooks for twenty whenever she can. Loves meeting new neighbors.": { sq: "Ka një stendë të vogël ushqimi dhe gatuan për njëzet vetë sa herë mundet. Do të njohë fqinjë të rinj." },
  "Point guard on weeknights, cheering from the sideline on weekends.": { sq: "Bazist gjatë netëve të javës, mbështetës nga anash në fundjavë." },
  "Teacher who never leaves a library without a new book. Loves teaching and learning languages.": { sq: "Mësuese që nuk del kurrë nga biblioteka pa një libër të ri. Do të mësojë dhe të mësojë gjuhë." },
  "Illustrator and wheelchair user — he checks accessibility first and appreciates venues that get it right.": { sq: "Ilustrues dhe përdorues karroce — kontrollon fillimisht qasshmërinë dhe çmon vendet që e bëjnë mirë." },

  // Example conversations
  "Are you coming to the Golden Hour walk on the 21st?": { sq: "A vjen në shëtitjen e orës së artë më 21?" },
  "Yes! I'll bring my old film camera.": { sq: "Po! Do të sjell aparatin tim të vjetër me film." },
  "Perfect — see you at Mother Teresa Square.": { sq: "Shkëlqyeshëm — shihemi në sheshin Nënë Tereza." },
  "Thanks for coming to the AI workshop, Arta. Want to help with the teens curriculum?": { sq: "Faleminderit që erdhe në punëtorinë e AI-së, Arta. Dëshiron të ndihmosh me kurrikulën për adoleshentë?" },
  "Happy to help with materials. Send me the outline.": { sq: "Me kënaqësi ndihmoj me materialet. Më dërgo skicën." },
  "Hi! I noticed we both like photography and technology.": { sq: "Përshëndetje! Vura re se të dyve na pëlqen fotografia dhe teknologjia." },
  "Hi Arta! What are you up to this weekend?": { sq: "Përshëndetje Arta! Çfarë ke planifikuar për këtë fundjavë?" },
  "I'm thinking about the Golden Hour Photography Walk on Saturday the 21st — want to come along?": { sq: "Po mendoj për Shëtitjen Fotografike të Orës së Artë të shtunën më 21 — dëshiron të vish?" },
  "Welcome! The Phone Photography Workshop on the 28th is very beginner friendly.": { sq: "Mirë se vjen! Punëtoria e Fotografisë me Telefon më 28 është shumë e përshtatshme për fillestarët." },

  // Invitation messages
  "Want to come along? Golden hour is the best light of the week.": { sq: "Dëshiron të vish? Ora e artë ka dritën më të bukur të javës." },
  "Golden hour on Saturday — come shoot with me?": { sq: "Ora e artë të shtunën — vjen të fotografojmë së bashku?" },
  "Want to pair up on the data night? I will bring the laptops.": { sq: "Dëshiron të bëjmë ekip në natën e të dhënave? Unë sjell laptopët." },

  // Prices
  "€2 suggested donation at the door": { sq: "€2 donacion i sugjeruar në hyrje" },
  "€3 covers ingredients": { sq: "€3 mbulojnë përbërësit" },
  "€5 to cover materials": { sq: "€5 për të mbuluar materialet" },
  "€4 suggested donation": { sq: "€4 donacion i sugjeruar" },

  // Community needs
  "Neighbors have asked for a second monthly clean-up session so more people can help look after the Dardania green space.": { sq: "Fqinjët kanë kërkuar një sesion të dytë mujor pastrimi, që më shumë njerëz të ndihmojnë në kujdesin për hapësirën e gjelbër të Dardanisë." },
  "Parents in Dardania have asked for a second weekly supervised coding session, on a different day, so more teens can take part.": { sq: "Prindërit në Dardani kanë kërkuar një sesion të dytë javor kodimi nën mbikëqyrje, në një ditë tjetër, që të marrin pjesë më shumë adoleshentë." },
  "Older residents in Sunny Hill ask for a weekly low-cost shared meal they can walk to.": { sq: "Banorët më të moshuar në Kodrën e Diellit kërkojnë një vakt javor të përbashkët me çmim të ulët, ku mund të shkojnë në këmbë." },
  "Riders ask for a marked, safer bike route between Ulpiana and the city center.": { sq: "Çiklistët kërkojnë një rrugë biçikletash të shënuar dhe më të sigurt mes Ulpianës dhe qendrës së qytetit." },

  // Community rules
  "Be respectful; no unsolicited direct messages to the supervised teens group's participants.": { sq: "Respekto të tjerët; pa mesazhe të drejtpërdrejta të pakërkuara për pjesëmarrësit e grupit të adoleshentëve nën mbikëqyrje." },
  "Bring your own gloves if you have them; follow the session lead's safety instructions.": { sq: "Sill doreza nëse i ke; ndiq udhëzimet e sigurisë të drejtuesit të sesionit." },
  "New members are reviewed by the organizer before joining, to keep sessions small and consistent.": { sq: "Anëtarët e rinj shqyrtohen nga organizatori para se të bashkohen, që sesionet të mbeten të vogla dhe të qëndrueshme." },
  "Performances are typically in Albanian; be considerate of shared equipment.": { sq: "Shfaqjet zakonisht janë në shqip; kujdesu për pajisjet e përbashkëta." },
  "Helmets required on every ride; the slowest rider sets the pace.": { sq: "Përkrenarja është e detyrueshme në çdo udhëtim; çiklisti më i ngadaltë përcakton ritmin." },
  "Everyone helps, everyone eats. Tell us about allergies in advance.": { sq: "Të gjithë ndihmojnë, të gjithë hanë. Na tregoni paraprakisht për alergjitë." },
  "Be kind to beginners in either language.": { sq: "Sillu me mirësi me fillestarët në të dyja gjuhët." },

  // Projects
  "Ongoing Dardania Park Care": { sq: "Kujdesi i Vazhdueshëm për Parkun në Dardani" },
  "A running volunteer project maintaining the Dardania green space between monthly clean-up events.": { sq: "Një projekt i vazhdueshëm vullnetar për mbajtjen e hapësirës së gjelbër në Dardani mes aktiviteteve mujore të pastrimit." },
  "Teens Coding Curriculum Volunteers": { sq: "Vullnetarë për Kurrikulën e Kodimit për Adoleshentë" },
  "Volunteers help prepare supervised lesson materials for the Tuesday teens coding club — no direct unsupervised contact with minors.": { sq: "Vullnetarët ndihmojnë në përgatitjen e materialeve mësimore të mbikëqyrura për klubin e kodimit të të martave — pa kontakt të drejtpërdrejtë të pambikëqyrur me të miturit." },
  "Collaboration: Prishtina AI Klub × Gjelbër për Prishtinën": { sq: "Bashkëpunim: Prishtina AI Klub × Gjelbër për Prishtinën" },
  "Neighbors asked for a second monthly clean-up in Dardania. This project makes it possible to organize one without overloading the organizers: a simple volunteer sign-up app where neighbors pick a shift, and a few low-cost sensors that show which corners of the park need attention first. The first joint session is the Eco-Tech Idea Lab on 25 June, where volunteers sketch the sign-up flow and propose a date for the second clean-up. Fictional demo project.": {
    sq: "Fqinjët kërkuan një pastrim të dytë mujor në Dardani. Ky projekt e bën të mundur pa i mbingarkuar organizatorët: një aplikacion i thjeshtë ku fqinjët zgjedhin një turn dhe disa sensorë të lirë që tregojnë cilat cepa të parkut kanë nevojë më parë. Sesioni i parë i përbashkët është Laboratori i Ideve Eko-Teknologji më 25 qershor, ku vullnetarët skicojnë regjistrimin dhe propozojnë një datë për pastrimin e dytë. Projekt demonstrues fiktiv.",
  },

  // Flagship BRIDGE proposal
  "Prishtina AI Klub builds the tools and Gjelbër për Prishtinën brings the volunteers and the knowledge of the park. Neighbors asked for a second monthly clean-up: the sign-up app lets people choose shifts, and the sensors show which parts of the park need attention first — so a second clean-up can run without extra work for the organizers.": {
    sq: "Prishtina AI Klub ndërton mjetet dhe Gjelbër për Prishtinën sjell vullnetarët dhe njohjen e parkut. Fqinjët kërkuan një pastrim të dytë mujor: aplikacioni i regjistrimit i lejon njerëzit të zgjedhin turnet dhe sensorët tregojnë cilat pjesë të parkut kanë nevojë më parë — kështu pastrimi i dytë mund të zhvillohet pa punë shtesë për organizatorët.",
  },
  "Join the Eco-Tech Idea Lab on 25 June, pick a prototype task, and volunteer on the collaboration project.": { sq: "Bashkohu me Laboratorin e Ideve Eko-Teknologji më 25 qershor, zgjidh një detyrë prototipi dhe bëhu vullnetar në projektin e bashkëpunimit." },
};
