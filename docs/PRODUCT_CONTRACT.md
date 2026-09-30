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

**Phase 2 implemented**: a persisted, migrated schema behind that same
journey; email/password accounts with server-signed session cookies; real
RSVP with transactional capacity checks; role-based authorization
(member/organizer/moderator/municipality analyst) enforced at the
data-access layer; server-persisted onboarding interests for signed-in
members; a basic safety baseline (report a concern → moderator queue).

**Phase 3 implemented**: the full discovery filter set (category, area,
cost, indoor/outdoor, accessibility, age eligibility, difficulty,
weekday/weekend — every one backed by real seeded data, never a
promised-but-unsatisfiable option); a transparent, documented relevance
score with honest per-activity reasons and a deterministic soonest-first
fallback; opt-in "Near me" distance ranking; a map with a configurable tile
source, auto-fit viewport, and marker encoding that is never color-only
(glyph + legend); real handling for canceled/past activities.

**Phase 4 implemented**: real community membership (join/leave,
public-immediate vs. restricted-pending-approval, never silent access);
organizer creation/editing of communities and events with a real
moderation/publishing policy (new organizer content starts hidden until a
moderator publishes it — never instantly trusted); projects with real
volunteer sign-up counts and no fabricated hours; community needs with
duplicate-prevention (support instead of resubmit) and a submitter who is
never public; event check-in / organizer-confirmed attendance, kept
separate from RSVP and gated by a documented **simulated clock** (see
`docs/ARCHITECTURE.md`) so "has this happened yet" is demonstrable inside
the fixed fictional 2036 calendar; an Impact page deriving everything from
real stored actions (no follower/popularity counts, no estimated hours);
and a simple in-app notification inbox for useful state changes (RSVP
confirmed, an organizer changed or canceled an event).

**Phase 5 implemented**: BRIDGE — deterministic, explainable collaboration
proposals generated from real communities and a real, currently-open
community need, each showing source records, a documented "why," mutual
benefit, required resources, and a suggested next action; only a human
organizer of one of the two proposed communities can save, edit, accept
(which creates a real draft `Project`), or decline — nothing is
auto-messaged to another community. Human matching for consenting adult
demo profiles only (opt-in, defaults off, requires a named mutual basis,
supports block/report, never exposes exact location or private contact
info).

**Phase 6 implemented**: a typed, deterministic search-intent assistant
(`/assistant`) that answers the three demonstration requests (meet people
by interest/day, find an accessible activity, ask how two communities
could collaborate) by querying the same real data modules Discover/
People/BRIDGE already use — every fact is real, nothing invented,
authorization/eligibility re-checked by those modules. Works fully without
any AI provider key (none is configured in this environment); an optional
provider hook exists, documented and off by default. An organizer
draft-event helper prefills the existing event-creation form from a parsed
query — the organizer still reviews and submits.

**Phase 7 (this phase) implements**: municipality intelligence with
defensible privacy — a demand/supply gap dashboard derived from real,
small-cell-suppressed community-need/support records and real published-
activity supply, paired with a separate, explicitly-labeled **synthetic
scenario dataset** (no relation to any user account, ever) that makes the
"several simulated youth-technology requests vs. few real events" story
demonstrable without fabricating individual accounts. A documented
method/denominator explanation, a structural mitigation against
differencing attacks (no derivable totals), known public places (never
called "underused" without evidence), and an editable, human-review-only
recommendation. The full Phase 8 integration/accessibility/deployment pass
remains — see "What's deferred" below.

## Audience & roles

The audience includes a judge seeing the app for the first time and a user on
a phone. The full role model (defined here, implemented incrementally):

| Role | Can do |
| --- | --- |
| Visitor | Browse onboarding, discover activities, view activity/community detail, use the assistant (signed out). No account required. |
| Member | Everything a visitor can, plus RSVP, join communities, volunteer on projects, submit/support needs, opt into human matching, save/accept/decline BRIDGE proposals for communities they organize (Phase 2–5). |
| Organizer | Everything a member can, plus create/edit their own communities and events, review pending join requests, confirm attendance, decide BRIDGE proposals for their community (Phase 4/5). Any member can become one by creating a community. |
| Moderator | Process reports (activities, needs, and people as of Phase 5) and safety flags, publish pending organizer-created communities/events (Phase 2/4). |
| Municipality analyst | Aggregate-only, small-cell-suppressed demand/supply gaps; never identifiable user records; can edit their own draft recommendation text (Phase 7). |

Phase 2 implements all five roles as real accounts (`Role` enum in
`prisma/schema.prisma`) with server-enforced checks in `src/lib/data/*` and
`src/lib/auth/current-user.ts` (`requireUser`/`requireRole`) — never only in
the UI. Visitors still see the full discovery journey with no account.
Members get RSVP, editable interests, their own profile, community
membership, project volunteering, and need submission. As of Phase 4,
"organizer" is also a **per-community** capability (`Membership.role =
ORGANIZER`), not only the global `Role.ORGANIZER` enum value — any signed-in
member can start a community and immediately organize it, subject to the
moderator publish gate. Moderator UI now includes a real publishing queue
alongside reports. Municipality-analyst UI is now the full Phase 7
demand/supply/suppression dashboard (the area-level small-cell-suppressed
gap analysis and synthetic scenario projection the scope document
anticipates) — see `/account`, `/moderation`, `/municipality`,
`/communities`.

## Non-negotiable boundaries (apply to every phase)

- No invented real municipal findings.
- No public exact user locations — only public venue coordinates for seeded
  activities are ever shown on the map.
- No direct stranger matching for minors. The one minor-eligible seeded
  activity (`Coding Club for Teens`) is explicitly supervised and non-social.
- No private user data in the city dashboard — enforced at the aggregation
  layer itself (`src/lib/data/municipality-aggregation.ts`, Phase 7):
  small-cell suppression, no derivable totals, supply-only exact numbers.
- No popularity score, no follower count, no "most liked person."
- No fake AI claims — the assistant (Phase 6) visibly labels itself
  "Rules-based demo response (no AI provider configured)" whenever no
  provider is configured, which is the state in this environment; nothing
  claims a model produced a response that didn't.
- AI never decides who someone must meet, never ranks a person's social
  value, never exposes a private field or exact location, and never makes
  a municipal decision (Phase 6) — the assistant only surfaces real,
  already-authorized records from the same modules the rest of the app
  uses.
- Human matching (Phase 5) is opt-in, adult-consenting-only, defaults off,
  and never exposes exact location or private contact info — see "Human
  matching" in `docs/ARCHITECTURE.md`.
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

## What's deferred (and why that's fine, project-wide)

Phase 8 (final) completed the integration/accessibility/security/
deployment-readiness pass: it audited every route for stale copy and dead
links (found and fixed two real ones — see `docs/PHASE_STATUS.md`
"Phase 8"), added bounded-length validation to every free-text public
action (`src/lib/validation.ts`), fixed three real WCAG 2.2 AA violations
found by an automated `axe-core` scan across 14 routes (now zero
violations), and re-verified the full toolchain end to end. See
`docs/FINAL_STATUS.md` for the complete implemented/verified/deferred
breakdown and `docs/DEMO_RUNBOOK.md` for the judge-facing walkthrough.
The items below remain deliberately out of scope for this prototype:

- **Volunteer hours** — deliberately never tracked, in any form, anywhere
  (see "Non-negotiable boundaries" and `docs/ARCHITECTURE.md`'s Attendance
  note) — not a gap to close later, a permanent design choice to avoid
  fabricated or unverifiable impact figures.
- **Rich text / image uploads** for organizer-authored communities and
  events — plain text fields only, matching this prototype's design
  throughout.
- **Marker clustering** — only 6 seeded activities exist; nothing to
  cluster yet. Revisit if a later phase grows the seeded activity count.
- **Production tile provider account** — the configurable style URL
  (`NEXT_PUBLIC_MAP_STYLE_URL`, Phase 3) still defaults to MapLibre's public
  demo style; swapping in a paid/production tile provider is a config
  change, not a code change, whenever that becomes necessary.
- **A live AI provider integration** — the hook exists and is documented
  (`src/lib/assistant/ai-provider.ts`) but is intentionally inert (no key,
  no guaranteed outbound network access in this environment); the
  deterministic assistant is what every verified path actually uses.
- **A dedicated `Skill` model for BRIDGE** — capability matching currently
  proxies through each community's own activities' interest tags.
- **A geographic choropleth for municipality data** — the current
  "heatmap" is a colored table over coarse area strings; no real GeoJSON
  boundaries exist in this prototype to render a true map-based one
  against.
- **Formal anonymity guarantees for municipality suppression** — the
  small-cell threshold and no-derivable-totals rule are documented,
  defensible mitigations, stated as such on the page itself, not a
  cryptographic or legal guarantee.

## Phase 9 additions (friends, plans, messages, demo access)

* **Demo friends are fictional and never live.** They cannot accept, reply or
  react in real time. Any status a demo friend "gives" is either a seeded
  example (labeled) or the visible availability rule (labeled "simulated
  reply"). The assistant never claims an action happened.
* **Friend suggestions need a mutual basis** (shared interest, community or
  project) and respect consent (`isDiscoverable`) and blocks. Blocking ends a
  friendship. Messages exist only between friends and are bounded and
  rate-limited.
* **One-click demo access is always an ordinary member**, isolated per visitor
  and purged after 24 h. Privileged roles are never reachable without a
  private password; no password is published in production.
* **No public sign-up and no email verification** in this prototype.
* **Illustrative photos** are labeled as such and credited; they never claim to
  depict a fictional event or a fictional person.
* **AI honesty.** Without a configured provider the assistant is rules-based
  and says so; with one, the model only rephrases server-supplied facts.

