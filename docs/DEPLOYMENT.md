# Deployment — Vercel + managed PostgreSQL

The hosted demo runs on **Vercel** (Next.js, Node.js runtime) with a **managed
PostgreSQL** database (Supabase, EU Central). Local development is unchanged
and keeps using SQLite.

## Why two Prisma schemas

Prisma ties a generated client to one database provider, so a single schema
cannot serve both SQLite and PostgreSQL. Therefore:

| | Local dev / tests | Hosted |
| --- | --- | --- |
| Schema | `prisma/schema.prisma` (source of truth) | `prisma/schema.production.prisma` (**generated** — `node scripts/sync-production-schema.mjs`) |
| Client | `@prisma/client` | `src/generated/prisma-postgres` (git-ignored, built by `postinstall`/`build`) |
| Migrations | `prisma/migrations` | `prisma/migrations-postgres` |
| Config | `prisma.config.ts` | `prisma.production.config.ts` |
| Driver | better-sqlite3 adapter | `@prisma/adapter-pg` |

`src/lib/prisma.ts` chooses the client from the scheme of `DATABASE_URL`
(`file:` → SQLite, `postgres(ql)://` → PostgreSQL). After a model change: edit
`schema.prisma`, run `npm run db:migrate`, run the sync script, and add a
PostgreSQL migration with
`prisma migrate diff --from-schema <old prod schema> --to-schema prisma/schema.production.prisma --script`
into a new folder under `prisma/migrations-postgres/`.

## What runs on every deploy

`vercel.json` sets the build command:

```
prisma migrate deploy --config prisma.production.config.ts   # apply PostgreSQL migrations
prisma db seed        --config prisma.production.config.ts   # idempotent fictional demo data
npm run build                                                 # prisma generate + next build
```

The seed is idempotent (upserts by id), so re-running it on every deploy is safe
and self-healing. It never touches one-click demo visitors' rows.

## Environment variables (Vercel → Project → Settings → Environment Variables)

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | `postgresql://USER:PASSWORD@HOST:5432/postgres` — the provider's **session-mode pooler** (IPv4). **No** `sslmode` / `ssl*` parameters. Sensitive. |
| `AUTH_SECRET` | yes | 32+ random bytes. The app refuses to start in production without it. Sensitive. |
| `DEMO_STAFF_PASSWORD` | yes | Private password for the seeded organizer / moderator / analyst accounts (never published on the site). Sensitive. |
| `ASSISTANT_AI_API_KEY` | no | Enables AI phrasing in the assistant (server-side only). See below. |
| `DEMO_LOGIN_DISABLED` | no | `1` turns off the public one-click demo login. |
| `ASSISTANT_DAILY_LIMIT`, `ASSISTANT_AI_DAILY_LIMIT` | no | Per-account daily caps (defaults 60 / 20). |
| `DATABASE_SSL_CA`, `DATABASE_POOL_MAX` | no | PEM for non-Supabase providers; pool size per instance (default 4). |

Secrets live only in Vercel's encrypted environment store. `.env*` files are
git-ignored; the repository contains only `.env.example`.

### Database TLS

Certificates are **always verified** — there is no skip-verification mode.
The Supabase Root 2021 CA (a public certificate) is embedded in
`src/lib/supabase-ca.ts` for the runtime driver and shipped as
`certs/supabase-prod-ca-2021.crt` for the Prisma CLI (migrations use
`sslmode=require` + `sslcert`, added programmatically in
`prisma.production.config.ts`).

## Public-site safety

* `/dev-login` and the dev persona switcher return 404 in production, and the
  action behind them refuses to run (`assertNotProduction`).
* The login page never prints a password in production. Staff accounts use
  `DEMO_STAFF_PASSWORD`; demo friends have random, unknowable password hashes.
* **Log in as demo** always creates an ordinary `MEMBER` — never an organizer,
  moderator or analyst.
* Session cookies are `httpOnly`, `sameSite=lax`, `secure` in production.
* Free text is length-bounded (`src/lib/validation.ts`); the assistant API
  requires same-origin requests, bounds its input, and has per-account limits.

## Demo isolation and reset

Every click on **Log in as demo** creates a fresh temporary member with its
own starter friendships, example conversation and invitation. All actions are
stored on that account, so visitors never see or damage each other's data.
Shared state is protected as well:

* visitor RSVPs, project sign-ups and community joins never change shared
  counts, "spots left" or capacity;
* visitors are never suggested to anyone and never appear in matches;
* a visitor's needs, supports and reports are visible only to that visitor and
  excluded from municipal aggregates and the moderation queue;
* accounts are purged automatically after **24 h** (`DEMO_VISITOR_TTL_HOURS`;
  cascade deletes remove everything they created), creation is rate-limited
  (60 per 10 minutes site-wide) and capped (400 active — the oldest 100 are
  freed first).

Reset the shared demo content at any time by re-running the seed (a redeploy
does it automatically). Remove all visitor data with
`DELETE FROM "User" WHERE "isDemoVisitor" = true;` (cascades).

## Assistant AI (optional)

With no key the assistant is a **rules-based, grounded** helper and every reply
says so. Setting `ASSISTANT_AI_API_KEY` (or `AI_GATEWAY_API_KEY`) lets a model
*phrase* replies from facts the server already looked up (default:
`anthropic/claude-haiku-4.5` through the Vercel AI Gateway; override with
`ASSISTANT_AI_BASE_URL` / `ASSISTANT_AI_MODEL` for any OpenAI-compatible
endpoint). The model never chooses records, never triggers actions, its output
is sanitized and bounded, and any failure falls back to the rules-based answer
with a visible notice. The integration is covered by unit tests with a mocked
provider; it has not been exercised against a live model in this environment.

## Git integration

Pushes to the connected GitHub repository deploy automatically (production
branch → production). Preview deployments use the same database, so treat
previews as production-adjacent.

## Operations notes

* The database connection goes through the provider's pooler; if migrations
  ever fail with `P3009`, inspect `_prisma_migrations` and use
  `prisma migrate resolve` deliberately — never force a re-run blindly.
* Rotating `AUTH_SECRET` signs everyone out (visitors just click the button again).
