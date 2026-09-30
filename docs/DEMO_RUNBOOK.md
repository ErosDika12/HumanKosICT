# Demo Runbook — Human Network (Prishtina 2036)

A judge/visitor walkthrough. Everything about Prishtina 2036 — people,
activities, communities, numbers — is **fictional demo content**, labeled as
such on every page. Real: the software, the database, and the actions you take
on your own temporary demo account.

## 30-second pitch

Human Network turns "what's on?" into "see you there": you find an activity,
find a friend who shares your interests and availability, invite them, and get
a plan you can message about. Underneath, **BRIDGE** connects two communities
around a real neighborhood need — from proposal to project to first joint
session — and every step explains why. Everything is stored, isolated per
visitor, and honest about what is simulated.

## The 3-minute journey (public URL)

1. **Home** — headline, live counts, map preview, demo friends, BRIDGE example.
   Click **Log in as demo** (one click, no password, no sign-up).
2. **Discover** — your journey checklist appears. Filter (category, when, cost,
   area, accessibility…) or switch to the **Map**. Open **Golden Hour Photography
   Walk** (Sat 21 Jun).
3. **RSVP** — one click; refresh and it is still there. A **seeded invitation
   from Arta** (a fictional friend) is already waiting — accept it if you like.
4. **Friends** — suggested demo friends share your interests. **Add friend**
   (say, Lulzim), open **See what fits**: only activities that match both
   people's interests, availability and accessibility needs.
5. **Invite** — press **Invite Lulzim** on a suggested activity. Demo friends
   never reply live: the reply is labeled **simulated** and explained by a
   visible availability rule.
6. **Plans** — the activity, your RSVP, and every invitation with its status.
7. **Messages** — send Lulzim or Arta a message; your lines are saved. Lines
   labeled **demo example** are seeded.
8. **Assistant** — ask *“Which activity could I attend with Arta?”*, then
   *“Show me another”*. Answers cite stored records and carry **Invite** /
   **RSVP** buttons; the assistant itself never performs actions.
9. **BRIDGE** — click through *Need → Match → Decision → Project → First
   session* for **Prishtina AI Klub × Gjelbër për Prishtinën**, then **Join the
   project** or **RSVP to the first session**.

## Two personas

* **Visitor (public):** the one-click demo member above.
* **Staff (private):** organizer / moderator / municipality analyst accounts
  (see `docs/DEMO_DATA.md`) sign in at `/login` with the private
  `DEMO_STAFF_PASSWORD` — for reviewing `/moderation`, `/municipality` and
  organizer tools. They are deliberately **not** reachable via the demo button.

## Fallbacks

* **Map tiles unavailable** → use **List** view; every filter and action works
  the same. (The map uses OpenFreeMap's public OpenStreetMap-based style.)
* **Assistant** works with no AI key (rules-based, and it says so). With a key
  it may phrase replies with a model; see `docs/DEPLOYMENT.md`.
* **Demo busy message** → the site limits how fast new demo accounts are
  created; wait a few minutes.
* **Local run:** `npm run dev` with the SQLite database (`docs/../README.md`).

## Architecture in one paragraph

Next.js App Router + TypeScript; Prisma over SQLite locally and PostgreSQL on
Vercel (two generated clients, one source schema). Server-only data modules
enforce every authorization and privacy rule; a fixed simulated clock
(Monday 16 June 2036) makes fictional dates behave like a real "today". BRIDGE
scoring, friend suggestions and simulated replies are deterministic and
explainable. See `docs/ARCHITECTURE.md`.

## Privacy in one paragraph

Profiles are visible only where a user opted in; friend suggestions require a
real mutual basis; municipal data is aggregate-only with small-cell suppression;
demo visitors are isolated and purged after 24 h; free text is bounded; secrets
live only in the host's encrypted environment. See `docs/PRODUCT_CONTRACT.md`.

## Roadmap (out of scope for the prototype)

Public sign-up and email verification, live friend messaging between real
people, a production map-tile plan, an AI provider verified against a live
model at scale, native mobile apps, and real municipal data partnerships.
