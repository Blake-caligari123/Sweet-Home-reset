# CLAUDE.md: Sweet Home Reset (PixelVortex Games)

## Project
A cosy top-down town life sim: Puff the dust bunny ("they") tidies homes in the town of Hollowfern, befriends 6 neighbours and restores the Glimmerwell fountain, with an optional tiny real chore each day. v1 ships on **web/PWA, iOS App Store and Google Play together, with no phases**. Bundle ID `com.pixelvortexgames.sweethomereset` (web Services ID `com.pixelvortexgames.sweethomereset.web`). Repo: github.com/Blake-caligari123/Sweet-Home-reset.

## Stack
- Client: TypeScript + Vite + PixiJS v8, DOM overlay UI, Capacitor for iOS/Android, vite-plugin-pwa.
- Server: Cloudflare Pages (static, packs) + Workers (Hono, `/api/*`) + D1; Cron Triggers; Resend free tier for email.
- Payments: one non-consumable unlock, the RevenueCat `full_game` entitlement. Stripe Checkout on web (through the API), Apple IAP on iOS, Play Billing on Android. Code: `apps/web/src/town/unlock/`.
- Sign-in: email magic link + Sign in with Apple. Optional; the game is fully playable offline and signed out.
- Prices (only in `config/pricing.json`): the full-game unlock, A$14.99 (provisional until checked against a store price point). The phone apps show the store's own price string.

## Source of truth (GDD v3, 27 Oct 2026)
- `claude/GAME-DESIGN.md` (GDD v3): Part A wins over Part B (v2 text) and all older room-game docs. A11 holds specialist sections; A11.7 is the story.
- `claude/STORY.md`: story bible (world, Puff, neighbours, heart events, dialogue, pack JSON example).
- `claude/FRONTEND-PLAN.md` (client, F1–F15) and `claude/BACKEND-PLAN.md` (server: opt-in sync, Plus, Mess of the Day, claims, packs, analytics, privacy).
- `claude/VISION.md` (28 Oct 2026, from Blake's 44 answers): the full vision and the 12-week road to release. It wins over everything below where they differ (no ending; free first spring + one unlock instead of Plus; all six neighbours in year one).
- `claude/NEXT-PHASE.md` (30 Oct 2026, from Blake's 100 answers in `claude/PHASE-2-ANSWERS.md`): Phase 6, from basic to deep, and the road to early access. It wins over VISION.md where they differ.
- `claude/config/tuning.json`: every gameplay number (`dayRealMinutes` 10, `firstDayRealMinutes` 12; the year-one schedule in `unlocks`). Never hard-code.
- Milestone order (A9, v2 p.12): M1 walking world → M2 all 6 neighbours (Plus gate stubbed) → M3 grow and craft → M4 seasons + sharing (reveal clip, photo mode, Mess of the Day) → M5 launch (accounts, sync, Plus, store builds, TestFlight/Play testing, IARC). Milestones are test checkpoints, not scope cuts.
- Money (VISION §10): the first spring is free, then one purchase unlocks the full game and its future updates; optional cosmetic packs later. The Plus gate is gone (Phase 0); `unlocks.ts` never reads a purchase. Offer timing is decided in Phase 5.
- Analytics: first-party, anonymous gameplay counts only. No third-party tracking.

## Art (unparked 27 Oct 2026, hybrid)
- Character sprite sheets come from Blake (Grok Imagine + cleanup), processed by `tools/process_asset.py --sheet` into `apps/web/public/sprites/` and wired in as they arrive: `claude/SPRITE-SHEETS.md` (order: Puff walk, idle+blink, clean swing, hop+doze; then neighbours). Code-drawn placeholders stay until each sheet lands.
- Claude Code keeps tiles, props, mess, effects and ambient animation in code (16 px tiles, 24 px Puff in the world; 48 px menu Puff later).
- Character sprites use Blake's Grok art at high resolution (`--hires 6`: the art's own colours and outline, 6 texture px per world px, Puff in a 24×28 world-px cell), decided 27 Oct 2026. Areas are Grok paintings too (decided 27 Oct 2026): `--background` in `process_asset.py`, `background` in the pack, map traced over the painting; the burrow and bakery are in; yard, square, General Store, Neighbour Lane, Bea's shop, Pip's workshop, Moss's library, Riverside and Otto's bathhouse are code-drawn until their paintings arrive (`claude/SPRITE-SHEETS.md`). Soft shadows and lamp glow are code overlays. `PUFF-ANIMATION-TASKS.md` (48 px room game) is retired. Old room paintings / 01–99 prompts are retired unless re-requested.
- Log assets in `claude/LICENCES.md`.

## Commands
- `npm test` (Vitest, incl. `@cloudflare/vitest-pool-workers`), `npm run lint`, `npm run typecheck`, `npm run build`, `npx playwright test`
- `npm run pack:build {id}`, `npm run pack:preview {id}`
- `npx cap sync`, then build in Xcode / Android Studio
- Art: `tools/.venv/bin/python tools/process_asset.py <name> --sheet N --hires 6 --frame 24x28 [--rows a,b,c] --log` for character sheets; `--pixel room|puff|prop` for the older modes (see `tools/README.md`). Tool tests: `tools/.venv/bin/python -m unittest discover tools`

## Folder map
- `apps/web/src/`: `town/` (the town game, `/test/` link) in feature folders: `data/`, `world/`, `play/`, `neighbours/`, `requests/`, `ui/`, with `game.ts` as the coordinator. `room/` is the original room game (main link, frozen). `shared/` holds code both use. How the pieces fit and how to add a feature: `docs/ARCHITECTURE.md`. Tests sit beside their files (`*.test.ts`).
- `config/pricing.json`: the only place prices live.
- `claude/`: design and build docs: SPRITE-SHEETS, GAME-DESIGN, FRONTEND-PLAN, BACKEND-PLAN, M2-PLAN, DIALOGUE-REVIEW, ASSET-PROMPTS (+ `asset-prompts/01–99`), PIXEL-ART-SPEC, PUFF-ANIMATION-TASKS, LICENCES, STORE-LISTING, IARC-ANSWERS (ratings and privacy forms), RELEASE-CHECKLIST (Blake-only steps to launch), BUSINESS-IDEAS, STORY.md, `config/tuning.json`, `gdd-v3/` (section sources; rebuild A11 with `python3 ../tools/merge_gdd_v3.py` from `claude/`), `prompts/` (build steps)
- `art/`: source images and previews (`sprites/raw/` Blake's original sheets, `sprites/*_x4.png` pixel-art previews, `_drafts/`); engine sprite strips in `apps/web/public/sprites/`
- `tools/`: `process_asset.py`, `palette24.json`, `README.md`
- Root `GAME-DESIGN.md`, `BUILD-SPEC.md`: early concept docs; `claude/` wins where they differ.
- **Game: GDD v3** (`claude/GAME-DESIGN.md`): a full top-down town life sim (tap to walk and clean, 16 px tiles, 24 px Puff, Fluff stamina, seasons, 6 neighbours). Build the full game; the 5 milestones in its A9 are test checkpoints. Part A overrides Part B and the older room-game docs. Tuning lives in `claude/config/tuning.json`. Never name other games in prompts, store or in-game copy.
- Precedence: BACKEND-PLAN wins on API/data; FRONTEND-PLAN on client; GAME-DESIGN on rules and feel.

## Conventions
- **Before building** any feature, step, area or sizeable fix: follow the `factorisation-and-organisation` skill (`.claude/skills/`). Write a file plan, keep files within budget, and `game.ts` only wires.
- **After building**, before committing: run the `post-feature-cleanup` skill every time, without being asked. That means its checker (`node .claude/skills/post-feature-cleanup/check.mjs`), a self-review of the diff, then all checks and the docs.
- **Feature tour (Blake, 30 Oct):** every new player-facing feature gets a card in `apps/web/src/town/tour/tour.ts` (Pause → 🧪 Feature tour on the test link), set up so Blake can try it in one tap.
- Tests first; each step ends with `npm test` green. Lowercase snake_case asset names; pack room ids use `-`.
- Copy is a kind friend: never "failed", "lost", "overdue"; no body, weight or appearance talk. Puff is never sad because of the player.
- Secrets only in Worker secrets / `.dev.vars` / `.env` (gitignored, chmod 600). Never in code or chat.

## Hard rules
- Accounts are 16+ (age checkbox). No ads, ad SDKs, IDFA, loot boxes, random paid rewards, paid timers or resetting streaks. Cleaning uses Fluff (stamina), never a paid resource; dozing off is free.
- iOS build never shows or links to web prices.
- Free tiers only. No deploys to production, public releases, account creation or spending without Blake's yes. Stripe test mode only.
- Every change goes through QA Group before it's called done.

## Build prompts
Build by the A9 milestones and FRONTEND-PLAN F1–F15. The older room-game prompts (pre-v3) are reference only: `claude/prompts/01-scaffold.md` … `14-performance-and-store-readiness.md`. Each has a goal, files to touch and acceptance tests.

## Open questions (conflicts not settled by current decisions)
1. Room outlines: PIXEL-ART-SPEC says no outline on room backgrounds; `tools/process_asset.py` outlines rooms (strong edges).
2. Sage hex: spec style block had #B7CDB0; `palette24.json` uses #A9CDA0. Prompts now use the palette24 value; confirm.
3. Prop grid: spec says multiples of 16 px; the tool fits all props to 64×64.
4. (Resolved 30 Oct 2026: there is no subscription to cancel; the unlock is one purchase, VISION §10.) Paywall cancel line.
5. (Resolved in GDD v3 A2: reveal clip and Mess of the Day card are on-device only; IARC 'Shares user content' = No.) Sharing: IARC-ANSWERS says "shares user content: yes, limited" and mentions a home-tour link; FRONTEND/GAME-DESIGN say no publicly shared user content. Is the home-tour link in v1?
6. Idle 4 / blink 2 / hop 6 sheets have no asset numbers (01–99 is full; only #97–99 are walk sheets).
7. Root BUILD-SPEC still has a streak badge, household sharing and a "1 room free" tier vs claude/ docs (no streaks, 3 free rooms); household sharing in v1 is still open.
8. Store price points A$7.99/A$44.99 are unconfirmed until Blake checks App Store Connect.
