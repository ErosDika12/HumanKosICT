# Final Status — Kosovo 2036: Human Network

All 8 phases complete. This document is the single source of truth for
what's real, what's simulated, what's deferred, and what was verified —
written at the close of Phase 8 (integration, accessibility, security,
and deployment readiness). See `docs/DEMO_RUNBOOK.md` for the judge
walkthrough and `docs/PHASE_STATUS.md` for the full phase-by-phase build
history.

## Implemented (real, working, verified)

- **Onboarding & discovery**: interest picker; Discover list + map view
  with 8 independent filter facets; a real, explained recommendation
  score (never opaque); real-time RSVP with capacity enforcement and
  idempotent toggling.
- **Accounts, roles, and persistence**: email/password auth (Phase 2),
  4 roles (Member/Organizer/Moderator/Municipality Analyst) enforced
  server-side on every gated route and action, Prisma/SQLite persistence
  for every model.
- **Communities & organizer tools**: create/edit communities and
  activities (start `DRAFT`, moderator-published), public vs. restricted
  (approval-gated) membership, projects with volunteering, community
  needs with duplicate-aware submission and support-toggling, organizer
  attendance check-in gated by the simulated clock, an Impact page
  derived only from real stored actions.
- **BRIDGE**: deterministic, fully explained cross-community
  collaboration scoring; the flagship AI-klub × environment-group
  proposal generated from real seeded data, not hardcoded; organizer-only
  edit/save/decline/accept, with accept creating a real draft Project;
  regeneration never overwrites a human decision; a proposal invalidates
  itself once its driving need resolves.
- **Human matching**: consent-gated (`isDiscoverable`) matching over
  shared interest/community/project participation only, blocking,
  reporting, and connect-request flow requiring a real mutual basis,
  checked server-side even if the client were bypassed.
- **Assistant**: a deterministic, grounded query layer over real
  Discover/BRIDGE/People data with honest "no results" and clarification
  behavior — never a fabricated answer. A real (but intentionally inert
  in this environment) AI-provider hook exists for a future live
  integration.
- **Municipality intelligence**: real aggregate demand vs. supply by
  area/category, small-cell suppression (threshold 3 distinct
  contributors) with no path to reconstruct a suppressed value, a
  separate and clearly labeled synthetic scenario dataset, an editable
  and attributed recommendation draft — all role-gated to the
  Municipality Analyst.
- **Cross-cutting (Phase 8)**: bounded-length validation on every public
  free-text action; three real WCAG 2.2 AA violations found and fixed
  (see below); a genuinely dead production link fixed; an unhandled-
  crash-on-empty-form-submit bug fixed; stale Phase-1 landing-page copy
  replaced with a live, accurate summary; nav restructured to not
  overflow at tablet width.

## Simulated / fictional (by design, always labeled)

- Every activity, community, project, need, person, and municipal number
  in the app is fictional demo data for a "Prishtina, 2036" scenario —
  see `docs/DEMO_DATA.md` for full provenance of every seeded row.
- The app runs on a fixed **simulated clock**
  (`SIMULATED_NOW_ISO = 2036-06-16`) so the fictional 2036 dates behave
  like a real "today" (past/upcoming/RSVP-closed logic all work against
  it) — visibly labeled on every page that depends on it.
- The municipality dashboard's synthetic scenario dataset
  (`MunicipalityScenarioDemand`) is structurally separate from real data
  (no relation to any `User` row) and always rendered in its own,
  explicitly-labeled section — never blended with the real, suppressed
  numbers beside it.
- The assistant's AI-provider integration point is real code but
  deliberately inert (no key configured) — every verified demo path uses
  its deterministic, grounded fallback.

## Deferred (explicitly out of scope, not hidden gaps)

- Volunteer-hour tracking — permanently out of scope to avoid fabricated
  or unverifiable impact figures (`docs/PRODUCT_CONTRACT.md`).
- Rich text / image uploads for organizer content — plain text only.
- A geographic choropleth for municipal data — no real GeoJSON area
  boundaries exist in this prototype; the current colored-table
  "heatmap" is the honest equivalent at this data's actual resolution.
- A dedicated `Skill` model for BRIDGE capability matching — proxied
  through each community's own activities' interest tags instead.
- A live AI-provider key and a production map-tile subscription.
- Marker clustering on the map — only 6 seeded activities exist.
- A formal (cryptographic/legal) anonymity guarantee for municipal
  suppression — the small-cell threshold is a documented, defensible
  mitigation, stated as such on the page itself.
- **A configured deployment target.** No Vercel project or other hosting
  was set up or attempted in this environment; there is no live preview
  URL. This is stated plainly rather than a URL being invented — the
  verified demo path is a local `npm run build && npm start`.

## Verification results (as of Phase 8 completion)

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | ✅ 0 errors |
| `npx eslint .` | ✅ 0 errors, 0 warnings |
| `npm run build` (`next build --webpack`) | ✅ compiles, typechecks, generates all 25 routes |
| `npm test` (Node's built-in test runner via `tsx`, 25 suites) | ✅ 99/99 pass |
| Playwright smoke journey, desktop (1280×800) + mobile (390×844), all top-level routes, against a real `npm run build && npm start` | ✅ zero console/page errors |
| Playwright authenticated journey (login, account, report forms, moderation access-denied, logout, session cleared) | ✅ pass (one real bug found and fixed mid-verification — see `docs/PHASE_STATUS.md` "Phase 8") |
| Playwright role journey (Moderator, Municipality Analyst, Member-denied, BRIDGE detail, RSVP toggle) | ✅ pass, zero console/page errors |
| `axe-core` 4.13 automated WCAG 2.2 A/AA scan, 14 routes including two dynamic detail pages, authenticated | ✅ 0 violations (3 real violations found and fixed first) |

No screenshots are included in this document — the verification above was
performed via headless Playwright against a real production build rather
than manual browser inspection with capture; the exact routes and
personas to reproduce it visually are listed in `docs/DEMO_RUNBOOK.md`.

## Residual risks (for a different deployment environment)

- **SQLite instead of PostgreSQL.** A deliberate substitution from
  Phase 2 on (no Postgres/Docker available here) via
  `@prisma/adapter-better-sqlite3`. Behaviorally equivalent for this
  prototype's scale; a real multi-writer production deployment should
  restore PostgreSQL.
- **Vitest could not run** in this environment (a Windows Application
  Control policy blocks its native `@rollup/rollup-win32-x64-msvc`
  binary, unrelated to `better-sqlite3` which loads fine) — `npm test`
  uses Node's built-in test runner instead, with no coverage loss.
- **Webpack instead of Turbopack** — pinned since Phase 1 due to a
  MapLibre worker-bundling incompatibility with Turbopack; revisit when
  upstream resolves it.
- **`axe-core`'s automated scan is necessary but not sufficient** for a
  full accessibility audit — it catches unambiguous violations (contrast,
  invalid ARIA, malformed semantic markup, which is exactly what it found
  and what was fixed) but not judgment calls like reading order, focus
  order under complex interaction, or whether an alt text is genuinely
  useful. A fuller manual pass with real assistive technology is future
  work.
- **No production secrets or deployment configuration exist** — `AUTH_SECRET`
  and `DATABASE_URL` in `.env.local` are local-dev-only values; a real
  deployment needs its own secret management, not a checked-in value.
