# Architecture

Sweet Home Reset is a local-first monorepo:

- **`apps/web`** is the game: rendering, UI, saves on the device, the PWA and the Capacitor shell.
- **`apps/api`** is the optional Cloudflare Worker for accounts, sync, entitlement and packs.
- **`packages/shared`** holds types that must agree on both sides.

Design docs live in `claude/`. Rules and feel come from GAME-DESIGN, client from FRONTEND-PLAN, server and data from BACKEND-PLAN.

## Two games, one web app

`apps/web` builds two pages from one codebase:

| Page | Entry | Code | What it is |
|---|---|---|---|
| `/` (main link) | `index.html` → `src/room/main.ts` | `src/room/` | The original single-room cleaning game. It is kept working, but frozen: no new features. |
| `/test/` | `test/index.html` → `src/town/main.ts` | `src/town/` | The GDD v3 town game, built milestone by milestone. All new work goes here. |

The two never import each other. Anything both use lives in `src/shared/`.

```
apps/web/src/
  town/      the town game (below)
  room/      the original room game: app.ts, game/ (rules), scenes/, art/
  shared/    used by both
    art/       palette (the 24 colours), pixel-canvas, menu Puff, dull filter
    audio/     synthesised sound and music
    render/    Pixi helpers: particles, textures
    share/     the before/after clip and share sheet
    ui/        dom helper (h), pixel images
    native.ts  Capacitor bridge (haptics, back button)
    pwa-*.ts   service worker setup and updates
    date.ts, style.css
```

## The town game (`src/town/`)

```
town/
  main.ts       entry: loads the pack, save, paintings and sprites, then starts TownGame
  game.ts       TownGame, the coordinator: wires the features together; areas, input, the day,
                the main loop and the save
  debug.ts      the `?debug` test hooks (`window.__town`) for browser playthroughs
  state.ts      TownState: Puff's saved progress (Sparkles, bag, Fluff, tools, flags, friends, jobs,
                names…) and how it saves and loads
  unlocks.ts    the year-one schedule: whether something (a neighbour, a place) has arrived yet, from
                the day and story flags only (`tuning.unlocks`); never a purchase
  data/         the pack schema and validation (area.ts), save format and migrations (save.ts),
                tuning.json access (tuning.ts), pack lookups (content.ts), the test pack loader
  world/        drawing and walking: world.ts (Pixi stage), alive.ts (lamps, sunbeams, the cat…),
                sprites.ts, backgrounds.ts (paintings),
                bake.ts, ambience.ts, nav.ts (free movement), pathfind.ts, town-areas.ts (every
                area with its mess and walking grid, rebuilt as things get built), grumble-layer.ts
    art/          code-drawn placeholders: texture.ts (tile size, noise, dither), ground.ts,
                  props.ts, items.ts (mess, item icons, crops), characters.ts (Puff, neighbours)
  play/         core rules: mess.ts (mess, colour, restore), bag.ts, fluff.ts, clock.ts,
                pickups.ts, onboarding.ts (tip rules), letter.ts (morning letter and real chore),
                names.ts (the player's names for Puff and the town: `{puff}`, `{town}` in text),
                overnight.ts (what happens while Puff sleeps: Fluff, crops, builds), nudges.ts (the tracker's
                "try this next"), carry.ts (dragging clutter home);
                Puff in play: puff.ts (position, facing), targets.ts (what a tap lands on),
                actions.ts (cleaning, furniture, soil, pickups, doors), onboarding-guide.ts
                (runs the tips: tools, highlights); gestures.ts (tap, rub, drag); a home coming
                alive: alive.ts (stage rules) and home-life.ts (switches stages on in play)
  neighbours/   neighbours.ts (routines, walking), talk.ts (line choice), friends.ts (points,
                gifts), heart-events.ts (scene rules), conversations.ts (the talk/gift/scene/
                Friends UI)
  requests/     requests.ts (board rules), jobs.ts (the board and jobs UI)
  build/        build.ts (plots and buildings: start, overnight finish, the props they put in an
                area), build-sheet.ts (the Keeper's plans screen)
  grumbles/     grumbles.ts (families, setting them out each day, tidying into helpers), drift.ts
                (the slow amble, shy of Puff), grumble-life.ts (Grumbles in play: spawn spots, taps,
                tidies, hellos)
  shops/        shops.ts (hours, stock, buying and selling), shop-sheet.ts (the shop screen)
  ui/           hud.ts, view.ts (dialogs, sheets, banners, feedback), prompt.ts (the line above
                the tool bar), pointer-input.ts (fingers on the world), keyboard.ts, bag-sheet.ts,
                naming-sheet.ts, pause-menu.ts, reveal.ts (share clip offer), frame-stats.ts, town.css
```

### How the pieces talk

- **Rules are pure modules.** `talk.ts`, `friends.ts`, `heart-events.ts`, `requests.ts`, `shops.ts`, `mess.ts`, `nav.ts` and the like take data in and give results back. They have no DOM and no Pixi, and each has a `*.test.ts` beside it. Test new rules here first.
- **Each feature's UI is one class or function** (`Conversations`, `Jobs`, `openBag`, `openPause`). It receives a small *host* interface listing exactly what it needs from the game, for example `ConversationHost` and `JobsHost`. That keeps features from reaching into `TownGame`'s internals, and the host interface is the list of what a feature depends on.
- **`TownState`** is one shared object for saved progress. Loading a save replaces its fields, never the object, so features can keep a reference. To add something saved:
  1. Add it to `TownState`.
  2. Add it to `TownSave` in `data/save.ts`.
  3. Add a migration if old saves need a value.
  4. Add it to `toSave()` and `load()` in `state.ts`.
- **`View`** owns everything over the world: speech boxes (`ask`), sheets, banners, Puff's bubble, sounds and haptics. While a box or sheet is open the game is held (`view.busy`), so the clock, Puff and the neighbours wait.
- **`Content`** answers questions about the pack: text by id (`line`), item names, neighbours, requests.

### Content is data

Areas, mess, neighbours, routines, dialogue, gift reactions, heart events, requests, shops and items all live in the pack: `public/packs-bundled/hollowfern/1/pack.json`.
- **Text** goes in the `strings['en-AU']` table and logic uses ids, never names.
- **Numbers** go in `claude/config/tuning.json`.
- **Validation:** `validateTownPack` checks the pack at load, and the pack tests check that every door, mess spot, prop, stop and tidy job is reachable.

### Adding a feature (the M2 pattern)

1. Write the rules as a pure module with tests, in a feature folder (`town/<feature>/`).
2. Add its content to the pack, with validation and a pack test.
3. Write its UI as a class or function with a host interface, in the same folder.
4. Wire it into `game.ts`: construct it, give it its host, and call it from taps, the loop or the day.
5. Add a `?debug` hook if a browser test needs one (`installDebugHooks` in `game.ts`).

### Keeping it clean

Two project skills in `.claude/skills/` keep the code organised as it grows:
- **factorisation-and-organisation:** the file plan and size budgets before building.
- **post-feature-cleanup:** after building, a checker (`node .claude/skills/post-feature-cleanup/check.mjs`: oversized files, orphans, dead exports, leftovers, `any`, unused CSS) plus a self-review against the project standard.

### Checks

From `apps/web`:
- `npm test` (Vitest)
- `npm run lint` (ESLint)
- `npm run typecheck`
- `npm run build`
- `npm run size` (first-load budget, 300 KB gzipped)

Browser playthroughs run with Playwright against `npm run dev`, using the `?debug` hooks (`window.__town`).

## Saves and sync

The local save is authoritative while offline. It lives in IndexedDB (main and backup slots) with a `schemaVersion` and migrations (`town/data/save.ts`). Optional sign-in and sync, entitlement and the packs API follow BACKEND-PLAN.

## Building and shipping

- `npm run build` makes the GitHub Pages PWA: both pages, with the service worker auto-updating.
- `npm run build:native` makes the Capacitor bundle (see the README).
