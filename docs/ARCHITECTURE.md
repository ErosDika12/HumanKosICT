# Architecture

## Stack

- **Framework**: Next.js 16.3.6, App Router, TypeScript, `src/` directory.
- **Bundler**: **Webpack**, not the Turbopack default. See "Turbopack vs
  Webpack" below — this was a forced decision, not a stylistic one.
- **Styling**: Tailwind CSS v4 (CSS-first config via `@theme inline` in
  `src/app/globals.css` — no `tailwind.config.js` in this version).
- **Map**: MapLibre GL JS v6, using MapLibre's public demo vector style
  (`https://demotiles.maplibre.org/style.json`) — no API key, no tile
  provider account. See "MapLibre worker fix" below for a real bundler
  incompatibility that had to be worked around.
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

## Routes

| Route | Type | Purpose |
| --- | --- | --- |
| `/` | Dynamic | Landing page, pitch, journey explainer, seeded-data counts. |
| `/onboarding` | Dynamic | Interest picker. Signed-in members persist to the DB (`saveInterestsAction`); signed-out visitors keep Phase 1's `localStorage` behavior. |
| `/discover` | Dynamic (reads `searchParams`) | Filterable activity list + map toggle, now querying Prisma. |
| `/discover/[slug]` | Dynamic | Activity detail + real RSVP/cancel/report actions. |
| `/login` | Dynamic | Judge-facing sign-in (seeded persona email + `Demo-2036!`). |
| `/dev-login` | Dynamic, dev-only (404 in production) | One-click persona switcher. |
| `/account` | Dynamic | Signed-in user edits their own bio/discoverability. |
| `/moderation` | Dynamic, moderator-only | Open reports queue. |
| `/municipality` | Dynamic, analyst-only | Aggregate-only category-count preview. |

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

- The interest→activity relevance matching in `/discover` is still a simple
  tag intersection, not the documented relevance score — Phase 3.
- The Webpack pin above should be revisited once MapLibre or Next.js resolve
  the worker-bundling incompatibility upstream.
- `/moderation` and `/municipality` are intentionally thin Phase 2 previews
  that exist to prove the role boundary works end-to-end, not the full
  Phase 4/7 features.
- Vitest could not run in this environment: a Windows Application Control
  policy blocks its native `@rollup/rollup-win32-x64-msvc` binary (unrelated
  to `better-sqlite3`, which loads fine). The test suite (`npm test`) uses
  Node's built-in test runner (`node --test`) via `tsx` instead — zero native
  dependencies beyond what the app itself already needs. See
  `tests/setup.ts`, `scripts/test-setup.ts`, and the `--conditions=react-server`
  flag in the `test` script (it makes plain Node resolve the `server-only`
  marker package to its no-op export, the same way Next's RSC bundler does).
