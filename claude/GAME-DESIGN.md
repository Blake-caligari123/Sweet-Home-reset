# Sweet Home Reset: Game Design Document v3 (full game)
*PixelVortex Games · v3 · 27 Oct 2026 · owner: BB Builder (merge), sections by Dev Team. Claude Code builds from this file. It supersedes GDD-v2.pdf and the v1 GAME-DESIGN.md (backup: gdd-v3/GAME-DESIGN-v1-backup.md). All numbers are design targets or playtest starting values, not measured data.*

**Rules for prompts and store copy:** never name another game in asset prompts, store text, marketing or in-game copy. Internal references in Part B (the v2 text) are allowed.

## Part A: v3 decisions and additions

### A1. Scope
Build the full game described in Part B. The 5 milestones (A9) are test checkpoints, not scope cuts. Each one must be playable on a phone and pass its done-when tests before the next starts. Milestone builds go to a separate test path; the main test link keeps the last passing build.

### A2. Locked decisions (override Part B where they differ)
| Topic | Decision |
|---|---|
| Day length | One tuning value `dayRealMinutes`. Playtest 8 and 10 (default 10). 14 is no longer the default. |
| Dozing off at 2:00 | Free. Wake at home with half Fluff, lose nothing. No Sparkles cost. |
| Free tier | The whole first spring (14 days), 3 neighbours, garden, crafting, Mess of the Day, real-chore letters, the reveal clip, saving on device. Must feel like a complete game. |
| Plus | Seasons 2–4, neighbours 4–6 and their stories, weekly visitors, full wardrobe/decor, extra house upgrades. Offered first at the Spring Clean Fair (day 14), never during a task; after a dismiss, shown at most once per in-game week. Story: a postcard waiting at home after the fair. |
| Plus wording | Store page, first screen and paywall all say: "Spring is free. Summer, autumn and winter need Plus." No surprise mid-season lock. |
| Plus lapse | Never locks existing progress. Save, town, items, neighbours and restored homes stay usable. Player freezes at the end of the last season they can access; nothing is deleted. |
| Pricing | A$7.99/mo, A$44.99/yr; founding A$34.99/yr on web only. iOS/Android use store billing via RevenueCat, entitlement `plus`, renewal wording from BUILD-SPEC.md before purchase, Restore Purchases in Settings. |
| Never sold | Sparkles, Fluff/stamina, refills, time skips, random items, loot boxes, ads. |
| Social | Friend-town visits, leaderboards (including Speed Clean boards) and any server-side sharing come later, after an IARC and /privacy review. |
| Sharing in v1 | Reveal clip and Mess of the Day card, made on device from game art only, no name/photos/camera, nothing uploaded or tracked. |
| Combat | None. Optional later: a cosy puzzle cellar with nothing dangerous. |
| Art | Tiles and mess drawn in code; Puff and neighbours generated (Grok, per tool terms), pixel-passed, tidied, logged in LICENCES.md. Credit "Some art created with Grok Imagine" in app and store listing. Nothing resembling Finch. |
| Music | Synthesised for v1. Any commissioned art/music needs Blake's yes. |
| Launch | Australia first. |
| Beach and lighthouse | Open on day 43 (start of winter) only, no heart condition (overrides Part B's "3 hearts with Mabel"). |
| Mabel rewards | 3 hearts: old shore map (mystery item, replaces the woodland map). 6 hearts: lamp night, a night event, not a festival. |
| Copper tool | Recipe sold at the General Store from day 5 (so a Copper tool by day 7 is reachable). Hazel's 6-heart reward is a snack cooking recipe. |
| Names | Town Hollowfern, fountain the Glimmerwell, Puff is "they". Neighbour names/species per A7 are final (Part B "placeholders" note is superseded). |
| Analytics | First-party, anonymous gameplay counts only (A10/A11.4). No third-party analytics or ad IDs. |
| Accounts | Optional sign-in, 16+. If sign-in exists, in-app account deletion is required (Apple) and /privacy lists the synced save data. |

### A3. Engine and frontend (summary; full detail in FRONTEND-PLAN.md)
- TypeScript, PixiJS, Capacitor (existing shell). 16 px tiles, integer scale, `roundPixels`, canvas `image-rendering: pixelated`, nearest-neighbour.
- Mess and colour state on the CPU, one byte per tile; redraw only changed tiles. No GPU readback.
- Tap-to-walk with A* over each area's walkable grid, 4-direction movement to match the walk sheets; tapping an object walks to the nearest free adjacent tile and faces it. Sprites depth-sorted by foot y.
- Tiles baked into chunk textures per area; time-of-day tint is one world overlay (never over the HUD); particles capped and off with reduced motion.
- Budgets: 60 fps at 390×844 on a mid-range phone; first load under 300 KB excluding art. Zoom is not disabled (no `user-scalable=no`).

### A4. Saves, data and payments (summary; full detail in BACKEND-PLAN.md)
- One versioned save in IndexedDB with `schemaVersion` and migrations from day one. Written at bedtime plus a 60 s recovery autosave.
- Content (areas, homes, mess, neighbours, dialogue, heart events, crops, shop stock, festivals) lives in versioned pack JSON, later served by `GET /api/packs` with `catalogue_version` (also seeds Mess of the Day). Walkable grids live in the pack JSON.
- Opt-in cloud sync: one save blob per account in D1, last-write-wins on `savedAt` plus device ID; if the server copy is newer, ask "Keep this device or cloud?". Never overwrite silently.
- Entitlement checked on the client from cached RevenueCat info (works offline); server only for synced content. Real-chore 5-a-day cap checked against server date for synced players; honour system offline. Seasons tied to real month use the device's local date.

### A5. HUD and art plan (summary; full list in ASSET-PLAN-v2.md)
- HUD: top left Fluff meter (icon, bar, number; under 20 shows a sleepy icon plus colour change). Top right day and season ("Spring 3"), time in 10-minute steps with sun/moon, Sparkles below. Top centre a one-line collapsible request tracker. Bottom band: 6 tool slots plus Bag, with a context prompt above it ("Sponge the stain"). Soft warning at 1:00, no countdown. Live UI text, 44 pt targets, play area kept clear.
- Art: 24×24 Puff in the world on a new model sheet (simpler face); 48 px Puff for menus, title and dialogue. Retire full-room paintings, dirty/clean pairs, dirt overlays, Puff states 02–14, Energy icons. Seasonal tilesets by palette24 swaps in code where possible. Art is parked: no new asset prompts until Claude Code asks for a specific asset.

### A6. First 30 minutes (onboarding)
Real-time targets at a 10-minute day. No tutorial walls; each step is one hint bubble that disappears once done. Skippable after the first clean.
| Time | Beat | Teaches | Done when |
|---|---|---|---|
| 0:00 | Title, "Let's tidy!". Puff wakes in a dim, grey burrow bedroom (Day 1, 6:00). | — | First tap |
| 0:15 | Hint: "Tap the floor to walk." | Tap-to-walk | Puff reaches the rug |
| 0:40 | Dust patch glows. "Tap the dust." Duster auto-selected; colour floods back. | Tap-to-clean, colour reveal | 3 dust tiles cleared |
| 1:30 | Sock on the floor. "Pick it up and put it in the basket." | Hands, clutter homes | Sock put away |
| 2:30 | Kitchen Nook: a stain needs 3 hits. Sponge appears in slot 2. | Multi-hit mess, tool bar | Stain cleared |
| 4:00 | Fluff bar pulses for the first time: "Cleaning uses Fluff. Snacks and sleep refill it." | Fluff | Bar seen |
| 5:00 | Burrow reaches 95%: first mini reveal and the share prompt (skippable). | Reveal, share clip | Reveal done |
| 6:30 | Out to the yard: weeds and leaves (Rake), the 6×4 garden plot. Plant 3 radish seeds. | Areas, garden | Seeds planted and watered |
| 9:00 | Path sign to Town Square. Meet Hazel at the Hollowfern bakery doorway; she gives a Berry tart. | Talking, gifts, snacks | Talked to Hazel |
| 11:00 | Eat the tart (+40 Fluff). Notice board shows the first request: "Dust Hazel's shop counter." | Snacks, requests | Request accepted |
| 13:00 | Clean Hazel's counter. +1 heart progress, Sparkles reward. Meet Bea and Pip on Neighbour Lane. | Requests, friendship | 3 neighbours met |
| 17:00 | Evening tint. Hint near 1:00 game time: "Puff's getting sleepy. Head home to bed." | Clock | — |
| 20:00 | Bed: save, Fluff refill. Day 2 morning letter: one tiny real chore ("You cleaned a counter. Wipe yours?"), skip always fine. | Letter, honour system | Letter opened |
| 22:00 | Day 2: radish sprouts; General Store opens (Copper tool recipe stocked from day 5); first full request choice. | Daily loop | Player chooses freely |
| 30:00 | Target state: burrow restored, 3 neighbours met, 1 request done, 1 crop growing, 1 day completed. | — | — |
No paywall, sign-in or ratings prompt in the first 30 minutes.

### A7. Neighbour story outlines (story detail and overrules in A11.7 / STORY.md)
Town: Hollowfern; fountain: the Glimmerwell; Puff is "they". Heart events at 2, 4, 6, 8 and 10. Gentle; mess is never shamed. Free: Hazel, Bea, Pip. Plus: Otto, Moss, Mabel.
- **Hazel (hedgehog, bakery).** 2: the oven's been grimy since the morning rush doubled. 4: she admits she bakes for everyone but never sits down. 6: a snack cooking recipe; Puff helps her set a "closed Sundays" sign. 8: she teaches Puff her gran's tart. 10: she hosts a tea for Puff with the shop tidy and her feet up.
- **Bea (bee, flower shop).** 2: perfect front shop, chaos in the back room. 4: lists everywhere; she's scared of letting anyone down. 6: greenhouse unlocked. 8: she lets Puff choose the window display. 10: she plants a flower bed for Puff with no plan at all.
- **Pip (mouse, toy workshop).** 2: half-finished toys on every surface. 4: each one was for a friend who moved away. 6: bag upgrade; they finish one toy together. 8: Pip mails the toy. 10: a reply arrives and Pip opens the workshop to the town.
- **Otto (otter, riverside bathhouse).** 2: soap scum and a closed bathhouse. 4: it was his late uncle's and he's not sure he's good enough. 6: Silver squeegee recipe; reopening day. 8: he adds a bubble bath for tired neighbours. 10: a bath-night party for the whole town.
- **Moss (mole, dusty library).** 2: books stacked to the ceiling, curtains shut. 4: Moss finds people tiring and the library became a hiding spot. 6: cellar unlocked; a reading nook just for one. 8: Moss starts a quiet hour for others. 10: Moss reads a story aloud at the fountain.
- **Mabel (owl, lighthouse).** 2: salt-crusted windows, the light's off. 4: her eyes are tired and the climb is long. 3: the old shore map (mystery item). 6: lamp night (a night event, not a festival). 8: old maps reveal the fountain's history. 10: the lighthouse and the Glimmerwell relight together (year-1 finale).

### A8. Tuning table (starting values; all in `claude/config/tuning.json`)
| Key | Value | Notes |
|---|---|---|
| dayRealMinutes | 10 (test 8) | 6:00–2:00 game day |
| firstDayRealMinutes | 12 | Day 1 only, so the A6 first half hour fits before bed |
| gameMinutesPerTick | 10 | clock steps |
| fluffStart / fluffMaxStep | 100 / +10 | per Fluff upgrade |
| fluffToolUse / charged | 1 / 5–8 | +1 under 20 Fluff. Was 2; halved after Blake's playtest (28 Oct 2026): a full bar was only ~3 minutes of cleaning |
| fluffLowThreshold | 20 | yawn, slow walk |
| dozeWakeFluff | 0.5 × max | no other cost |
| restoreThreshold | 0.95 | home counts as restored |
| messHits (tier 1) | dust 1, cobweb 2, stain 3, weeds 2, mud 3, grime 6, crumbs 1, fog 1 | −1 hit per tier, min 1 |
| chargedArea | t2 3×1, t3 3×3, t4 3×3 + adjacent | |
| bagSlots | 12 start | upgradable |
| gardenPlot | 6×4 → 12×8 | |
| cropDays | 3–10 | unwatered pauses, never dies |
| friendship | talk +1/day, liked +3, loved +8, request +10, 10 pts/heart | never decreases |
| requestsPerDay / expiry | 1–3 / 2–3 days | expired request just goes |
| earlyDaySparkles | 150–300 | target |
| realChoreReward | 25 Sparkles + 30 max Fluff for the day | cap 5 per real day |
| plusOfferDay | 14 (Spring Clean Fair) | then at most once per in-game week after a dismiss |
| beachUnlockDay | 43 | Beach and lighthouse open at start of winter; no heart condition |
| copperRecipeShopDay | 5 | Copper tool recipe sold at the General Store |
| relaxedMode | Fluff ×0.5, no doze, no expiry | |
| autosaveSeconds | 60 | plus bedtime save |
| targetFps / firstLoadKB | 60 / 300 | excl. art |

### A9. Milestones as test checkpoints (done-when tests)
Each test runs on a 390×844 viewport and a real mid-range Android, with a clean console and screenshots attached.
1. **M1 Walking world.** Burrow, yard, Town Square and Hazel's bakery as tile maps; tap-to-walk with A* (never enters blocked tiles), camera follows Puff; dust, stain and clutter with 4 tools, per-tile colour reveal; Fluff bar and costs; day clock, bed, dozing off; bag; versioned save survives reload and a schema bump; onboarding 0:00–6:30; HUD per A5. Pass: a full day plays on an iPhone, waking to bed, and Hazel's home can be restored; 60 fps, no GPU readback warnings, save migration test green.
2. **M2 Neighbours.** All 6 neighbours (Hazel, Bea, Pip, Otto, Moss, Mabel) with dialogue, gifts, hearts and heart events; notice board requests; shops with opening hours; General Store and Sparkles economy; Neighbour Lane and Riverside homes. Plus gating of neighbours 4–6 is stubbed (all unlocked in test builds) until M5. Pass: onboarding to 30:00 completes; playtesters befriend neighbours and restore 3 homes within 14 days; a home restores at 95% and triggers the reveal; hearts never drop.
3. **M3 Grow and craft.** Garden plot, seeds, watering and harvest; foraging and materials; crafting bench; tool tiers up to Sparkle with charged use; home upgrades; cooking snacks. Pass: Copper tool crafted (recipe bought at the General Store, day 5+) and a crop harvested by day 7 in a scripted playtest; grime gated correctly; unwatered crops pause.
4. **M4 Seasons and sharing.** 4 seasons with palette swaps, weather, 4 festivals with mini-games, heart events to 10, Woodland edge and Beach areas (Beach and lighthouse open day 43), Glimmerwell fountain finale; house reveal clip (9:16, reveal in first second, sound, app-name mark, 4×+ export), photo mode, Mess of the Day card, real-chore letter. Pass: a full in-game year (56 days) plays end to end without soft-locks; Relaxed mode works; every share moment works on iOS, made on device only.
5. **M5 Launch.** Optional accounts and D1 sync with in-app deletion; Plus via RevenueCat with Restore Purchases, Spring Clean Fair offer, paywall wording, lapse keeps progress; signed store builds, TestFlight and Play testing; IARC rating ("Shares user content" = No), /privacy, store screenshots and preview video; accessibility settings, synthesised music, credits; playtest rounds. Pass: purchase, restore and lapse tested in sandbox; store wording matches A2; Blake approves the store accounts and public release.

### A10. Metrics (first-party anonymous events, on-device or store dashboards only; no third-party tracking)
Day-1 and Day-7 return rate, share rate of the reveal clip, Mess of the Day completion, Plus conversion when offered at the Spring Clean Fair, Plus retention after month 1.

### A11. Specialist sections
Dev sections merged below. Business sections (Ops, Growth, Strategy) to follow.

#### A11.1 Frontend (SF Frontend & Mobile Dev)
*Source: claude/gdd-v3/frontend.md*

### Engine, controls and tuning (owner: SF Frontend & Mobile Dev)
*All numbers are starting values for playtests, not measurements.*

#### Engine
- **Stack:** Capacitor wrapping Vite + TypeScript + PixiJS v8. One codebase for web, iOS and Android.
- **World:** 16 px tiles. Each area is a tile map of about 40×30 tiles, loaded from pack JSON, with layers for ground, walls/blocked, props and mess.
- **Rendering:** ground and wall layers are baked into chunk textures of 16×16 tiles. Only props, characters, mess tiles and effects are live sprites. Use whole-number scaling, nearest-neighbour, `roundPixels`, and `image-rendering: pixelated` on the canvas.
- **Camera:** follows Puff with a 1-tile lead in the walking direction, about 11 tiles wide on a phone. It clamps to the map edges, and spare screen space is filled with the area's edge tile colour, never black.
- **Depth:** sprites sort by foot y (`zIndex = footY`).
- **Mess state:** lives on the CPU as typed arrays per area (type, HP, colour level, one byte each). Tool hits change the array, and only the changed tiles are redrawn. There's no GPU readback, so progress = cleared tiles / total mess tiles, counted on the CPU.
- **Colour reveal:** a desaturate filter on each mess tile's chunk region. A cleared tile ripples colour into its neighbours over 300 ms (an instant swap with reduced motion).
- **Area changes:** a 250 ms fade. The next area's pack and textures are preloaded when Puff gets within 3 tiles of an exit.

#### Controls
- **Tap the ground:** A* pathfinding on the walkable grid, 4-direction, using a binary heap and capped at 2,000 nodes. If the tile can't be reached, Puff walks to the nearest reachable tile. A tap marker shows for 400 ms.
- **Tap a mess, object or neighbour:** Puff walks to the nearest free tile next to it, turns to face it, then acts. With auto-select on, the right tool is chosen; if Puff doesn't own it, a hint appears.
- **Tap and hold (upgraded tool):** after 400 ms, charge rings show 3×1 or 3×3. Release to use. In Settings, double-tap can replace hold.
- **Tool bar:** 6 slots plus Bag, each a real `<button>` with an icon, label, aria-label and focus ring, at least 44×44 pt.
- **Web:** WASD or arrow keys to walk, Space to use, 1–6 for tools, B for the bag, Esc to pause.
- **Pinch-zoom:** browser zoom stays on (no `user-scalable=no`). The game doesn't use pinch.

#### Performance targets (checked on a mid-range Android profile in Chrome DevTools, 4× CPU throttle)
- 60 fps while walking and cleaning in an area of 40×30 tiles, with no long tasks over 50 ms during play.
- First load under 300 KB of JS (gzipped), not counting art. An area's art is under 400 KB and loads lazily.
- Time to the title screen under 2.5 s on a fast-4G profile. The play area never shows blank; a loader stays up until textures are ready.
- No console errors. The service worker caches the app shell and the packs seen so far, so the game is fully playable offline.

#### Saves on the client
- Saves are IndexedDB JSON with `schemaVersion` and migrations (format owned by BACKEND-PLAN). Save at bedtime, plus an autosave every 60 s and when the app is hidden (`visibilitychange`).

#### Accessibility (frontend side)
- WCAG AA contrast for all UI text, with UI text kept as live text. The game respects system text size and reduced motion.
- Every sound has a visual cue. Haptics go through Capacitor Haptics, with an off switch.

#### Tuning table (all values live in `config/tuning.json`, never hard-coded)
| Value | Start | Test range |
|---|---|---|
| Real minutes per day (`dayRealMinutes`) | 10 | test 8 and 10 |
| Day span | 6:00–2:00 | fixed |
| Starting Fluff / max upgrade step | 100 / +10 | |
| Tool use cost / charged | 2 / 5–8 | 1–3 / 4–10 |
| Tired threshold / extra cost | 20 / +1 | 10–25 |
| Doze-off penalty | wake at half Fluff, nothing lost | fixed (free) |
| Walk speed | 4 tiles/s (3 when tired) | 3–5 |
| Hits per tile at tier 1 (dust/stain/grime/cobweb/crumbs/fog/weeds/mud) | 1/3/6/2/1/1/2/3 | ±1 |
| Hits removed per tier (Basic/Copper/Silver/Sparkle) | 1/2/3/4 | |
| Charged area (tier 2 / tier 3) | 3×1 / 3×3 | |
| Home restored at | 95% | 90–98% |
| Colour ripple | 300 ms, 1 tile | 200–500 ms |
| Hold-to-charge delay | 400 ms | 300–600 ms |
| Snack restore | 10–60 Fluff | |
| Bag slots at start | 12 | |
| Real-chore cap | 5/day | fixed |

#### Milestone done-when tests (frontend checks; each run on 390×844 and on a mid-range Android profile)
1. **M1, walking world:** tapping any reachable tile walks Puff there around furniture and never onto blocked tiles. Tapping a mess walks Puff next to it and clears it in the hits set in `tuning.json`. Area fades between the burrow, yard, Town Square and the bakery show no blank frame. The Fluff bar drops by the tuning cost, and the clock runs out at 2:00 with a free doze-off. A bedtime save survives a reload and a schema bump. Crisp at 375, 390 and 430 px with no black bars, 60 fps, and no console errors or GPU readback warnings.
2. **M2, neighbours:** all 6 neighbours follow their schedules using the pathfinder. Dialogue, gifts and hearts work, and hearts never drop. Shop hours are respected. A home restores at 95% and triggers the reveal. The Plus gate for neighbours 4–6 is a stub. 30 area changes leave heap within ±10%.
3. **M3, grow and craft:** crops grow across days in an accelerated test. The bench crafts tools, and grime stays gated until the Copper sponge. Charged use clears 3×1 and 3×3 areas, and double-tap can replace hold. Bag and home upgrades work.
4. **M4, seasons and sharing:** palette swaps rebake the chunks at each season change. Rain adds mud and waters crops. All 4 festivals can be completed. The reveal clip is a 6 s 9:16 mp4 or webm (PNG fallback), and making it sends no network request. Photo mode and the Mess of the Day card work. A 56-day year plays with no soft-locks in Relaxed mode.
5. **M5, launch:** the sync conflict prompt appears, and nothing is overwritten silently. The paywall shows as a postcard after the day-14 fair or from Settings, at most once a week. Restore Purchases works, and a lapse keeps all progress. The iOS build shows no web prices. Lighthouse scores at least 90 for performance and accessibility. A 10-minute soak holds 60 fps p95 and ≤ 150 MB. Capacitor builds run on iOS and Android.

#### A11.2 Backend (SF Backend & Payments Dev)
*Source: claude/gdd-v3/backend.md*

### Saves, sync, Plus and data (owner: SF Backend & Payments Dev)
#### Saves (local first)
- One versioned JSON save in IndexedDB (`shr` DB, `saves` store, slot `main` + `backup`): day, season, clock, Fluff, Sparkles, inventory/bag, tools+tiers, per-tile mess state per area (1 byte/tile, RLE-packed), crops, hearts + seen heart events, requests, restored rooms, festivals done, letters/chore log, settings.
- Fields: `schemaVersion`, `catalogueVersion`, `deviceId`, `savedAt` (ISO with local offset), `localDate`.
- Write on bed (main) + autosave every 60 s and on `visibilitychange` hidden (backup). Write backup first, then main; on corrupt main, load backup.
- Migrations: `migrations[n](save) -> save` chain, run on load, unit-tested with a fixture per version. Never drop unknown fields.
#### Opt-in sync
- Only after optional sign-in (magic link / Apple, 16+). `PUT /api/save` (gzip JSON, max 256 KB) and `GET /api/save`. D1 `saves(user_id PK, blob, schema_version, saved_at, device_id)`.
- Conflict: newer `savedAt` from a different device → ask "Keep this device or cloud save?" showing day/season of each. Never silent overwrite. Old copy kept 30 days in `save_history`.
#### Plus entitlement
- RevenueCat entitlement `plus`; products A$7.99/mo, A$44.99/yr, 7-day trial (Stripe web, Apple IAP, Google Play).
- Gate: seasons 2–4 and neighbours 4–6 plus the year-1 story. First spring fully free.
- Offer: a postcard back home after the Spring Clean Fair (day 14), never mid-task, at most once a week after.
- Offline: cached RevenueCat CustomerInfo; grace 3 days without network re-check.
- Lapse: player freezes at the end of the last season they can access with a friendly "Plus needed for summer" card; save, items and hearts untouched. Re-subscribe resumes exactly.
- Settings: Restore Purchases (required on iOS) and Manage subscription link.
#### Content data
- Pack JSON, versioned (`catalogueVersion`): areas (tile maps, walkable/blocked grid, chunks), mess types, neighbours (schedule, likes, dialogue, heart events), crops, shop stock by season, festivals, requests, tuning. Served bundled; `GET /api/packs` later swaps content without an app update. Schema validated in CI.
- Mess of the Day seed unchanged: `sha256("motd:"+localDate+":"+catalogueVersion)`.
#### Anti-cheat (light)
- Single-player, so device clock changes are tolerated. Anything server-rewarded (Mess of the Day claim, real-chore cap 5/day) is checked against server date for signed-in players.
#### Privacy and compliance
- In-app Delete account: deletes D1 user, saves, save_history, entitlement link; local save optional "also delete from this device". Done within the request, confirmation email.
- Export my data (JSON) from Settings.
- Privacy text: local save by default; sign-in stores email + save; purchases via the store/Stripe; no ads, no selling data, analytics events anonymous.
#### Done-when tests (backend part of each milestone, v2 order per A9)
- M1 Burrow and yard: save/load round-trip; backup recovers a corrupt main; schema-bump migration fixture green; pack JSON validates in CI.
- M2 Town and all 6 neighbours: neighbours, hearts, requests and shops load from pack JSON; hearts never drop across save/load; Plus gate for neighbours 4-6 stubbed (mocked entitlement flag).
- M3 Garden, materials, crafting: crops, materials and tool tiers persist; save < 256 KB after a scripted 7-day run.
- M4 Seasons, festivals, sharing: scripted 56-day run saves/loads at every bed with no loss; save < 256 KB; Mess of the Day seed matches client/server and claims pay once; share clips stay on device (no upload endpoint).
- M5 Launch: accounts (magic link, Apple), opt-in sync with conflict prompt, Plus live on Stripe/IAP/Play via RevenueCat with Restore; lapse leaves save byte-identical; delete account leaves 0 rows; export matches save; rate limits 429; privacy labels match /privacy for IARC and store forms.

#### A11.3 Art style and HUD (SF Product Designer)
*Source: claude/gdd-v3/art-ui.md*

### Art, animation and HUD (owner: SF Product Designer)

#### Art rules (carry over from PIXEL-ART-SPEC.md)
- palette24 only (tools/palette24.json), 1 px #8A6E5E outlines on characters and props, flat colour with one shade step, soft top-left light, no gradients, dithering or anti-aliasing.
- Whole-number scaling, nearest-neighbour, canvas `image-rendering: pixelated`, roundPixels on.
- Every asset goes through tools/process_asset.py --pixel and is logged in LICENCES.md. Prompts use the pixel style block, end with "original character, not resembling any existing mascot", and never name a game or artist.
- Body-safe and kind: no shaming of mess or people; messy homes read as "busy", never "dirty person".

#### Scale
| Thing | Size |
|---|---|
| Tile | 16x16 px |
| Puff in world | 24x24 px frame (simplified face, 2 px eyes, no blush gradient) |
| Neighbours in world | 16x24 px body |
| Puff menus / title / dialogue | 48x48 px (#01, 100-102) |
| Neighbour portraits | 48x48 px, 3 expressions |
| Props / decor | multiples of 16 px |
| View | about 11 tiles wide (176 px) at 2x on 375-430 pt phones; scale picked as the largest whole number that fits |

#### Camera
Angled top-down (~45°), follows Puff with a small lead in the walk direction, clamped to map edges, whole-pixel positions only. Area changes use a short fade (a plain cut with reduced motion).

#### Animation sets
- Puff (24 px): walk 4 directions x 6 frames (left mirrored from right), idle 4, blink 2, yawn, doze, happy hop 6, 4-frame swing per tool per direction, pick-up.
- Neighbours: idle, walk 4 directions, 3 expressions (happy, thinking, tired).
- Mess: per-tile colour drain in code; cleaning floods colour back with a sparkle ripple to neighbouring tiles. Reduced motion: instant colour, no ripple.
- Time of day: one tint overlay on the world (morning gold, clear afternoon, evening peach, night blue) plus lit windows. The tint never covers the HUD.
- Seasons: palette swaps in code first; seasonal art only where a swap can't do it.

#### Mess readability
Each of the 9 mess types has its own shape or pattern (dust = soft puffs, stain = blob, grime = cross-hatch, cobweb = lines, crumbs = dots, fog = horizontal streaks, clutter = items, weeds/leaves = sprigs, mud = splats), never colour alone.

#### HUD layout (portrait, safe-area aware, live text, 44 pt min targets)
- Top left: Fluff = icon + bar + number. Under 20 the icon turns sleepy and the bar changes colour (never colour alone).
- Top right: "Spring 3" + time in 10-minute steps with a sun or moon icon; Sparkles count below.
- Top centre: one-line current request tracker, tap to collapse.
- Bottom band: 6 tool slots + Bag button. Selected slot = raised + outline + name label. Auto-select can be switched off in Settings.
- Context prompt (for example "Sponge the stain") sits just above the bottom band when Puff faces something.
- Soft "Getting late" note at 1:00; no countdown, no red.
- Pause opens Settings, Our Home scrapbook and Save.
- HUD never covers the tapped path: if Puff walks under a HUD element it fades to 40%.
- High-contrast option: darker panels and outlines; all text meets WCAG AA (AAA in high contrast).

#### Dialogue
48 px portrait left, name, 2 lines max, tap to advance, auto-advance option, respects system text size.

#### A11.4 Ops and compliance (BB Ops & Finance)
*Source: claude/gdd-v3/ops.md*

## Ops & Compliance detail for A11 (owner: BB Ops & Finance, 2026-10-27)
Adds detail only; A2 holds the locked split, lapse, pricing and clip rules.

**Purchase screens**
- Founding offer wording (web only): "A$34.99 for your first year, then renews automatically at A$44.99/year until you cancel."
- Paywall shows price, period and renewal line before the buy button; links to Terms and /privacy; Restore Purchases; "Manage subscription" opens the store's own page (iOS/Android) or Stripe portal (web).
- Apple price points still to confirm in App Store Connect (codex/STORE-PRICES.md).
- Lapse screen copy: "Your town and everything in it are safe. Renew Plus to keep going into the next season." No countdowns or urgency copy.

**Account deletion (if sign-in exists)**
- In Settings, two taps max, confirms then deletes synced save data and account email within 30 days; on-device save stays unless the player also clears it.
- Tells the player that store subscriptions must be cancelled in the App Store / Google Play and are not cancelled by deletion.

**/privacy and /notices must list**
- Synced save data and email (only if signed in); purchase status via RevenueCat; transactional email via Resend; web payments via Stripe; Apple/Google for store billing.
- Analytics: first-party, anonymous gameplay counts only (A10 events). No ad ID, fingerprint, name or email in events; nothing sold or shared. Any third-party analytics tool needs Ops sign-off and a /privacy entry first.
- No ads, no tracking SDKs, no data sale. Grok Imagine credit line.

**IARC**
- Answers stay as claude/IARC-ANSWERS.md: "Shares user content" = No; in-app purchases is the only descriptor. Re-run before adding any server-side sharing, chat, friend visits or leaderboards.
- Seasonal and festival content: no gore, jump scares, alcohol or gambling-like mechanics.

**Support and money**
- Text-only support (email/in-app form); no calls. Store refunds go via Apple/Google; web refunds via Stripe under Australian Consumer Law.
- GST registration due once turnover reaches A$75k; I track revenue from store and Stripe reports, no invented figures.

#### A11.5 Share moments (BB Growth)
*Source: claude/gdd-v3/growth.md*

### Share moments (owner: BB Growth, 2026-10-27)
Detail only. The clip conditions are in A2. All v1 sharing happens on the device and goes through the phone's share sheet (on web, it downloads). Never name other games in captions or store copy.

#### Reveal clip
- 6 s, 9:16, at least 1080×1920 (integer 4x+ upscale, nearest-neighbour). The before state shows for under 1 s, then a sparkle wipe, a sound effect on the reveal, the after state, and Puff's happy pose for the last 2 s.
- Small corner wordmark watermark, with the synthesised v1 music baked in.
- Offered when a house or room reaches 100% clean, and from the photo menu. Share or Save to device. Auto-prompted at most once a day.

#### Mess of the Day card
- One daily seeded mess that's the same for everyone (seed = the date in Sydney time), with a one-line prompt, e.g. "Muddy porch after the storm".
- When finished, a 9:16 card shows the before and after thumbnails, the player's own time, the date and "Mess of the Day #N". No leaderboard and no server.
- Free, and part of the spring free tier.

#### First-30-minutes share moment
- The first full reveal lands in session 1 (an estimated 10–15 min). Show the clip with a soft prompt: "Your first reset! Save or share it?" It can be skipped and never nags after that.
- Puff's day-1 letter uses a large, clean, screenshot-friendly frame.

#### Measure
Anonymous first-party counts only (per Ops: no ad ID, fingerprint, name or email): share_sheet_open, clip_saved, motd_complete. We can't see anything that happens after the share sheet, so never claim reach from it.

#### A11.6 Metrics (BB Strategist)
*Source: claude/gdd-v3/strategy.md*

#### Strategy: metric targets (owner: BB Strategist, 2026-10-27)
Adds targets to A10. ALL targets are ESTIMATES (planning guesses, not benchmarks); reset them from the first 100 trials (Australia launch first). Events are first-party, anonymous gameplay counts only (no ad ID, fingerprint, name or email), per Ops.

Extra events: `day_end` {day, season, minutes, dozed}, `season_complete` {season}, `festival_view|done` {festival}, `motd_done` (Mess of the Day).

| Metric | Definition | Estimate target |
|---|---|---|
| D1 / D7 / D30 return | active on day N ÷ installs | 40% / 18% / 8% |
| Spring finish | season_complete spring ÷ installs | ≥ 15% |
| Day length test | 8 vs 10 min arms | keep arm with higher D7 |
| Doze rate | dozed day_end ÷ day_end | ≤ 25% (higher = stamina too tight) |
| Mess of the Day | motd_done ÷ daily actives | ≥ 30% |
| Clip share rate | reveal_shared ÷ room_complete | ≥ 5% |
| Fair → Plus | Plus within 24h of Spring Clean Fair ÷ fair attendees | ≥ 8% |
| Spring end → Plus | Plus by spring day 14 ÷ spring finishers | ≥ 20% |
| Yearly mix | yearly ÷ all Plus | ≥ 60% |
| Month-1 Plus retention | renewed ÷ monthly subs due | ≥ 50% |
| Refund rate | refunds ÷ conversions | ≤ 3% |

Rework signal (estimate): after 500 installs, D7 under 10% or spring finish under 8% means fix the early game before adding content.

#### A11.7 Story (SHR Story Lead)
*Source: claude/STORY.md*

**Sweet Home Reset: Story Bible (first draft)**
*PixelVortex Games · SHR Story Lead · 27 Oct 2026 · Draft for team review. Sources: GDD-v2.pdf, GAME-DESIGN.md (v3 draft, Part A and Part B), gdd-v3/, v3-sections/. Anything marked **Proposed** is new and not yet in the GDD. Everything else restates an established fact. Never name another game in any player-facing text taken from this file. Headings start at level 4 so that tools/merge_gdd_v3.py can nest them under A11.7.*

##### 1. World premise and town history

###### 1.1 Established
- Pitch: "Help a sleepy little town get its sparkle back, one messy home at a time, and do one tiny real thing at home along the way."
- You play Puff the dust bunny in a small pixel town of seven areas. The Town Square is the hub. The other areas are Puff's burrow and yard, Neighbour Lane, Riverside (opens day 3), the Woodland edge (opens day 5), and the Beach and lighthouse.
- Colour floods back wherever Puff cleans. Puff starts Day 1 in a dim, grey burrow bedroom.
- The year has 4 seasons of 14 days each (56 days). Each season has one festival: Spring Clean Fair, Summer Picnic, Autumn Leaf Fest and Winter Lights.
- The long goal is to restore all six neighbour homes and relight the Town Square fountain by Day 56. At 8 hearts, Mabel's old maps reveal the fountain's history. At 10 hearts, the lighthouse and the fountain relight together.
- Heart events reveal why a home got messy ("a new baby, a busy season, feeling low"). The game never shames anyone for mess.

###### 1.2 Town history (Proposed)
- **The town is Hollowfern (Decided).** Its old saying is "Many paws, light work." The Town Square fountain, the **Glimmerwell (Decided)**, was built by the first settlers. Each spring, everyone brought one small clean thing to it, such as a polished spoon or a washed ribbon, and dropped it in with a wish. The water caught the light from the lighthouse across the bay and threw sparkles all over town. That shared glow is where the town's colour came from.
- **Why the fountain went dark (Proposed).** Nobody did anything wrong. A few years ago, a long wet winter was followed by a very busy spring. Hazel's rush doubled, Otto's uncle passed away, Pip's friend moved away and Mabel's eyes grew tired. Everyone got a little too busy or a little too low, so the spring gathering was skipped "just this once", and then again the next year. Mabel stopped climbing to light the lamp. Without its light and without the yearly gathering, the Glimmerwell went still and the colour faded slowly, like a photo left in the sun.
- **Why homes fell into mess (Proposed).** Mess in Hollowfern is a sign that life got heavy, never a judgement. Each neighbour's home holds the weight of their own story (section 3). As homes get messier, people visit each other less, and each neighbour thinks they're the only one struggling. Hollowfern's real problem is that everyone is quietly lonely. The dirt is just how that shows.
- **The moral, which the game never says out loud:** you don't have to fix everything. One small thing, done kindly, done together, is enough to start.
- **The colour rule (Proposed lore for the art direction):** colour comes back where care happens. That's why cleaning, gifts and friendships all brighten the town, and why the fountain needs everyone's colour, not just Puff's.

##### 2. Puff

###### 2.1 Established
Puff is a dust bunny who lives in a burrow. The burrow's rooms are the Kitchen Nook, Living Room and Bedroom, and it grows in 3 upgrade steps. Fluff is Puff's stamina: Puff yawns below 20 Fluff, and if Puff stays up past 2:00 they doze off and wake at home, free, with half Fluff. Each morning Puff sends a letter suggesting one tiny real chore, and skipping it is always fine. Puff never speaks down to anyone and is never sad, sick or angry about the player. Puff is 24×24 px in the world and 48 px in menus and dialogue. Pronouns: v2 uses "they".

###### 2.2 Backstory (Proposed)
*Origin Decided by Story Lead (2026-10-27).* Puff gathered together out of the soft fluff and forgotten bits under the Glimmerwell's stone rim: lint from scarves, a thread from a festival ribbon, a little of the last sparkle the fountain ever threw. Puff wakes in an empty, grey burrow that nobody has lived in for years, knowing only one thing: *where I tidy, colour comes back.* Puff has no memories, just a warm feeling that the town used to sparkle and could again. Puff doesn't know they came from the fountain. Mabel's maps (8 hearts) show a drawing of "the Well's little keeper, born of what the town lets fall", and the player works it out before Puff does.
- Dust bunnies are normally the thing you sweep away. Puff is the reverse: proof that even forgotten fluff can hold some warmth. This is Puff's quiet tie to the "never shame mess" rule.

###### 2.3 Motivation, quirks and voice (Proposed)
- **Want:** see Hollowfern sparkle. **Need:** to belong. Puff is the newcomer who makes a home by helping others make theirs.
- **Quirks:** sneezes when happy ("pff!"). Hops into dust piles. Names their tools ("Spongey", "Sir Duster"). Can't resist putting a sock in a basket. Hums while scrubbing. Gets sleepier and rounder as Fluff drops. Keeps one thing from every restored home in a "memory jar".
- **Voice:** short, bright, curious. Mostly present tense. Lots of small wonder ("Ooh."). Never sarcastic and never sighs at mess. When Puff praises someone, it's for what they did or felt, never how they look. Puff asks before helping. Every line is 60 characters or fewer for localisation.
- **Sample lines:**
  - Waking on Day 1: "Ooh. Grey. Let's fix that."
  - First clean: "Look! Colour came back!"
  - Low Fluff: "Getting fluffy-sleepy... one more?" / "Snack time, maybe."
  - Dozing off at 2:00: "Zzz... just resting my fluff."
  - Clutter put in the wrong place: "Close! Socks live in the basket."
  - Meeting a neighbour: "Hi! I'm Puff. I like tidying. Can I help?"
  - A missed request: "Hazel found her rolling pin! All good."
  - Coming back after time away: "You're back! I saved you a sparkle."

###### 2.4 The real-chore hook (warm, no guilt)
Established: the morning letter offers one tiny chore matched to what Puff cleaned yesterday, at 5 a day max. It never blocks progress, and skipping is fine. The Our Home scrapbook collects stickers.
- **Proposed framing:** Puff writes because Puff loves hearing about the player's home. Letters are never homework. Every letter ends with the same two choices, "I did it!" and "Not today", and both get the same warm reply.
  - Example: "Dear friend, I polished Hazel's counter. My paws sparkle! Maybe wipe one counter of yours? Or just have tea. Both are lovely. ♥ Puff"
  - After the daily cap: "That's loads today. Rest counts too."
- **Proposed:** in the year-1 finale, Puff drops one Our Home sticker into the Glimmerwell, "for your home, too". This holds even with zero chores ticked: the sticker becomes "a cosy day", so no player is left out.

###### 2.5 Growth across the year (Proposed)
- **Spring:** a curious stranger. Learns names, then learns that mess has stories. Arc beat: "I thought I was here to clean. I'm here to help."
- **Summer:** belonging. Gets invited to things, not just asked for help. Learns to rest (the dozing-off scene is played for comfort).
- **Autumn:** a wobble. Puff finds out the colour is fading at the edges of their own fur, because the fountain is still dark. Puff isn't sick and doesn't suffer. It's a gentle mystery, and the neighbours now look after Puff.
- **Winter:** the gift returned. Puff learns where they came from (Mabel 8) and that the fountain needs everyone, not just Puff. The finale is the town doing the "Many paws" gathering again. Puff has stopped being the town's cleaner and become its friend.

##### 3. Neighbours

*Established for every neighbour: home, personality, the Loves column, the heart unlocks from v2, and talk +1, liked gift +3, loved gift +8, request +10, 10 points a heart, hearts never drop. v3 A7 outlines are placeholders, so I've kept them where they work and overruled some (listed in 8.4). Likes, dislikes, secrets, routines and speech patterns are all **Proposed**. "Remembers" means the event reads save flags (section 7).*

###### 3.1 Hazel the hedgehog (bakery kitchen) · free
- **Personality (established):** busy, warm, a bit frazzled. **Loves (established):** fresh bread, flowers. **Likes:** berries, honey, a clean apron. **Dislikes:** clay, mud ("Not near the dough, petal!").
- **Want or wound:** to be needed. She's afraid that if she stops, she'll stop mattering. **Secret:** her gran's tart recipe has a missing step she has never been able to remember.
- **Routine:** bakes from 6:00 to 11:00, has the shop open 11:00 to 17:00, and falls asleep in a chair by 21:00. Closed on day 7 of each week after her 6-heart event.
- **Speech:** quick, calls everyone "petal", stops mid-sentence to check the oven. "Puff, petal, could you just — oh, the buns!"
- **Relationships:** feeds Pip, who's like a son to her. Old rival of Bea over who has the best window. Sends Otto loaves, unasked, since his uncle died.
- **Hearts:** 2: the oven has been grimy since the morning rush doubled (A7). Remembers whether the player cleaned her counter in the onboarding request. 4: Puff finds her asleep standing up. She admits she bakes for everyone but never sits down. 6: a recipe for cooking snacks (C6). Puff helps her paint a "Closed Sundays" sign, in the colour the player chooses, which stays visible in town. 8: she teaches Puff her gran's tart, the missing step is "share it while it's warm", and the player can choose who gets the first tart. 10: she holds a tea for Puff with her feet up, and the guest is whoever Puff gave the first tart to.

###### 3.2 Bea the bee (flower shop) · free
- **Personality (established):** organised, chatty. **Loves (established):** honey, rare seeds. **Likes:** flowers, string, notebooks. **Dislikes:** weeds, crumbs.
- **Want or wound:** to be perfect so no one is let down. **Secret:** she has never let a single flower grow wild.
- **Routine:** opens at 8:00 sharp, lists from 13:00 to 14:00 in the back room, walks the Riverside at 18:00.
- **Speech:** buzzy lists, numbering her own sentences. "Three things! One: hello. Two: seeds. Three: did I say hello?"
- **Relationships:** a friendly window war with Hazel. Pip's toys are the one mess she secretly adores. She waters Moss's doorstep plants without telling him.
- **Hearts:** 2: the front shop is perfect and the back room is chaos (A7). 4: lists everywhere. She's scared of letting anyone down, and Puff helps her throw out one list. 6: greenhouse unlocked. 8: she lets Puff design the window display, which shows the player's choice of three items. 10: she plants a flower bed for Puff with no plan at all, made from seeds the player has gifted her.

###### 3.3 Pip the mouse (toy workshop) · free
- **Personality (established):** creative, messy. **Loves (established):** buttons, string. **Likes:** silk thread, shells, clay. **Dislikes:** soap ("It's for later!").
- **Want or wound:** connection. Every toy was made for Wren, a friend who moved away (Decided). **Secret:** Pip has a letter from Wren he's never opened, because he's scared it says goodbye.
- **Routine:** sleeps until 10:00, works until 2:00, pops out to Hazel's for crumbs around 15:00.
- **Speech:** tumbling, invents words, ends lines with "...right?" "It's a bunny-copter! Kind of. Right?"
- **Relationships:** Hazel's surrogate son. Moss's only regular library visitor. Makes Otto bath toys.
- **Hearts:** 2: half-finished toys on every surface (A7). 4: each toy was for Wren. 6: bag upgrade. Puff and Pip finish one toy together, and its colour comes from the button the player gifts. 8: Pip mails the toy, and Puff helps him finally open Wren's old letter (overrule: adds the unopened letter). 10: a reply arrives, warm, with a drawing of the toy. Pip opens the workshop to the town, and a toy of Puff appears on the shelf.

###### 3.4 Otto the otter (Riverside bathhouse) · Plus
- **Personality (established):** cheerful, loves bubbles. **Loves (established):** shells, soap. **Likes:** fresh bread, fibre, river stones. **Dislikes:** cobwebs, silk thread.
- **Want or wound:** grief. The bathhouse belonged to his late Uncle Brook (Decided), and he isn't sure he's good enough. His cheerfulness is partly a cover. **Secret:** he can't swim very well.
- **Routine:** fishes at 6:00, polishes the brass from 10:00 to 16:00, and sits alone on the jetty at 20:00.
- **Speech:** puns about water, laughs a lot, goes quiet when he talks about Brook. "Water you up to, Puff? Heh. Heh."
- **Relationships:** Hazel's loaves keep him going. Mabel was Brook's best friend. Pip's bath toys are lined up on his windowsill.
- **Hearts:** 2: soap scum and a closed bathhouse (A7). 4: it was Brook's, and he isn't sure he's good enough. 6: Silver squeegee recipe and reopening day, where the first guests are the neighbours with the most hearts. 8: he adds a bubble bath for tired neighbours and admits he can't swim, so Puff and Otto paddle in the shallows. 10: a bath-night party for the whole town. Mabel tells a story about Brook, and Otto laughs for real.

###### 3.5 Moss the mole (dusty burrow library) · Plus
- **Personality (established):** shy, bookish. **Loves (established):** books, mushrooms. **Likes:** tea, old maps, lint. **Dislikes:** loud bubbles, flowers (they make him sneeze).
- **Want or wound:** to be around people without wearing himself out. The library became his hiding spot (A7). **Secret:** he writes stories and has never shown anyone.
- **Routine:** opens 10:00 to 16:00 behind closed curtains. Reads aloud to himself at 22:00, and Puff can overhear him from the doorway.
- **Speech:** few words, long pauses ("..."), very precise. "Hello. ... You may stay. Quietly. If you like."
- **Relationships:** Pip is the only one he lets in. Bea's secret plants. Mabel lends him maps.
- **Hearts:** 2: books stacked to the ceiling, curtains shut (A7). 4: people tire him out, so the library became his hiding spot. Puff offers to come back "only when you wave", and Moss gets a waving sign. 6: cellar unlocked, with a reading nook just for one. 8: he starts a quiet hour for others and shows Puff one of his stories, which is about a dust bunny. 10: Moss reads that story aloud at the fountain. It includes three things the player did that year, taken from save flags.

###### 3.6 Mabel the owl (lighthouse) · Plus
- **Personality (established):** wise, sleepy by day. **Loves (established):** tea, old maps. **Likes:** books, honey, silk thread. **Dislikes:** mud, crumbs at night.
- **Want or wound:** her eyes are tired and the climb is long (A7). She feels she's the one who let the light go out. **Secret:** she knows where Puff came from and has been waiting to see whether Puff is "the little keeper".
- **Routine:** asleep from 6:00 to 17:00. Takes visitors from 18:00 to 1:00, and lights a candle at the window in the hours the lamp should be lit.
- **Speech:** slow, owlish, rhyming proverbs. "Hoo. Many paws, light work."
- **Relationships:** Brook's best friend, now keeping an eye on Otto. The town's memory. She knew Hazel's gran.
- **Hearts:** 2: salt-crusted windows, the light's off (A7). 4: her eyes are tired and the climb is long. Puff fixes the stair rail. 6: lamp-night event unlocked (C3, Accepted). 8 (established): old maps reveal the Glimmerwell's history, the "Many paws" gathering and the drawing of the little keeper. Remembers how many homes are restored. 10 (established): the lighthouse and fountain relight together. This is the year-1 finale (section 4).

##### 4. Year-1 arc

###### 4.1 Spring (days 1–14, free): "Something's waking up"
- **Beats:** Puff wakes and restores the burrow. Meets Hazel, Bea and Pip. The town goes from grey to the first pastels. Goal by day 14 (established): 3 homes restored and the first festival.
- **Festival, the Spring Clean Fair (established, day 14):** Proposed beat: the town gathers in the square for the first time in years, because Puff's three friends put up posters. In the fair mini-game, everyone tidies the square together. At the end, the Glimmerwell trickles. It's one drop, then a faint shimmer, the first sign the fountain can come back. Hazel, Bea and Pip each thank Puff by name for something the player did. Fireworks, then a reveal clip.
- **The emotional high before the offer:** spring is a complete story. It ends: "Hollowfern remembered how to gather." The free arc closes fully: three friends, a trickling fountain and a party.
- **Plus offer (established timing: after the fair, never mid-task; capped at once per in-game week after a dismiss, C5 Accepted):** shown only after the fair has ended and the player is back home. Proposed framing is a postcard rather than a wall: "Spring is free. Summer, autumn and winter need Plus." It shows Otto, Moss and Mabel as silhouettes and promises "more friends, more seasons". "Not now" is the bigger, equal button. Puff's reply is the same either way: "Best spring ever." Free players can keep playing spring (the lapse and freeze rules are in the GDD).

###### 4.2 Summer (days 15–28, Plus): "Belonging"
- Riverside and Otto. Bathhouse reopening day. Puff gets invited to things, not just asked for help.
- **Festival, the Summer Picnic (established):** Proposed beat: a picnic by the river where everyone brings a dish. The mini-game is setting the blanket. Otto laughs for the first time without a pun, and the fountain's trickle becomes a small arc.

###### 4.3 Autumn (days 29–42, Plus): "The wobble"
- The Woodland edge, Moss and the library. Puff's fur dims at the edges (Proposed), and the neighbours start caring for Puff: snacks left at the door, Hazel's tart.
- **Festival, the Autumn Leaf Fest (established):** Proposed beat: leaf piles and a lantern walk to Moss's library. Moss joins in for one minute. That's his victory, and everyone claps quietly.

###### 4.4 Winter (days 43–56, Plus): "Many paws"
- The Beach, lighthouse and Mabel, unlocking on day 43 (C1, Accepted). Mabel 8: the maps and Puff's origin.
- **Festival, Winter Lights (established), as the finale:** Proposed beat: on day 56, all six neighbours walk to the square with one small clean thing each, which the player helped them find. Mabel climbs the lighthouse with Otto's help and Puff drops the Our Home sticker in. The lighthouse and fountain relight together (established), colour sweeps over the whole map, and Puff's fur is bright again. Moss reads his story. Credits roll over a montage of the reveal clips.
- **Note:** if Mabel hasn't reached 10 hearts by day 56, the finale waits for her. Proposed: the fountain is still very bright, and the finale plays whenever Mabel reaches 10 hearts. It's never lost and has no deadline.

##### 5. First 30 minutes (story layer on A6)

*A6 timings and steps are established and kept. The lines are **Proposed**.*
- **Hook (0:00):** title, "Let's tidy!", then grey. A single sparkle drifts down onto a lump of fluff in a dim, grey burrow bedroom. It sneezes ("pff!"): that's Puff. "Ooh. Grey. Let's fix that."
- **Puff's intro (0:15–1:30):** tapping to walk, Puff explores the burrow. Dusting the first patch floods it with colour: "Look! Colour came back!" Putting the sock away: "Socks live in baskets. I just know it."
- **The first room (2:30–5:00):** the Kitchen Nook stain takes three hits ("Spongey, go!"). The Fluff hint is a yawn. At the 95% burrow reveal: "It's... a home. Is it mine?" A tiny cushion appears: "It's mine."
- **Yard (6:30):** planting radishes: "Grow big. No rush."
- **The first neighbour (9:00), Hazel at the bakery door:** "Oh! A dust bunny! I mean, hello, petal! Tart? You look peckish." She hands over the Berry tart. The notice board request: "Dust Hazel's shop counter." Clearing it sets a flag that her 2-heart event remembers. Bea and Pip are met on Neighbour Lane ("Three things! One: hello!" / "Is that a real bunny? Can I draw you? Right?").
- **Evening and bed (17:00–20:00):** "Puff's getting sleepy. Head home to bed." The first letter is written in Puff's voice as in section 2.4. The hook question to leave the player with (Proposed): from the window, Puff sees the dark fountain. "Why is that so quiet?"
- No paywall, sign-in or rating prompt (established).

##### 6. Living-world detail

###### 6.1 Dialogue pool rules (Proposed)
- **Each neighbour has pools tagged by:** `season`, `weather` (sunny/rainy/windy/snowy), `timeBand` (morning 6–11, day 11–17, evening 17–22, night 22–2), `heartsMin`/`heartsMax`, `area`, and optional `flags`.
- **Selection order:** the most specific match wins (flag > hearts > weather > season > time > generic). Within a tier, pick a random line that hasn't been seen in the last 5 talks (saved). Talking once a day gives +1 (established), and after that the neighbour gives short "busy" lines with no extra points.
- **Minimum pool sizes:** 3 lines per season, plus 2 per weather, 2 per time band and 3 per heart band (0–2, 3–5, 6–8, 9–10). That's about 40 lines per neighbour per year.
- **Rules:** no guilt words (the banned list from the GDD: "failed", "overdue", "lazy", "lost"), no talk about bodies or appearance, and no complaints about the player. A missed request gets a "no worries" line.

###### 6.2 Reactive gossip (Proposed)
After a home reveal, a heart event or a festival, the other neighbours get a one-day gossip line, e.g. Bea: "Three things! Hazel sat DOWN. Two: in a chair. Three: wow." Gossip is always about something good. At most one gossip line per neighbour per day.

###### 6.3 Letters (Proposed)
- Puff's morning chore letter (established) comes first. Neighbours sometimes add a short note: thanks after a request, an invitation to a heart event, or a festival poster. Max 2 notes a day.
- The Our Home scrapbook gets a sticker for every chore ticked (established), plus "cosy day" stickers for rest days.

###### 6.4 Small mysteries (Proposed)
1. **The night humming:** a tune is heard near the square at night in spring. It turns out to be Moss reading aloud (his autumn story). The payoff is the Moss 10 heart event.
2. **The unopened letter:** a sealed envelope sits on Pip's shelf from day 2. It's from Wren, and it's opened at the Pip 8 heart event.
3. **The sparkle on Puff's fur:** at the start, one fleck of Puff's fur doesn't match the palette. It's the fountain's last sparkle, and its payoff is Mabel 8.
4. **The window candle:** a light appears in the lighthouse window at night, visible from the beach path from day 1. It's Mabel keeping the hours, and it pays off when the player meets her.
5. **Hazel's missing step:** the gran's tart tastes "nearly right" in spring. The payoff is Hazel 8.

##### 7. Pack JSON example (Hazel, 8 hearts)
Proposed shape, to be validated against the pack schema (the neighbours → heart events field in the GDD). The ids are stable and the text lives in string tables.
```json
{
  "id": "he_hazel_08",
  "neighbourId": "hazel",
  "hearts": 8,
  "trigger": { "type": "enterArea", "areaId": "bakery_kitchen", "timeBand": ["morning"] },
  "conditions": {
    "heartsMin": 8,
    "seen": ["he_hazel_06"],
    "notWeather": [],
    "notFestivalDay": true,
    "fluffMin": 0
  },
  "scene": [
    { "speaker": "hazel", "line": "he_hazel_08.l01", "emote": "flour_puff" },
    { "speaker": "puff",  "line": "he_hazel_08.l02" },
    { "speaker": "hazel", "line": "he_hazel_08.l03", "if": { "flag": "onboard_counter_done" } },
    { "speaker": "hazel", "line": "he_hazel_08.l03b", "if": { "notFlag": "onboard_counter_done" } },
    { "choice": "he_hazel_08.c01", "options": [
        { "label": "he_hazel_08.c01.bea",  "setFlag": "first_tart_bea" },
        { "label": "he_hazel_08.c01.pip",  "setFlag": "first_tart_pip" },
        { "label": "he_hazel_08.c01.self", "setFlag": "first_tart_hazel" } ] },
    { "speaker": "hazel", "line": "he_hazel_08.l04" }
  ],
  "rewards": { "recipe": "gran_tart", "sparkles": 0 },
  "setFlags": ["he_hazel_08_done"],
  "skippable": true
}
```
English string table (`en-AU`):
```json
{
  "he_hazel_08.l01": "Puff, petal! Gran's tart. Help me get it right?",
  "he_hazel_08.l02": "Ooh. Yes please!",
  "he_hazel_08.l03": "You dusted my counter on your very first day.",
  "he_hazel_08.l03b": "You've helped so much this spring, petal.",
  "he_hazel_08.c01": "The missing step: share it while it's warm. Who first?",
  "he_hazel_08.c01.bea": "Bea",
  "he_hazel_08.c01.pip": "Pip",
  "he_hazel_08.c01.self": "You, Hazel!",
  "he_hazel_08.l04": "Warm and shared. Gran would be proud."
}
```
**Localisation notes:**
- Lines are 60 characters or fewer in English, so leave about 40% room to grow for other languages.
- No puns that a scene depends on. Otto's puns have a non-pun alternative key (`.alt`), and translators may use either.
- "petal" is a term of endearment, so translate it to the local equivalent.
- Neighbour names are localisable, so use ids, never names, in logic.
- Avoid gendered grammar for Puff ("they" in English). Translators should pick neutral forms or a noun ("the bunny").
- Use a plural-aware format (ICU) for counts. No text inside images.
- Australia launches first, so `en-AU` spelling ("colour", "neighbour") is the source.

##### 8. Timeline, open threads, decisions and clashes

###### 8.1 Timeline (Proposed unless marked)
- **Years before the game:** the Glimmerwell gathering lapses, Brook dies, Wren moves away, and Mabel stops climbing to light the lamp.
- **Day 1:** Puff wakes and meets Hazel, Bea and Pip (established beat).
- **Day 3:** Riverside opens (established). **Day 5:** the Woodland edge opens (established).
- **Day 7:** 1 home restored (established target). **Day 14:** the Spring Clean Fair, the first trickle, then the Plus postcard.
- **Days 15–28:** Otto and the Summer Picnic. **Days 29–42:** Moss, the fur wobble and the Autumn Leaf Fest.
- **Days 43–56:** Mabel, her 8-heart reveal and Winter Lights. **Day 56:** the lighthouse and fountain relight (established).

###### 8.2 Open threads
- Year 2 hook (Proposed): a letter from Wren saying "Can I come home?", a seventh neighbour.
- Weekly visitors (in Plus, established) need story roles.
- The optional puzzle cellar (in the GDD as "later") could hold the first settlers' things.

###### 8.3 Decision log (draft)
- **Decided by Story Lead (2026-10-27):** the town's name (Hollowfern), the fountain's name (Glimmerwell), the "Many paws, light work" saying, and Puff's origin (the fountain's fluff and last sparkle).
- **Decided by Story Lead (2026-10-27):** Puff uses "they". **Proposed:** The fountain went dark from no one's fault. A finale that hasn't triggered by day 56 waits for Mabel, with no deadline.
- **Decided by Story Lead (2026-10-27):** new character names Wren and Uncle Brook.
- **Accepted 2026-10-27 by BB Manager:** C1 Beach and lighthouse unlock on day 43; C2 Mabel 3-heart reward is an old shore map; C3 Mabel 6-heart is a lamp-night event, not a festival; C5 Plus offer capped at once per in-game week after a dismiss; C6 the Copper recipe is sold at the General Store from day 5, and Hazel 6-heart gives a snack recipe. Builder adds: the Beach can also open at Otto 3 hearts.
- **Locked:** milestone order follows v2: all 6 neighbours in M2, neighbours 4–6 behind Plus.
- **Proposed:** the Plus offer is a postcard after the fair, back at home, with an equal "Not now" button.

###### 8.4 Clashes with the GDD and overrules of A7
- **C1 Beach unlock vs Mabel:** v2 opens the Beach and lighthouse at 3 hearts with Mabel, but Mabel lives at the lighthouse, so the player can't earn hearts before reaching her. Proposed: the Beach opens at the start of winter (day 43) or after Otto 3 hearts, since he knew Brook's friend. **Accepted 2026-10-27 by BB Manager:** the Beach and lighthouse unlock on day 43.
- **C2 Mabel's 3-heart woodland map vs the Woodland edge opening on day 5:** that unlock is redundant. Proposed: Mabel's 3-heart reward becomes the "old shore map" mystery item. **Accepted 2026-10-27 by BB Manager:** Mabel's 3-heart reward is an old shore map.
- **C3 Mabel's 6-heart "night festival" vs one festival per season:** proposed: make it a night event or "lamp night", not a festival, or fold it into Winter Lights. **Accepted 2026-10-27 by BB Manager:** her 6-heart event is a lamp-night event, not a festival.
- **C4 Free-tier Mabel:** Mabel is Plus, so free players never see the fountain's history. Proposed: free spring ends at the first trickle, which is a complete beat on its own.
- **C5 Plus offer frequency:** v3 A2 and the backend section say "at most once a day", while the older v3 backend text in v3-sections/backend.md says "once per in-game week after a dismiss". The story prefers the weekly rule (it's less pushy). **Accepted 2026-10-27 by BB Manager:** capped at once per in-game week after a dismiss.
- **C6 Hazel's 6-heart Copper sponge vs "crafted a Copper tool by day 7":** a 6-heart event by day 7 is unlikely. The Copper tool on day 7 needs another recipe source. **Accepted 2026-10-27 by BB Manager:** Builder sources the day-7 Copper tool recipe elsewhere.
- **C7 Pronoun for Puff:** v2 uses "they". **Decided by Story Lead (2026-10-27):** "they".
- **Overrules of A7:** Hazel 8 adds the missing step and the "who gets the first tart" choice, and Hazel 10 adds the remembered tart guest. Bea 4 adds throwing out one list, and Bea 10 says the seeds come from the player's gifts. Pip 8 adds the unopened letter from Wren. Otto 8 adds his secret (he can't swim), and Otto 10 adds Mabel's story about Brook. Moss 4 adds the waving sign, Moss 8 adds his story about a dust bunny, and Moss 10 says the story mentions the player's actions. Mabel 4 adds the stair rail, and Mabel 8 adds Puff's origin. Apart from these, the A7 beats are kept word for word.


## Part B: GDD v2 text (kept in full; Part A wins where they differ)

Sweet Home Reset: Game Design Document
v2
  ​Oct 27, 2026      · ​@No j · Draft for team review

Overview
Sweet Home Reset becomes a cosy life sim in the style of Stardew Valley, built around
cleaning: you play as Puff the dust bunny, walking a small pixel town, restoring messy
homes, helping neighbours and growing a little life. It replaces the current single-screen
"scrub a room" loop, which testing found repetitive and slow.

Pitch: Help a sleepy little town get its sparkle back, one messy home at a time, and do one
tiny real thing at home along the way.

Pillars

 1. Every action feels good. Tools have weight, sound and a visible reveal: colour floods
    back where Puff cleans.
 2. A world worth walking around. A town, neighbours, a garden and seasons give reasons
    to explore and come back.
 3. Fair challenge. Fluff (stamina), a daily clock and tougher messes make choices matter.
    Falling short costs time, never progress.
 4. Real life counts. One tiny real chore a day feeds the game, the hook no other cleaning
    game has.
 5. Made to share. House reveals, town photos and Puff are built to be posted.

Audience: adults (16+) who play cosy games (Stardew Valley, Animal Crossing,
Unpacking) and watch cleaning and organising videos. Mobile first, playable on web.

Session shape: one in-game day takes about 14 minutes of play (starting value); players
can stop at any time and pick up where they left off.

Core loop
Each in-game day is a loop of planning, three kinds of daytime work that compete for Fluff
and hours, then spending and rest.


a day in Puff's town · 7 steps, one loop

Cleaning homes is the heart of the day; the garden and foraging feed it with snacks and
materials. Over a week, requests and friendships build up. Over a season, homes get
restored, tools upgrade and a festival caps it off.

Puff and controls
You play as Puff, and everything is done with one thumb: tap to walk, tap a thing to use the
right tool on it.

     Tap the ground: Puff walks there along the shortest path around furniture and walls.
     Tap a mess, plant or object: Puff walks next to it, turns to face it and uses the tool that
     fits (if Puff owns one). Tapping again repeats the action.
     Tap and hold a mess: a charged use with an upgraded tool cleans a bigger area (3×1 at
     tier 2, 3×3 at tier 3), costing more Fluff.
     Tap a neighbour: talk, give the held item as a gift, or accept a request.
     Tool bar: 6 slots along the bottom. Tapping a slot selects it; auto-select picks the right
     tool when Puff faces a mess (can be switched off in Settings for players who want
     manual control).
     Bag: opens from the bar. Holds collected clutter, materials, seeds, snacks and gifts
     (starts at 12 slots, upgradable).
     Doors and paths: walking onto a doorway or a map edge moves to the next area with a
     short fade.


     Camera: follows Puff, top-down at about 45 degrees, whole-number pixel scaling so
     the art stays crisp.

Keyboard and mouse work on web (arrow keys or WASD to walk, Space to use, number
keys for the tool bar).

World and areas
The town is seven small areas joined by paths, with the Town Square as the hub; each area
is a tile map of about 40×30 tiles, and every home has its own interior map.

town map · 7 areas linked by paths

     Start of the game: Puff's burrow, yard, Town Square and Neighbour Lane are open.
     Riverside opens on day 3, the Woodland edge on day 5, and the Beach and lighthouse
     at 3 hearts with Mabel.
     Interiors: each neighbour home has 2–4 rooms of mess. The three current rooms
     (Kitchen Nook, Living Room, Bedroom) become rooms in Puff's burrow.
     Maps are data: areas, homes and their mess are loaded from pack files, so new homes
     and seasonal changes ship without an app update.

Cleaning and tools
Mess lives on the tile grid (16 px tiles). Each mess tile has hit points; every tool use
removes some, and colour floods back into the tile and its neighbours as it clears (the
colour-reveal from Phase 1, now per tile).


  Mess                   Where               Tool           Hits       Drops
                                                            (tier 1)

  Dust                   Floors, shelves     Duster         1          Lint (crafting)

  Stain                  Floors, counters,   Sponge         3          Nothing
                         rugs

  Grime                  Ovens, tubs, old    Sponge (tier   6          Sometimes a lost coin
                         houses              2+)

  Cobweb                 Corners, ceilings   Duster         2          Silk thread

  Crumbs                 Under tables,       Vacuum         1          Crumbs (garden compost)
                         sofas

  Fog                    Windows, mirrors    Squeegee       1          Nothing

  Clutter                Anywhere            Hands          Pick up    The item, to put away, gift
                                                                       or recycle

  Weeds,                 Yards, paths        Rake           2          Fibre, leaves
  leaves

  Mud                    Paths after rain    Broom          3          Clay

Tool tiers: every tool upgrades from Basic → Copper → Silver → Sparkle. Each tier adds
power (fewer hits) and a bigger charged area, and is crafted at the bench (see Garden,
materials and crafting).

Clutter is the puzzle part of cleaning: each item has a home (books to shelves, cups to the
sink, socks to the basket). Putting an item away gives a small bonus; wrong spots are
allowed and simply don't score.

Housework jobs: a home counts as restored at 95% of its mess cleared; the rest sparkles
away, followed by the house reveal (before and after).

Fluff, the clock, days and seasons
Fluff is Puff's stamina and the day's main limit: 100 Fluff to start, every tool use costs
some, and snacks or rest refill it. All numbers below are starting values for playtests.

Fluff

     Tool use: 2 Fluff (charged use 5–8). Walking and talking are free.
     Under 20 Fluff, Puff yawns and slows down; tool uses cost 1 more.
     At 0, Puff can't use tools. Puff can still walk, talk, shop and decorate, or head to bed.


     Snacks restore 10–60 Fluff (garden produce, café treats, cooking).
     Max Fluff grows by 10 with each Fluff upgrade (friendship rewards, a found "Cosy
     Charm").

The clock

     A day runs 6:00 to 2:00 the next morning; 10 game minutes = 7 real seconds, so a full
     day is about 14 minutes.
     Shops and neighbours keep hours; some requests can only be done at certain times.
     Going to bed saves the game, refills Fluff and starts the next day.
     Staying up past 2:00: Puff dozes off where they stand and wakes at home next
     morning with half Fluff. Nothing in the bag is lost (a gentler rule than Stardew's money
     penalty; the team may want a small cost here).

Days and seasons

     4 seasons of 14 days (a 56-day year), each with its own weather, crops, mess types and
     colours.
     Weather: sunny, rainy (mud on paths, plants watered for free), windy (more leaves),
     snowy in winter.
     One festival per season: Spring Clean Fair, Summer Picnic, Autumn Leaf Fest, Winter
     Lights. Each has a mini-game and limited-time decor.
     Real-time option: Settings can tie the in-game season to the real month for players who
     like that.

Neighbours and friendships
Six neighbours at launch, each with a home to restore, a personality, likes and dislikes, and
a 10-heart friendship track. Names and species are placeholders for the team to change.

  Neighbour                Home             Personality       Loves          Unlocks at hearts

  Hazel the                Bakery           Busy, warm, a     Fresh bread,   3: café snacks · 6:
  hedgehog                 kitchen          bit frazzled      flowers        Copper sponge
                                                                             recipe

  Otto the                 Riverside        Cheerful, loves   Shells, soap   3: bubble bath · 6:
  otter                    bathhouse        bubbles                          Silver squeegee
                                                                             recipe

  Bea the bee              Flower shop      Organised,        Honey, rare    3: seed discount · 6:
                                            chatty            seeds          greenhouse


  Neighbour                Home             Personality       Loves           Unlocks at hearts

  Moss the                 Dusty burrow     Shy, bookish      Books,          3: storage chest · 6:
  mole                     library                            mushrooms       cellar

  Pip the                  Toy workshop     Creative,         Buttons,        3: decor recipes · 6:
  mouse                                     messy             string          bag upgrade

  Mabel the                Lighthouse       Wise, sleepy by   Tea, old maps   3: woodland map · 6:
  owl                                       day                               night festival

Friendship: talking (once a day) +1 point, a liked gift +3, a loved gift +8, finishing their
request +10; 10 points per heart. Hearts never go down.

Requests: the notice board shows 1–3 jobs a day (clean a room, find an item, deliver a
snack). Requests have a soft deadline of 2–3 days; a missed one just goes away, and the
neighbour is fine.

Heart events: at 2, 4, 6, 8 and 10 hearts, a short scene reveals the neighbour's story and
why their home got messy (a new baby, a busy season, feeling low). These stay gentle and
never shame anyone for mess.

Tone: short lines, kind humour, no guilt. Puff never speaks down to anyone, and
neighbours never complain about the player.

Garden, materials and crafting
The garden feeds Puff (Fluff snacks) and the shop (Sparkles); materials from cleaning and
foraging feed the crafting bench, which is how tools and the house improve.

Garden

     A 6×4 plot behind Puff's house at the start, expandable to 12×8.
     Loop: rake the soil, plant seeds, water daily (watering can), harvest. Rain waters for
     free.
     4 crops per season to start (e.g. spring: strawberries, radish, peas, tulips), 3–10 days to
     grow.
     Unwatered plants pause; they never die.
     Crops become snacks (Fluff), gifts, cooking ingredients, or sell for Sparkles.

Materials come from cleaning (lint, silk thread, clay, lost buttons), foraging in the
woodland (twigs, berries, mushrooms, pebbles) and the river (shells, sea glass).

Crafting bench (in Puff's house):


  Recipe                      Made from                                   Gives

  Copper sponge               10 lint, 5 clay, 200 Sparkles               Sponge tier 2

  Silver squeegee             8 sea glass, 4 silk thread, 600 Sparkles    Squeegee tier 3

  Storage chest               20 twigs, 5 buttons                         24 extra item slots

  Sprinkler                   6 pebbles, 4 clay                           Waters 8 tiles each morning

  Cosy rug                    15 lint, 10 fibre                           Decor

  Berry tart                  3 berries, 1 flour                          +40 Fluff snack

Home upgrades: Puff's burrow grows in 3 steps (bigger kitchen, a bedroom with more
decor slots, a cellar), paid with Sparkles and materials.

Economy and shop
Sparkles stay the single in-game currency, earned only by playing and never sold for real
money; a typical early day earns 150–300 Sparkles (starting value).

  Source                                    Sparkles      Sink                     Price

  Room restored for a                       50–150        Seeds                    10–60 a packet
  neighbour

  Request completed                         30–100        Tool upgrades            200–1,500 plus
                                                                                   materials

  Crops sold                                15–120        Home upgrades            1,000–5,000 plus
                                            each                                   materials

  Found coins in grime                      5–20          Decor                    50–800

  Real chore ticked                         25            Puff outfits             90–600

  Festival prizes                           100–300       Bag and chest            300–2,000
                                                          upgrades

Shops: Bea's flower shop (seeds, plants), Pip's workshop (decor, outfits), and the General
Store (tools, snacks, bag upgrades). Shops keep hours and stock changes by season.

Rules kept from the current design: fixed prices, nothing random for sale, no loot boxes,
no paid Sparkles, no ads.


Real-chore tie-in
The real-life hook stays, now delivered as Puff's morning letter: each in-game morning
suggests one tiny real chore, and ticking it (on trust, no photo) gives an in-game boost.

     The letter: one tiny chore matched to what Puff cleaned yesterday ("You cleaned
     Hazel's oven. Wipe your stovetop?"). Skipping is always fine.
     Reward for ticking: 25 Sparkles and a Cosy Boost: +30 max Fluff for that in-game day.
     Capped at 5 real chores a real day.
     Real-life streaks are not used. A "Cosy Days" count goes up and never resets.
     Our Home: a scrapbook page in Puff's house counts real chores done, shown as
     stickers.
     Real chores never block progress: a player who never ticks one can finish everything in
     the game.

Progression and challenge
The long goal is to restore all six neighbour homes and relight the Town Square fountain;
the challenge comes from limited Fluff and time each day, messes that need better tools,
and requests that compete for the same hours.

Goals by time played (targets for playtests)

  By                                   The player has

  Day 1                                Cleaned Puff's own burrow, met 3 neighbours,
                                       planted a first crop

  Day 7                                Restored 1 neighbour home, crafted a Copper tool,
                                       2 hearts with 2 neighbours

  Day 14 (end of spring)               3 homes restored, first festival, garden expanded
                                       once

  Day 56 (end of year 1)               All 6 homes restored, fountain relit, most tools at
                                       Silver

Where the challenge comes from

     Fluff budget: a neighbour's home needs more Fluff than one day gives at tier 1, so
     players plan across days, eat snacks or upgrade tools.
     Gated messes: grime needs a Copper sponge, the lighthouse's salt-crust windows
     need a Silver squeegee.


     Time choices: shops close, neighbours keep hours, crops need watering, requests
     expire.
     Optional hard mode: "Speed Clean" timed challenges on restored homes, with best
     times and festival leaderboards (friends only).

After year 1: new seasons bring new mess events (spring storms, autumn leaf floods),
weekly visitors with homes to clean, and the house and town keep growing.

Sharing and virality
The main share moment is the house reveal: when a neighbour's home is restored, the
game makes a 6-second before/after clip on the phone, ready for TikTok, Reels and Shorts.

Built-in share moments

 1. House reveal clip (built in Phase 1, extended to whole homes): dull and messy to bright
     and decorated, Puff dancing, game name on screen.
 2. Town photo mode: pose Puff and neighbours anywhere, add a frame and stickers.
 3. Puff's home tour: a short pan through the player's decorated burrow.
 4. Mess of the Day: one seeded messy room everyone gets each day, with a Wordle-style
     result card (time, tools used, Puff emoji), no personal data.
 5. Festival moments: seasonal clips (Winter Lights over the restored town).

Marketing angles for the team

     Cleaning and organising content (#CleanTok, #oddlysatisfying) for reveal clips.
     Cosy gaming communities (Stardew, Animal Crossing fans) for the town, neighbours
     and decor.
     The real-chore hook: "the cosy game that got me to clean my room" invites creators to
     post their real before and after next to the game's.
     Puff as a mascot: stickers, emotes, a plush later.

Everything shared is made on the device from game art only, with no upload and no
personal data.

Art, audio and feel
The pixel-art rules from the current spec carry over unchanged; what changes is scale: a
tile world with a following camera instead of one fixed room.

     Pixel art: the 24-colour palette, 1 px warm-brown outlines on characters and props, one
     shade step, soft top-left light, no gradients or dithering. Whole-number scaling,
     nearest-neighbour.


     Tiles: 16×16 px. Characters on a 16×24 px body (Puff 24×24 in the world; the 48 px Puff
     stays for menus and close-ups).
     Camera: angled top-down (about 45 degrees), follows Puff with a small lead in the
     walking direction; about 11 tiles wide on a phone.
     Animation: Puff walks in 4 directions (6 frames), plus idle, blink, tool swings (4 frames
     per tool), yawn, doze and a happy hop. Neighbours get idle, walk and 3 expressions
     each.
     Colour reveal: messy areas are drained of colour; cleaning floods colour back with a
     sparkle ripple across neighbouring tiles.
     Time of day: a soft tint over the world (morning gold, afternoon clear, evening peach,
     night blue), with lit windows at night.
     Audio: a music track per season and area (synthesised or commissioned, logged in the
     licences file), tool sounds that rise in pitch as an area nears clean, footsteps per
     surface, neighbour "voice" blips.
     Haptics: a light tap per tool hit, stronger on a cleared tile, a success pattern on a
     restored home.

Accessibility and comfort
The challenge is optional to soften: a Relaxed mode and per-system settings let anyone
play at their own pace.

     Relaxed mode: Fluff costs halved, no dozing off (the day simply waits at 2:00),
     requests never expire.
     Clock speed: normal, slow (×0.5) or paused indoors.
     Reduced motion: no screen shake, fewer particles, fades instead of wipes.
     Text: respects system text size, high-contrast UI option, dialogue speed and auto-
     advance settings.
     Sound off: every sound has a visual cue; captions for sound events.
     Motor: one-thumb play throughout, no timed taps outside Speed Clean, tap targets of
     44 pt or more, hold-to-charge can be swapped for a double tap.
     Colour: mess types differ in shape and pattern as well as colour.

Platforms and monetisation
One codebase ships to web, iOS and Android (TypeScript, PixiJS, Capacitor, already built),
and the single Plus subscription stays at A$7.99 a month or A$44.99 a year.

Proposed split (for the team to decide):


  Free                                                     Plus

  The whole first spring (14 days), 3                      All four seasons, all 6 neighbours and the
  neighbours, the garden and crafting                      year-1 story

  Mess of the Day and festivals                            Weekly visitors with new homes to clean

  Real-chore letters and share clips                       Full wardrobe and decor catalogue, extra
                                                           house upgrades

     Plus is offered after the first neighbour home is restored, never during a task, at most
     once per in-game week after a dismiss (see C5).
     No ads, no loot boxes, no paid currency, no paid Fluff refills or time skips.
     Saves sync across devices after optional sign-in; the game is fully playable offline.

Decisions that change the current design docs
This document replaces parts of the 27 Oct 2026 GAME-DESIGN, FRONTEND-PLAN and
BUILD-SPEC; once approved, those files get updated to match.

  Topic                      Current docs                         This document

  Genre and                  Scrub one room in a 3–5 minute       Stardew-style town life sim, about 14
  loop                       session                              minutes per in-game day

  Movement                   Drag to clean; Puff wanders          Tap to walk and tap to use; Puff is the
                                                                  player character

  Stamina                    None; "cleaning never costs          Fluff stamina limits each day; snacks
                             Energy"                              and upgrades refill or raise it

  Never                      Nothing can be lost or fail          Falling short costs time (dozing off
  punished                                                        ends the day); items and progress are
                                                                  never taken

  Energy                     Earned from real chores, spent       Removed; real chores give Sparkles and
  currency                   on boosts                            a Cosy Boost to max Fluff

  Content unit               Room packs, one room per             Areas and homes on tile maps; new
                             screen                               homes arrive as data packs

  Free tier                  Mess of the Day, 3 starter           First spring, 3 neighbours, Mess of the
                             rooms                                Day, festivals


  Topic                      Current docs                 This document

  Puff size                  48 px frames                 24 px in the world; 48 px kept for menus
                                                          and close-ups

Unchanged: the pixel-art spec and palette, 16+ accounts, Plus pricing, no ads or loot
boxes, real-chore honour system with a 5-a-day cap, local-first saves, bundle ID and
platforms.

Build milestones
The game is built in five milestones, each one playable on a phone and reviewed by the
team before the next begins; dates are set once milestone 1 shows the pace.

build plan · 5 milestones, each with its done-when gate

Milestone 1 replaces the current room game on the test link once it is merged, so for a
while the live build will be a small walkable town rather than the three-room version.


Open questions for the team
     Dozing off at 2:00: keep it free (wake with half Fluff), or add a small cost such as 10% of
     carried Sparkles like Stardew?
     Free vs Plus: is the whole first spring the right free slice, or should all four seasons be
     free with Plus as extras only?
     Neighbour cast: species, names and personalities above are placeholders. Who writes
     their stories?
     Day length: is about 14 minutes right for phone sessions, or should days be shorter (8–
     10 minutes)?
     Combat or danger: none planned. Does the team want a light challenge area (e.g. a
     dust-storm cellar) for players who want more?
     Multiplayer: visit a friend's town (read-only) at launch, or later?
     Art: keep code-drawn pixel art, or commission or generate (Grok) character art for
     neighbours?
     Music: synthesised tracks, or commission a composer?
     Launch target: what date and which region first (Australia only, or wider)?
