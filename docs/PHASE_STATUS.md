# Phase Status

## Phase 1 — Foundation, product contract, design system, runnable vertical slice

**Status: Complete.** (Summary below; see git history / prior revisions of
this file for the full original verification log. Superseded by Phase 2 —
the in-memory data layer this phase built no longer exists as the runtime
path, but its UI and content are exactly what Phase 2 preserved.)

Implemented Next.js 16 App Router app shell, design system, onboarding,
Discover (list + MapLibre map), activity detail, and seeded fictional
Prishtina 2036 content (6 activities, 4 communities, 15 interests). Real bug
found and fixed: MapLibre's worker script 404s under both bundlers because
of `import.meta.url` rewriting — fixed by vendoring the worker script as a
static asset (`scripts/copy-maplibre-worker.mjs`, `public/maplibre-gl-worker.mjs`).
No accounts, RSVP, or persistence — by design, and clearly labeled as such
in the UI.

## Phase 2 — Persistent data, accounts, roles, permissions, and safety base

**Status: Complete.**

### Implemented

- **Schema & migrations** (`prisma/schema.prisma`, `prisma/migrations/`):
  `User` (with `Role`: MEMBER/ORGANIZER/MODERATOR/MUNICIPALITY_ANALYST),
  `Interest`/`UserInterest`, `Community`/`Membership`, `Activity`/
  `ActivityInterest`, `Rsvp`, `Project`/`ProjectVolunteer`/`CommunityNeed`
  (Phase 4 schema placeholders), `BridgeProposal` (Phase 5 placeholder),
  `Report` (moderation). Unique constraints (`Rsvp` on
  `[userId, activityId]`, `Membership` on `[userId, communityId]`), indexes,
  and deletion rules (`onDelete: Cascade`/`SetNull` as appropriate) are in
  the schema, not left to application code.
- **Database**: Prisma ORM 7 + SQLite via `@prisma/adapter-better-sqlite3`
  — a documented deviation from the scope's suggested PostgreSQL because no
  Postgres server or Docker was available in this environment. Full
  reasoning and exact steps to switch to Postgres later are in
  `docs/ARCHITECTURE.md` "Database".
- **Seed/reset scripts**: `prisma/seed-lib.ts` (content, converted directly
  from `src/lib/demo-data.ts` — never duplicated by hand) + `prisma/seed.ts`
  (CLI entrypoint). `npm run db:seed` / `npm run db:reset`. Idempotent
  (upserts) — verified by `tests/seed-consistency.test.ts`.
- **Authentication**: email/password (`bcryptjs`, 12 rounds) with a signed
  (HS256 `jose`) httpOnly session cookie. `AUTH_SECRET` required in
  production (throws if missing); a logged, insecure dev-only default keeps
  `npm run dev` working without setup. A separate, guarded, dev-only demo
  persona switcher (`/dev-login`) — refused twice over (route `notFound()`
  outside development, and the server action's own `assertNotProduction()`
  guard) — verified 404 against a real `npm run build && npm start`.
- **Authorization**: centralized in `src/lib/auth/current-user.ts`
  (`requireUser`/`requireRole`) and re-checked inside each
  `src/lib/data/*` mutation (e.g. `updateOwnProfile` refuses
  `actorId !== targetUserId` regardless of what a caller passes as the
  target). Public/private profile projections (`src/lib/data/profile.ts`):
  a user's email and password hash are never in any projection; their
  bio/name are public only if `isDiscoverable` is explicitly true (off by
  default).
- **RSVP**: `src/lib/data/rsvp.ts`, transactional — capacity is re-checked
  and the write applied inside one `prisma.$transaction`, so two requests
  for the last spot cannot both succeed. Idempotent (re-RSVPing while
  already confirmed is a no-op; the DB unique constraint is the second line
  of defense). Wired into `/discover/[slug]` with real capacity display,
  a working Cancel action, and a full-state "Full — join waitlist
  unavailable" disabled control (not a dead button).
- **Safety baseline**: any signed-in user can report a concern on an
  activity (`src/lib/data/reports.ts`); moderators review and resolve
  reports at `/moderation`. No new dates-of-birth field was added; the one
  Phase 1 minor-eligible activity keeps its "supervised, no open
  participant↔adult messaging" description unchanged.
- **Municipality preview**: `/municipality` — aggregate-only category
  counts (`prisma.activity.groupBy`), analyst-role-gated. Deliberately a
  thin Phase 2 proof that the role boundary works end-to-end, not the full
  Phase 7 dashboard.
- **Onboarding persistence**: signed-in members' interest selections save
  to `UserInterest` (`saveInterestsAction`) and are pre-filled on return
  visits; signed-out visitors keep Phase 1's exact `localStorage` behavior
  — no regression for the no-account path.
- **UI preserved**: `src/lib/data/mappers.ts` converts every Prisma row back
  into the exact `DemoActivity`/`DemoCommunity` shapes Phase 1's components
  expect, so `ActivityCard`, `DiscoverExplorer`, and `ActivityMap` needed no
  changes at all.

### How to run

```bash
npm install              # also runs: prisma generate, then the MapLibre worker copy
cp .env.example .env.local  # then set DATABASE_URL="file:./prisma/dev.db" and a real AUTH_SECRET
npm run db:migrate        # creates prisma/dev.db and applies migrations
npm run db:seed           # seeds fictional Phase 1 demo content + 8 demo personas
npm run dev                # http://localhost:3000, Webpack dev server
npm run build               # production build (Webpack)
npm start                    # serve the production build
npm run lint                  # eslint
npm test                       # node's built-in test runner via tsx (see below)
```

Demo sign-in: any persona email from `docs/DEMO_DATA.md` + password
`Demo-2036!` at `/login`. In development only, `/dev-login` skips the
password.

### Verification results

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | ✅ 0 errors. |
| `npm run build` (`next build --webpack`) | ✅ Compiles, typechecks, generates all routes. Every route is now dynamic (`ƒ`) — expected, since the root layout reads the session cookie to render the header. |
| `npx eslint .` | ✅ 0 errors, 0 warnings. |
| `npm test` (13 tests, `node --test` via `tsx`, against a throwaway seeded SQLite DB) | ✅ 13/13 pass — RSVP capacity/uniqueness (full-activity rejection, idempotent double-RSVP, concurrent last-spot race, real-count reflection), profile projections (public projection excludes email/password hash, excludes non-discoverable users entirely), cross-account edit rejection (member A cannot edit member B), seed consistency (exact slugs, 15 interests, full-capacity + minor-eligible fixtures preserved, idempotent re-seed), dev-persona-switcher production guard. |
| Playwright smoke test against a real `npm run build && npm start` production server | ✅ `/dev-login` → 404. Login as a seeded member → redirected to `/discover`, header shows the signed-in name. RSVP on an activity with room → capacity display decrements by exactly 1, "You're going ✓" shown, Cancel button appears. Cancel → capacity display reverts to the exact original value. Full activity (`basketboll-i-hapur-lakrishte`) → RSVP button is disabled with "Full — join waitlist unavailable", no bypass. Signed-in member hitting `/moderation` and `/municipality` → "Access denied" message, not the protected content. Sign out → header reverts to "Sign in"; `/account` then requires signing in again. Zero unexpected console/page errors (the one console error captured was the deliberately-triggered `/dev-login` 404). |
| Manual: two members cannot see each other's private fields | ✅ Covered by `tests/profile.test.ts` at the data-access layer (the layer every route goes through — there is no separate code path that could bypass it). |

**Known verification limitation carried over from Phase 1**: MapLibre's
canvas may paint as a flat background in a headless, GPU-less browser even
though every network request succeeds — a headless-browser WebGL rendering
limitation, not an application defect. Re-verify in a real browser at
`/discover` → Map view if you want to double check.

**Testing environment note**: Vitest could not run in this environment — a
Windows Application Control policy blocks its native
`@rollup/rollup-win32-x64-msvc` binary specifically (confirmed
`better-sqlite3`'s own native binary, which the app itself depends on, loads
fine — this is not a project-wide native-module problem). `npm test` uses
Node's built-in test runner instead, which has zero native dependencies
beyond what the app already needs. See `docs/ARCHITECTURE.md` "Known
issues" for the exact mechanism.

### Limitations (Phase 2 scope, by design)

- SQLite, not PostgreSQL — documented deviation, see `docs/ARCHITECTURE.md`.
- Organizer community/event CRUD, community membership pages, projects, and
  needs UI don't exist yet — Phase 4. The schema for all of them does.
- `/municipality` is a one-table aggregate preview, not the full Phase 7
  demand/supply/small-cell-suppression dashboard.
- No password reset / email verification flow — out of scope for a
  demo-persona-only prototype; every account is seeded, never
  self-registered.
- Git repository still has no commits — this repo's own convention is that
  commits are made only when explicitly requested.

## Phase 3 — The map, discovery, recommendation, and accessible search

**Status: Complete.**

### Implemented

- **Richer discovery filters** (`src/lib/data/activities.ts`
  `ActivityFilters`/`listActivities`): category (existing), area, cost
  (free/paid), indoor/outdoor, accessibility (hard constraint, must match
  ALL selected tags), age eligibility, difficulty, and a weekday/weekend
  bucket derived from each activity's real calendar date. Cheap,
  enum-friendly filters run in the Prisma `where` clause; accessibility and
  the day bucket are filtered in JS after the query (documented trade-off —
  accessibility is a comma string with no array type in SQLite, and
  day-of-week isn't a stored column — both are cheap at this dataset's
  size). **Group size was deliberately not added**: no stored field
  represents it (`capacity` is the venue's cap, not a requested group size),
  and the brief is explicit that discovery must never promise a filter the
  data can't satisfy.
- **`listDiscoveryFacets()`**: derives real area and accessibility-tag
  values straight from the seeded rows, so the filter UI only ever offers
  options the data can actually match — never a hardcoded guess.
- **Filter state is the URL**: every filter is a `searchParams` key
  (`category`, `area`, `cost`, `indoor`, `accessibility`, `ageEligibility`,
  `difficulty`, `when`, `lat`, `lng`), so the exact result set is shareable
  and survives navigation/refresh with zero client state.
- **Transparent recommendation function** (`src/lib/data/recommendations.ts`,
  no `server-only` — pure logic, directly unit-testable):
  `score = 2×(matched interests) + 1 if the activity falls on the
  requested weekday/weekend + max(0, 3 − distanceKm/5) if the visitor
  opted into their location`. Each activity gets a short, honest reason
  string ("Matches your interest in Technology", "Happening this
  weekend") — never an opaque confidence percentage. Accessibility and age
  eligibility remain hard filters, never scored. With no interests, no
  weekday preference, and no location, every score is 0 and the same
  date-then-title tie-break becomes the fallback ordering (soonest first) —
  verified deterministic and input-order-independent in
  `tests/recommendations.test.ts`.
- **Opt-in "Near me"** (`src/components/NearMeButton.tsx`): a visitor must
  explicitly click and grant browser geolocation; coordinates only ever
  become `?lat=&lng=` on this page's own URL, never sent anywhere else.
  Distance is shown as a structured field on each card, not fabricated into
  a reason string.
- **Onboarding interests as the default recommendation input**: signed-in
  members with no explicit `?interests=` on the URL get their saved
  interests (Phase 2 persistence) applied automatically; anyone can still
  override via the URL, and `/onboarding` remains the way to change what's
  saved.
- **Map polish**: configurable tile/style source
  (`NEXT_PUBLIC_MAP_STYLE_URL`, defaults to MapLibre's public demo style —
  the Phase 1 "no key required" property is unchanged); markers auto-fit to
  the current result set (`fitBounds`); **never color-only** — each
  category marker also carries a two-letter glyph (TE/EN/SP/ED/CU/CO), and
  a text legend below the map repeats color + glyph + label, satisfying
  the "meaningful alternative to color-only encoding" requirement. The list
  view (always paired with the map, per Phase 1) remains the full
  non-visual alternative.
- **Activity detail correctness**: added real handling for **canceled**
  (`Activity.status`, a genuine Phase 2 schema state) and **past-dated**
  activities — a clear banner, RSVP disabled, but an existing RSVP can
  still be canceled. `src/lib/data/rsvp.ts` already rejected both
  server-side (`isPastActivityDate`, now exported and reused by the page);
  Phase 3 added the matching UI so it reads as designed behavior, not a
  raw error message. **Not exercised in this environment**: no seeded
  activity is actually canceled or past-dated (all seeded dates are June
  2036), and there's no organizer UI yet (Phase 4) to cancel one — the code
  path is real and covered by `rsvp.ts`'s existing rejection, just without
  a seeded fixture to click through in a browser.

### How to run

Unchanged from Phase 2 (`docs/PHASE_STATUS.md` Phase 2 section) — no new
environment variables are required; `NEXT_PUBLIC_MAP_STYLE_URL` remains
optional.

### Verification results

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | ✅ 0 errors. |
| `npm run build` (`next build --webpack`) | ✅ Compiles, typechecks, generates all routes. |
| `npx eslint .` | ✅ 0 errors, 0 warnings. |
| `npm test` (26 tests, `node --test` via `tsx`) | ✅ 26/26 pass, including 13 new: `dayBucketOf`/`haversineKm` ground-truth checks, `scoreActivities` (fallback ordering, interest ranking + reason text, weekend bonus, distance ranking, deterministic tie-break), and `listActivities` filter-combination tests against the real seeded fixtures (accessibility AND-match, weekend vs. weekday by real calendar date, cost, indoor/outdoor, exact age eligibility, combined AND filters, facets never exceeding real data). |
| Playwright journey, desktop (1280×800) **and** mobile (390×844), against a real `npm run build && npm start` | ✅ Onboarding → Discover with `?interests=` in the URL → all seven new filter groups render → Weekend filter narrows to exactly the two real weekend fixtures and excludes a known weekday one → Accessibility ("captioned") filter narrows to exactly one real fixture → Map view renders with an accessible, non-color legend → switch back to List → sign in → RSVP → capacity decrements → Cancel → capacity reverts exactly (Phase 2 regression check) → personalized interests produce a real "Matches your interest in Technology" reason on the card. Zero console/page errors on both viewports. |

**Known verification limitation carried over from Phase 1/2**: MapLibre's
canvas may still paint as a flat background in a headless, GPU-less
browser even though every network request succeeds — re-verify in a real
browser if you want to double check the visual result; the Playwright
check above verifies the DOM/legend/accessibility structure, not pixels.

### Limitations (Phase 3 scope, by design)

- No marker clustering — only 6 seeded activities exist, so clustering
  would add complexity with nothing to demonstrate. Revisit if Phase 4's
  organizer tools grow the seeded activity count meaningfully.
- No "today"/"this week" relative-date filter — the seed data lives in a
  fixed fictional June 2036, so a filter relative to the real current date
  would always be empty. The weekday/weekend bucket (computed from each
  activity's real calendar date) is the meaningful equivalent for a fixed
  demo calendar, and is what "this weekend" in the landing copy refers to.
- No group-size filter — no stored field represents it; adding one just to
  offer the filter would violate "don't promise filters the data can't
  satisfy."
- Canceled/past-activity UI exists and is covered by the RSVP rejection
  path, but has no seeded fixture to exercise in a live browser walkthrough
  (see "Implemented" above).

## Phase 4 — Communities, events, projects, needs, and actual participation

**Status: Complete.**

### Implemented

- **Simulated clock** (`src/lib/simulated-clock.ts`): before any feature
  work, verified that the fixed fictional June 2036 seed dates would make
  every "has this happened yet" feature (check-in, past-event banners, the
  Impact page's attended history) permanently empty against the real
  wall-clock date. Fixed a single, clearly-labeled in-universe "today"
  (`SIMULATED_NOW_ISO = "2036-06-16"`) instead of silently shipping empty
  results — surfaced in the site footer on every page, never presented as
  the real date. Splits the 6 seeded activities into 3 already-happened and
  3 upcoming, so both the RSVP journey and the check-in/Impact journey have
  real fixtures in the same demo. `src/lib/data/rsvp.ts`'s past-activity
  rejection now goes through this module (previously compared against the
  real date, which could never actually trigger against 2036 seed data).
- **Community membership** (`src/lib/data/communities.ts`, `/communities`,
  `/communities/[slug]`): real member counts, join/leave, and a genuine
  public-vs-restricted distinction — joining a `PUBLIC` community activates
  membership immediately, joining the one `RESTRICTED` community
  (Rinia Basketboll Lakrishtë) creates a `PENDING` membership its organizer
  must explicitly approve or deny. Never silent access.
- **Organizer CRUD** (`src/lib/data/communities.ts` `createCommunity`/
  `updateCommunity`, `src/lib/data/organizer-activities.ts`
  `createActivity`/`updateActivity`/`cancelActivity`): any signed-in user
  can start a community (becoming its organizer via a per-community
  `Membership.role = ORGANIZER`, independent of their global `Role`); any
  community organizer can create/edit its events. Every new
  community/event starts hidden (`CommunityStatus.DRAFT` /
  `ActivityStatus.DRAFT`) until a moderator publishes it at `/moderation`
  — a real moderation/publishing policy, not "every new public event
  instantly trusted." Server-side validation (date/time format, capacity,
  required fields, paid-needs-a-cost-detail) — never trusts the client
  alone. An organizer's schedule change or cancellation notifies every
  confirmed RSVP holder via the new in-app inbox.
- **Projects & volunteering** (`src/lib/data/projects.ts`,
  `/projects/[slug]`): join/withdraw is idempotent (a second join is a
  no-op, never a duplicate row); the displayed "X of Y volunteers" count is
  always the real `ProjectVolunteer` row count. No hours field exists
  anywhere in the schema or UI — a deliberate, permanent choice to avoid
  fabricated or unverifiable impact figures, not a Phase 4 shortcut.
- **Community needs** (`src/lib/data/needs.ts`, `/needs`): the submitter is
  never selected or returned in any public list. Duplicate prevention via
  `findSimilarOpenNeed` + a `NeedSupport` join table ("I also need this,"
  idempotent toggle) — submitting into a category+area that already has an
  open need redirects back showing that need instead of silently creating
  a near-duplicate, with an explicit "submit anyway" override. Report/
  moderation extended to needs too (`Report.needId`).
- **Event check-in / organizer-confirmed attendance**
  (`src/lib/data/attendance.ts`): a new `Attendance` model, deliberately
  separate from `Rsvp`. Only an activity's organizer can mark it, and only
  once the activity's date has passed on the simulated clock — checked
  server-side (`AttendanceError`), not just hidden in the UI.
- **Impact page** (`src/lib/data/impact.ts`, `/impact`): attended events,
  joined projects, and community memberships, every field read straight
  from a stored action (`Attendance`, `ProjectVolunteer`, `Membership`).
  No follower/popularity counts anywhere in this app.
- **In-app notifications** (`src/lib/data/notifications.ts`, `/inbox`,
  an unread-count badge in the header): created only for RSVP confirmation
  or an organizer's schedule change/cancellation — never a marketing ping.
  No external messaging dependency.
- **Seed data extended** (`prisma/seed-lib.ts`): two real projects (with
  real seeded volunteers), a second community need (youth technology,
  satisfying the Phase 4 brief's "at least one ... youth activity need"),
  one organizer-confirmed attendance row, one report, one notification, and
  one community (Rinia Basketboll Lakrishtë) marked `RESTRICTED` — see
  `docs/DEMO_DATA.md` "What Phase 4 added."

### How to run

Unchanged from Phase 2/3 (`npm run db:migrate` picks up the new Phase 4
migration; `npm run db:seed` seeds the new fixtures). No new environment
variables.

### Verification results

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | ✅ 0 errors. |
| `npm run build` (`next build --webpack`) | ✅ Compiles, typechecks, generates all 22 routes. |
| `npx eslint .` | ✅ 0 errors, 0 warnings. |
| `npm test` (42 tests, `node --test` via `tsx`, `--test-concurrency=1` — see note below) | ✅ 42/42 pass, including 15 new: community join/leave/pending-approval + organizer-only edit authorization (`tests/communities.test.ts`), organizer activity CRUD authorization/validation/schedule-change notifications (`tests/organizer-activities.test.ts`), attendance check-in authorization + simulated-clock gating (`tests/attendance-and-impact.test.ts`), Impact derivation from real stored actions (same file), needs privacy + duplicate-prevention + per-viewer support state (`tests/needs.test.ts`). Also updated 3 Phase 3 RSVP tests whose fixture activities became "past" once the simulated clock replaced the always-false real-date comparison — turned into a real regression test for that exact rejection path instead of just re-dating the fixtures away from it. |
| Playwright journey, desktop (1280×800) **and** mobile (390×844), against a real `npm run build && npm start` | ✅ Full **event → community → project → impact** journey: activity detail → "Organized by" link → community detail (real member count, real project) → project detail (real volunteer count, real "Withdraw" state for the seeded volunteer) → Impact page (real attended event confirmed by the organizer's name, real project, real community membership). Separately verified (desktop): organizer creates a new event → starts hidden ("Pending review") → absent from Discover → a member is denied `/moderation` ("Access denied") → the moderator sees it in the publishing queue and publishes it → it now appears in Discover. Restricted-community join → pending → organizer sees and approves the request → membership becomes active. Needs page renders support/report controls. Zero console/page errors on either viewport. |

**Testing environment note (SQLite lock contention, new since Phase 4)**:
with 42 tests across 13 files, Node's test runner's default file-level
parallelism caused concurrent writers against the same SQLite file
(`better-sqlite3` allows one writer at a time) and requests timed out
waiting for a lock. Fixed with `--test-concurrency=1` in the `test` script
— tests run correctly, just sequentially; total suite time is ~2–8s, so
this has no practical cost at this project's scale.

### Limitations (Phase 4 scope, by design)

- No rich text or image uploads for organizer-authored communities/events —
  plain text fields only, matching this prototype's design throughout.
- Volunteer hours are never tracked in any form — a permanent choice, not
  a gap (see docs/PRODUCT_CONTRACT.md).
- The "similar need" duplicate-prevention flow loses the visitor's
  in-progress description text on the warning redirect (a plain
  server-rendered form has no client-side draft state) — a minor, accepted
  UX rough edge for this prototype's scale.
- Organizer attendance check-in has no "unmark all" bulk action — each
  attendee is toggled individually, adequate at this seeded scale (a
  handful of RSVPs per activity).

## Phase 5 — Human matching and BRIDGE, the signature demonstration

**Status: Complete.**

### Implemented

- **BRIDGE candidate scoring** (`src/lib/data/bridge-scoring.ts`, pure and
  independently unit-tested): documented, deterministic formula —
  `2 if complementary categories + 2 if the need's area matches either
  community + 2 if either community's category matches the need's category
  + 1 if either has an upcoming activity + 1 if their activities share an
  interest tag`. Excludes non-`PUBLISHED` ("blocked"/inactive) communities
  and any need that isn't `OPEN`/`IN_PROGRESS`, and deduplicates to a
  single best-scoring need per community pair — never one proposal per
  need. Against the real seeded data, the flagship Prishtina AI Klub ×
  Gjelbër për Prishtinën pairing scores highest (7) and is generated
  without any hardcoding — the exact worked example the scope document
  anticipates, emerging from real records.
- **Generation/regeneration** (`src/lib/data/bridge.ts`): recomputed at the
  top of `/bridge`, `/communities/[slug]`, and `/needs` page loads (cheap
  at this dataset's scale) — "recompute or invalidate when inputs change"
  without scattering event hooks across every mutation. A `SUGGESTED`
  proposal whose need resolves, disappears, or drops below threshold is
  marked `INVALIDATED` (kept for audit, hidden from the active list) —
  never silently deleted, never a stale row shown as current. A human
  decision (`SAVED`/`ACCEPTED`/`DECLINED`) is **never** touched by
  regeneration.
- **Proposal lifecycle**: every proposal names its source communities, the
  real community need driving it, a "why" (the joined scoring reasons —
  never an opaque "AI says 95% match"), mutual benefit, required resources,
  and a suggested next action — all templated from real stored names/
  descriptions, never fabricated. Only an organizer of one of the two
  communities can save, edit (mutual benefit / required resources /
  suggested next action are all editable before a decision), decline, or
  accept (`assertCommunityOrganizer` against either side). Accepting
  creates a real `Project` row (status `ACTIVE`, attached to the need's own
  community when it has one) — idempotent on re-accept (returns the
  existing project, never a duplicate). No automated message to another
  community ever happens without this explicit organizer click.
- **BRIDGE exploration surface** (`/bridge`, `/bridge/[id]`): an inline SVG
  network graph (`src/components/BridgeNetworkGraph.tsx`) showing only the
  communities and needs that appear in an active proposal (never the whole
  community graph), with a text-labeled, non-color-only node/glyph
  encoding — paired with a full accessible list as the primary surface, not
  a lesser fallback. Linked naturally from `/communities/[slug]` (a
  "💡 BRIDGE" callout) and `/needs` (a per-need "See BRIDGE proposal" link)
  so a judge reaches the flagship proposal within a minute of the main
  journey, per the brief.
- **Human matching** (`src/lib/data/people-matching.ts` pure +
  `src/lib/data/people.ts` server-only, `/people`): reuses
  `User.isDiscoverable` as the single consent flag for this feature too
  (documented in `docs/ARCHITECTURE.md` "Human matching" — a deliberate
  reuse, not an oversight). A match requires both users opted in, neither
  blocking the other, and a named mutual basis (shared interest, shared
  community, or shared project) — no basis, no match, never a bare
  compatibility score. New `Block` and `ConnectionRequest` models: blocking
  is bidirectional-exclusionary and withdraws any pending connection
  request between the pair; a connection request re-checks the mutual-basis
  precondition server-side (never trusts that the UI only showed the
  button because a match existed); `Report.reportedUserId` extends the
  existing moderation model to people, not just activities/needs. Adult-only
  by construction — no minor has ever had an account in this schema (the
  one minor-eligible seeded activity remains supervised, non-account-based,
  unchanged since Phase 1).
- **Seed data**: `user-arta` and `user-drin` (both already `isDiscoverable`)
  seeded with a real shared interest (`technology`) so `/people` shows a
  genuine match on first login — the brief's "must work with two or three
  fictional adults" is satisfied exactly, not padded.

### How to run

Unchanged from Phase 4 — no new environment variables. `npm run db:migrate`
picks up the Phase 5 migration (`BridgeProposal` extended, `Block`/
`ConnectionRequest` added, `Report.reportedUserId`); `npm run db:seed`
seeds the new `UserInterest` fixtures.

### Verification results

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | ✅ 0 errors. |
| `npm run build` (`next build --webpack`) | ✅ Compiles, typechecks, generates all 24 routes. |
| `npx eslint .` | ✅ 0 errors, 0 warnings. |
| `npm test` (65 tests at the time, `node --test` via `tsx`, `--test-concurrency=1`) | ✅ 65/65 pass, including 17 new: `generateBridgeCandidates` fixture cases for a good match, a bad match, a blocked (DRAFT-community) candidate, a changed (resolved) need, and deduplication (`tests/bridge-scoring.test.ts`); DB-level BRIDGE generation/authorization/accept-creates-a-real-project/regeneration-never-overwrites-a-decision/invalidate-on-resolved-need (`tests/bridge.test.ts`); `findMatches` fixture cases for a good match, a bad match (no mutual basis), a blocked match, and non-discoverable exclusion (`tests/people-matching.test.ts`); DB-level human matching, blocking, connection-request preconditions, and person-reporting (`tests/people.test.ts`). |
| Playwright journey, desktop (1280×800) **and** mobile (390×844), against a real `npm run build && npm start` | ✅ Full event → community → need → BRIDGE → draft project: activity detail → "Organized by" community link → community page's "💡 BRIDGE" callout → proposal detail (who/why/mutual benefit/required resources/what next all present) → `/needs`'s "See BRIDGE proposal" link → signed in as the AI klub's organizer → Accept → real draft `Project` created and shown with a real volunteer count. Verified on both viewports, zero console/page errors. |

### Limitations (Phase 5 scope, by design)

- BRIDGE scoring uses each community's own activities' interest tags as the
  closest proxy this schema has for "capabilities" — there's no dedicated
  `Skill` model. Documented as a deliberate simplification, not a gap.
- Human matching has no in-app messaging beyond a single free-text
  connection-request reason and an accept/decline — no threaded
  conversation. Consistent with Phase 4's "no external messaging
  dependency, a simple in-app inbox suffices" scope.
- The network graph is a basic two-column SVG layout (needs vs.
  communities), not a force-directed graph — deliberately simple given the
  dataset's small scale (a handful of active proposals at a time).

## Phase 6 — Useful AI assistant, natural language discovery, and honest fallbacks

**Status: Complete.**

### Implemented

- **Typed intent parser** (`src/lib/assistant/intent-parser.ts`, pure,
  independently unit-tested): deterministic keyword/substring matching —
  not natural-language understanding, and stated as such in the UI —
  extracting category, weekday/weekend, accessibility, "near me," an
  out-of-scope city, and up to two real community mentions (for a BRIDGE
  question), across English and a documented set of Albanian phrasings
  covering the three demonstration journeys exactly. A genuinely ambiguous
  query (empty, or a bare greeting) asks for clarification instead of
  guessing; a longer query with no matched keyword still runs as a general
  activity search rather than refusing.
- **Deterministic, grounded responder** (`src/lib/assistant/respond.ts`,
  server-only): the always-available baseline — reuses
  `listActivities`/`scoreActivities` (Phase 3), `listMatches` (Phase 5),
  and `regenerateBridgeProposals`/`listBridgeProposals` (Phase 5) directly,
  so every fact in a response is a real, freshly-queried record — nothing
  is invented, and authorization/eligibility are enforced by those same
  modules, never assumed from the parsed query. An out-of-scope city says
  so honestly. No results says so honestly, with a link to adjust filters
  on `/discover`. A canceled activity is excluded by `listActivities`
  itself (queries only `PUBLISHED`); a genuinely past activity, if it's the
  only match, is shown labeled "already happened," never presented as if
  upcoming.
- **AI provider hook** (`src/lib/assistant/ai-provider.ts`): OFF by default
  in this environment — no `ASSISTANT_AI_PROVIDER`/`ASSISTANT_AI_API_KEY`
  is configured, and none is required; every verified path in this
  repository uses only the deterministic responder. The hook is real and
  documented (config detection, a shape-validating response parser, a
  timeout constant, a fail-safe stub that throws a clearly-labeled error
  rather than fabricating a call this environment can't verify) — not
  vaporware, but also not a working outbound integration, since no key or
  guaranteed network access exists here. If ever enabled, its output would
  still be shape-validated and would still need to pass through the same
  authorization/eligibility checks as the deterministic path before
  rendering.
- **Assistant UI** (`/assistant`): a plain GET form (`?q=`, shareable/
  bookmarkable like Discover's filters), four example prompts (the three
  demo requests + one Albanian variant), a visible
  "Rules-based demo response (no AI provider configured)" badge, and
  direct links into the real underlying records (activity pages, `/bridge/
  [id]`, `/discover` with the parsed filters applied, `/people`).
- **Organizer draft-event helper**: when the signed-in viewer organizes a
  real community and the query implies a category, the response includes a
  prefilled-but-editable link to `/communities/[slug]/activities/new` —
  wired through `ActivityForm`'s existing `defaults` prop (Phase 4) via
  query-string prefill, not a new form. The organizer still reviews and
  submits it themselves, and it still starts `DRAFT` pending moderator
  publish (Phase 4's policy, unchanged) — nothing is auto-created or
  auto-published. The BRIDGE side of "organizer assistance" is the
  existing `/bridge/[id]` edit form itself (Phase 5) — the assistant's job
  there is only to point at the real generated proposal, not build a
  second composer.

### How to run

Unchanged — no new required environment variables. Optional:
`ASSISTANT_AI_PROVIDER` / `ASSISTANT_AI_API_KEY` (undocumented-elsewhere,
intentionally inert in this build — see `src/lib/assistant/ai-provider.ts`).

### Verification results

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | ✅ 0 errors. |
| `npm run build` (`next build --webpack`) | ✅ Compiles, typechecks, generates all 25 routes. |
| `npx eslint .` | ✅ 0 errors, 0 warnings. |
| `npm test` (82 tests, `node --test` via `tsx`, `--test-concurrency=1`) | ✅ 82/82 pass, including 17 new: intent extraction for all three demo requests in English plus Albanian phrasing, an out-of-scope city, and ambiguous-query clarification (`tests/assistant-intent.test.ts`); grounded responses for all three demo requests against real seeded data, out-of-scope handling, an impossible-filter no-results case, ambiguous-query clarification, canceled-activity exclusion + past-activity honest labeling, provider-off confirmation, and an end-to-end assistant search → real RSVP (`tests/assistant-respond.test.ts`). |
| Playwright journey, desktop (1280×800) **and** mobile (390×844), against a real `npm run build && npm start` | ✅ All three demo requests verified live: accessible-activity search returns only real accessibility-tagged activities with a working Discover link; the BRIDGE question links to the real, highest-ranked AI klub + environment proposal; the "meet people" request, signed in as Arta, surfaces the real Drin match with no email/private field ever rendered. Out-of-scope city handled honestly. End-to-end assistant search → real RSVP → cancel verified. Re-verified the full Phase 5 event → community → need → BRIDGE → draft project journey still works unchanged. Zero console/page errors on both viewports. |

### Limitations (Phase 6 scope, by design)

- The parser is deterministic keyword/substring matching, not grammatical
  understanding — stated in the assistant UI itself, not hidden. It won't
  handle phrasing outside its documented keyword lists gracefully beyond
  falling back to a general activity search.
- No AI provider is actually wired to a live endpoint in this environment
  (no key, no guaranteed outbound network access) — the integration point
  is real and documented but intentionally inert, per the brief's
  requirement that the app work fully without one.
- The organizer draft-event helper prefills only title/category, not a
  full slot-extracted event (date/time/venue) — those are quick manual
  edits in the existing, already-validated `ActivityForm`.

## Phase 7 — Municipality intelligence with defensible privacy

**Status: Complete.**

### Implemented

- **Pure, documented aggregation core** (`src/lib/data/municipality-aggregation.ts`,
  no `server-only`, independently unit-tested): the entire privacy boundary
  lives here — if a rule is enforced in this module, no page or future API
  path can bypass it, because there is no separate "raw list" or "export"
  function anywhere else that reads `CommunityNeed`/`NeedSupport` rows.
  - **Small-cell suppression**: real demand = distinct contributors (a
    need's submitter + its supporters, deduplicated) per (area, category).
    Below `MIN_DISTINCT_CONTRIBUTORS` (3, documented in the module), a
    cell is `{ kind: "suppressed" }` — never a number, never a near-exact
    range.
  - **No derivable totals (differencing)**: this module has no function
    that sums per-category cells into an area or grand total — verified by
    a test that inspects the module's actual export surface, not just a
    numeric trick. Any total a page might want must be its own independent,
    equally-suppressed aggregation.
  - **A suppressed cell never ranks**: `topGaps` filters to disclosed
    values only — a suppressed cell's absence from a "top gaps" list is
    the point; its presence at any rank would itself leak information.
  - **Real supply is never suppressed** — a published activity is public
    by definition.
- **Synthetic scenario dataset** (`MunicipalityScenarioDemand` — no
  relation to `User` at all, structurally incapable of identifying anyone):
  the brief's requirement 4, satisfied without fabricating individual
  accounts. Seeded with the exact "several simulated requests for youth
  technology activities and relatively few relevant events" story — 14
  simulated requests vs. 1 real published activity in Dardania/technology
  (gap 13) — always rendered in its own clearly-labeled "Scenario
  projection" section, never blended with the real, privacy-governed
  numbers.
- **`/municipality` dashboard**: demand/supply comparison (real +
  scenario, kept structurally distinct types so they can't be
  accidentally interchanged), top gaps, a "How this is computed" method/
  denominator explanation (including the differencing mitigation, stated
  in plain language), known public places (`listCandidateSpaces` — real
  seeded venues with real scheduled-activity counts, never called
  "underused" without evidence, phrased as "candidate space in this
  scenario"), and an editable recommendation
  (`MunicipalityRecommendationNote`, analyst-authored free text tied to an
  area/category — explicitly phrased "Suggestion for human review," never
  auto-creates a real `Activity`/`Project`). A simple colored-cell "heat"
  table doubles as its own accessible alternative — one coherent
  structure, not a color-only chart with a separate fallback.
- **Real seed data demonstrates suppression working both ways**: the
  environment/Dardania need now has 4 distinct real contributors
  (Fatlume + Arta + Drin + Yll) and clears the threshold — shown as a real
  number; the youth-technology/Dardania need has 1 contributor and stays
  suppressed. Both from real, already-seeded personas — no new fake
  accounts were created to demonstrate this.
- **Access boundary unchanged from Phase 2**: `requireRole("MUNICIPALITY_ANALYST")`,
  same pattern as every other role gate in this app. A regular member is
  denied with a clear message, not a silent redirect. There is no
  alternate API path, filter, export, or URL anywhere that returns
  individual `CommunityNeed`/`NeedSupport` rows to any role — the
  aggregation module is the only read path, and it never returns one.

### How to run

`npm run db:migrate` picks up the Phase 7 migration
(`MunicipalityScenarioDemand`, `MunicipalityRecommendationNote`); `npm run
db:seed` seeds the synthetic scenario rows and the additional real
supporters. No new environment variables.

### Verification results

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | ✅ 0 errors. |
| `npm run build` (`next build --webpack`) | ✅ Compiles, typechecks, generates all 25 routes. |
| `npx eslint .` | ✅ 0 errors, 0 warnings. |
| `npm test` (99 tests, `node --test` via `tsx`, `--test-concurrency=1`) | ✅ 99/99 pass, including 17 new: `suppressCount`/`computeRealDemandCells` small-cell suppression (including cross-need deduplication and "the small number never appears in the output at all"), a structural differencing test (no total-computing export exists, and a 3-category/1-suppressed scenario can't be reconstructed from the returned rows), `topGaps` excluding every suppressed row, scenario rows staying a distinct type (`tests/municipality-aggregation.test.ts`); DB-level confirmation that the real seed data discloses the environment cell and suppresses the technology cell exactly as designed, that no municipality function ever returns a need's free text or submitter id, that the scenario projection reproduces the core demo story, and that the editable recommendation persists and attributes correctly (`tests/municipality.test.ts`). |
| Playwright journey, desktop (1280×800) **and** mobile (390×844), against a real `npm run build && npm start` | ✅ Signed out → prompted to sign in (not silently denied). Signed in as a regular member → "Access denied." Signed in as the analyst → full dashboard: demo-data badge prominent, scenario projection shows the 14-vs-1 (gap 13) youth-tech story, real demand section shows one disclosed cell (4) and one suppressed cell, method explanation present (including the word "differencing"), known public places list present with no item labeled "underused," no raw need description or submitter name anywhere on the page, and the editable recommendation textarea saves and re-displays the analyst's own edited text with correct attribution. Verified on both viewports, zero console/page errors. |

### Limitations (Phase 7 scope, by design)

- A suppression threshold is a documented, defensible mitigation, not a
  formal anonymity guarantee — stated on the page itself, not just in
  docs. Someone with outside knowledge of a small area could still narrow
  things down.
- The "heatmap" is a colored table, not a geographic choropleth over real
  map boundaries — this prototype has no GeoJSON area boundaries to
  render against, and a coarse area-string grid is the honest
  equivalent at this data's actual resolution.
- The synthetic scenario dataset covers 3 area/category cells — enough to
  demonstrate the story and the suppression mechanism side by side, not an
  exhaustive city-wide dataset.
- The editable recommendation is scoped to one area/category at a time
  (the current top scenario gap) — a future phase could let the analyst
  browse and draft for any cell, not just the headline one.

## Phase 8 — Integration, accessibility, security, deployment readiness (final)

Phase 8 audited every route and public action, fixed the real problems it
found (not just documented them), ran a full WCAG 2.2 AA accessibility
scan, re-verified the whole toolchain, and produced the final judge-facing
docs. No new features — this phase touches only correctness, safety, and
polish of what Phases 1–7 already built.

### What was audited, and what was actually fixed

- **Stale landing-page copy** (`src/app/page.tsx`): the homepage still
  claimed "This prototype currently implements Phase 1 of an eight-phase
  build" and had a Phase-1-era 4-step journey, while Phases 2–7 had long
  since shipped communities, BRIDGE, human matching, and municipality
  intelligence. Rewritten as a live, server-rendered page: real activity/
  community/BRIDGE counts from the database, a 5-step journey through the
  full app, and a third stats card (`bridgeProposals.length`) linking to
  `/bridge`. `src/components/SiteFooter.tsx`'s "Phase 4" tag was removed
  the same way — grep confirms no user-visible "Phase N" string remains
  anywhere in `src/app` or `src/components` (only design-rationale code
  comments, which are fine).
- **Real dead link in production**: `/login` linked to `/dev-login` for
  "the persona list (development only)," but `/dev-login` calls
  `notFound()` whenever `NODE_ENV === "production"` (by design — see
  `src/lib/auth/dev-guard.ts`). In a real `npm start` build that link led
  to a raw framework 404 with no explanation. Fixed: `src/app/login/page.tsx`
  now only renders the `/dev-login` link outside production; in
  production it points to `docs/DEMO_DATA.md` / `docs/DEMO_RUNBOOK.md`
  instead.
- **Unhandled crash on empty report submission**: the "Report" forms on
  `/needs` and `/people` had no `required` attribute on the reason input.
  `reportNeed`/`reportUser` (`src/lib/data/needs.ts`, `src/lib/data/people.ts`)
  correctly throw `Error("A reason is required.")` for an empty reason,
  but with no client-side guard that throw surfaced as an uncaught
  "Minified React error #441" in the browser — confirmed reproducible via
  Playwright against a real `npm run build && npm start`, then fixed by
  adding `required` to both inputs (matching the pattern already used on
  `/discover/[slug]`'s report textarea). Re-verified: the error no longer
  occurs.
- **Missing accessible names**: three placeholder-only text inputs (report
  reason on `/needs`, report reason on `/people`, resolution note on
  `/moderation`) had no programmatic label. Added `aria-label` to each.
- **Bounded input on every public action**: no free-text field anywhere
  had a length limit — a genuine "rate limits or bounded inputs on public
  actions" gap. Added `src/lib/validation.ts` (`assertBoundedText`,
  `MAX_SHORT_TEXT` = 500, `MAX_LONG_TEXT` = 5000) and wired it into every
  data-access function that writes free text from a signed-in member:
  `reports.ts`, `needs.ts`, `people.ts`, `profile.ts`, `communities.ts`,
  `organizer-activities.ts`, `projects.ts`, `municipality.ts`. See
  `docs/ARCHITECTURE.md` "Phase 8 — input bounding" for the full list.
- **Nav overflow at tablet width**: the desktop nav's `sm:` (640px)
  breakpoint held 7 links (Discover, Communities, Needs, BRIDGE, People,
  Assistant, Interests) plus account controls — genuinely too many for a
  640–1024px viewport. Moved the breakpoint to `lg:` (1024px) and removed
  the redundant `/onboarding` ("Interests") nav link (onboarding is
  reachable from the homepage CTA and `/discover`'s "Edit interests"
  link, so the nav entry was pure duplication) in `src/components/SiteHeader.tsx`.
- **Three real WCAG 2.2 AA violations**, found by an automated `axe-core`
  scan (the same engine ESLint's `jsx-a11y` plugin already depends on,
  run directly via Playwright against a real production build) across 14
  routes and fixed:
  1. `aria-pressed` on `<a>` elements — invalid ARIA (that attribute is
     only allowed on `role="button"` elements, and these are real
     navigating links). Changed to `aria-current` on the Discover
     category filter chips (`src/app/discover/page.tsx`).
  2. Insufficient color contrast (light mode only — dark mode already
     passed) on the demo badge text (`--accent-strong` on
     `--accent-tint`, 3.32:1) and the "N spots left" badge
     (`--success` on `--success-tint`, 4.34:1), both below the 4.5:1
     required for 12px text. Darkened `--accent-strong` to `#8f5406`
     (5.18:1) and `--success` to `#2a7047` (5.16:1) in
     `src/app/globals.css`; dark-mode tokens were already well above
     threshold and untouched.
  3. `<dt>`/`<dd>` elements outside a `<dl>` ancestor on
     `/discover/[slug]` (the whole info-row grid was a `<div>`, not a
     `<dl>`) and `/communities/[slug]` (the "Rules" row sat in its own
     `<div>` after the `<dl>` closed instead of inside it). Fixed both to
     valid `<dl>` markup.
  - Re-scanned all 14 routes after the fixes: **zero violations**.

### What was checked and found already correct (documented, not re-fixed)

- No `dangerouslySetInnerHTML` anywhere in `src/`.
- No arbitrary demo role elevation reachable in production — `/dev-login`
  and `devLoginAction` both refuse outside `NODE_ENV !== "production"`
  (defense in depth, tested in `tests/auth.test.ts`).
- No cross-account editing — every mutating data-access function checks
  `actorId` against the resource's real owner/organizer server-side, never
  trusting client-supplied ids alone (`ProfileAuthorizationError`,
  `CommunityAuthorizationError`, `assertCommunityOrganizer`, etc.).
- Role gates (`requireRole`) correctly deny a member on `/moderation` and
  `/municipality` with a clear message, not a silent redirect or a crash
  — re-verified live for a Member, a Moderator, and a Municipality
  Analyst persona.
- Reporting/moderation path (file a report → it appears at `/moderation`
  → a moderator resolves it) still works end to end after the input-
  bounding and `required`-attribute changes.
- No exact private location or individual-level municipality data is ever
  rendered or logged — re-confirmed via the existing suppression test
  suite (`tests/municipality-aggregation.test.ts`, `tests/municipality.test.ts`)
  plus a live axe/Playwright pass over `/municipality` as the analyst.
- Locale pairing (`labelSq`/`titleSq`/`descriptionSq`, `lang="sq"` spans)
  is present everywhere it was in Phase 1–7; nothing broke it.
- No reduced-motion-sensitive animation exists to gate — the map has no
  scripted camera moves beyond MapLibre's own default interaction
  handling, and no other component animates on a timer.

### Verification results

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | ✅ 0 errors. |
| `npx eslint .` | ✅ 0 errors, 0 warnings. |
| `npm run build` (`next build --webpack`) | ✅ Compiles, typechecks, generates all 25 routes. |
| `npm test` (99 tests) | ✅ 99/99 pass — unchanged by Phase 8 (no test behavior was touched, only markup/validation/copy). |
| Playwright smoke, desktop (1280×800) **and** mobile (390×844), all 10 top-level routes | ✅ Zero console/page errors, against a real `npm run build && npm start`. |
| Playwright authenticated journey (login → account → needs report form → people report form → moderation access-denied → logout → session cleared) | ✅ All pass; the empty-report-submit crash reproduced once, was fixed, then re-verified clean. |
| Playwright role journey (Moderator sees moderation queue; Municipality Analyst sees the dashboard; a Member is denied on both; BRIDGE detail loads; RSVP toggles on and back off on a future-dated activity) | ✅ All pass, zero console/page errors. |
| `axe-core` 4.13 WCAG 2.2 A/AA automated scan, 14 routes (including two dynamic detail pages), authenticated as a Member | ✅ 0 violations after fixes (3 real violations found and fixed first — see above). |

### Limitations (Phase 8 scope, stated plainly — not re-litigated)

- **SQLite, not PostgreSQL** — a deliberate environment substitution from
  Phase 2 on (no Postgres/Docker available here), via
  `@prisma/adapter-better-sqlite3`. Behaviorally equivalent for this
  prototype's needs; a real deployment would restore PostgreSQL.
- **Vitest could not run** in this environment (a Windows Application
  Control policy blocks its native `@rollup/rollup-win32-x64-msvc`
  binary) — `npm test` uses Node's built-in test runner instead, with no
  loss of coverage.
- **Webpack, not Turbopack** — pinned since Phase 1 due to a MapLibre
  worker-bundling incompatibility with Turbopack; revisit when upstream
  resolves it.
- **No deployment target is configured.** No Vercel project, no other
  hosting, no live preview URL exists for this repository in this
  environment. The judge-facing demo path is `npm run build && npm start`
  (or `npm run dev`) against the seeded local SQLite database — see
  `docs/DEMO_RUNBOOK.md`. This is stated plainly rather than a public URL
  being invented.
- **Axe-core's automated scan is not a substitute for a full manual audit**
  — it catches unambiguous WCAG violations (contrast ratios, invalid ARIA,
  malformed semantic markup) but not judgment calls like reading order or
  the genuine usefulness of an alt text. What it found was fixed; a fuller
  manual pass is future work, not a Phase 8 gap being hidden.
- Every Phase 1–7 "Limitations" entry earlier in this document still
  applies and was deliberately left as-is (small-cell suppression is a
  documented mitigation not a formal guarantee, no marker clustering with
  only 6 seeded activities, no rich text/image uploads, etc.) — Phase 8
  triaged that list and found nothing there that was actually a bug
  rather than a stated design choice.

**Project status: all 8 phases complete.** See `docs/FINAL_STATUS.md` for
the full implemented/simulated/deferred breakdown and residual-risk
summary, and `docs/DEMO_RUNBOOK.md` for the judge walkthrough.
