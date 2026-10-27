# Sweet Home Reset: Frontend & Mobile Plan v3 (for Claude Code)
*PixelVortex Games · owner SF Frontend & Mobile Dev · v3 27 Oct 2026. Matches GAME-DESIGN.md v3 Part A (Part A wins on game rules) and BACKEND-PLAN.md (wins on API and data). The v1 room-scrub plan is in `gdd-v3/FRONTEND-PLAN-v1-backup.md`. All numbers are targets or playtest starting values, not measurements.*

## 0. Ground rules (also in /CLAUDE.md)
- One TypeScript codebase for web/PWA, iOS and Android. iPhone first, 375–430 px wide.
- Free tools only. No ads, ad SDK, IDFA, loot boxes, paid currency, paid Fluff or time skips.
- **Content is data:** areas, homes, mess, neighbours, dialogue, crops, shops and festivals all come from pack JSON. Only the free-spring packs ship bundled.
- **Every tuning number lives in `config/tuning.json`** and every price in `config/pricing.json`. Never hard-code either.
- **Local-first:** fully playable offline with no account. Sign-in is optional and only adds sync and Plus on all devices.
- No keys or tokens in code or chat. Client env names: `VITE_API_ORIGIN`, `VITE_RC_WEB_KEY`, `VITE_RC_IOS_KEY`, `VITE_RC_ANDROID_KEY`, kept in `.env` (chmod 600).
- Copy tone: a kind friend. Never "failed", "lost" or "overdue". Puff is never sad because of the player. Never name another game in player-facing text.
- Art is parked. Draw tiles and mess in code. Use placeholder sprites until Blake supplies art, and ask for a specific asset only when one is needed.
- Nothing is published, no account is created and nothing is paid for without Blake's yes.

## 1. Stack
| Layer | Choice |
|---|---|
| Renderer | PixiJS v8 (WebGL2, Canvas fallback) |
| Shell and UI | Vite + TypeScript, DOM overlay for the HUD and menus (plain Web Components) |
| Native | Capacitor: haptics, filesystem, preferences, app (deep links, back), share, status-bar, splash, secure storage, Sign in with Apple, `@revenuecat/purchases-capacitor` |
| PWA | `vite-plugin-pwa` (Workbox) |
| Storage | IndexedDB (`idb`) on web, Capacitor Filesystem in apps |
| Tests | Vitest, Playwright (WebKit and Chromium mobile emulation), Lighthouse CI, axe-core |

**Why Pixi stays:** we need baked chunk textures, sprite sorting, filters for the colour reveal and a small bundle. Our own tile and A* code is a few hundred lines, so a full engine isn't needed.

## 2. Screens (DOM over the canvas)
1. Boot and splash, with a loader until the first area's textures are ready (never a blank play area).
2. Title ("Let's tidy!"), with the 16+ confirmation saved locally.
3. World (play): the canvas plus the HUD (§6).
4. Dialogue: 48 px portrait, name, typed text (speed setting), choices, and a gift button.
5. Bag: 12 slots to start, upgradable.
6. Crafting bench, shop, wardrobe and decor: fixed Sparkle prices.
7. Morning letter and real chores: tick on trust, 5 a day, a warm cap message.
8. House reveal: the before/after clip and the share sheet.
9. Calendar: season, day, festivals and neighbour birthdays.
10. Photo mode and the Mess of the Day card.
11. Paywall (Plus): as a postcard back home after the day-14 Spring Clean Fair, or from Settings, at most once a week, never during a task.
12. Settings: sound, music, haptics, reduced motion, captions, clock speed, Relaxed mode, auto-select tool, double-tap instead of hold, high contrast, text size, sign in or out, Manage plan, Restore Purchases, Export my data, Delete my account, legal links, and the credits.
13. Sign-in sheet: email magic link and Sign in with Apple.

## 3. Engine
```
PixiApp (one canvas)
 ├─ World
 │   ├─ ChunkLayer   baked 16×16-tile chunk textures (ground, walls), rebaked when the season changes
 │   ├─ MessLayer    one sprite per mess tile, redrawn only when changed
 │   ├─ ActorLayer   props, Puff, neighbours; sortableChildren, zIndex = footY
 │   ├─ FxLayer      pooled particles (max 300; ×0.25 with reduced motion)
 │   └─ TintLayer    time-of-day overlay (world only)
 └─ Camera          follows Puff, 1-tile lead, clamped to map edges
Systems: Clock, Fluff, Mess, Pathfinder, Interact, Inventory, Craft, Garden, Weather,
Neighbours, Requests, Festivals, Save, Packs, Entitlement, Feedback, Share.
```
- **Scale:** the logical view is about 11 tiles (176 px) wide, scaled by the largest whole number that fits. Use `roundPixels`, `scaleMode: 'nearest'` and `image-rendering: pixelated` on the canvas. Fill leftover space with the area's edge colour, never black.
- **Mess state:** typed arrays per area (`type`, `hp`, `colour`, one byte each) on the CPU. Progress = cleared tiles / total mess tiles. There's no GPU readback anywhere.
- **Colour reveal:** a desaturate filter per chunk region driven by the `colour` array. A cleared tile ripples into its neighbours over 300 ms (instant with reduced motion).
- **Fixed-step simulation:** 20 ticks a second for the clock, crops and neighbour schedules. Rendering is interpolated at the display rate. The ticker pauses when the app is hidden or a menu is open.
- **Areas:** each one is a pack map of about 40×30 tiles with layers `ground`, `walls` (blocked), `props`, `mess`, `doors` and `spawns`. Leaving through a door fades for 250 ms. The next area is preloaded when Puff is within 3 tiles of an exit.
- **Neighbours:** follow schedules from pack JSON (where they are each hour), walk with the same pathfinder, and keep shop hours.
- **Weather and seasons:** palette24 swaps rebake the chunks. Rain spawns mud tiles and waters crops, wind adds leaves, and snow uses an overlay.

## 4. Controls
- **Pointer Events only**, with `touch-action: none` on the canvas. Pinch-zoom stays on in the browser (never `user-scalable=no`), and the game doesn't use pinch.
- **Tap the ground:** 4-direction A* over the walkable grid, using a binary heap and capped at 2,000 nodes. If the tile can't be reached, Puff walks to the nearest reachable tile. A tap marker shows for 400 ms. Walk speed comes from `tuning.json`.
- **Tap a target:** Puff walks to the nearest free tile next to it, turns to face it, then interacts. Mess uses the owned tool that fits (auto-select can be switched off). A neighbour opens dialogue. A plant, item or door does its own action. Tapping again repeats the action.
- **Hold:** after 400 ms with an upgraded tool, charge rings show 3×1 or 3×3, and release uses it. A double-tap option replaces hold.
- **Keyboard on web:** WASD or arrow keys, Space to use, 1–6 for tools, B for the bag, Esc to pause.
- **Native:** iOS edge-swipe back is off in the world. The Android back button opens pause.

## 5. Feedback
`Feedback.emit(event, {intensity})` is the single hook for particles, sound, haptics and captions. Events: `toolHit`, `tileCleared`, `homeRestored`, `itemPutAway`, `heartUp`, `cropHarvest`, `fluffLow`, `dozeOff`, `uiTap`.
- **Haptics:** a light tap per hit, a medium one on a cleared tile, and a success pattern when a home is restored. Use Capacitor in apps, and `navigator.vibrate` only where it exists. Throttle to 1 per 60 ms.
- **Sound:** synthesised with WebAudio. A tool's pitch rises as the area nears clean. There are footsteps per surface and voice blips for neighbours.
- **Latency:** a tap shows on screen in the same frame. Sound and haptics follow within 50 ms.

## 6. HUD (DOM, live text, 44 pt targets, safe-area insets)
- **Top left:** the Fluff meter (icon, bar, number). Under 20 it shows a sleepy icon plus a colour change.
- **Top right:** "Spring 3", the time in 10-minute steps with a sun or moon icon, and Sparkles underneath.
- **Top centre:** a one-line request tracker you can collapse.
- **Bottom band:** 6 tool slots plus the Bag, each a real `<button>` with an icon, label, aria-label and focus ring. A context prompt ("Sponge the stain") sits above the band.
- A soft warning appears at 1:00, with no countdown. The time-of-day tint never covers the HUD.

## 7. Packs
- Catalogue: `GET /api/packs?since=` (format in BACKEND-PLAN). Pack files are immutable static JSON. Bundled free-spring packs are the offline fallback.
- The schema is in `src/packs/schema.ts` (Zod, `schemaVersion`). Pack types: `area`, `home`, `neighbour`, `dialogue`, `crops`, `shop`, `festival`, `season`, `dailyMesses`.
- Flow: fetch, then check `min_app_version`, verify sha256, validate with Zod, cache as `pack:{id}@{version}`, then swap in. Keep the current and previous versions.
- **A bad pack never crashes the game.** On failure, fall back to the previous version or hide the pack, and show a calm message. There's no `eval`.

## 8. Saves, auth and entitlement (BACKEND-PLAN wins on format)
- One versioned save JSON in IndexedDB or Filesystem, with `schemaVersion` and a migration table from day one. Save at bedtime, plus every 60 s and on `visibilitychange`/`pagehide`. Keep the last good copy as a fallback for a corrupt save.
- **Opt-in sync:** last-write-wins on `savedAt` plus device ID. If the server copy is newer, the player chooses "Keep this device or cloud?". Never overwrite silently.
- **Sessions:** web uses an HttpOnly cookie. Apps keep a Bearer token in Keychain or Keystore through secure storage, never in localStorage or Preferences. Magic links return through Universal Links or App Links (`{APP_DOMAIN}` placeholder).
- **Entitlement:** `isPlus()` reads cached RevenueCat customer info for `plus` (offline grace), and on web also `GET /api/me`. Plus gates seasons 2–4, neighbours 4–6, weekly visitors and the full wardrobe. When Plus lapses, play freezes at the end of the last season the player can access, and nothing is locked or deleted.
- **Real chores:** queue offline, claim on reconnect, cap of 5 a day. Rewards are Sparkles plus the Cosy Boost to max Fluff (no Energy).

## 9. Pricing and paywall
- On web, prices come from `config/pricing.json` (A$7.99/mo, A$44.99/yr, founding A$34.99 for the first year on web only, with the renewal price shown just as large). In apps, show RevenueCat `priceString` only, and never mention web prices on iOS.
- Show the wording "Spring is free. Summer, autumn and winter need Plus." on the store page, the first screen and the paywall. Use the renewal wording from BUILD-SPEC verbatim. Restore Purchases and Manage plan are in Settings.

## 10. Sharing (on device, nothing uploaded)
- **House reveal clip (6 s):** `captureStream(30)` + `MediaRecorder` of an offscreen 1080×1920 composition (mp4 on Safari, webm elsewhere). The fallback is a PNG. Share through Web Share or `@capacitor/share`.
- The Mess of the Day card and photo mode use the same pipeline. They include game art only, with no names or photos.

## 11. Accessibility
- WCAG AA contrast, with UI text on solid panels. Respect system text size up to 200%, and offer a high-contrast option.
- Reduced motion: no shake, particles ×0.25, fades instead of wipes.
- Every sound has a visual cue and a caption. Mess types differ in shape as well as colour.
- Relaxed mode, clock speed (normal, ×0.5 or paused indoors) and double-tap instead of hold. One-thumb play, and no timed taps outside Speed Clean (later).
- Screen readers: the DOM UI is labelled, and an ARIA live region announces requests, hearts and the time.

## 12. Performance budgets
- 60 fps (p95 frame time ≤ 16.7 ms) walking and cleaning in an area of 40×30 tiles, on an iPhone 12-class phone and a mid-range Android (DevTools 4× CPU throttle as a proxy). No long tasks over 50 ms during play.
- Initial JS ≤ 300 KB gzipped, not counting art and packs. An area's art and pack ≤ 400 KB, loaded lazily.
- Title screen ≤ 2.5 s on cold Fast 4G, ≤ 1.5 s warm or offline. Memory ≤ 150 MB. No leaks after 30 area changes (heap within ±10%).
- No console errors or warnings in play, and no GPU readback.

## 13. PWA, offline and store builds
- **PWA:** manifest, portrait, `display: standalone`. Precache the app shell and bundled packs. `/packs/*` is CacheFirst and `/api/packs` is StaleWhileRevalidate. Never cache `/api/save|me|auth|billing`. The favicon and icons use paths relative to the repo (GitHub Pages subpath).
- **Capacitor:** appId `com.pixelvortexgames.sweethomereset`, webDir `dist`. TestFlight and Play Internal testing only after Blake approves and creates the developer accounts.
- **Store inputs:** answer the IARC questionnaire honestly (no violence, gambling, user communication or public user content in v1; fixed-price IAP; no ads). Privacy labels match BACKEND-PLAN and /privacy. Account deletion is in the app, plus a public `/delete-account` page.
- ⚠️ Needs Blake's yes: the Apple and Google developer accounts, the RevenueCat account, store products, outside testers and any public release.

## 14. Build order (Claude Code steps, grouped by the GAME-DESIGN A9 milestones, v2 order)
**M1, walking world** (burrow, yard, Town Square, Hazel's bakery)
- F1 **Scaffold, tuning loader, pricing, CI size limit.** AT: the build passes. Initial JS ≤ 300 KB is enforced. No tuning or price literals outside `config/`.
- F2 **Tile renderer.** Pack area loader, chunk baking, integer scale, camera, edge fill, area doors with fades. AT: crisp at 375, 390 and 430 px, with no black bars, no blur and no blank frames.
- F3 **Pathfinder and tap-to-walk.** AT: unit tests find the shortest path on fixture maps and never step on blocked tiles. An unreachable tap goes to the nearest reachable tile. Each path takes under 2 ms.
- F4 **Interact, mess and 4 tools, colour reveal, bag.** AT: hits come from `tuning.json`. Progress never goes down. A home is restored at 95%.
- F5 **Fluff, clock, bed and doze.** AT: the day lasts `dayRealMinutes`. Tools stop at 0 Fluff but walking still works. Dozing off is free.
- F6 **HUD, Feedback, onboarding 0:00–6:30.** AT: axe-core finds 0 serious issues, and every control is at least 44×44 pt.
- F7 **Local save and migrations.** AT: a reload and a schema bump both restore the state. A corrupt save falls back to the last good copy.

**M2, neighbours**
- F8 **All 6 neighbours:** schedules, dialogue, gifts, hearts, heart events, requests, shops with hours, the General Store, Neighbour Lane and Riverside homes. The Plus gate for 4–6 is a stub. AT: onboarding to 30:00 completes by script. Hearts never drop. 30 area changes don't leak memory.

**M3, grow and craft**
- F9 **Garden, foraging, bench, tool tiers with charged use, home upgrades, cooking.** AT: grime is gated until the Copper sponge. Unwatered crops pause. A crop is harvested and a Copper tool crafted by day 7 in a scripted run.

**M4, seasons and sharing**
- F10 **Seasons by palette swap, weather, 4 festivals, Woodland edge and Beach, the fountain finale.** AT: a 56-day year has no soft-locks.
- F11 **Reveal clip, photo mode, Mess of the Day card, real-chore letter.** AT: Safari makes an mp4, Chrome a webm, with a PNG fallback. No network request is made while sharing. The same date gives the same daily mess on two devices.

**M5, launch**
- F12 **Auth, opt-in sync, account deletion and export.** AT: the conflict prompt appears, and nothing is overwritten silently.
- F13 **Entitlement, paywall, Restore Purchases, lapse.** AT: the paywall shows as a postcard after the day-14 fair or from Settings, at most once a week. A lapse keeps all progress. The iOS build has no web prices.
- F14 **PWA, Capacitor builds, accessibility settings, music, credits, performance soak, store inputs.** AT: Lighthouse scores at least 90 for performance and accessibility. An offline reload works. A 10-minute soak holds 60 fps p95 and ≤ 150 MB. Store builds happen only after Blake approves the accounts.

Each step's evidence: 390×844 screenshots, clean console output, and a pass or fail for each acceptance test. QA Group checks each milestone.

## 15. Open items
- The app domain is the `{APP_DOMAIN}` placeholder in `config/app.json` until Blake buys one.
- Art is parked. Code-drawn placeholders follow PIXEL-ART-SPEC sizes: 16 px tiles, a 24 px Puff in the world, and the 48 px Puff in menus.
