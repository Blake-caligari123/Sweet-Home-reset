# Sweet Home Reset

A calm cleaning game from PixelVortex Games. Puff the dust bunny keeps you company while you scrub a room on screen and, later, tick off a real chore. It is one web app, wrapped for iOS and Android. It stays playable offline and signed out.

This repository is the foundation. The game is not finished. [AGENTS.md](AGENTS.md) (and [CODEX.md](CODEX.md)) is the handoff: what already runs, what to build next, and how to run it.

## Stack

- Web: Vite, TypeScript, PixiJS
- iOS and Android: Capacitor around that same build (`com.pixelvortexgames.sweethomereset`)
- API: Cloudflare Workers, Hono, D1
- Tests: Vitest. Playwright arrives with the browser-flow task in `AGENTS.md`

## Layout

```
apps/web/                 PixiJS shell, placeholder home, kitchen prototype
apps/web/public/art/     96 asset paths and manifest.json
apps/api/                 Worker stub and D1 migrations
packages/shared/          Save types shared by the web app and the API
config/                   app.json, pricing.json, tuning.json
docs/                     Design docs. These win over guesses.
```

Art files use the names in `docs/ASSET-PROMPTS.md` and live in `apps/web/public/art/`. The PNGs in git are 8×8 placeholders. `manifest.json` marks every one `missing`. Drop the real picture in under the same file name.

## Quick start

Node 20+ and npm 10+.

```sh
npm install
npm run dev:web
```

Open `http://localhost:5173/Sweet-Home-reset/`. The house is a stand-in. Kitchen Nook can be scrubbed. The other two rooms are not built yet.

```sh
npm run dev:api
npm run check
```

`npm run check` is typecheck, lint, test, and build.

## Boundaries

- Secrets stay out of the repo. Copy `.env.example`, `apps/web/.env.example`, or `apps/api/.dev.vars.example`, and keep the copies untracked. Deployed Worker values use `wrangler secret put`.
- The domain in `config/app.json` stays `{APP_DOMAIN}` until it is replaced on purpose.
- Prices live only in `config/pricing.json`.
- No ads, loot boxes, or paid timers. Store accounts and real purchases wait for Blake.

## Status

The boot screen is Puff's house, drawn in code. The kitchen nook still uses the earlier spot-grid scrub and a local save. The API answers `GET /api/health` and ships the D1 schema from `docs/BACKEND-PLAN.md`. Later routes are listed as tasks in `AGENTS.md`.
