# Architecture

## Stack

- **Framework**: Next.js 16.3.6, App Router, TypeScript, `src/` directory.
- **Bundler**: **Webpack**, not the Turbopack default. See "Turbopack vs
  Webpack" below — this was a forced decision, not a stylistic one.
- **Styling**: Tailwind CSS v4 (CSS-first config via `@theme inline` in
  `src/app/globals.css` — no `tailwind.config.js` in this version).
- **Map**: MapLibre GL JS v6. Defaults to MapLibre's public demo vector
  style (`https://demotiles.maplibre.org/style.json`, no API key or tile
  provider account) but the source is configurable via
  `NEXT_PUBLIC_MAP_STYLE_URL` (Phase 3). Markers auto-fit to the current
  result set and are never distinguished by color alone — each category
  marker carries a two-letter glyph, repeated in a text legend below the
  map. See "MapLibre worker fix" below for a real bundler incompatibility
  that had to be worked around.
- **Database (Phase 2+)**: Prisma ORM 7 over SQLite. See "Database" below.
- **Auth (Phase 2+)**: email/password with `bcryptjs` hashing and a
  signed, httpOnly session cookie (`jose`, HS256). See "Authentication" below.
- **Phase 1** shipped with in-memory, typed, seeded fictional data in
  `src/lib/demo-data.ts` and `src/lib/types.ts` — no database, no auth, no
  server actions. That data is now the seed script's source content (see
  "Database" below); the shapes in `src/lib/types.ts` remain the UI-facing
  contract every component renders.

## Database

**Deviation from the scope's suggested PostgreSQL, documented and
deliberate**: this environment has no PostgreSQL server and no Docker
available, so Phase 2 uses **Prisma ORM 7 + SQLite** (`@prisma/client`,
`prisma`, `@prisma/adapter-better-sqlite3`, `better-sqlite3`) instead. The
schema (`prisma/schema.prisma`) avoids Postgres-only features, so switching
providers later means: change `datasource db { provider = "postgresql" }`,
point `DATABASE_URL` at a real Postgres instance, swap the driver adapter in
`src/lib/prisma.ts` for `@prisma/adapter-pg` (or drop the adapter entirely
once you're on a standard connection string), and re-run
`prisma migrate dev`. No application code outside those two files needs to
change.

**Prisma 7 breaking change worth flagging** (this is not the Prisma CLI
prior knowledge assumes): connection URLs no longer live in
`datasource { url = ... }` in `schema.prisma`. They're configured in
`prisma.config.ts` (this project's `datasource.url`) and, for the runtime
client, passed via a **driver adapter** (`PrismaBetterSqlite3`) into the
`PrismaClient` constructor — see `src/lib/prisma.ts` and `prisma/seed.ts`.

Commands (see also `package.json` scripts):

```bash
npm run db:migrate   # prisma migrate dev — creates/applies a migration locally
npm run db:deploy    # prisma migrate deploy — applies existing migrations (CI/deploy)
npm run db:seed      # prisma db seed — (re-)seeds fictional Phase 1 demo content
npm run db:reset     # prisma migrate reset --force — wipes + re-migrates + re-seeds
```

`prisma/schema.prisma` defines the full Phase 2 domain: `User` (with `Role`:
member/organizer/moderator/municipality analyst), `Interest`/`UserInterest`,
`Community`/`Membership`, `Activity`/`ActivityInterest`, `Rsvp`, `Project`/
`ProjectVolunteer` and `CommunityNeed` (schema placeholders for Phase 4),
`BridgeProposal` (schema placeholder for Phase 5), and `Report` (moderation).

`prisma/seed-lib.ts` converts `src/lib/demo-data.ts`'s Phase 1 fictional
content into Prisma rows (see `docs/DEMO_DATA.md`) plus eight seeded demo
personas across all five roles. It's written with no dependency on the
`server-only` marker package so it can run identically from the CLI seed
script (`prisma/seed.ts`, via `tsx`, plain Node) and from the test suite
(`scripts/test-setup.ts`) — both need a script-only entrypoint since
`server-only` unconditionally throws under plain Node (no bundler
"react-server" export condition set).

`src/lib/data/mappers.ts` converts Prisma rows back into the exact
`DemoActivity`/`DemoCommunity` shapes from `src/lib/types.ts`, so every
Phase 1 UI component (`ActivityCard`, `DiscoverExplorer`, `ActivityMap`)
works unmodified against real persisted data. `Activity.simulatedRsvpBaseline`
(renamed from Phase 1's `rsvpCount`) is the fictional 2036-scenario baseline
attendance seeded with the activity; the UI-facing `rsvpCount` a page renders
is that baseline **plus** real confirmed `Rsvp` rows created by signed-in
demo accounts through this app — see `docs/DEMO_DATA.md`.

## Authentication

Email + password, hashed with `bcryptjs` (12 rounds), sessions as a signed
(HS256, `jose`) JWT in an httpOnly, `sameSite=lax` cookie
(`src/lib/auth/session.ts`, `current-user.ts`, `actions.ts`). `AUTH_SECRET`
is required in production (`src/lib/auth/session.ts` throws if unset when
`NODE_ENV=production`); in development it falls back to a logged, clearly
insecure default so `npm run dev` works without setup.

A **development-only demo persona switcher** (`/dev-login`) lets you sign in
as any seeded persona with one click, with no password. It is guarded twice:
the page calls `notFound()` outside development, and the server action
(`assertNotProduction()` in `src/lib/auth/dev-guard.ts`) refuses independently
— verified by a real production build in Phase 2 (`npm run build && npm start`
→ `/dev-login` returns 404) and by `tests/dev-login-guard.test.ts`. The
judge-facing path is always `/login` with a persona's email +
`Demo-2036!` (documented on the login page itself).

Authorization is enforced in `src/lib/auth/current-user.ts`
(`requireUser`/`requireRole`) and again inside each `src/lib/data/*` module
(e.g. `updateOwnProfile` refuses `actorId !== targetUserId` even if a caller
passed the wrong target) — never only in a page component or the UI.

## Turbopack vs Webpack

Next.js 16 defaults both `next dev` and `next build` to Turbopack. Under
Turbopack, MapLibre GL's worker script failed to load in every configuration
tested (`Error: Worker failed to load`). Root-caused (see below) — the fix is
bundler-agnostic (a static asset + explicit worker URL), but Turbopack's
`next build` output was verified alongside Webpack's during debugging and the
project was pinned to Webpack via `--webpack` on both `dev` and `build` npm
scripts (`package.json`) to match the environment where this was fully
verified end-to-end. Revisit this pin in a later phase if there's a reason to
move back to Turbopack — the underlying MapLibre fix does not depend on it.

## MapLibre worker fix (real bug, not a demo shortcut)

MapLibre GL JS v6's published ESM build resolves its background worker
script's URL relative to its own `import.meta.url` at runtime. Bundlers
rewrite `import.meta.url` to point at an internal chunk URL with no sibling
worker file, so the default lookup 404s and the map silently loses all tile
parsing (it still constructs without throwing, so this is easy to miss).

Fix, in two parts:

1. `scripts/copy-maplibre-worker.mjs` (run via `postinstall`) copies
   `maplibre-gl-worker.mjs` **and** its sibling chunk `maplibre-gl-shared.mjs`
   from `node_modules/maplibre-gl/dist/` into `public/` verbatim. Both files
   are required — the worker script itself imports the shared chunk via a
   relative specifier that the browser resolves against the worker's own
   served URL.
2. `src/components/ActivityMap.tsx` calls `setWorkerUrl("/maplibre-gl-worker.mjs")`
   from the `maplibre-gl` package before constructing any `Map` instance.

Both copied files are excluded from ESLint (`eslint.config.mjs`) as vendored,
unmodified third-party output.

**Verification**: confirmed via Playwright that `style.json`, `tiles.json`,
and vector tile `.pbf` requests all return 200 and that markers render at the
correct seeded coordinates, with zero console/page errors. The one remaining
gap is that in a headless, GPU-less Chromium test runner the WebGL basemap
paints as a flat background even though every underlying request succeeds —
a known headless-browser WebGL limitation, not an application defect (see
`docs/PHASE_STATUS.md` verification notes for how this was isolated).

## Graceful map fallback (required by the Phase 1 brief, kept even after the fix above)

`ActivityMap` still catches synchronous constructor failure and the map's
native `error` event and renders a clear inline message ("Map tiles
unavailable right now") while the list view next to it stays fully usable and
identically filtered. This is intentional defense-in-depth for a judge's
machine with no network access to `demotiles.maplibre.org`, not a crutch for
the worker bug above (which is fixed at the source).

## Discovery & recommendation (Phase 3)

`src/lib/data/activities.ts` (`ActivityFilters`/`listActivities`) filters on
category, area, cost, indoor/outdoor, age eligibility, and difficulty at the
Prisma `where` level, plus accessibility (AND-match across selected tags)
and a weekday/weekend bucket in JS after the query — see the doc comment on
`listActivities` for exactly why those two aren't `where` clauses.
`listDiscoveryFacets()` derives real area/accessibility values from the
seeded rows so the UI never offers a filter combination the data can't
satisfy. Every filter is a `searchParams` key on `/discover`, so the exact
result set is a shareable/bookmarkable URL, not client-only state.

`src/lib/data/recommendations.ts` scores an already-filtered activity list —
accessibility/eligibility are hard filters applied earlier, never part of
the score. The formula (also documented in the module's own header comment):

```
score = 2 × (number of matched interests)
      + 1                         if the activity's real calendar date falls
                                   on the requested weekday/weekend bucket
      + max(0, 3 − distanceKm/5)  if the visitor opted into "Near me"
```

Ties break by soonest date then title — deterministic regardless of input
order. With no interests, no weekday preference, and no location, every
score is 0 and that same tie-break becomes the fallback: soonest-first,
never a fabricated ranking. Each non-zero contributor produces a short,
honest reason string ("Matches your interest in Technology", "Happening
this weekend") rendered directly on `ActivityCard` — distance is shown as
its own structured field, not restated as text, to avoid saying the same
thing twice. This module deliberately has no `import "server-only"`: it's
pure functions over already-fetched data, so `tests/recommendations.test.ts`
unit-tests it directly with fixtures, no database involved.

"Near me" (`src/components/NearMeButton.tsx`) is opt-in only — nothing
requests geolocation until the visitor clicks, and the coordinates only
ever become `?lat=&lng=` on this page's own URL, never sent to any other
endpoint or third party.

A signed-in member's saved interests (Phase 2 `UserInterest` rows) become
the default recommendation input on `/discover` when no `?interests=` is on
the URL — explicit query params always override.

## Simulated clock (Phase 4)

The entire app runs inside a fictional June 2036 Prishtina scenario, but the
real wall-clock date this app happens to run on is always years earlier. A
naive `new Date()` comparison would make every seeded 2036 activity look
permanently upcoming — forever undemoable for anything that depends on
"has this already happened" (event check-in, a past-event banner, the
Impact page's attended history). `src/lib/simulated-clock.ts` fixes a
single, clearly-labeled in-universe "today" (`SIMULATED_NOW_ISO =
"2036-06-16"`) instead, chosen so the 6 seeded activities split
meaningfully: 3 already happened (both 2036-06-13 events and the
2036-06-14 one), 3 are still upcoming (2036-06-17/20/21) — enough real
fixtures for both the RSVP/cancel journey (needs upcoming activities) and
the check-in/attendance/Impact journey (needs past ones) in the same demo.
It's surfaced in the footer on every page ("Simulated 'today' inside this
2036 scenario: …") — never presented as the real date. Every past/upcoming
comparison in the app (`src/lib/data/rsvp.ts`'s `isPastActivityDate`,
`src/lib/data/attendance.ts`'s check-in gate) goes through this module, not
`new Date()` directly.

## Communities, organizer CRUD, projects, needs, attendance, notifications (Phase 4)

- **Communities** (`src/lib/data/communities.ts`): `listCommunities`/
  `getCommunityBySlug` (purpose, area, language, rules, organizer, real
  member count, upcoming events, projects), `joinCommunity`/`leaveCommunity`
  (a `PUBLIC` community activates membership immediately; a `RESTRICTED`
  one creates a `PENDING` membership the organizer must approve via
  `decideMembership` — never silent access), `createCommunity` (any
  signed-in user; starts `CommunityStatus.DRAFT`, invisible until a
  moderator publishes it — see "do not make every new public event
  instantly trusted by default" in docs/PRODUCT_CONTRACT.md), and
  `updateCommunity` (organizer-only, checked via `assertCommunityOrganizer`,
  the same authorization pattern `src/lib/data/profile.ts` established in
  Phase 2).
- **Organizer activity CRUD** (`src/lib/data/organizer-activities.ts`):
  `createActivity` (organizer-only, server-side validated — date/time
  format, capacity, required fields, paid-needs-a-cost-detail — starts
  `ActivityStatus.DRAFT`), `updateActivity` (organizer-only; a date/time/
  venue change notifies every confirmed RSVP holder via
  `notifyRsvpHolders`), `cancelActivity` (organizer-only; notifies RSVP
  holders too). `src/components/ActivityForm.tsx` is the shared create/edit
  form — a plain server-rendered `<form>`, no client JS required.
- **Moderation publishing queue** (`src/lib/data/moderation.ts`,
  `/moderation`): lists every `DRAFT` community/activity with a one-click
  publish action. Nothing an organizer creates is discoverable until it
  appears here.
- **Projects** (`src/lib/data/projects.ts`): `joinProject`/`withdrawProject`
  (idempotent — a second join is a no-op, not a duplicate row),
  `createProject` (organizer-only). Volunteer counts are always the real
  `ProjectVolunteer` row count — no hours field exists anywhere in this
  app, by design (see docs/PRODUCT_CONTRACT.md "avoid fabricated impact
  hours").
- **Community needs** (`src/lib/data/needs.ts`): never selects or returns
  `submittedById` in any list — the submitter is never public. Duplicate
  prevention is a `NeedSupport` join table ("I also need this," unique per
  user+need, idempotent toggle) plus `findSimilarOpenNeed` — submitting into
  a category+area that already has an OPEN need redirects back to the form
  with that need shown instead of silently creating a near-duplicate; the
  submitter can still confirm they want a genuinely new entry.
- **Attendance** (`src/lib/data/attendance.ts`): deliberately separate from
  `Rsvp` (an intent to attend). Only an activity's organizer can mark it,
  and only once the activity's date has passed on the simulated clock —
  confirming attendance at an event that, in-universe, hasn't happened yet
  wouldn't mean anything. No self-check-in exists.
- **Impact** (`src/lib/data/impact.ts`, `/impact`): every field is read
  straight from a stored action (`Attendance`, `ProjectVolunteer`,
  `Membership`) — no derived/estimated/self-reported hours, no follower or
  popularity count anywhere in this app.
- **Notifications** (`src/lib/data/notifications.ts`, `/inbox`): created
  only for a genuinely useful state change — RSVP confirmation
  (`src/lib/data/rsvp.ts`), or an organizer's schedule change/cancellation
  (`notifyRsvpHolders`). A simple in-app inbox; no external messaging
  dependency.

## BRIDGE (Phase 5)

`src/lib/data/bridge-scoring.ts` is pure, documented, deterministic
candidate scoring — no `server-only`, unit-tested directly with fixtures
(good match, bad match, blocked/ineligible candidate, changed need,
deduplication). The formula (also in the module's own header comment):

```
score = 2  if the two communities have different categories
      + 2  if the need's area matches either community's area
      + 2  if either community's category matches the need's category
      + 1  if either community has a PUBLISHED activity on/after the
           simulated clock's "today"
      + 1  if their activities share at least one interest tag
```

`src/lib/data/bridge.ts` is the server-only layer: `regenerateBridgeProposals()`
recomputes `SUGGESTED` proposals from live communities/needs (invalidating
any that no longer qualify — a resolved need, a dropped score, a different
need now winning for the same pair — while never touching a human's
`SAVED`/`ACCEPTED`/`DECLINED` decision), `listBridgeProposals`/
`getBridgeProposal` for display, `saveBridgeProposal`/`updateBridgeProposal`/
`declineBridgeProposal`/`acceptBridgeProposal` for organizer actions.
Authorization (`assertBridgeOrganizer`) accepts either community's
organizer, reusing `communities.ts`'s `assertCommunityOrganizer`.
`acceptBridgeProposal` creates a real `Project` row inside a transaction —
idempotent on re-accept (returns the existing project). Regeneration runs
at the top of `/bridge`, `/communities/[slug]`, and `/needs` page loads —
cheap at this dataset's scale, and how "recompute or invalidate when
inputs change" is satisfied without scattering hooks across every mutation.

`src/components/BridgeNetworkGraph.tsx` is an inline server-rendered SVG —
only the communities/needs appearing in an active proposal, text-labeled
nodes (never color-only), paired with the full accessible list on
`/bridge` as the primary surface, not a fallback.

## Human matching (Phase 5)

Deliberately reuses `User.isDiscoverable` — the same opt-in flag Phase 2
established for the public profile projection — as the single consent flag
for matchability too, rather than adding a second toggle for a
conceptually identical "will other members see something about me"
decision. `src/lib/data/people-matching.ts` (pure, unit-tested) requires
both users discoverable, neither blocking the other, and a named mutual
basis (shared interest, shared community, or shared project) — no basis,
no match, never a bare score. `src/lib/data/people.ts` (server-only) adds
`Block` (bidirectional-exclusionary, withdraws any pending
`ConnectionRequest` between the pair) and `ConnectionRequest`
(`requestConnection` re-checks the mutual-basis precondition server-side —
never trusts that the UI only showed the button because a match existed).
`Report.reportedUserId` extends Phase 2's moderation model to people.
Adult-only by construction: no minor has ever had an account in this
schema (the one minor-eligible seeded activity remains supervised and
account-free, unchanged since Phase 1) — there was no age field to check
in the first place, by design (see docs/PRODUCT_CONTRACT.md).

## Assistant (Phase 6)

`src/lib/assistant/intent-parser.ts` is a pure, typed, deterministic
keyword/substring parser (English + a documented set of Albanian
phrasings) — not natural-language understanding, and the UI says so.
Extracts category, weekday/weekend, accessibility, "near me," an
out-of-scope city, and up to two real community mentions (for a BRIDGE
question). `src/lib/assistant/respond.ts` (server-only) is the
always-available grounded baseline: it calls
`listActivities`/`scoreActivities` (Phase 3), `listMatches` (Phase 5), and
`regenerateBridgeProposals`/`listBridgeProposals` (Phase 5) directly — the
same modules Discover/People/BRIDGE already use — so every fact in a
response is freshly queried, never invented, and authorization/eligibility
are enforced by those modules, not assumed from the parsed text.

`src/lib/assistant/ai-provider.ts` is a real, documented, **off-by-default**
integration point: `ASSISTANT_AI_PROVIDER`/`ASSISTANT_AI_API_KEY` are
unset in this environment (no key, no guaranteed outbound network access),
so `isAiProviderConfigured()` is `false` and the assistant UI shows
"Rules-based demo response (no AI provider configured)." If ever
configured, the response shape would still be validated
(`parseModelIntentResponse`) and re-checked by the same deterministic data
modules before rendering — the model would never decide who someone must
meet, rank a person's social value, see a private field, or make a
municipal decision. `callAiProvider` is an intentional fail-safe stub, not
a bug: calling it always throws a clearly-labeled `AiProviderError`.

The organizer draft-event helper reuses `ActivityForm`'s existing
`defaults` prop (Phase 4) via query-string prefill on
`/communities/[slug]/activities/new?title=&category=` — no new form, no
auto-creation; the organizer still reviews and submits, and it still
starts `DRAFT` pending moderator publish.

## Municipality intelligence (Phase 7)

`src/lib/data/municipality-aggregation.ts` is pure, documented, and
independently unit-tested — it is the entire privacy boundary for this
feature. There is no other code path anywhere (no export, no filter
combination, no alternate route) that reads raw `CommunityNeed`/
`NeedSupport` rows; every consumer goes through this module's suppressed,
pre-aggregated output.

- **Small-cell suppression**: real demand for a (area, category) cell is
  the count of distinct contributors (a need's submitter plus its
  supporters, deduplicated across needs in the same cell). Below
  `MIN_DISTINCT_CONTRIBUTORS` (3), the cell is `{ kind: "suppressed" }` —
  never a number, never a rounded-but-still-revealing approximation.
- **Differencing**: this module deliberately has **no function that sums
  per-category cells into an area or grand total**. If it did, and exactly
  one sibling category were suppressed, `total − sum(visible)` would
  reconstruct it exactly. Any total a page wants must be its own
  independent aggregation with its own suppression check — never derived
  from the per-category rows this module returns.
  `tests/municipality-aggregation.test.ts` verifies this structurally (the
  module's actual export surface has no total-computing function), not
  just with a numeric trick.
- **A suppressed cell never ranks**: `topGaps`/`topScenarioGaps` only ever
  rank disclosed values — a suppressed cell's rank position would itself
  leak information about a small group.
- **Supply is never suppressed** — a published `Activity` is public by
  definition (Phase 3's Discover already shows it to every visitor).
- **The synthetic scenario dataset** (`MunicipalityScenarioDemand`) has no
  relation to `User` at all — structurally incapable of identifying
  anyone, by construction, not just by policy. It exists only so the
  "several simulated requests... relatively few relevant events" story is
  demonstrable at a realistic scale without fabricating individual
  accounts (Phase 7 brief requirement 4). Always returned as its own
  distinct type (`ScenarioGapRow`, never `RealGapRow`) so a caller can't
  accidentally blend it into the real, privacy-governed numbers.
- **`listCandidateSpaces`**: real seeded venues with real
  scheduled-activity counts only — never asserts "underused" without that
  evidence; UI copy uses "candidate space in this scenario" instead.
- **`MunicipalityRecommendationNote`**: an analyst's own free-text edit,
  tied to an area/category. Explicitly phrased "Suggestion for human
  review" in the UI — never becomes a real `Activity`/`Project`; analysts
  have no organizing authority anywhere in this app's role model.

The seeded real data was extended (not replaced) so suppression is
demonstrated both ways from genuine records: the environment/Dardania need
now has 4 distinct real contributors (disclosed), the youth-technology/
Dardania need has 1 (suppressed) — see `docs/DEMO_DATA.md`.

## Routes

| Route | Type | Purpose |
| --- | --- | --- |
| `/` | Dynamic | Landing page, pitch, journey explainer, seeded-data counts. |
| `/onboarding` | Dynamic | Interest picker. Signed-in members persist to the DB (`saveInterestsAction`); signed-out visitors keep Phase 1's `localStorage` behavior. |
| `/discover` | Dynamic (reads `searchParams`) | Filterable, scored activity list + map toggle (Phase 3) — see "Discovery & recommendation" above. |
| `/discover/[slug]` | Dynamic | Activity detail + real RSVP/cancel/report actions + organizer attendance check-in (Phase 4). |
| `/discover/[slug]/edit` | Dynamic, organizer-only | Edit or cancel an activity. |
| `/communities` | Dynamic | Published communities index. |
| `/communities/new` | Dynamic, signed-in | Create a community (starts DRAFT). |
| `/communities/[slug]` | Dynamic | Community detail, join/leave, pending-member approval (organizer), BRIDGE callout (Phase 5). |
| `/communities/[slug]/edit` | Dynamic, organizer-only | Edit a community. |
| `/communities/[slug]/activities/new` | Dynamic, signed-in | Create an event for this community (assistant-prefillable, Phase 6). |
| `/communities/[slug]/projects/new` | Dynamic, organizer-only | Create a project. |
| `/projects/[slug]` | Dynamic | Project detail, join/withdraw. |
| `/needs` | Dynamic | Community needs list, submit/support/report, BRIDGE links (Phase 5). |
| `/bridge` | Dynamic | BRIDGE proposal list + network graph (Phase 5). |
| `/bridge/[id]` | Dynamic | Proposal detail — who/why/mutual benefit/resources/next action; organizer save/edit/accept/decline. |
| `/people` | Dynamic, signed-in | Opt-in human matching, connection requests, block/report (Phase 5). |
| `/assistant` | Dynamic (reads `?q=`) | Natural-language-ish assistant over real records (Phase 6). |
| `/impact` | Dynamic, signed-in | Attended events, joined projects, communities. |
| `/inbox` | Dynamic, signed-in | In-app notifications. |
| `/login` | Dynamic | Judge-facing sign-in (seeded persona email + `Demo-2036!`). |
| `/dev-login` | Dynamic, dev-only (404 in production) | One-click persona switcher. |
| `/account` | Dynamic | Signed-in user edits their own bio/discoverability. |
| `/moderation` | Dynamic, moderator-only | Pending community/event publishing queue + open reports queue. |
| `/municipality` | Dynamic, analyst-only | Demand/supply gap dashboard, small-cell suppressed, scenario projection, editable recommendation (Phase 7). |

Every route is now dynamic (`ƒ` in the build output) because the root layout
calls `getCurrentUser()` (reads the session cookie) to render the header —
Phase 1's static/SSG optimization for `/discover/[slug]` no longer applies,
which is the correct trade-off once a page's content can depend on who's
signed in.

## Data flow

Server components and server actions call `src/lib/data/*` directly — no
client-side fetch of application data, no same-app HTTP round trip, matching
the Phase 1 architectural guidance. `src/lib/prisma.ts` is a singleton
cached on `globalThis` (so Next.js dev's module reloads don't open a new
SQLite connection every edit). Every data-access and auth module that must
never run in a Client Component starts with `import "server-only"`.

## Environment

`DATABASE_URL` and `AUTH_SECRET` are required from Phase 2 on — see
`.env.example` for the exact variables and a dev fallback story for each.
`.env.local` (gitignored) is what this repository actually runs against
locally.

## Known issues / follow-ups for later phases

- The Webpack pin above should be revisited once MapLibre or Next.js resolve
  the worker-bundling incompatibility upstream.
- `/municipality` is now the full Phase 7 demand/supply/suppression
  dashboard, not the Phase 2 category-count preview. `/moderation` gained a
  real publishing queue in Phase 4.
- The municipality "heatmap" is a colored table, not a geographic
  choropleth — this prototype has no real GeoJSON area boundaries to
  render against; a coarse area-string grid is the honest equivalent.
- No marker clustering on the map — only 6 seeded activities exist, so
  there's nothing to cluster yet; revisit if a later phase grows the
  seeded set.
- Canceled/past-activity handling (Phase 3) now has real seeded fixtures
  as of Phase 4's simulated clock — `punetori-ai-fillestare`,
  `pastrim-parku-gjelber`, and `basketboll-i-hapur-lakrishte` are all past
  relative to `SIMULATED_NOW_ISO`, closing the "no fixture to click
  through" gap noted in the Phase 3 handoff.
- Organizer community/event creation has no rich-text or image upload —
  plain text fields only, matching the rest of this prototype's design.
- No dedicated `Skill` model — BRIDGE scoring's "complementary
  capabilities" factor uses each community's own activities' interest tags
  as the closest available proxy. A deliberate simplification.
- The assistant's AI provider hook is real but intentionally inert in this
  environment (no key configured, no guaranteed outbound network access) —
  the deterministic path is what every verified demo path actually uses.
- Vitest could not run in this environment: a Windows Application Control
  policy blocks its native `@rollup/rollup-win32-x64-msvc` binary (unrelated
  to `better-sqlite3`, which loads fine). The test suite (`npm test`) uses
  Node's built-in test runner (`node --test`) via `tsx` instead — zero native
  dependencies beyond what the app itself already needs. See
  `tests/setup.ts`, `scripts/test-setup.ts`, and the `--conditions=react-server`
  flag in the `test` script (it makes plain Node resolve the `server-only`
  marker package to its no-op export, the same way Next's RSC bundler does).
- No deployment target (Vercel or otherwise) is configured in this
  environment — verified explicitly in Phase 8. There is no live preview
  URL; the demo runs from a local `npm run build && npm start` (or `npm
  run dev`). See `docs/DEMO_RUNBOOK.md`.

## Phase 8 — input bounding

`src/lib/validation.ts` adds `assertBoundedText(value, max, fieldName)`, a
pure (no `server-only`) helper that throws `ValidationError` when a
free-text field exceeds `MAX_SHORT_TEXT` (500 — report reasons, connection
requests, need descriptions) or `MAX_LONG_TEXT` (5000 — bios, community/
activity/project descriptions, recommendation notes). Every data-access
function that accepts free text from a signed-in member calls it before
writing to the database: `reports.ts`, `needs.ts`, `people.ts`
(`reportUser`, `requestConnection`), `profile.ts` (`updateOwnProfile`),
`communities.ts` (`createCommunity`, `updateCommunity`),
`organizer-activities.ts` (`validate`, shared by create and update),
`projects.ts` (`createProject`), and `municipality.ts`
(`saveRecommendationNote`). This closes a real "public actions accept
unbounded input" gap found during the Phase 8 security review — an
oversized payload is now rejected uniformly instead of being silently
written to SQLite.

## Phase 9 — friends, plans, messages, demo isolation, assistant, hosting

**Data model** (all in `prisma/schema.prisma`): `Friendship` (mutual rows),
`ActivityInvite` (a *plan* = an activity plus its invitations),
`Message`, `AssistantUsage` (per-account daily counter),
`BridgeProposal.kickoffActivityId`, and `User.isDemoFriend / isDemoVisitor /
areaSq / availability`.

**Modules** (`src/lib/data`): `friends.ts` (suggestions reuse the consent-based
`listMatches`; `suitableActivities` filters by shared interests, availability,
accessibility and open capacity), `invites.ts` (invitations, plans, the
transparent simulated reply from `src/lib/demo-social.ts`), `messages.ts`
(friends only, bounded, rate-limited), `demo-session.ts` (isolated visitor
creation, purge, journey progress), `bridge-stages.ts` (pure stage/next-step
logic) and `bridge.ts` (`getBridgeShowcase`).

**Demo isolation.** Visitor rows are excluded from every shared aggregate: RSVP
counts and capacity (`activities.ts`, `rsvp.ts`), community and project counts
(`communities.ts`, `projects.ts`), needs and supports (`needs.ts`), municipal
inputs (`municipality.ts`), the moderation queue (`reports.ts`) and matching
(`people.ts`). A visitor's own action is always reflected for that visitor.

**Assistant.** `src/lib/assistant/conversation.ts` is the deterministic,
multi-turn, grounded engine (parser in `conversation-parser.ts`, pure and
tested); `src/app/api/assistant/route.ts` is same-origin, input-bounded and
quota-limited (`usage.ts`); `ai-provider.ts` is the optional server-side model
hook that only *phrases* text from the engine's facts. Cards and buttons always
come from stored records.

**Map.** OpenFreeMap style by default; marker popups are built with DOM APIs
(never HTML strings); overlapping markers are pushed apart in pixel space
(WCAG 2.2 target size) without changing coordinates.

**Hosting.** See `docs/DEPLOYMENT.md` (two schemas/clients, verified TLS,
build-time migrate + seed).

