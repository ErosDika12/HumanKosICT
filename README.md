# KOSOVO 2036 — HUMAN NETWORK

A prototype of a Prishtina 2036 neighborhood platform: discover activities on a
real map, find a demo friend to go with, make a plan, message them, and watch
two communities collaborate on a real need through **BRIDGE**. Everything about
Prishtina 2036 (people, events, communities, numbers) is **fictional demo
content** and is labeled as such — see `docs/DEMO_DATA.md`.

Visitors click **Log in as demo** (no password, no sign-up): they get their own
temporary member account, so nothing they do can affect anyone else.

## Getting started (local development)

```bash
npm install          # generates both Prisma clients + copies MapLibre's worker (postinstall)
cp .env.example .env.local   # then set AUTH_SECRET; DATABASE_URL defaults to local SQLite
npm run db:migrate   # create the local SQLite database
npm run db:seed      # fictional demo data (idempotent — safe to re-run)
npm run dev          # http://localhost:3000
```

Local development uses **SQLite**. The hosted site uses **PostgreSQL** — see
`docs/DEPLOYMENT.md` for how the two coexist.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server (Webpack — see `docs/ARCHITECTURE.md`). |
| `npm run build` | Production build (also generates the PostgreSQL client). |
| `npm start` | Serve the production build. |
| `npm test` | Unit + database tests (Node's test runner; scratch SQLite DB). |
| `npm run lint` | ESLint. |
| `npm run db:migrate` / `db:seed` / `db:reset` | Local SQLite migrations, seed, reset. |
| `npm run db:migrate:prod` / `db:seed:prod` | Apply PostgreSQL migrations / seed to the database in `DATABASE_URL`. |
| `node scripts/sync-production-schema.mjs` | Regenerate `prisma/schema.production.prisma` after editing `prisma/schema.prisma`. |

## Documentation

- `docs/DEMO_RUNBOOK.md` — the 3-minute visitor journey, pitch, personas.
- `docs/DEPLOYMENT.md` — Vercel + PostgreSQL setup, environment variables, demo isolation and reset.
- `docs/FINAL_STATUS.md` — what is real, simulated and deferred; verification results.
- `docs/PRODUCT_CONTRACT.md` — scope, roles, non-negotiable privacy/safety boundaries.
- `docs/ARCHITECTURE.md` — stack decisions, routes, data flow.
- `docs/DEMO_DATA.md` — exactly what is seeded and why.
- `docs/PHASE_STATUS.md` — build history and per-phase verification.
