# Codex

Handoff for Codex. `AGENTS.md` is the same file. Follow this one if you opened `CODEX.md`.

## Source of truth

Read these before changing behaviour:

| Doc | What it decides |
|---|---|
| `docs/GAME-DESIGN.md` | Feel, loops, tasks, economy, onboarding |
| `docs/FRONTEND-PLAN.md` | Screens, Pixi scenes, packs, build order F1–F20 |
| `docs/BACKEND-PLAN.md` | API, D1, billing, build order steps 1–12 |
| `docs/ASSET-PROMPTS.md` | The 96 art file names and target sizes |
| `docs/BUSINESS-IDEAS.md` | Task list and free vs Plus |
| `docs/STORE-PRICES.md` | Store price points Ops still has to confirm |
| `docs/IARC-ANSWERS.md` | Draft questionnaire answers |
| `docs/LICENCES.md` | Grok Imagine commercial-use verdict |
| `config/app.json` | Name, bundle id, `{APP_DOMAIN}` placeholder |
| `config/pricing.json` | The only price source |
| `config/tuning.json` | Mini-task starting values |

If `docs/FRONTEND-PLAN.md` and `docs/BACKEND-PLAN.md` disagree on an API or on stored data, `docs/BACKEND-PLAN.md` wins.

Do not build the rest of the game in one session. Take the next unchecked task, write its tests first when the plan says so, and stop when that task's acceptance line passes.

## Rules that do not move

- One TypeScript web build ships to the browser, iOS, and Android. Bundle id: `com.pixelvortexgames.sweethomereset`.
- The game is playable offline and signed out. The server backs up sync, accounts, and Plus. Scrubbing never costs Energy.
- No ads, loot boxes, paid timers, or paid currency. Sparkle prices are fixed and are not the AUD prices.
- Prices appear only in `config/pricing.json`. Do not hard-code an amount anywhere else.
- Copy sounds like a kind friend. Never "failed", "lost", "overdue", or "lazy". Puff is never sad because of the player. Unbuilt rooms are "still being fluffed", not locked.
- Rooms are data. Do not special-case a new room in TypeScript. The whitelist interpreter never uses `eval`.
- Missing art falls back to code-drawn shapes. Do not crash on a missing file.
- Nothing is published, no developer account is created, and nothing is paid for without Blake's yes. Do not run `cap` upload steps, Stripe live mode, or store consoles.
- The domain stays the `{APP_DOMAIN}` placeholder in `config/app.json` until Blake replaces that one value. Do not invent a hostname.
- No secrets in the repo, in wrangler.toml, or in chat. See Secrets below.

## What's done

- [x] Design docs live in `docs/`. `config/app.json` is where the plans say the domain and bundle id live.
- [x] npm workspaces: `apps/web` (Vite, TypeScript, PixiJS 8), `apps/api` (Hono on Workers), `packages/shared` (save types).
- [x] `apps/web/capacitor.config.ts` with the locked bundle id and `webDir: dist`. Native `ios/` and `android/` are not generated (they are gitignored).
- [x] Scripts: `dev:web`, `dev:api`, `typecheck`, `lint`, `test`, `build`, `check`, `art:placeholders`.
- [x] Placeholder home scene at boot. The kitchen nook from the earlier prototype opens from that house (pointer, drag, keyboard). Escape or House returns home. Progress for the kitchen is a local spot list, not `SaveBlob` yet.
- [x] `GET /api/health` returns `{ ok: true }`. Unknown routes return `{ error: "not_found" }`.
- [x] `apps/api/migrations/0001_initial.sql` is the D1 schema from the backend plan, including `billing_events` and the `items` catalogue. `database_id` in `wrangler.toml` is still `REPLACE_WITH_D1_DATABASE_ID`.
- [x] `apps/web/public/art/` has all 96 paths from `docs/ASSET-PROMPTS.md`. `manifest.json` records path, size, transparency, and `status: "missing"`. The PNGs are 8×8 stand-ins with a `PLACEHOLDER` text chunk. They are not game art.
- [x] `.env.example`, `apps/web/.env.example`, and `apps/api/.dev.vars.example` list every env name with empty secret values.

## What's left

Do these in order. Each box is one session. Acceptance detail stays in the named plan section.

1. [ ] **F2** Replace the `main.ts` scene switch with scene classes: `enter` / `exit` / `update` / `resize`, safe-area insets, and a heap check that 20 switches do not leak textures.
2. [ ] **F3** Drawing helpers, a Puff rig with the moods in `docs/GAME-DESIGN.md` §6, and an SVG sanitiser. A missing file in the art manifest must fall back to code-drawn art with no throw.
3. [ ] **F4** Zod `schemaVersion: 1` in `apps/web/src/packs/schema.ts`. Replace the stub `public/packs-bundled/starter-home/1/pack.json` with the three free rooms (kitchen nook, living room, bedroom). Fuzzed broken packs must not escape `PackService`.
4. [ ] **F5 / game step 1–2** Replace the kitchen spot grid with the RenderTexture scrub (brush, 95% auto-finish, stages 25/50/75/100 once). Keep pointer, mouse, and keyboard on one path. Drive numbers from `config/tuning.json`.
5. [ ] **Backend step 1** Add `@cloudflare/vitest-pool-workers` so the migration applies on an empty local D1 and `GET /api/health` is tested there. No Cloudflare account is required for the local pool.
6. [ ] **F6 / game step 3** Mini-tasks from pack data plus `config/tuning.json`. Help Puff. Wrong bins bounce back. Idle hint at the tuning delay.
7. [ ] **F7** `FeedbackService` for particles (cap 400), haptics (Capacitor / vibrate / none), Web Audio hooks, and captions. Mute silences sound. iOS Safari must not call `vibrate`.
8. [ ] **F8 / game step 11** Reduced motion, 44pt targets, captions, the live region, and assist mode. Keyboard play stays.
9. [ ] **F9** Move the kitchen off the spot-index save onto `SaveBlob` in `packages/shared`. Corrupt saves fall back. Signed-out play still works.
10. [ ] **Backend step 2** Magic-link auth. Tests first. Same response whether or not the email exists. Missing Resend vars return 503, not a send attempt. Age confirmation required for a new account.
11. [ ] **Backend step 3** `GET /api/save` and `PUT /api/save` with the version check, 409 body, 256 KB limit, and 400 on invalid JSON.
12. [ ] **F10 + step 4b** Pack catalogue, sha256, versioned cache, offline fallback to bundled packs, and corrupt-pack isolation. Plus packs stay visible and locked for free players.
13. [ ] **F11 / game step 6** Replace this placeholder home with Puff's house diorama, the pack browser, the restored room, and the shop. Finished rooms become decor. No random rewards.
14. [ ] **Step 4 + F12 / game step 5** Real-chore claim, Sparkles ledger, Energy, daily cap of 5. A 429 shows the kind cap line. Scrubbing still works at 0 Energy. The client queues ticks offline.
15. [ ] **Step 4d / game step 7** Mess of the Day seed, same function on client and server. Add the once-per-date claim table in a new migration. Second claim pays nothing. Works offline from the cached catalogue.
16. [ ] **F13 + §2c** Auth client, Sign in with Apple, secure storage for the app token. Magic-link files `apple-app-site-association` and `assetlinks.json` wait on the real domain. Do not put a fake host in them.
17. [ ] **F14** Debounced save sync, 409 merge (higher progress per room, union of items), flush on `pagehide`. A 403 on a Plus pack looks locked, not broken.
18. [ ] **Step 5** `GET /api/me` from `users`, not from the client.
19. [ ] **Steps 6–9 + F15** Billing routes. If a Stripe var is missing, return 503 `{ "error": "billing_unavailable" }`. Web prices come from `config/pricing.json`. Do not show those numbers inside a future iOS UI. Do not call Stripe with a real key.
20. [ ] **Step 10** Trial reminder email. Missing Resend vars skip the send. One email per user.
21. [ ] **Step 11 + F17** Export, delete, settings, legal links. Delete does not cancel a store subscription; the copy must say so. Logs must not contain email, tokens, or save bodies.
22. [ ] **Step 11b** `POST /api/events`. Reject unknown names and any field that looks like an email. Store nothing when analytics is off. Add the events table in a new migration.
23. [ ] **Step 12** Origin check, body size limit, rate limits, security headers, error shape `{ "error": "code" }`.
24. [ ] **§2b** `POST /api/revenuecat/webhook`. Constant-time auth compare. Idempotent on `billing_events`. Do not create the RevenueCat account.
25. [ ] **F16 / game step 9** On-device before/after clip, PNG fallback, Mess of the Day card, photo mode. No upload.
26. [ ] **F18** PWA manifest and Workbox rules. Never cache `/api/save`, `/api/me`, `/api/auth`, or `/api/billing`.
27. [ ] **F1 leftover** Playwright smoke that the canvas is on screen, and a CI check that the initial JS gzip is within the plan's budget. Do not add a paid Lighthouse service.
28. [ ] **F19** `npx cap add ios` and `npx cap add android` when a machine has the SDKs. Wire haptics, status bar, and the Android back button. Do not open store consoles.
29. [ ] **F20 / game step 12** Performance notes and store screenshot list from `docs/GAME-DESIGN.md` §9. Uploading to TestFlight or Play needs Blake's accounts. Stop before any upload.

Game-design steps 1–12 are covered by the frontend tasks above. Do not add a parallel implementation.

## Conventions

- TypeScript `strict`. ESM. PixiJS 8. Hono on the Worker. Shared types go in `packages/shared` and use the plan's field name `mask_progress`.
- Web UI that is not the room canvas is DOM (the plan's shell). The canvas keeps one ARIA live region for stage announcements.
- Art path: `apps/web/public/art/` plus the relative path in `docs/ASSET-PROMPTS.md` (`puff/puff_idle.png`). Room id `kitchen-nook` maps to `kitchen_nook_*.png`. Dirty and clean rooms share a frame.
- When real art replaces a placeholder, overwrite the PNG, set that manifest entry's `status` to `"ready"` and `placeholder` to `false`, and log the prompt and date in `LICENCES.md`.
- New D1 changes are new files in `apps/api/migrations/`. Do not edit `0001_initial.sql` once a database has applied it.
- API tests are written first, as the backend plan asks. Stripe and Resend are mocked. Tests must pass with no keys.
- The kitchen prototype stays until task 4 replaces the scrub. Do not delete it in an earlier task.
- Comments explain a constraint the code cannot show. Do not narrate the change.
- `npm run check` is the local gate: typecheck, lint, test, build.

## How to run and test

Requires Node 20+ and npm 10+.

```sh
npm install
npm run dev:web
```

The dev server uses the GitHub Pages base path. Open `http://localhost:5173/Sweet-Home-reset/`.

```sh
npm run dev:api          # Worker on port 8787, when a task needs it
npm run typecheck
npm run lint
npm run test
npm run build            # web production build, and wrangler deploy --dry-run for the API
npm run check            # all four
npm run art:placeholders # rewrites the 8×8 stand-ins and the manifest
```

Boot shows Puff's house. Kitchen Nook scrubs. Living room and bedroom announce that they are still being fluffed. House or Escape leaves the kitchen.

There is no D1 database in this environment. `wrangler dev` can use a local database later. Do not create a paid Cloudflare resource. The `database_id` placeholder is intentional.

## Secrets

- Never commit `.env`, `.dev.vars`, keystores, or tokens. `.gitignore` already excludes them and keeps the example files.
- Web: copy `apps/web/.env.example` to `apps/web/.env`. Names: `VITE_API_ORIGIN`, `VITE_RC_WEB_KEY`, `VITE_RC_IOS_KEY`, `VITE_RC_ANDROID_KEY`.
- API local: copy `apps/api/.dev.vars.example` to `apps/api/.dev.vars`. Names are listed in that file and in `docs/BACKEND-PLAN.md` §1 and §2c.
- Deployed Worker values use `wrangler secret put`. They do not go in `wrangler.toml`.
- `chmod 600` the local copies.
- If a billing or email secret is absent, the route fails closed with 503. Do not substitute a made-up key so a call "works".
