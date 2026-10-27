# Sweet Home Reset: Frontend & Mobile Plan (for Codex)
*PixelVortex Games · owner SF Frontend & Mobile Dev · v1 2026-10-27. Matches codex/BACKEND-PLAN.md names exactly. Where this file and BACKEND-PLAN.md disagree on API or data, BACKEND-PLAN.md wins.*

## 0. Ground rules (paste into every Codex session)
- One TypeScript codebase ships to **web/PWA, iOS App Store and Google Play**. iPhone first.
- Free tools only. No paid assets, fonts, SDK tiers or services. **Every asset is drawn in code** (Pixi Graphics, procedural textures, inline SVG). Sounds are synthesised with WebAudio or are original and logged in LICENCES.md.
- 16+. No ads, no ad SDK, no IDFA, no loot boxes, no random paid rewards, no paid timers. Purchases are cosmetic or Plus only, at fixed prices.
- **Rooms are data, not code.** All room content comes from packs (Section 6). The app ships only the free starter packs bundled as a fallback.
- **Local-first.** The game is fully playable offline and with no account. Sign-in (magic link or Sign in with Apple) is optional and only adds sync and Plus across devices.
- **Prices live only in `config/pricing.json`** (Section 9). No price string is hard-coded anywhere else.
- Never put keys or tokens in code or chat. Client env names: `VITE_API_ORIGIN`, `VITE_RC_WEB_KEY`, `VITE_RC_IOS_KEY`, `VITE_RC_ANDROID_KEY` (public SDK keys, still kept out of the repo in `.env`, chmod 600).
- Copy tone: kind friend. Never "failed", "lost", "overdue". Puff is never sad because of the player.
- Nothing is published, no account is created and nothing is paid for without Blake's yes (Section 12).

## 1. Stack and why
| Layer | Choice |
|---|---|
| Game renderer | **PixiJS v8** (WebGL2, WebGPU when stable, Canvas fallback) |
| App shell / UI | Vite + TypeScript, DOM overlay UI with plain Web Components (no framework needed) |
| Native wrapper | **Capacitor** (iOS + Android) |
| Native plugins (free, official or community) | `@capacitor/haptics`, `@capacitor/filesystem`, `@capacitor/preferences`, `@capacitor/app` (deep links, back button), `@capacitor/share`, `@capacitor/status-bar`, `@capacitor/splash-screen`, a secure-storage plugin for Keychain/Keystore, a Sign in with Apple plugin, `@revenuecat/purchases-capacitor` |
| Web payments | RevenueCat Web Billing / our Stripe Checkout via `POST /api/billing/checkout` |
| PWA | `vite-plugin-pwa` (Workbox) |
| Storage | IndexedDB (`idb`) on web; Capacitor Filesystem + Preferences in apps |
| Tests | Vitest (unit), Playwright (web e2e incl. WebKit mobile emulation), Lighthouse CI |

**Why PixiJS over Phaser:** the game is one diorama with masks, render textures, particles and layered art, not a physics/tilemap game. Pixi is a lean 2D renderer with first-class `RenderTexture`, masks, filters and a particle container, so the scrub reveal is direct and the bundle stays small. Phaser bundles scenes, physics and loaders we don't need. **Why Capacitor:** it wraps the same locked PixiJS web/PWA build into real iOS and Android apps with no rewrite, and gives native haptics (Taptic Engine on iPhone, which `navigator.vibrate` can't reach on iOS Safari), secure storage, deep links and store billing through plugins.

## 2. Screens
1. **Boot / splash** – Puff logo drawn in code, loads starter packs.
2. **Age gate + welcome** – 16+ confirmation (stored locally, sent as `ageConfirmed` on sign-up).
3. **Onboarding** – "Which rooms do you have?" and energy level (Low/Some/Lots), per GAME-DESIGN first 10 minutes.
4. **Home (Puff's house)** – rooms from installed packs, each with its stage; locked Plus packs show a soft "Plus" tag, never greyed-out shame.
5. **Room select / pack browser** – catalogue from `GET /api/packs`, badges Free / Plus / New this week / Mess of the Day.
6. **Play (room scene)** – scrub/wipe mini-tasks, progress meter, stage pips 25/50/75/100, tool tray, Puff.
7. **Room restored** – slow-mo sparkle, 3 s before/after wipe, share clip.
8. **Real chores ("Do it for real")** – chores from the pack matched to the room just cleaned, tick on trust, Sparkles + Energy toast, daily cap message ("That's plenty today ✨").
9. **Shop / wardrobe / decor** – fixed Sparkle prices, Puff tools and outfits (`items` slots `puff_tool`, `puff_outfit`).
10. **Share / photo mode** – clip or still, Web Share / native share.
11. **Paywall (Plus)** – shown first after the first 100% room; plans from `config/pricing.json` (web) or live store prices (apps); verbatim renewal wording; Restore Purchases on apps.
12. **Settings** – sound, music, haptics, reduced motion, captions, notifications (opt-in), sign in / out, Manage plan, Restore Purchases, Export my data, Delete my account, legal links (/terms, /privacy, /refunds, /notices), © PixelVortex Games + ABN.
13. **Sign-in sheet** – email magic link, Sign in with Apple (iOS required, also offered on web/Android).

## 3. Scene structure (Pixi)
```
App (DOM shell, router, overlays)
 └─ PixiApp (single Application, one canvas)
     ├─ BootScene        load config, starter packs, fonts-as-code
     ├─ HomeScene        house diorama, room tiles
     ├─ RoomScene        per pack room
     │   ├─ CleanLayer   room art (clean), built from pack layers
     │   ├─ DirtLayer    dirt sprite masked by RevealRT (RenderTexture)
     │   ├─ TaskLayer    active mini-task (scrub, wipe, sweep, pop, fold...)
     │   ├─ FxLayer      ParticleContainer pools
     │   └─ PuffActor    procedural rig (body, ears, eyes) + mood state
     ├─ RestoredScene    celebration + before/after capture
     └─ ShopScene        wardrobe preview
Services: InputService, FeedbackService (haptics/sound/particles), PackService,
SaveService, EntitlementService, AuthService, ShareService, Settings.
```
Scenes are classes with `enter(params) / exit() / update(dt) / resize()`. Only one scene ticks at a time; exited scenes destroy textures they own.

## 4. Touch input and scrub feel
- **Pointer Events** only (`pointerdown/move/up`, `pointerType`), `touch-action: none` on the canvas, `{passive:false}`, disable iOS long-press callout, text selection and double-tap zoom (`user-scalable=no` only on the canvas page, pinch blocked in-canvas but OS zoom still works elsewhere).
- Use `getCoalescedEvents()` where available to keep strokes smooth at 120 Hz ProMotion and on Android.
- **Reveal technique:** `DirtLayer` sprite has a `mask` = sprite of `RevealRT` (a RenderTexture at 0.5× room resolution). Each move, stamp a soft brush (procedural radial gradient) along the segment from last point to current point at spacing = 0.35 × radius, with `blendMode: 'erase'` into the dirt alpha RT. Radius is in points (CSS px) and converted by `devicePixelRatio`.
- **Progress:** sample the mask on a 64×64 grid via `renderer.extract.pixels` on a downscaled RT every 150 ms (not every frame); `cleanPct = cleared cells ÷ dirty cells in the pack's dirt mask`. **Room clean at 95%** → auto-finish the last 5% with a sparkle sweep. Stages fire at 25/50/75/100%.
- Tool feel per task from GAME-DESIGN "Mini-task tuning values" (stroke radius, combo windows). Wipe tasks (fog) need directional strokes; scrub tasks need repeated passes (dirt has 1–3 "layers" of alpha).
- **Platform parity:** same code path on iOS WKWebView, Android WebView and mobile/desktop browsers; mouse and pen work too. Edge-swipe back on iOS is disabled inside RoomScene (Capacitor config), Android back button = pause menu.
- Idle 6 s → Puff points at the biggest remaining patch (hint).

## 5. Satisfying feedback
`FeedbackService.emit(event, {surface, intensity})` is the single hook. Events: `stroke`, `patchCleared`, `combo`, `stage25|50|75`, `roomClean`, `choreTicked`, `purchase`, `uiTap`.
- **Particles:** pooled ParticleContainer (max 400 live), suds, dust motes, sparkles; counts per task in GAME-DESIGN tuning table.
- **Haptics:** apps → `@capacitor/haptics` (`impact Light/Medium/Heavy`, `notification Success`, `selectionChanged`); web → `navigator.vibrate(pattern)` only if `'vibrate' in navigator` (Android Chrome; iOS Safari has none, so silently skip). Throttle stroke haptics to ≤ 1 per 60 ms. Global haptics toggle.
- **Sound hooks:** `SoundService.play(id, {pitch, gain})` with WebAudio-synthesised scrape/fizz/squeak/chime/"pff"; pitch rises with cleanPct; AudioContext unlocked on first tap; respects mute and iOS silent switch (WebAudio is silenced by the switch in apps via the audio session set to ambient).
- **Captions** (Section 8) are emitted from the same event.
- **Latency target:** stroke → visible reveal in the same frame; stroke → haptic/sound ≤ 50 ms.

## 6. Room packs (data, not code)
- **Catalogue:** `GET /api/packs?since=` → `[{id, version, title, tier, released_at, manifest_url, sha256, min_app_version}]` (ETag, 304 when unchanged). Pack files are static JSON on Pages under `/packs/{id}/{version}/`, immutable.
- **Pack JSON** (schema in `src/packs/schema.ts`, Zod, `schemaVersion: 1`; full schema and authoring in GAME-DESIGN "Room-pack content pipeline"): `id, version, title, tier, rooms[] { id, layers[] (code-draw ops or inline SVG), dirtMasks[] (SVG paths or seeded procedural params), tasks[] (type + tuning ref), decor[], chores[] {choreKey, size}, puffLines[] }`.
- **PackService flow:** fetch catalogue → filter `min_app_version` ≤ app → download manifest → verify **sha256** (SubtleCrypto) → **Zod-validate** → store versioned → swap in.
- **Versioned cache:** key `pack:{id}@{version}`. Web: IndexedDB store `packs`. Apps: Capacitor Filesystem `Directory.Data/packs/{id}/{version}/pack.json` + index in Preferences. Keep current + previous version; GC older after the new one loads once.
- **Offline fallback:** no network → use cached index; nothing cached → bundled starter packs (`public/packs-bundled/`, the 3 free rooms).
- **Corrupt pack never crashes:** hash mismatch, JSON parse error, schema failure or a render exception inside a pack room → log locally, mark that version bad, fall back to the previous cached version or hide the pack, show "This room is tidying itself, try again later". Rendering of pack-defined draw ops runs through a whitelist interpreter (no `eval`, SVG sanitised: no scripts, no external refs).
- **Free/Plus gate:** UI asks `EntitlementService.isPlus()`; Plus packs are visible but locked for free users. The server is the real gate (free user saving Plus pack progress → 403); client treats 403 as "locked" not error.

## 7. Saves, auth, entitlement (interfaces only)
```ts
interface SaveBlob { schemaVersion: 1; deviceId: string; rooms: Record<string /*packId:roomId*/, {stage: 0|25|50|75|100; mask_progress: number}>;
  ownedItems: string[]; equipped: Record<'puff_tool'|'puff_outfit', string|null>; cosyDays: number; settings: Settings; }
interface SaveApi {               // BACKEND-PLAN Step 3
  get(): Promise<{version: number; data: SaveBlob; updated_at: string}>;          // GET /api/save
  put(baseVersion: number, data: SaveBlob, deviceId: string): Promise<{version: number} | {conflict: {version:number; data:SaveBlob}}>; // PUT /api/save, 409 → merge
}
interface ChoreApi { claim(choreKey: string, localDate: string): Promise<{sparkles: number; energy: number} | {capped: true}>; } // POST /api/chores/claim, 429 = cap
interface PackApi  { list(since?: string): Promise<PackMeta[]>; }                 // GET /api/packs
interface MeApi    { me(): Promise<{plan:'free'|'plus'; plan_status:string; plan_period_end?:string; cancel_at_period_end:boolean; notice?:string}>; // GET /api/me
  exportData(): Promise<Blob>; deleteAccount(): Promise<void>; }                  // GET /api/me/export, DELETE /api/me
interface AuthApi  { startMagicLink(email: string, ageConfirmed: boolean): Promise<void>; // POST /api/auth/start
  apple(identityToken: string, nonce: string): Promise<void>;                     // POST /api/auth/apple
  logout(): Promise<void>; }                                                      // POST /api/auth/logout
interface BillingApi { checkout(interval:'monthly'|'yearly'): Promise<{url:string}>; portal(): Promise<{url:string}>; } // web only
```
- **Local-first:** every change writes locally first (IndexedDB / Filesystem), debounced sync every 10 s and on `pagehide`/app pause when signed in; 409 → merge (higher progress per room, union of owned items) → retry. Wallet balances are display-only from server when signed in; offline chore ticks queue and are claimed on reconnect (server enforces the cap of 5/day).
- **Sessions:** web uses the HttpOnly cookie; apps use the Bearer session token stored in **Keychain (iOS) / Keystore (Android)** via secure storage, never in localStorage or Preferences.
- **Magic-link deep links:** links open the app via **Universal Links** (`apple-app-site-association`) and **Android App Links** (`assetlinks.json`), handled by `App.addListener('appUrlOpen')` → verify → store token. Web falls back to the browser.
- **Sign in with Apple:** native plugin on iOS, Apple JS on web/Android; send `{identityToken, nonce}` (raw nonce hashed for Apple).
- **Entitlement layer:** `EntitlementService` = RevenueCat Capacitor SDK on iOS/Android (Apple IAP `plus_monthly`/`plus_yearly`; Play `plus` with base plans `monthly`/`yearly`) + `GET /api/me` on web (Stripe). App user id = `users.id` after sign-in. `isPlus()` = RC entitlement `plus` active OR `/api/me` plan=plus. Plus unlocks on all platforms. Cached last-known state for offline (grace 7 days, matches backend past_due rule).
- **Energy:** shown as a soft meter. It comes only from real chores (`POST /api/chores/claim`) and is spent only on optional boosts (stronger spray, wider sponge) and Puff's tools. Scrubbing and mini-tasks never cost Energy. A spend the server rejects (balance would go below 0) shows a calm "Do a real chore to earn more" note, never an error.

## 8. Accessibility
- **Reduced motion:** honour `prefers-reduced-motion` + in-app toggle: no screen shake, particles ×0.25, no slow-mo, crossfades instead of wipes, Puff idles still.
- **Tap targets ≥ 44×44 pt** for every control, including tool tray and pips; 8 pt spacing.
- **Contrast:** WCAG AA (4.5:1 text, 3:1 UI/icons) on pastel palette; text sits on solid panels, never on art.
- **Captions for sound:** optional toast captions for every sound event ("[soft squeak]", Puff's lines always shown as text).
- Haptics, sound and music each toggle separately; game fully playable silent.
- Screen reader: DOM UI labelled; canvas has an ARIA live region announcing progress at stages ("Kitchen 50% clean"). Scrub has an assist mode: tap-and-hold auto-cleans a patch (for motor accessibility).
- Dynamic text size respected in DOM UI up to 200%.

## 9. Pricing and paywall
- `config/pricing.json` is the only price source: `{ "currency":"AUD", "monthly":7.99, "yearly":44.99, "foundingFirstYear":34.99, "foundingWebOnly":true, "trialDays":7 }` plus the verbatim Ops wording strings with `{price}` placeholders.
- **Web:** prices from pricing.json; founding offer web only, A$44.99 renewal shown just as large as A$34.99.
- **Apps:** show the live store price string from RevenueCat (`product.priceString`), never pricing.json numbers, and never mention web prices in the iOS app.
- Wording beside the pay button (Ops, verbatim): "Renews automatically at {monthly}/month (or {yearly}/year) until you cancel. Cancel anytime in the app." Trial: show end date and the charge line.
- Manage plan: web → `POST /api/billing/portal`; iOS/Android → store subscription page. Restore Purchases on apps.

## 10. Share clips
- **Before/after clip (5–6 s):** `canvas.captureStream(30)` + `MediaRecorder` (prefer `video/mp4` on Safari, `video/webm` elsewhere) of an offscreen 1080×1920 composition; **fallback:** still PNG (9:16) from `renderer.extract`. Share via Web Share API (files) or `@capacitor/share`; fallback download. Game art only, no personal data, made on device with no upload.
- Mess of the Day card (text grid + room thumbnail) and Puff photo mode use the same pipeline.

## 11. Performance targets
- **60 fps** sustained during scrubbing on iPhone 12-class (A14) and a mid-range Android; frame time p95 ≤ 16.7 ms.
- **Initial JS bundle ≤ 250 KB gzip** (Pixi tree-shaken, scenes lazy-loaded); starter packs ≤ 150 KB total; each weekly pack ≤ 300 KB.
- **Load:** first interactive ≤ 2.5 s on Fast 4G (web, cold); ≤ 1.5 s warm/offline; app cold start to Home ≤ 2 s.
- **Memory:** ≤ 150 MB JS+GPU on iPhone 12; RenderTextures at 0.5× resolution, max texture 2048, destroy on scene exit; no leaks after 20 room enters/exits (heap within ±10%).
- Battery: canvas ticker paused when app is hidden or menus are open.

## 12. PWA, offline and store builds
- **PWA:** manifest (name Sweet Home Reset, short "Home Reset", icons drawn in code and exported at build by a script, theme colours, `display: standalone`, portrait), Workbox precache app shell + bundled packs, runtime cache `/packs/*` CacheFirst (immutable), `/api/packs` StaleWhileRevalidate, never cache `/api/save|me|auth|billing`. iOS "Add to Home Screen" hint sheet (shown once, dismissible); Android `beforeinstallprompt` button.
- **Offline play:** everything except sign-in, purchase, sync and new pack download works offline; offline banner is calm ("Playing offline, saves will sync later").
- **Capacitor:** `capacitor.config.ts` appId `com.pixelvortexgames.sweethomereset` (locked), webDir `dist`.
- **iOS (Xcode):** `npx cap add ios`, `npx cap sync`, set Bundle ID, team = PixelVortex Games, Associated Domains (`applinks:` the app domain), Sign in with Apple and In-App Purchase capabilities, automatic signing, archive → upload → **TestFlight** internal testers.
- **Android (Android Studio):** `npx cap add android`, App Links intent filter (autoVerify), generate upload keystore (stored outside repo, chmod 600, path only in chat), Play App Signing, build signed AAB → **Internal testing** track.
- **Store submission inputs (frontend):**
  - **IARC questionnaire (decided):** answer honestly on content: no violence, no sexual content, no gambling or simulated gambling, no user-to-user communication, no publicly shared user content, no location sharing, in-app purchases yes (subscription plus fixed-price cosmetics, no random items), no ads. The rating will likely be Everyone/4+ because it describes content. The 16+ limit is a separate Ops rule for accounts and payments, stated in the store listing and /terms. Ops makes the final call on the answers.
  - **Privacy label / Data safety** (same list as BACKEND-PLAN and /privacy): email (account), game progress + chore ticks (app functionality), purchase history (via RevenueCat/stores); not used for tracking, not sold, encrypted in transit, deletable in-app; no IDFA, no ad SDK, no analytics SDK unless Ops approves.
  - In-app account deletion in Settings (+ public `/delete-account` for Google), note that store subscriptions must be cancelled in the store.
  - Screenshots and preview video captured from the app itself.
- ⚠️ **Needs Blake's yes (money/accounts):** Apple Developer Program as organisation PixelVortex Games (needs D-U-N-S, about US$99/yr), Google Play Console organisation (about US$25 one-off), RevenueCat account, store product setup, any TestFlight/Internal test invite to outsiders, and any public release. Blake does all ID steps. Codex must not create accounts.

## 13. Build order (Codex-sized steps with acceptance tests)
**F1. Scaffold.** Vite + TS + PixiJS v8, Vitest, Playwright, ESLint, `config/pricing.json`, size-limit check.
- AT: `npm run build` passes; blank Pixi canvas renders at 60 fps in Playwright; initial gzip JS ≤ 250 KB enforced in CI; grep finds no price literal outside `config/pricing.json`.

**F2. Scene manager + DOM shell.** Router, scene lifecycle, resize/DPR handling, safe-area insets.
- AT: switching scenes 20× leaves heap within ±10% and no orphan textures (Pixi texture count back to baseline); notch/safe areas respected in iPhone 12 viewport.

**F3. Procedural art kit.** Drawing helpers (rounded shapes, pastel palette, grain), Puff rig with 4 moods, SVG layer sanitiser + interpreter.
- AT: Puff renders in all moods with zero image files loaded; an SVG with `<script>` or external `href` is rejected; palette contrast test passes AA for UI tokens.

**F4. Pack schema + bundled starter packs.** Zod schema `schemaVersion 1`, 3 free rooms (kitchen nook, living room, bedroom) as JSON.
- AT: all bundled packs validate; 20 fuzzed broken packs (missing fields, wrong types, huge arrays) are rejected with no throw escaping `PackService`.

**F5. Scrub reveal.** InputService, brush stamping into RenderTexture, mask, progress sampling, 95% auto-finish, stage events 25/50/75/100.
- AT: scripted stroke test clears a known mask and reports cleanPct within ±2%; stage events fire once each in order; reaching 95% completes the room; strokes at 120 Hz coalesced input show no gaps; 60 fps p95 on iPhone 12-class during continuous scrub (manual device check, logged).

**F6. Mini-tasks.** Scrub, fog-wipe, sweep-to-pile, pop dust bunnies, plus a task interface for the rest from BUSINESS-IDEAS (fold, sort, water plant...) driven by tuning values in GAME-DESIGN.
- AT: each task completes via scripted input; tuning comes only from pack/tuning data (changing a value in JSON changes behaviour with no code change); idle 6 s shows Puff hint.

**F7. Feedback service.** Particles pools, haptics adapter (Capacitor / vibrate / none), WebAudio sound hooks, captions.
- AT: unit test maps every event to haptic/sound/caption; on iOS Safari no `vibrate` call is attempted; stroke haptics throttled ≤ 1/60 ms; live particles never exceed 400; mute/haptics toggles silence everything.

**F8. Accessibility pass.** Reduced motion, 44 pt targets, captions, ARIA live progress, assist mode.
- AT: with `prefers-reduced-motion` emulated, no shake/slow-mo and particles ×0.25; automated check finds no tap target < 44×44 pt; axe-core reports 0 serious issues on DOM screens; assist mode completes a room with taps only.

**F9. Local save.** SaveBlob in IndexedDB / Filesystem, schema migration hook, deviceId.
- AT: kill and reload mid-room restores progress within 1 stroke batch; corrupt save falls back to last good copy without crashing; works with no account.

**F10. Pack loader + versioned cache.** `GET /api/packs`, ETag, sha256, validation, `pack:{id}@{version}` cache (IndexedDB web, Capacitor Filesystem apps), GC, offline fallback, corrupt-pack isolation.
- AT: 304 uses cache with no download; a new catalogue row appears and becomes playable offline with no app rebuild (BACKEND AT4c); a hash mismatch or invalid JSON leaves the previous version playing and the app running; airplane mode with empty cache shows bundled packs; `min_app_version` newer than app → pack hidden; render exception in a pack room returns to Home with a calm message.

**F11. Screens: Home, pack browser, Room restored, Shop.** Badges Free/Plus/New, decor placement, fixed Sparkle prices.
- AT: Plus packs visible but locked for free; no screen shows a random reward; restored room becomes decor in Puff's home.

**F12. Real-chore loop.** Chores from pack matched to the room just cleaned, tick on trust, local queue, `POST /api/chores/claim`, daily cap UI, Energy meter and optional-boost spend.
- AT: ticking queues offline and claims on reconnect; 6th claim (429) shows the kind cap message, no error; with 0 Energy, scrubbing and every mini-task still work fully and boosts show as unavailable; a rejected spend (below 0) changes no balance and shows the calm note; Sparkles toast matches server response.

**F13. Auth.** Magic link (`/api/auth/start`, deep-link return via Universal Links/App Links), Sign in with Apple, Keychain/Keystore token storage, logout.
- AT: magic link opens the app on device and signs in; token never appears in localStorage/Preferences (test inspects storage); forged deep-link token shows a calm error; sign out clears secure storage; age 16+ confirmation required for new accounts.

**F14. Sync.** Debounced `PUT /api/save`, 409 merge, pause/pagehide flush.
- AT: two devices editing offline then syncing end with max progress per room and union of items; 403 on a Plus pack while free shows locked, not error.

**F15. Entitlement + paywall.** EntitlementService (RevenueCat Capacitor + `/api/me`), paywall after first 100% room, pricing.json on web, store price strings in apps, Restore Purchases, Manage plan.
- AT: mocked RC "plus" active unlocks Plus packs; mocked `/api/me` plan=plus on web unlocks the same; purchase on iOS (sandbox) unlocks on web after sign-in; iOS build has no web price or external payment link (grep + UI test); renewal wording matches Ops verbatim; founding A$34.99 shows only on web with A$44.99 renewal equally prominent; billing 503 shows "Plus isn't available yet".

**F16. Share.** MediaRecorder before/after clip, PNG fallback, Mess of the Day card, photo mode.
- AT: Chrome produces a 5–6 s webm, Safari an mp4 or the PNG fallback; when MediaRecorder is missing, PNG 1080×1920 is shared; no network request is made while creating a share.

**F17. Settings + privacy.** Toggles, Export my data, Delete my account (with store-cancel note), legal links, footer.
- AT: export downloads JSON; delete calls `DELETE /api/me`, clears local + secure storage, returns to welcome; all four legal links return 200.

**F18. PWA + offline.** Manifest, Workbox caching rules, install prompts.
- AT: Lighthouse PWA installable; offline reload plays a cached room; `/api/save|me|auth|billing` never served from cache; first interactive ≤ 2.5 s Fast 4G cold.

**F19. Capacitor iOS + Android.** Add platforms, plugins, deep-link config, back button, status bar, haptics native.
- AT: same build runs in iOS Simulator and Android emulator; native haptics fire on stage events; Android back opens pause; scrub feels identical (manual checklist on iPhone 12, mid Android, desktop browser).

**F20. Performance + store readiness.** Profiling, memory soak, store assets, IARC/privacy inputs doc, signed builds.
- AT: 60 fps p95 and ≤ 150 MB on iPhone 12 over a 10-minute session (logged); signed iOS archive uploads to TestFlight and signed AAB uploads to Internal testing **only after Blake has approved and created the developer accounts**; privacy answers match /privacy and BACKEND-PLAN exactly.

## 14. Open items for BB Builder
- App domain for Universal/App Links: `{APP_DOMAIN}` placeholder in `config/app.json` until Blake buys one (bundle ID locked: `com.pixelvortexgames.sweethomereset`).
- ~~Mess of the Day seed source~~ settled: computed from local date + catalogue version, picked from each pack's `dailyMesses` list, same function on client and server (BACKEND-PLAN Step 4d); `GET /api/daily` only verifies reward claims.

## 15. Image asset manifest (Grok Imagine art, added Oct 27)
Blake is generating art in Grok Imagine, so the "every asset drawn in code" rule (§0, F3) now covers only the fallback: code-drawn shapes stay as the placeholder art, used when an image is missing. Images live in `public/art/`, export as PNG at the size below, and are then converted to WebP at build time (quality 85). The build makes the smaller copies. "T" means the background must be transparent.

**Source of truth for file names and sizes is `ASSET-PROMPTS.md` (confirmed by Frontend, Oct 27).** Files are lowercase snake_case under `public/art/<folder>/` exactly as listed there: `puff/` 1024² (model sheet 2048×1024), `rooms/<room>_dirty|clean.png` 2048², `overlays/` 2048² T, `props/` `decor/` `tools/` 512² T, `outfits/*_worn` 1024² T and `*_icon` 256² T, `ui/` 256² T, `brand/` app icon 1024² + Android adaptive fg/bg 432², splash 2732², `store/` 1320×2868, 1284×2778 and 1080×1920, `share/` 1080×1920.

Rules: a pack's room id is the file name with `-` for `_` (`kitchen-nook` maps to `kitchen_nook_*.png`). The dirty and clean versions of a room are framed pixel-for-pixel the same. There's no text in any image. Budget: no more than 150 KB per room image after WebP; pack art is served from `/packs/<id>/art/`.
- AT: a missing image falls back to code-drawn art with no crash; the dirty and clean versions are the same size; images use under 150 MB of memory on an iPhone 12.
- **Credits (Settings > About):** must show "Some art created with Grok Imagine" and keep any AI label the tool adds (LICENCES.md).
