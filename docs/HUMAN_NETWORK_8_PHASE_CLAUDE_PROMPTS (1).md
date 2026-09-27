# KOSOVO 2036 — HUMAN NETWORK
## Scope review and eight sequential Claude Code prompts

Use these prompts **in order**, one at a time, in the project repository. Let Claude finish a phase, inspect its result, and only then paste the next prompt. The prompts are written so they also work in a fresh Claude session: each one tells Claude to read the repository's handoff files. If the original 38-page scope PDF is available to Claude, place it in the repository's `docs/` folder as `HUMAN NETWORK - Project Scope.pdf`; otherwise these prompts contain the essential requirements.

### Scope review: the decision that makes the project buildable

The scope has a compelling identity: **technology that makes real-world connection easier**, with a map as the main interface and **BRIDGE** as the signature cross-community feature. It covers 64 sections and an exceptionally large product: accounts, discovery, human matching, communities, events, projects, AI, moderation, municipal intelligence, accessibility, translations, and future smart-city integrations. Building all of this as a real production platform in a short competition window would make the experience shallow. Build a **credible, interactive Prishtina 2036 prototype** with a working end-to-end journey and clearly labeled fictional demonstration data.

**Core journey:** A user picks interests and availability → discovers a relevant local activity on a live map → joins it → sees its community and a useful collaboration proposed by BRIDGE → a community need contributes to an aggregated municipality insight → the municipality can inspect a suggested intervention. The data and explanation should connect across screens, so a judge sees one system rather than ten unrelated pages.

**Non-negotiable boundaries:** No invented real municipal findings; no public exact user locations; no direct stranger matching for minors; no private user data in the city dashboard; no popularity score; no fake AI claims. Use fictional personas and simulated data with a conspicuous **“Simulated Prishtina 2036 demo”** label. For a public launch involving minors or municipal data, a separate safeguarding, privacy, security, and legal review is required.

**Scope priority:**

| Build for the demo | Simplify honestly | Future roadmap only |
| --- | --- | --- |
| Onboarding, accessible map/list discovery, event RSVP, community membership, needs, BRIDGE, explainable suggestions, municipal aggregated insight, impact | Human matching as opt-in interest/skill compatibility among consenting adult demo personas; AI assistant with deterministic fallback; simple organizer tools and moderation | Voice, automatic translation, advanced social graph, real-time behavior detection, payment plans, nationwide challenges, transit and smart-city integration, sophisticated ML |

**Suggested stack, subject to the repository:** Preserve an existing viable stack. For a new project, use Next.js App Router, TypeScript, Tailwind CSS, PostgreSQL, a documented ORM, and MapLibre GL JS. Do not install a large backend or AI framework solely for a demo. Keep sensitive data access on the server, validate input, and check authorization on every read and mutation. Use Playwright for a small set of meaningful end-to-end journeys. The official Next.js, MapLibre, PostGIS, Playwright, OWASP, and WCAG documentation should guide exact implementation choices rather than pinned versions in a prompt.

---

## Phase 1 — Foundation, product contract, design system, runnable vertical slice

```text
You are the lead product engineer and designer for KOSOVO 2036 — HUMAN NETWORK, a competition-grade, interactive web prototype for Kosovo. Work in the current repository, not in a new unrelated folder. This phase must leave a runnable application and a coherent plan for seven subsequent phases.

PRODUCT CONTRACT
The product helps people form real-world connections, not collect followers. Its primary interface is a live social map. BRIDGE proposes useful collaborations between communities. For the demo, focus on Prishtina with fictional, labeled 2036 data. The complete planned journey is: onboarding → map discovery → event RSVP → community/project → BRIDGE collaboration → community need → privacy-preserving municipality insight → impact. The audience includes judges seeing the app for the first time and a user on a phone. Distinct roles: visitor, member, organizer, moderator, municipality analyst. Do not imply that fictional organizations, activities, counts, or city trends are real.

OPERATING RULES
1. Inspect the repository, package scripts, current UI, assets, README, tests, environment, and any AGENTS.md or project instructions. If the scope PDF is present, read it. Preserve working code and design conventions where viable. State the existing state and your implementation plan briefly, then implement it. Do not ask for routine choices or stop after planning.
2. Use the existing viable stack. If starting from a blank repo, create a Next.js App Router + TypeScript + Tailwind app; choose a simple database strategy that can persist the full demo by Phase 2. Explain the choice. Never hardcode secrets. Use environment examples, not real credentials. Do not add provider-dependent features to the critical demo path.
3. Treat security and privacy as architecture: server-side data boundaries, schema validation, role-aware APIs, a safe public projection of records, exact user coordinates private by default, and demo-only seeded identities. No public directory of minors or direct contact between a minor and an unrelated adult.
4. Keep one design system: a thoughtful map-first interface with human warmth, clear typography, excellent mobile navigation, high contrast, responsive layouts, visible focus states, and Albanian-first copy with English locale structure. Avoid generic admin dashboard styling on the user side. Do not fabricate photographs or testimonial quotes.
5. Implement a real vertical slice: app shell, compelling landing/entry, a short interactive interest onboarding, a seeded Discover page with at least a usable list and an activity detail, and a map view if the required tiles and environment are available. If a tile service is not configured, the list remains fully usable and the map explains the missing setup. Seed a small, internally consistent set of fictional Prishtina activities and communities. Clearly badge demo data on every relevant screen.
6. Store project decisions and a phase handoff in docs/PRODUCT_CONTRACT.md, docs/ARCHITECTURE.md, docs/DEMO_DATA.md, and docs/PHASE_STATUS.md. Define routes, roles, entity relationships, data provenance, demo story, privacy invariants, and what is deferred. Record commands and configuration needed to run locally.
7. Do not paper over failures with mock success. If infrastructure is unavailable, implement a documented, contained demo fallback with clear limitations. Keep the app runnable. Avoid page-only placeholders and dead buttons.

ACCEPTANCE CHECKS
- From a clean checkout, documented setup starts the app; typecheck/lint/build pass or you report precise blockers.
- A judge can select interests, view personalized seeded activity results, open a detail, and navigate between mobile-friendly map/list views.
- Visible demo labeling and consistent content make it impossible to mistake simulated city data for real findings.
- There is a concise phase handoff listing implemented files, commands run and their results, known issues, and the exact starting point for Phase 2.

End your answer with: (a) implemented, (b) how to run, (c) verification results, (d) limitations, (e) Phase 2 handoff. Do the coding now.
```

## Phase 2 — Persistent data, accounts, roles, permissions, and safety base

```text
Continue the KOSOVO 2036 — HUMAN NETWORK project in this repository. Read docs/PRODUCT_CONTRACT.md, docs/ARCHITECTURE.md, docs/DEMO_DATA.md, docs/PHASE_STATUS.md, and the code. Preserve the Phase 1 user journey. This phase turns the prototype into a coherent data-backed system. Do not rewrite the app or deliver a design proposal instead of code.

MISSION
Implement durable domain models and the permission rules required for discovery, communities, events, projects, needs, BRIDGE, and city analytics. The first screen and map/list must continue to work throughout the migration. Seed only fictional, internally consistent Prishtina 2036 records; keep the simulated-data notice visible.

DATA AND DOMAIN
- Establish a migration-based schema for users/profiles, interests/skills, social preferences, communities and memberships, events and RSVP/check-in records, projects, community needs, bridge proposals, public places/areas, reports, and audit-relevant moderation states. Create relationships, unique constraints, indexes, deletion rules, and deterministic seed/reset scripts. Use appropriate date/time representation and timezone display for Kosovo; do not mix UTC storage with naive local strings.
- A user should be able to revisit saved onboarding preferences. Define clear public, member-only, private, and aggregate projections. Public user profiles reveal only fields explicitly chosen for discovery. Never put private email, phone, precise live location, or sensitive preference fields into a public or municipality response.
- Implement a proper authentication flow using the existing project's provider if present; otherwise a reputable established authentication solution, with secure sessions. If external credentials are missing, use a strictly development-only seeded demo persona switcher or equivalent, guarded so it cannot be mistaken for deployed authentication. No shared production password, no mock login button that grants arbitrary real roles.
- Enforce authorization centrally and again at the relevant server access points. Members may edit their own profile and RSVPs. Organizers may change their own community/events. Municipality analysts receive only aggregate endpoints. Moderators may process reports. Try cross-account and cross-role access. Validate and constrain all input server-side, not just in the UI.
- Add a basic safety baseline: block/report controls or a well-scoped report workflow, content/status flags, capacity checks, and a clear rule that direct person matching is opt-in and adult-only in the demo. For the competition build, don't collect dates of birth unnecessarily. If teen features exist, limit them to supervised/institutional group activities without open stranger contact.

IMPLEMENTATION QUALITY
Keep data access in server-only modules and avoid fetching server data through an unnecessary same-app HTTP round trip. Use transactions where a join/cancel changes capacity. Handle empty, loading, and error states. Run migrations and seed on a clean local setup. Add focused tests for authorization, private projections, RSVP uniqueness/capacity, and seed consistency. Never silently fall back to stale hardcoded arrays after persistence is enabled.

PHASE EXIT
Demonstrate: onboarding data persists; member A cannot edit member B; a municipality account cannot request identifiable user records; a seeded demo account can see the same coherent activity records after refresh; the dev-only demo switcher cannot authorize a production request. Update the four docs, schema diagram or entity map, env example, and PHASE_STATUS with exact verification. Finish with the Phase 3 handoff. Implement now.
```

## Phase 3 — The map, discovery, recommendation, and accessible search

```text
Continue KOSOVO 2036 — HUMAN NETWORK in the existing repository. Read the four docs in docs/ and inspect the implemented app. Do not reset the database or replace the established design. This phase makes the map and discovery feel like the defining product experience.

GOAL
A user can answer “What can I do in Prishtina this weekend?” quickly and confidently. The live map and accessible list show the same filtered data and lead to the same activity details. Use fictional 2036 activities, coherent public locations, and a persistent simulated-demo label. The word “live” refers to interactive current application state; do not claim real-time civic data when there is none.

BUILD
1. Implement a polished MapLibre-based city map using a permitted, configurable style/tile source. Start at an appropriate Prishtina view; use category markers or clusters, event/need/community layers where useful, a legend, keyboard-accessible equivalents, and a synchronized list. Never render a person's exact private position, home, school location, or undisclosed meeting point. Public event venues may be shown if seeded as public.
2. Discovery filters: city/area, date/time, category, free/paid, indoor/outdoor, accessibility, age eligibility, group size, and difficulty as supported by stored data. Location permission is optional; default to a chosen city or area. Search and filter state should survive navigation or be shareable. Do not promise filters the underlying data cannot satisfy.
3. Add a transparent recommendation function over the same persisted records: interests, availability, distance where opted in, accessibility and eligibility as hard constraints, then a documented relevance score. Return short reasons like “matches technology and Saturday availability.” Users may adjust inputs; do not rank people by popularity. Define tie-breaking for stable results and a reasonable fallback when preferences are empty.
4. Make activity detail pages informative and actionable: date, timezone, location, organizer, accessibility, capacity, cost, eligibility, how to join, community link, and safety/report link. Allow a member to RSVP and cancel using the Phase 2 persistence and authorization checks; show the real resulting state and remaining spaces. Handle full/past/canceled events and duplicate action attempts correctly.
5. Make the layout compelling on phone and desktop, with a fast path from home to “near me / chosen area / this weekend.” Ensure list mode remains useful when WebGL, tiles, or geolocation fail. Use purposeful empty states rather than invented recommendations.

VERIFY
Test filter combinations and recommendation reasons against known seeded cases; test RSVP/capacity state; perform at least one end-to-end mobile and desktop journey for onboarding → discovery → detail → join/cancel. Check keyboard navigation, labels, visible focus, and meaningful alternatives to color-only map encoding. Run the existing typecheck/lint/build and document results. Update PHASE_STATUS and explain precisely how Phase 4 can reuse discovery records. Code and test now.
```

## Phase 4 — Communities, events, projects, needs, and actual participation

```text
Continue KOSOVO 2036 — HUMAN NETWORK from the existing code. Read docs/PRODUCT_CONTRACT.md, ARCHITECTURE.md, DEMO_DATA.md, PHASE_STATUS.md and respect their privacy and role rules. This phase supplies the real community actions behind the map. Preserve Phase 3 discovery and the seeded demo narrative.

PRODUCT JOURNEY
A user joins a community discovered through an event, sees another upcoming event and a project, volunteers, and can submit a neighborhood need. The organizer can create and edit a community activity; changes appear in discovery. Demonstrate at least one Prishtina technology community, one environment community, and one youth activity need with explicit simulated identities and dates.

IMPLEMENT
- Community detail with purpose, area, language, rules, organizer, upcoming events, projects, member count based on actual records, and join/leave. Respect public/private visibility. A member must not silently join a restricted group.
- Organizer creation/editing for communities and events, with validations for public versus restricted age eligibility, venue, capacity, time, cost, accessibility, and cancellation. Organizer authority must be checked on the server. For the demo, eligible users can create a community under a clear moderation/publishing policy; do not make every new public event instantly trusted by default.
- Project page with role/volunteer needs, status and a join/withdraw action. A “needs 20 volunteers” count reflects actual sign-ups. Avoid fabricated impact hours. If tracking volunteer hours, require organizer confirmation or label self-reported values explicitly.
- Community-needs submission: category, approximate area, description, status, and optional supporting text. No public pinpoint for a reporter. Provide duplicate prevention or a way to support an existing need rather than inflate counts; report and moderation actions for unsafe posts.
- Event check-in or organizer-confirmed attendance, separate from RSVP. The personal Impact screen should derive attended events, joined projects, and verified/clearly labeled contributions from stored actions. No follower counts or popularity leaderboard.
- Notifications only for useful state changes such as RSVP confirmation or event change. A simple in-app inbox suffices; no external messaging dependency.

QUALITY BAR
Use the established components, real CRUD operations, predictable empty/error states, and consistent Albanian-first copy with English coverage for visible controls. Add meaningful tests for authorization, join uniqueness, event state transitions, impact derivation, and needs privacy. Walk through a real seeded account from event to community to project to impact; verify an organizer edit updates discovery. Update docs and PHASE_STATUS, including exact Phase 5 extension points. Implement now.
```

## Phase 5 — Human matching and BRIDGE, the signature demonstration

```text
Continue KOSOVO 2036 — HUMAN NETWORK in this repository. Read the four handoff docs and existing tests. This phase builds the signature BRIDGE capability: a concrete, explainable collaboration proposal between communities. Keep it aligned with the actual communities, skills, projects, events, and needs already stored. No decorative network graphic with hardcoded unrelated text.

BRIDGE CONTRACT
Use the fictional demo chain: a Prishtina AI/technology community and an environment/community group have complementary skills; a neighborhood need asks for a youth activity or a local environmental intervention; BRIDGE proposes a specific workshop or project. Show source records, mutual benefit, required resources, suggested next action, and an understandable reason for the recommendation. Only a human organizer can accept, edit, or decline a proposal. No automated messages to another organization without a human action.

BUILD
1. Implement candidate generation with deterministic, testable scoring first: shared goals, complementary capabilities, geography, availability, and relevant community need; exclude blocked, inactive, non-consenting, or ineligible candidates. Explain the factors, avoid opaque “AI says 95% match,” and deduplicate proposals. Recompute or invalidate when inputs change.
2. Create a BRIDGE exploration surface with a network visualization that improves understanding, plus an accessible text/list alternative. Limit the visual to the most relevant entities and relationships. A proposal detail tells the story of “who + why + what next” with links to source communities, need, and proposed project/event. An organizer can save, edit, accept/decline, and turn an accepted proposal into a draft collaboration project with permission checks.
3. Add human matching only for consenting adult demo profiles: complementary skills/interests and a specific activity/project reason. Defaults off; only opted-in discoverable fields may appear. Mutual interest or participation should precede a contact request. Provide block/report, never expose exact location or private contact info, and do not match minors with strangers. The app must work if this subfeature is limited to two or three fictional adults.
4. Visual presentation matters: the judge should encounter one clearly explained BRIDGE suggestion in less than a minute after the main journey. Link it naturally from the relevant community/event and avoid an empty AI theater screen.

TEST AND DELIVER
Create fixture cases where a good match, a bad match, a blocked match, and a changed need produce expected outcomes. Verify organizer authorization and safe public projections. Walk through the demo: event → community → need → BRIDGE proposal → draft project. Run typecheck/lint/build and targeted tests. Update architecture, demo narrative, and PHASE_STATUS with a Phase 6 handoff. Implement now.
```

## Phase 6 — Useful AI assistant, natural language discovery, and honest fallbacks

```text
Continue KOSOVO 2036 — HUMAN NETWORK in the same repo. Read docs/PRODUCT_CONTRACT.md, ARCHITECTURE.md, DEMO_DATA.md, PHASE_STATUS.md and inspect the live data/recommendation modules. This phase adds AI where it improves decisions. Existing map search and BRIDGE must remain fully functional without an AI provider key.

PRIMARY DEMO REQUESTS
“I'm free on Saturday and want to meet people interested in programming in Prishtina.”
“Find an accessible activity near me.”
“How could the AI club and environmental group collaborate?”
Each response must point to real stored demo records, show useful links/actions, respect eligibility, and explain its reasoning. Never invent an event, venue, attendee, count, source, or capacity.

IMPLEMENTATION
- Build a typed search-intent parser for category, area, date/time, accessibility and user preferences. Use deterministic parsing/search as the always-available baseline. If an approved server-side AI provider is already configured, it may extract a structured intent or compose a grounded explanation from a server-supplied shortlist. Validate the model output and recheck authorization/eligibility before rendering. Store no secret in client code; use timeouts, error handling, usage limits, and a transparent provider-off state.
- Create a concise assistant UI with example prompts, helpful clarification for ambiguous queries, citations or direct links to the underlying in-app records, and a visible indication when the response comes from a rules-based demo rather than a model. A query about a different city with no seeded records should say so.
- Add organizer assistance as a draft-only event or BRIDGE proposal helper. Prefill an editable form using known records; the organizer reviews before publishing. Do not auto-send invitations or claim AI created a real partnership.
- AI must not decide who someone must meet, rank a person's social value, expose private information, infer sensitive traits, or make municipal decisions. Do not send private profiles or exact locations to a provider unless there is explicit user consent and a documented need; for this demo, prefer data minimization and server-side grounding.
- Support Albanian and English phrasing for the three demonstration journeys. If language understanding is limited, state the limitation in the UI or docs rather than faking broad multilingual competence.

VERIFICATION
Test intent extraction, unknown locations, no results, provider failure, prompt injection in an event description, private-field exclusion, and stale/canceled event handling. Run at least one end-to-end assistant search followed by a real RSVP. Compare AI and non-AI outputs for the same seeded records. Update docs and PHASE_STATUS with exact configuration and a Phase 7 handoff. Implement now.
```

## Phase 7 — Municipality intelligence with defensible privacy

```text
Continue KOSOVO 2036 — HUMAN NETWORK. Read the four handoff docs, source modules, and privacy/role tests. This phase creates the separate municipality experience. Its purpose is decision support using anonymous, aggregated *simulated* Prishtina 2036 data, not surveillance and not a claim about real Kosovo residents.

CORE DEMO STORY
A neighborhood has several simulated requests for youth technology activities and relatively few relevant events. The municipal analyst sees an opportunity gap, drills into its aggregate explanation, and reviews an editable recommendation for a monthly workshop. They never see who submitted a need, someone's exact location, contact details, profile, or a private group. Public-facing copy and charts prominently say “Simulated Prishtina 2036 demo data.”

IMPLEMENT
1. Create a role-protected municipality route and aggregate-only service boundary. Derive demand from eligible community-needs/support records and supply from public active activities, using defined areas, categories, and a documented time window. Explain the denominator and how the gap is scored. Do not conflate a fictional seeded count with an observed city statistic.
2. Provide an overview with demand/supply comparison, area/category filters, a small aggregate heatmap or choropleth, top gaps, and source-method explanation. Use a coherent graph/table alternative for accessibility. City recommendations should be phrased as *suggestions for human review*, never automatic government decisions.
3. Prevent reidentification: aggregate coarse areas, suppress cells with fewer than a documented minimum distinct contributors, suppress related totals or drilldowns if differencing could expose a small cell, omit precise coordinates, avoid free-text excerpts and sensitive slices, and enforce the rule at the query/API layer. A heatmap must visualize public activity density or protected aggregates, never individuals' live locations. Document limitations: a threshold alone does not guarantee anonymity in all cases.
4. Add a separate, clearly labeled simulation dataset large enough to show the product story while exercising suppression. Keep the seeded personas and events consistent with the user journey, but do not create many fake individual accounts purely to inflate a number. Synthetic aggregates may be stored separately and marked as scenario assumptions, never mixed into real member counters.
5. If modeling public-space intelligence, show only known fictional/demo place records and derived event supply. Do not label a space “underused” without actual usage evidence; use “candidate space in this scenario” where appropriate.

VERIFY
As an analyst, see a defensible aggregate gap and an explanation; as a regular member, receive denial for analyst APIs; as an analyst, be unable to retrieve individual records through filters, exports, URLs, or alternate API paths. Add tests for small-cell suppression and differencing combinations. Test charts/list on a narrow mobile viewport. Run typecheck/lint/build and relevant end-to-end tests. Update docs and PHASE_STATUS for Phase 8. Implement now.
```

## Phase 8 — Integration, accessibility, security, deployment readiness, and judge demo

```text
Finish KOSOVO 2036 — HUMAN NETWORK in this repository. Read all four docs and the actual code. This is an integration and quality phase, not a new feature spree. The goal is a stable, compelling competition demonstration that makes a credible claim: an interactive Prishtina 2036 social-infrastructure prototype, with simulated data and a clear path to a responsible pilot.

COMPLETE AND POLISH
1. Audit every visible route and action. Remove or finish dead buttons, contradictory counts, stale seeded content, inconsistent language, broken back paths, deceptive AI claims, and placeholder screens. Reconcile the home, map, communities, projects, BRIDGE, assistant, impact, and municipality views into one connected story. Polish the first 30 seconds on mobile and desktop without sacrificing clarity.
2. Run meaningful end-to-end journeys: new user onboarding → filter/search → activity detail → RSVP → community → project → impact; organizer edits an event → discovery reflects it; BRIDGE proposal → draft collaboration; need → privacy-preserving aggregate city gap; assistant provider unavailable → useful fallback. Check keyboard operation and screen reader names in the critical journey, map/list parity, contrast and focus, responsive layouts, locale switching, empty/error/loading states, and reduced motion where relevant. Use WCAG 2.2 AA as a review target, and report remaining gaps honestly.
3. Security/privacy review: no exposed secret, no arbitrary demo role elevation in a production build, no cross-account editing, no role bypass via direct API, no exact private location in a map or log, no identifiable data in municipality outputs, rate limits or bounded inputs on public actions, safe output rendering, and reporting/moderation path. Verify that sample data and analytics are unmistakably labeled. Fix issues found rather than only writing a checklist.
4. Verify clean setup, migrations, seed, local start, typecheck, lint, build, and targeted tests. If an allowed preview/deployment destination is already configured, prepare or run its documented deployment workflow and smoke test it; do not invent a public URL or silently require a new paid service. Include a map/list fallback if tiles fail. Document environment variables and one-step demo reset.
5. Create docs/DEMO_RUNBOOK.md: a 3-minute judge walkthrough with precise clicks, two demo personas/roles, a fallback route if AI/maps fail, 30-second pitch, accurate technical architecture, privacy explanation, and a short roadmap. Create docs/FINAL_STATUS.md with implemented vs simulated vs deferred, verification commands/results, residual risks, and screenshots if possible. Update PHASE_STATUS to complete.

FINAL ACCEPTANCE
The judge can use the app from the landing screen without reading the PDF; the core journey is functional; BRIDGE tells a specific, evidence-linked collaboration story; municipal insight is useful but aggregate and clearly fictional; no screen promises a production capability that is absent. Give a short final report with changed files, commands and results, demo instructions, deployment/preview status, and exact known limitations. Perform the work now; do not stop at an audit.
```

### Practical use

Paste Phase 1 into Claude Code while it is inside the intended project folder. Let it finish and verify its handoff before Phase 2. If Claude loses context, the four handoff files and each prompt's opening instruction restore the project state. Resist adding features between phases until the connected core journey works. For a very short deadline, prioritize Phases 1–5 and Phase 8; Phase 6 can use only the deterministic assistant, and Phase 7 can use a clearly simulated aggregate scenario.
