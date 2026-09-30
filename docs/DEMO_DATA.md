# Demo Data Provenance — Phase 1

**Everything described below is fictional.** No person, organization,
activity, count, or coordinate in this file represents a real resident,
organization, or municipal finding in Kosovo. It exists solely to make the
Phase 1 prototype demonstrable end-to-end. The UI labels this content
"Simulated Prishtina 2036 demo data" on every screen that shows it
(`src/components/DemoBadge.tsx`).

Source of truth: `src/lib/demo-data.ts` (data) and `src/lib/types.ts`
(shapes).

## Communities (4, seeded)

| Slug | Name | Category | Members (seeded) |
| --- | --- | --- | --- |
| `prishtina-ai-klub` | Prishtina AI Klub | technology | 128 |
| `gjelber-per-prishtinen` | Gjelbër për Prishtinën | environment | 76 |
| `rinia-basketboll-lakrishte` | Rinia Basketboll Lakrishtë | sports | 54 |
| `kolektivi-kulturor-prizreni-i-vjeter` | Kolektivi Kulturor Sunny Hill | culture | 91 |

These four are deliberately the same ones later phases will connect through
BRIDGE (an AI/technology community + an environment community, per the scope
document's worked example) — chosen now so Phase 5 doesn't need new seed data,
only new relationships between existing records.

## Activities (6, seeded)

| Slug | Title | Category | Age eligibility | Capacity/RSVP |
| --- | --- | --- | --- | --- |
| `punetori-ai-fillestare` | Beginner AI & Python Workshop | technology | all-ages | 20 / 12 |
| `pastrim-parku-gjelber` | Neighborhood Green Space Clean-Up | environment | all-ages | 30 / 19 |
| `basketboll-i-hapur-lakrishte` | Open Pick-Up Basketball | sports | all-ages | 16 / 16 (full — tests the "full" state) |
| `mbremje-kulturore-sunny-hill` | Open Cultural Evening | culture | all-ages | 60 / 33 |
| `kodim-per-adoleshente` | Coding Club for Teens (Supervised) | technology | **supervised-minors** | 18 / 10 |
| `shetitje-fotografike-qender` | Golden Hour Photography Walk | culture | all-ages | 15 / 6 |

All dates are in June 2036. All venues are plausible, named Prishtina-area
locations (parks, a youth center, a community hall, a school computer lab) —
none of them are asserted as real bookable venues; they exist to make the map
view legible, not to claim a real partnership with any named place.

### Why one activity is minor-eligible and how it's constrained

`kodim-per-adoleshente` is the only activity marked `supervised-minors`
(ages 13–17). Its description explicitly states it runs with a school staff
supervisor present, requires guardian confirmation, and has no open messaging
between participants and adult organizers outside the supervised session —
directly satisfying the scope's "no direct stranger matching for minors"
boundary. No other activity or community references a minor.

### Why one activity is seeded at full capacity

`basketboll-i-hapur-lakrishte` has `rsvpCount === capacity` so the UI's
"Full" badge, disabled-state messaging, and future waitlist copy have a real
case to render against without needing synthetic testing data later.

## Interests (15, fixed catalog)

Defined in `src/lib/types.ts` (`INTERESTS`), matching the 15 interests listed
in the scope PDF section 7 verbatim (technology, sports, art, music,
education, gaming, environment, volunteering, photography, cooking, travel,
science, culture, books, entrepreneurship), each with an English label, an
Albanian label, and an emoji.

## What Phase 2 preserved

Phase 2 migrated this data into a Prisma/SQLite schema via
`prisma/seed-lib.ts`, converting `src/lib/demo-data.ts` directly (still the
source of truth for activity/community content — never deleted or
duplicated by hand). Verified preserved:

- Every original slug — `/discover/[slug]` URLs still resolve, now against
  the database (`tests/seed-consistency.test.ts` asserts this exactly).
- The four communities and their categories, for BRIDGE's Phase 5 worked
  example (AI club + environment community).
- The full-capacity fixture (`basketboll-i-hapur-lakrishte`, 16/16) and the
  minor-eligible fixture (`kodim-per-adoleshente`, supervised minors) —
  `tests/seed-consistency.test.ts` and `tests/rsvp.test.ts` exercise both.
- Each activity's original `rsvpCount` became `Activity.simulatedRsvpBaseline`
  — the fictional 2036-scenario attendance baseline that existed before any
  real signed-in account RSVP'd. The number a page displays is that baseline
  **plus** real confirmed `Rsvp` rows, never real attendance alone (there
  are only 8 seeded personas — nowhere near enough to reproduce Phase 1's
  seeded counts through real RSVPs, nor should it be: see Phase 7's guidance
  against inflating counts with fabricated individual accounts).

## Seeded demo personas (Phase 2, all fictional)

Every account below is a fictional seeded persona for this prototype, never
a real person. Shared demo password for all of them:
**`Demo-2036!`** (see `prisma/seed-lib.ts` `DEMO_PERSONA_PASSWORD` — never a
production credential). Sign in at `/login`, or in development only, pick
one with no password at `/dev-login`.

| Name | Email | Role | Notes |
| --- | --- | --- | --- |
| Arta Krasniqi | arta.krasniqi@demo.humannetwork.example | Member | Discoverable profile; interests: technology, photography; member of Prishtina AI Klub; real seeded RSVP + organizer-confirmed **attendance** at the AI workshop; volunteers on the Dardania park project; supports the environment need. |
| Blerta Hoxha | blerta.hoxha@demo.humannetwork.example | Member | Not discoverable — used to demonstrate the "off by default" privacy projection and cross-account edit rejection in tests. Submitted the seeded youth technology need. |
| Drin Gashi | drin.gashi@demo.humannetwork.example | Organizer | Discoverable; interests: technology, science (shares "technology" with Arta — a real seeded human-matching fixture). Organizes Prishtina AI Klub; confirmed Arta's attendance at the AI workshop; organizes the teens-coding-curriculum volunteer project. |
| Fatlume Berisha | fatlume.berisha@demo.humannetwork.example | Organizer | Discoverable; interests: environment, volunteering. Organizes Gjelbër për Prishtinën; submitted the seeded environment need; organizes the Dardania park-care project. |
| Njomëza Krasniqi | njomeza.krasniqi@demo.humannetwork.example | Organizer | Organizes Rinia Basketboll Lakrishtë — the one **RESTRICTED** community (join requires her approval) and the one unverified organizer. |
| Yll Morina | yll.morina@demo.humannetwork.example | Organizer | Discoverable; interests: culture, music. Organizes Kolektivi Kulturor Sunny Hill. |
| Elmedina Tahiri | elmedina.tahiri@demo.humannetwork.example | Moderator | Reviews reports and publishes pending organizer-created communities/events at `/moderation`. |
| Agron Sylaj | agron.sylaj@demo.humannetwork.example | Municipality analyst | Views the aggregate-only preview at `/municipality`. |

Re-run `npm run db:seed` any time to restore this exact state (upserts by id,
safe to run repeatedly — verified by `tests/seed-consistency.test.ts`).

## What Phase 4 added (all fictional, all seeded)

- **Projects** (`prisma/seed-lib.ts`): "Ongoing Dardania Park Care" (20
  volunteers needed, Gjelbër për Prishtinën, Arta is a real seeded
  volunteer) and "Teens Coding Curriculum Volunteers" (5 needed, Prishtina AI
  Klub, Drin is a real seeded volunteer). No hours are tracked on either —
  see docs/PRODUCT_CONTRACT.md.
- **Community needs**: the Phase 2 environment need (with real seeded
  supporters — Arta, and as of Phase 7 also Drin and Yll, for a total of 4
  distinct real contributors) plus a second, Phase 4-required **youth technology need**
  (Dardania, submitted by Blerta, tied to Prishtina AI Klub) — satisfying
  the Phase 4 brief's "at least one ... youth activity need."
- **Attendance**: one organizer-confirmed attendance row (Arta at the AI
  workshop, confirmed by Drin) — a real fixture for the Impact page and for
  `tests/attendance-and-impact.test.ts`, without requiring a judge to click
  through check-in first. This is only possible because the AI workshop
  (2036-06-13) is in the past on the **simulated clock** (see
  `docs/ARCHITECTURE.md` "Simulated clock" — real check-in against a
  genuinely future 2036 date would make no narrative sense).
- **One RESTRICTED community**: Rinia Basketboll Lakrishtë (already the
  seed data's one unverified organizer) — joining it creates a PENDING
  membership Njomëza must approve, a real fixture for
  `tests/communities.test.ts`.
- **One seeded report and one seeded notification**: an open report on the
  basketball activity (reported by Blerta) for `/moderation`'s queue, and a
  real "RSVP confirmed" notification for Arta so `/inbox` isn't empty on
  first login.

## What Phase 5 added (all fictional, all seeded)

- **BRIDGE**: no proposal rows are seeded directly — `regenerateBridgeProposals()`
  computes them live from the seeded communities/needs above, every time
  `/bridge`, `/communities/[slug]`, or `/needs` is loaded. Against this seed
  data it deterministically produces the flagship **Prishtina AI Klub ×
  Gjelbër për Prishtinën** proposal (score 7 — the highest of the ~5 pairs
  generated), addressing the real environment need in Dardania: exactly the
  worked example the scope document anticipates, generated from real
  records rather than hardcoded.
- **Seeded interests for the human-matching fixture**: Arta
  (technology, photography), Drin (technology, science), Fatlume
  (environment, volunteering), Yll (culture, music) — chosen so Arta and
  Drin share a real "technology" interest and both are `isDiscoverable`,
  giving `/people` a genuine, non-empty match on first login without
  requiring a judge to fill out onboarding first.
- **No new communities or activities** — Phase 5 is entirely computed
  (BRIDGE) or opt-in-interactive (human matching) over Phase 1–4's
  existing seeded content; see docs/ARCHITECTURE.md for the scoring
  formula and matching rules.

## What Phase 6 added

Nothing new to seed — the assistant (`/assistant`) is a read-only query
layer over all of the above (`src/lib/assistant/respond.ts` calls the same
`listActivities`/`listMatches`/`listBridgeProposals` this document already
describes). No new Prisma models, no new migration.

## What Phase 7 added

- **Two more real supporters on the environment need**: Drin and Yll now
  support it alongside Arta (Fatlume is the submitter) — 4 distinct real
  contributors, at/above the small-cell suppression threshold
  (`MIN_DISTINCT_CONTRIBUTORS = 3`). This is a deliberate seed change (not
  new fake accounts — all three are existing seeded organizer personas) so
  `/municipality` has a real, disclosed demand cell to show alongside the
  youth-technology need's real, suppressed one (1 contributor: Blerta).
- **A separate, explicitly-labeled SYNTHETIC scenario dataset**
  (`MunicipalityScenarioDemand` — no relation to any `User` row, ever):
  - Prishtinë — Dardania / technology: 14 simulated requests (vs. 1 real
    published activity — the exact "several simulated requests for youth
    technology activities and relatively few relevant events" story the
    Phase 7 brief specifies).
  - Prishtinë — Dardania / environment: 6 simulated requests.
  - Prishtinë — Lakrishtë / sports: 3 simulated requests.
  
  These numbers are scenario assumptions for demo-scale storytelling —
  never real user counts, never mixed with the real, suppressed numbers
  above.
- **No new communities, activities, or user accounts** — Phase 7's larger
  numbers come entirely from the synthetic scenario table, exactly as its
  own brief requires ("do not create many fake individual accounts purely
  to inflate a number").

## What Phase 9 added (all fictional, all seeded)

* **18 activities** (12 new) across all six categories, free and paid
  (€3 / €4 / €5), indoor/outdoor, accessible and not (the Germia walk and the
  bike ride are deliberately not wheelchair-accessible), adults-only and
  all-ages, dated 2036-06-18 … 2036-06-29 (upcoming on the simulated clock,
  today = Monday 16 June 2036). One is almost full (3×3 tournament, 2 spots).
* **3 new communities** — Prishtina Cycling Collective (Ulpiana), Community
  Kitchen Prishtina (Sunny Hill), Book & Language Circle (Qendër) — each with a
  fictional organizer (`user-vlora`, `user-besnik`, `user-mirlinda`; staff
  password required). Two new neighborhoods: Ulpiana and Gërmia.
* **12 demo friends** (`isDemoFriend`): the existing Arta, Drin, Fatlume, Yll
  plus 8 new members (Lulzim, Era, Kaltrina, Blend, Vesa, Arbnor, Diellza, Ilir)
  with different interests, neighborhoods and availability (weekday mornings /
  afternoons / evenings, weekends; Ilir prefers wheelchair-accessible venues).
  They are **non-loginable** (random password hashes) and never reply live.
* **Example friendships, conversations and invitations** between the seeded
  personas, all flagged `isSeededExample` and labeled "demo example" in the UI.
* **Real RSVPs** by fictional friends so activities feel populated.
* **Two more needs**: Sunny Hill weekly shared meal (3 contributors) and
  Ulpiana safer bike route (2 contributors — suppressed in the municipality
  view).
* **Flagship BRIDGE example, already accepted**: Prishtina AI Klub × Gjelbër
  për Prishtinën → draft project "Collaboration: Prishtina AI Klub × Gjelbër
  për Prishtinën" (12 volunteers needed; Arta, Lulzim and Kaltrina joined) →
  first session "Eco-Tech Idea Lab — BRIDGE kickoff" (25 June). Other
  proposals are computed live and stay "Suggested".

### One-click demo visitors (not seeded — created per click)

Each click on **Log in as demo** creates `visitor-<hex>` (`MEMBER`,
`isDemoVisitor`) with interests technology / photography / environment,
neighborhood Qendër, availability weekends + weekday evenings, friendships with
Arta and Era, a 4-line example conversation and a pending invitation from Arta
to the Golden Hour walk. Purged after 24 h. See `docs/DEPLOYMENT.md`.

### Staff password

In a hosted environment the seeded organizer, moderator and analyst accounts
use the private `DEMO_STAFF_PASSWORD`. Local development and tests default to
`Demo-2036!`.

### Photographs

Eight photographs from Wikimedia Commons (CC0 / CC BY / CC BY-SA / public
domain) illustrate places and kinds of activity; each is labeled
"Illustrative photo · fictional event" where it illustrates an event, and
credited on `/credits` (`src/lib/photo-credits.json`).

