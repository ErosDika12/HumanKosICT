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
| Arta Krasniqi | arta.krasniqi@demo.humannetwork.example | Member | Discoverable profile; member of Prishtina AI Klub; has a real seeded RSVP to the AI workshop. |
| Blerta Hoxha | blerta.hoxha@demo.humannetwork.example | Member | Not discoverable — used to demonstrate the "off by default" privacy projection and cross-account edit rejection in tests. |
| Drin Gashi | drin.gashi@demo.humannetwork.example | Organizer | Organizes Prishtina AI Klub. |
| Fatlume Berisha | fatlume.berisha@demo.humannetwork.example | Organizer | Organizes Gjelbër për Prishtinën; submitted the one seeded community need. |
| Njomëza Krasniqi | njomeza.krasniqi@demo.humannetwork.example | Organizer | Organizes Rinia Basketboll Lakrishtë (the one unverified community). |
| Yll Morina | yll.morina@demo.humannetwork.example | Organizer | Organizes Kolektivi Kulturor Sunny Hill. |
| Elmedina Tahiri | elmedina.tahiri@demo.humannetwork.example | Moderator | Reviews reports at `/moderation`. |
| Agron Sylaj | agron.sylaj@demo.humannetwork.example | Municipality analyst | Views the aggregate-only preview at `/municipality`. |

Re-run `npm run db:seed` any time to restore this exact state (upserts by id,
safe to run repeatedly — verified by `tests/seed-consistency.test.ts`).
