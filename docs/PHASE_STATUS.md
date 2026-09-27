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

### Phase 3 starting point

Read `docs/PRODUCT_CONTRACT.md`, `docs/ARCHITECTURE.md` (especially
"Database" and "Authentication"), and `docs/DEMO_DATA.md` (persona roster)
before starting. Concretely, Phase 3 can build directly on:

1. `src/lib/data/activities.ts` (`listActivities`, `getActivityBySlug`) —
   already server-only, already querying Prisma with category/interest
   filters. Extend `ActivityFilters` with date/time, free/paid,
   indoor/outdoor, accessibility, age eligibility, group size, and
   difficulty filters directly on this module; the `/discover` page just
   needs more `searchParams` wiring, not a new data layer.
2. The recommendation function Phase 3 requires can live alongside
   `listActivities` and reuse `getUserInterests` (`src/lib/data/interests.ts`)
   — a signed-in user's saved interests are already real rows, not a
   client-only guess.
3. RSVP/cancel (`src/lib/data/rsvp.ts`) already has the capacity-checked,
   transactional behavior Phase 3's "activity detail pages ... allow a
   member to RSVP and cancel" step asks for — Phase 3 mainly needs to keep
   using it as filters get richer.
4. `Activity.lat`/`lng` are already real columns queried by
   `listActivities` — a bounding-box or area filter is a `where` clause
   away, no schema change needed.
