# Product Contract — KOSOVO 2036 — HUMAN NETWORK

This document is the standing contract for the prototype: what it is, who it's
for, and the boundaries every future phase must respect. Read this before
Phase 2 onward.

## What this product is

A competition-grade, interactive web prototype imagining a Prishtina where
technology makes real-world human connection easier — not a production social
network. The primary interface is a **live social map**. The signature
feature is **BRIDGE**, which proposes useful collaborations between
communities. All content is **fictional, labeled 2036 demonstration data for
Prishtina** — nothing implies a real organization, activity, count, or city
finding.

## The complete planned journey (8 phases)

Onboarding → map/list discovery → event RSVP → community/project → BRIDGE
collaboration → community need → privacy-preserving municipality insight →
impact.

**Phase 1 implemented**: onboarding (interest selection) → map/list discovery →
activity detail, all against in-memory seed data.

**Phase 2 (this phase) implements**: a persisted, migrated schema behind that
same journey; email/password accounts with server-signed session cookies;
real RSVP with transactional capacity checks; role-based authorization
(member/organizer/moderator/municipality analyst) enforced at the data-access
layer; server-persisted onboarding interests for signed-in members; a basic
safety baseline (report a concern → moderator queue). Communities pages,
projects, needs, BRIDGE, the AI assistant, and the full municipality
dashboard remain deferred — see "What's deferred" below.

## Audience & roles

The audience includes a judge seeing the app for the first time and a user on
a phone. The full role model (defined here, implemented incrementally):

| Role | Can do |
| --- | --- |
| Visitor | Browse onboarding, discover activities, view activity/community detail. No account required. |
| Member | Everything a visitor can, plus RSVP, join communities/projects, submit needs (Phase 2+). |
| Organizer | Everything a member can, plus create/edit their own communities and events (Phase 2/4). |
| Moderator | Process reports and safety flags (Phase 2+). |
| Municipality analyst | Aggregate-only endpoints; never identifiable user records (Phase 7). |

Phase 2 implements all five roles as real accounts (`Role` enum in
`prisma/schema.prisma`) with server-enforced checks in `src/lib/data/*` and
`src/lib/auth/current-user.ts` (`requireUser`/`requireRole`) — never only in
the UI. Visitors still see the full discovery journey with no account.
Members get RSVP, editable interests, and their own profile. Organizer,
moderator, and municipality-analyst UI is a Phase 2 preview scoped to what
each role's data boundary requires (org-restricted actions and community
CRUD arrive with Phase 4; the full municipality dashboard arrives with
Phase 7) — see `/account`, `/moderation`, `/municipality`.

## Non-negotiable boundaries (apply to every phase)

- No invented real municipal findings.
- No public exact user locations — only public venue coordinates for seeded
  activities are ever shown on the map.
- No direct stranger matching for minors. The one minor-eligible seeded
  activity (`Coding Club for Teens`) is explicitly supervised and non-social.
- No private user data in the city dashboard (not built yet — Phase 7).
- No popularity score, no follower count, no "most liked person."
- No fake AI claims — Phase 1 ships no AI; nothing claims otherwise.
- Every screen that shows demo content carries the **"Simulated Prishtina
  2036 demo data"** badge (`DemoBadge` component, also in the footer).

A public launch involving minors or municipal data would require a separate
safeguarding, privacy, security, and legal review — this prototype does not
attempt that review and should never be presented as production-ready.

## Design system

- Map-first, warm-but-professional visual identity: deep blue brand color,
  warm amber accent, warm off-white background (see `src/app/globals.css`
  design tokens). Dark mode supported via `prefers-color-scheme`.
- Typography: Geist (body) + Space Grotesk (display/headings) via
  `next/font/google`.
- Albanian-first copy with English locale structure: every user-facing string
  pairs an English label with an Albanian translation (`labelSq`/`titleSq`
  fields, visible secondary text under headings).
- Accessibility baseline: skip-to-content link, visible focus rings
  (`:focus-visible`), `prefers-reduced-motion` support, keyboard-operable
  category filters and interest picker, map view always paired with a fully
  equivalent, keyboard-navigable list view.
- No fabricated photographs or testimonial quotes anywhere in the UI.

## Stack decision

Next.js 16 (App Router, Webpack — see `docs/ARCHITECTURE.md` for why
Turbopack was rejected) + TypeScript + Tailwind CSS v4 + MapLibre GL JS +
Prisma ORM 7. Demo data lived in-memory in `src/lib/demo-data.ts` for
Phase 1; Phase 2 migrates it into a Prisma-managed **SQLite** database (a
deliberate, documented deviation from the scope's suggested PostgreSQL — no
Postgres server or Docker was available in this environment; see
`docs/ARCHITECTURE.md` "Database" for the full reasoning and how to switch)
without changing the Phase 1 UI contract — every component that rendered
`DemoActivity`/`DemoCommunity` shapes still does, now fed by a mapping layer
in `src/lib/data/mappers.ts` instead of the in-memory arrays.

## What's deferred (and why that's fine through Phase 2)

- **Community pages, organizer CRUD, projects, needs UI** — Phase 4. The
  underlying schema (`Community`, `Project`, `CommunityNeed`, `Membership`)
  already exists so Phase 4 only adds UI and mutations, not new tables.
- **BRIDGE** — Phase 5. `BridgeProposal` schema exists as a placeholder.
- **AI assistant** — Phase 6.
- **Full municipality dashboard** (area-level gaps, small-cell suppression)
  — Phase 7. Phase 2 ships only an aggregate-only category-count preview at
  `/municipality` to prove the analyst role boundary end-to-end.
- **Real map tile provider configuration** — Phase 1 uses MapLibre's public
  demo vector style (no key required); Phase 3 should evaluate a
  production-appropriate, configurable tile source per the scope's
  "permitted, configurable tile source" requirement.
