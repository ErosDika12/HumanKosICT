# KOSOVO 2036 — HUMAN NETWORK

An interactive prototype of a Prishtina 2036 social-infrastructure platform —
a live map for discovering activities and communities, with **BRIDGE**
(cross-community collaboration) as the signature feature. All content is
fictional demonstration data; see `docs/DEMO_DATA.md`.

This repository is being built in eight phases; see
`docs/HUMAN_NETWORK_8_PHASE_CLAUDE_PROMPTS (1).md` for the full plan and
`docs/PHASE_STATUS.md` for current progress.

## Getting started

```bash
npm install   # also copies MapLibre's worker script into public/ (postinstall)
npm run dev   # http://localhost:3000
```

No environment variables are required for Phase 1 (`.env.example` documents
what a later phase will use).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server (Webpack — see `docs/ARCHITECTURE.md` for why Turbopack isn't used yet). |
| `npm run build` | Production build. |
| `npm start` | Serve the production build. |
| `npm run lint` | ESLint. |

## Documentation

- `docs/PRODUCT_CONTRACT.md` — product scope, roles, non-negotiable privacy/safety boundaries.
- `docs/ARCHITECTURE.md` — stack decisions, routes, the MapLibre worker-loading fix.
- `docs/DEMO_DATA.md` — exactly what's seeded and why.
- `docs/PHASE_STATUS.md` — what's implemented, verification results, and the next phase's starting point.
