# Sweet Home Reset: Game Design (Codex edition)
*PixelVortex Games · v1 · 27 Oct 2026 · lead author: SF Product Designer. Shared file: each section names its owner. Edit only your own sections.*
*Sources folded in: ../GAME-DESIGN.md, ../BUILD-SPEC.md, BUSINESS-IDEAS.md (BB Manager), BACKEND-PLAN.md. Every number below is a design target or a placeholder. None of it is measured data.*

**Locked:** web, iOS and Android from one codebase (Capacitor + PixiJS, see FRONTEND-PLAN.md) · one "plus" entitlement (Stripe on web; Apple and Google in-app purchase on mobile, see BACKEND-PLAN.md) · A$7.99/mo or A$44.99/yr (founding members A$34.99 for the first year, web only) · 16+ accounts · email magic link sign-in · 4 stages per room at 25/50/75/100, and a room counts as clean at 95% · Sparkles at fixed prices · cosmetic-only purchases · no loot boxes, no ads, no paid timers · scrubbing never costs Energy.

**Hand-offs:** stack, scenes, screens and tuning values → FRONTEND-PLAN.md. Auth, save and sync, ledger, caps, entitlement, packs API and privacy → BACKEND-PLAN.md. This doc says *what it feels like* and *what the rules are*.

---

## 1. Pitch, pillars and target feel *(owner: SF Product Designer)*
**Pitch:** Scrub a messy little room back to sparkling with Puff the dust bunny, then do one tiny real thing at home and watch your cosy world grow from it.

**Pillars**
1. **Every stroke feels good.** There's an instant clean trail, sound and a buzz under your thumb, and progress you can see.
2. **Two loops, one home.** The screen game and real chores feed the same progress. Neither one is a chore list wearing a cute skin.
3. **Never punished.** Nothing decays, expires, nags or shames. Mess is just mess, and tiny wins count.
4. **Made to share.** Before/after moments are built in, and they show only game rooms.

**Target feel:** an ASMR cleaning video you're playing yourself. It should feel calm, tactile and warm, like a kind friend who's happy you showed up.

## 2. Loops *(owner: SF Product Designer)*
### 2.1 The one loop (screen ↔ real life)
```
 Scrub a room on screen ──► stage-up, sparkle, Puff reacts ──► Puff suggests a matching real chore (gentle, skippable)
        ▲                                                                   │
        │                                                                   ▼
 spend on decor, tools, Puff outfits ◄── Sparkles + Energy (honour, capped daily) ◄── tick "I did it" (no photo)
        │
        └── real chores can also open the next room early and trigger special Puff reactions
```
- **Game → real:** each finished task or room suggests one chore that matches it (you scrubbed the virtual sink, so maybe "Rinse 3 mugs?"). It's one line of text with buttons for **Do it for real** and **Not now**. Both are fine, and Puff says the same warm thing either way.
- **Real → game:** a ticked chore gives fixed Sparkles plus Energy (values: Economy section), a Puff reaction, and progress toward opening the next room early. Energy only powers optional boosts (stronger spray, wider sponge) and Puff's tools. **Scrubbing never needs Energy.**
- **Shared progress view, "Our Home":** a single home map showing rooms restored on screen and a cosy count of "tiny real things done". Both counts only go up. There are no percentages of failure, no "overdue" and no red.
- **Honour rules:** no photo, ever. A daily cap on chore rewards (backend: 5 claims). Once you hit the cap, Puff says "That's loads today. Rest counts too." Ticking past the cap is still allowed and logged in the cosy count, it just earns nothing more. Nothing is ever taken away.

### 2.2 Session (3–5 min)
Open → Puff greets you in the current room → play 3–4 mini-tasks (§3) mixed for that room → each task fills the room meter. Stages at 25/50/75/100 each remove a dirt layer with a reveal. At 95% the room is clean, and the last 5% auto-sparkles away in a slow-motion final sweep → before/after wipe (3 s) → share offer (once per room) → matching real-chore suggestion → reward toast → Puff naps or offers the next room.

### 2.3 Daily
- **Mess of the Day** (free for everyone): one daily seeded room that everyone plays, with a Wordle-style share card (time and tools only, no personal data).
- **Daily fresh mess:** a 30-second small mess in a room you already finished.
- **Reset of the day:** Puff suggests up to 3 tiny real chores matched to rooms you've played. "Just one thing" picks the easiest. One tick counts as showing up.
- Skipping a day costs nothing.

### 2.4 Weekly and seasonal
- **Reset Sunday:** a new themed room pack every week, delivered as data with no app update (see "Room-pack content pipeline"). Example themes: a festival tent, a gamer desk, a nan's kitchen, a beach shack after a storm.
- **Weekly Glow:** showing up on any 3 of 7 days (in the game or in real life) lights up the home for the week. Fewer days just means a softer glow.
- **Seasonal events** roughly monthly (a haunted attic, the kitchen after Christmas lunch). Event rooms are free while they run, and nothing is lost when they end. The rooms return later in the back catalogue.

## 3. Mini-task specs *(owner: SF Product Designer; tuning values: see "Mini-task tuning values")*
**Shared controls (all platforms):** one thumb, drag to clean. There are no multi-finger gestures. The tool tray sits at the bottom, inside the thumb zone, and every target is at least 44×44 pt. Holding still never fails anything. Mouse drag and trackpad work on web, and keyboard play is covered in §8. Every task has a **Help Puff** button that auto-completes it after 20 (playtest start) seconds with no penalty.
**Shared juice:** a clean trail appears under the finger on the same frame (target: no visible lag) · a surface sound loop whose pitch climbs as the task nears 100% · a mobile haptic tick at 60 ms (playtest start), tuned per surface · the meter fills smoothly · a particle burst at each stage.

| Task | Control | Success rule | Feedback and juice |
|---|---|---|---|
| **Scrub grime** (core) | Drag over the dirt mask. Grime with 2 passes (playtest start) takes repeat passes. | Mask cleared ≥ 90% (playtest start) | Foam bubbles, a scrape that turns into a squeak, a tile/wood/glass haptic |
| **Wipe fog** | Puff breathes on the mirror and you wipe in arcs | Cleared ≥ threshold | Squeak, a streak-free shine sweep |
| **Sweep dust** | Drag dust toward a pile marker | Pile reaches size 85% of dust within 60 pt (playtest start) | Puff hops into the pile, "pff!" |
| **Pop dust bunnies** | Tap the shy cousins (≥ 44 pt) | All popped (they don't move faster or time out) | Soft pop and a giggle |
| **Polish** | Circular drag on a dull surface | Shine ≥ threshold | A sparkle sweep runs across the surface |
| **Sort clutter / fold laundry** | Drag an item into a bin or fold zone (snap radius 40 pt (playtest start)) | All items placed, and wrong bins gently bounce back | A thunk, a fold "fwip", the bin wiggles |
| **Water plants** | Hold over a plant for 1.2 s (playtest start) | The plant perks up | Droplets, the leaves unfurl |
| **Vacuum crumbs / power-spray** | Drag the nozzle with a suction radius 60 pt (playtest start) | Crumbs cleared | Hum, crumbs zip in |
| **Untangle cords / peel stickers / shoo bugs / hand Puff a tool** | Drag a handle, peel along a direction, tap-guide, pick from the tray | Task state complete | A satisfying snap or peel sound |

Rules: no timers that can fail you (the optional "Can you clean it faster?" mode only records your best time), no mistakes that cost anything, and Energy boosts change only tool size or strength. Room mix: 3–4 tasks per room, chosen by the pack data.

## 4. Rewards and retention, ethical *(owner: SF Product Designer)*
- **Sparkles:** earned from finishing rooms, tasks and real chores, at fixed values (Economy section). Spent on decor, Puff outfits and tools at fixed, visible prices. Every Sparkle is earned. Nothing is random.
- **Finished rooms become decor** in Puff's home, so your history is visible.
- **Cosy Days** count the days you showed up. The count only goes up and never resets. There's also a rest/pause mode: tell Puff "rest day" and it counts as showing up.
- **Welcome back:** after time away, Puff throws a tiny party. There's no dust pile-up, no "you missed" and no catch-up wall.
- **Never used:** streak loss, energy timers to wait out, expiring rewards, FOMO countdowns, loot boxes/gacha, paid skips, guilt notifications, or a sad or sick Puff.
- **Notifications:** opt-in, at most one a day, at a time you choose, in Puff's voice ("Puff found a sunny spot. Want to do one tiny thing?").
- **Plus pitch:** shown only after your first 100% room reveal. It can be skipped and isn't repeated within the same session.

## 5. Onboarding and the first 10 minutes *(owner: SF Product Designer)*
| Time | Beat | Teaches |
|---|---|---|
| 0:00 | A dusty kitchen nook. A grey fluffball sneezes and soft music fades in (muted if the device is silent). | Mood |
| 0:15 | A finger-hint ghost shows one swipe. The first drag reveals a clean, colourful strip immediately. | Core verb |
| 0:45 | Puff pops out of the dust: "Oh! Someone's home!" | Mascot |
| 1:00–3:00 | Scrub the counter, then wipe the window. Stage 25: curtains open, light pours in, the first sparkle burst plays and the first haptic buzz. | Meter, stages |
| 3:00 | Pop 3 dust bunnies (taps only, easy). Stage 50. | Second verb |
| 4:00 | Sort 4 items into a bin. Stage 75, and steam curls from a mug. | Drag-to-place |
| 5:00 | The meter hits 95%, then a slow-motion final sparkle and the before/after wipe. Puff dances. +Sparkles. | Payoff |
| 5:45 | Place your first decor item (a plant) with the Sparkles you just earned. | Shop |
| 6:30 | "Want to do one tiny thing for real?" Puff offers "Put 5 things where they belong", with **Do it for real** or **Not now**. Doing it adds Sparkles and Energy, and Puff does a proud spin. | Real loop |
| 7:30 | Save your home: 16+ age confirmation and an email magic link. You can skip this and keep playing locally. | Account |
| 8:30 | Optional reminder in Puff's voice. Off by default. | Opt-in |
| 9:00 | Peek at the locked living room ("ready when you are"), and the Mess of the Day card is introduced. | Next goal |
| 10:00 | Puff curls up on the rug: "See you next time. No rush." | Warm exit |

Goal: 1 room restored, 1 optional real chore offered, and the player leaves feeling good. The first 100% happens at 5:00, but the Plus offer waits until after the 10-minute beat (or the next room), so it never interrupts onboarding.

## 6. Puff: character and animation states *(owner: SF Product Designer)*
- **Who:** a round, soft dust bunny who *used to be* the dust and became your friend when you started cleaning. Clumsy, proud of you, easily delighted, a little cheeky. Original design, nothing like Finch, Sweepy or Tody.
- **Voice:** short lines of 6 words or fewer, perfect for video captions. "Ooh, we found the floor!" "No rush." Never "you failed", "overdue" or "lazy". Never comments on bodies, weight or how dirty a real home is.
- **States (code-drawn and squash-and-stretch; Frontend builds them as a state machine):** `idle` (breathing bob) · `sleepy`/`nap` · `peek` · `bounce` (task done) · `wiggle` (stage-up) · `dance` (perfect combo / 95% reveal) · `proud_spin` (real chore ticked) · `hop_in_pile` (sweep task) · `sneeze` (dusty start) · `tidy_helper` (if idle 6 (playtest start) s, Puff picks up a missed speck, as help, not a hint of blame) · `party` (welcome back) · `cosy` (rest day, the cap has been reached).
- **Never:** sad, sick, crying, angry or disappointed.
- **Customise:** outfits (a tiny apron, a scarf) and tools (a pastel spray gun), paid for with Sparkles or included with Plus.

## 7. Art, audio and haptics direction *(owner: SF Product Designer)*
- **Art:** soft flat dioramas drawn in code (PixiJS graphics and SVG), one room per screen, with rounded shapes and warm pastels (butter, sage, peach, dusty blue). Gentle grain, no hard black outlines. Each room is layered: base → furniture → dirt layers (dust, grime, clutter, cobwebs) → sparkle → decor slots. **Mess is never gross:** it's soft haze, crumbs and smudges, with no mould, bugs that look disgusting or bodily mess. Cleaning *reveals colour*.
- **Motion:** everything squishes and eases. Target 60 fps on a mid-range phone (budget in FRONTEND-PLAN).
- **Audio:** lo-fi acoustic loop, surface sounds (scrape, fizz, squeak, sparkle chime), a pitch climb toward 100%, and a "pff" from Puff. All sounds are original or commercially licensed and logged in LICENCES.md. The game must look and feel complete with sound off.
- **Haptics (iOS and Android only; there's no web vibration on iOS, so web stays silent there):** per-surface patterns: glass = fine light ticks, wood = soft medium, tile = crisp. A stronger tap on each stage-up and a short celebratory pattern at the reveal. There's a single toggle, and haptics also respect system settings.
- **Platforms:** the feel must match on web (pointer events, mouse and touch), iOS and Android. It plays fully offline once a pack is cached, and progress syncs later (BACKEND-PLAN step 3).

## 8. Accessibility *(owner: SF Product Designer)*
- **Reduced motion** (follows the OS setting, with an in-game toggle): no screen shake, particles cut to a few static sparkles, and fades instead of wipes. The before/after uses a crossfade.
- **Contrast:** UI text and controls meet WCAG AA (4.5:1 for text, 3:1 for UI). Progress is never shown by colour alone: the meter has a number and an icon.
- **Sound off / deaf and hard-of-hearing players:** every audio cue has a visual cue, and Puff's lines are always on screen as text.
- **Motor:** a "big brush" assist mode and the Help Puff auto-complete. No precision taps under 44 pt, no holds over 1.2 s (playtest start), no failure timers, and you can play one-handed.
- **Keyboard and switch on web:** arrow keys/WASD move the tool and Space scrubs. Focus states are visible.
- **Text:** respects OS text size, and UI labels have screen-reader names.
- **Photosensitivity:** no flashing above 3 per second.

## 9. Store submission design *(owner: SF Product Designer; technical details and privacy labels → BACKEND-PLAN)*
- **Developer account:** PixelVortex Games on both stores (opening it needs Blake's yes).
- **IARC content notes:** no violence, gore, sexual content, gambling, loot boxes, user chat or user-generated sharing inside the app. Has digital purchases (a subscription). Bugs are "shooed", never squashed. Answer the questionnaire truthfully. The account gate is 16+ in the app, the store listing says 16+, and it's never marketed to kids. Decided: the IARC rating describes the content (likely Everyone/4+). The 16+ limit is a separate Ops account rule, stated in the listing and /terms. Ops makes the final call on the questionnaire answers.
- **Screenshot set (same order on both stores, iPhone 6.9" and 6.5" plus Android phone, portrait):** 1) a half-scrubbed room, with the caption "Scrub it back to sparkling" · 2) the before/after wipe, "The satisfying reveal" · 3) Puff dancing, "Meet Puff" · 4) a real-chore tick in Our Home, "Tiny real chores grow your home" · 5) Reset Sunday packs, "A new room every week" · 6) decor and outfits, "Make it cosy" · 7) "No ads. Nothing lost for taking a break." Only game art, no real homes, no invented ratings or stats.
- **Preview video (15–30 s, captured in the app):** sneeze → a scrub stroke → stage-up → 95% reveal → Puff dance → the real-chore tick → logo.
- **Privacy labels:** fill them in from BACKEND-PLAN.md (data collected, no tracking, deletion).

<!-- ===== Sections below were written by their owners (Economy, Monetisation, Analytics: SF Backend & Payments Dev; Playtest plan, Open questions: BB Builder) and are kept verbatim ===== -->
<!-- SECTION OWNER: SF Backend & Payments Dev (economy, monetisation, analytics). All numbers are starting tuning values, untested; playtests set the real ones. Matches BACKEND-PLAN.md ledger. -->
## Economy: Sparkles and Energy
Two currencies, both earned only, never bought. Every change writes a `ledger` row (currency, delta, reason, ref_id). The server owns the balances and the client only shows them.

| Currency | Sources (starting values) | Sinks | Rules |
|---|---|---|---|
| **Sparkles** (cosmetic) | Each mini-task cleared: 5. Room reaches 100%: 25. Mess of the Day: 15. Combo bonus: +1 per 5-combo, max +10 a room. Real chore ticked: 10. Weekly pack finished: 50. Plus doubles every Sparkle source except chores. | Decor, Puff's outfits and tool skins, all at fixed prices (common 50–150, rare 300–600, seasonal 400–800). | No random rewards and no Sparkles for cash. The price is shown before every buy. Balance never goes below 0. |
| **Energy** (from real life) | Real chore ticked: 1 Energy, max 5 chores a day (honour system), plus a 2-Energy bonus once a week for ticking chores on any 3 days of that week (it never resets and has no streak). | Optional boosts only (stronger spray, wider sponge, Puff speed-up): 1 Energy per room. Puff tool upgrades: 3–10 Energy, a one-time unlock. | Scrubbing and mini-tasks never cost Energy. Energy never expires and has no cap that wipes it, and missing a day takes nothing away. |

**Balance targets (check in playtests):** a free player earns about 150 Sparkles a day from 2 rooms, the Mess of the Day and 2 chores, so they can buy a common item every day and a rare one each week. A Plus player can buy a rare item every 2–3 days. Inflation guard: track median balance against what's still unbought each week, and add sinks (new decor) instead of cutting rewards.

**Server checks:** the client reports room clears in batches, and the server rejects more than 1 clear per room per 60 seconds and more than 60 clears a day (anti-cheat with no punishment: extra clears are simply not paid). Chore claims are unique per chore, per day, per user.

## Monetisation
- **One subscription, Plus,** through one RevenueCat entitlement: A$7.99/mo or A$44.99/yr (annual is the default), with a 7-day free trial. The founding price is A$34.99 for the first year, for the first 100 web annual subscribers through Stripe only. Store prices use the nearest Apple and Google price points, chosen by Ops. All values live in `config/pricing.json`.
- **Plus gives** every weekly pack and the back catalogue, the full wardrobe and tool set, unlimited replays, home decor and double Sparkles. **Free keeps** the Mess of the Day, 3 starter rooms and seasonal events forever. The core loop and real chores are never behind the paywall.
- **When it's shown:** the first offer appears after the first 100% reveal, then only when the player taps a locked pack or item. It never interrupts a mini-task, there's at most 1 automatic prompt a day, and a closed prompt stays quiet for 72 hours.
- **Wording:** the paywall shows the renewal and trial lines exactly as Ops wrote them (one `RENEWAL_COPY` constant) and the trial end date. Cancelling is one tap: the Stripe portal on the web, or the store's subscription page on mobile.
- **Never:** ads, loot boxes, gacha, paid Energy, paid Sparkles, paid time-skips, countdown pressure or fake discounts.
- **Store fees:** Apple and Google take 15% (Small Business and the Play 15% tier, which Blake has to opt into). Stripe on the web costs about 1.7% + A$0.30 for domestic cards. These are approximate public rates and Ops checks them.

## Analytics events and KPIs
Analytics is first-party: events go to D1 through `POST /api/events` in batches. There's no ad SDK or IDFA, and no email or chore text in any event. Each event carries an anonymous install id, the user id only when signed in, the platform, app_version and a timestamp. Players can turn analytics off in Settings.

**Events:** `install_first_open`, `onboarding_step` {step}, `onboarding_done`, `minitask_start|complete` {task, room, duration_ms, combo_max}, `room_complete` {room, pack, duration_ms}, `reveal_shared` {channel}, `chore_ticked` {room_tag}, `energy_spent` {sink}, `sparkles_spent` {item_tier}, `pack_downloaded|opened` {pack}, `paywall_view` {trigger}, `trial_start` {platform, plan}, `sub_converted`, `sub_canceled`, `sub_refunded`, `signin` {method}, `sync_conflict`, `account_deleted`.

| KPI | Definition | Starting target (to check) |
|---|---|---|
| FTUE completion | onboarding_done ÷ installs | ≥ 80% |
| First room done | room_complete in the first session | ≥ 70% |
| D1 / D7 / D30 retention | active on day N ÷ installs | 40% / 18% / 8% |
| Real-chore engagement | % of DAU ticking ≥ 1 chore | ≥ 35% |
| Session length | median minutes | 6–10 |
| Paywall → trial | trial_start ÷ paywall_view | ≥ 8% |
| Trial → paid | sub_converted ÷ trial_start | ≥ 40% |
| Weekly pack pull | % of Plus who open the new pack within 7 days | ≥ 60% |
| Refund rate | refunds ÷ conversions | ≤ 3% |
| Share rate | reveal_shared ÷ room_complete | ≥ 5% |

The targets are planning guesses, not benchmarks, so the first 100 trials set the real baseline. There's a weekly KPI dashboard query in D1, and no third-party analytics without Ops' sign-off.

## Playtest plan (owner: BB Builder)
All targets are starting goals to validate, not measured results.
- **Round 1, feel test** (5–8 players, about 15 min each, on their own phones): first room, two mini-tasks and one real-chore tick.
  - Pass if at least 6 in 8 say scrubbing "feels satisfying" without being prompted.
  - Pass if nobody gets stuck for more than 10 seconds.
  - Pass if the first room is finished in under 5 minutes.
- **Round 2, loop test** (10 players over 7 days, using the preview build): track it with the first-party analytics events.
  - Pass if at least half the players come back on day 2.
  - Pass if at least 3 real chores are ticked per player per week.
  - Pass if no player reports feeling guilty or punished.
- **Round 3, money and share test** (the same group): check that the Plus offer feels fair (no "pushy" mentions) and that players share at least one Puff photo or clip.
- **Method:** a short text survey after each round, plus the analytics events, and every finding goes to QA Group before any change. Testers are friends or family on Blake's yes, with no paid recruiting.
- **Tuning:** the mini-task tuning values and economy numbers get adjusted only between rounds, one batch at a time.

## Open questions (owner: BB Builder)
1. Exact Apple and Google price points nearest A$7.99 and A$44.99 (for Ops).
2. Apple developer account (about US$99 a year, D-U-N-S needed) and Google Play (about US$25 one-off): Blake's yes and the timing.
3. Who makes the room packs for the weekly drop (designer templates plus code-drawn art) and how far ahead they're built.
4. Puff's animation: code-drawn rig vs. a free Spine-like runtime licence. It needs a licence check for LICENCES.md.
5. Music and sound effects: original vs. licensed (logged in LICENCES.md).
6. Whether households sharing one home goes in version 1 or later.
7. The IARC questionnaire answers (Ops), plus the privacy labels and Data safety form.
8. Whether there's a launch region beyond Australia, which changes GST handling and store tax settings.

## Room-pack content pipeline (owner: SF Frontend & Mobile Dev)
Rooms are data, not code. Weekly "Reset Sunday" rooms and monthly seasonal events ship as packs with no store release. Client details are in FRONTEND-PLAN.md §6, and server details are in BACKEND-PLAN.md Step 4b.

**Pack JSON (`schemaVersion: 1`, validated by Zod in `src/packs/schema.ts`)**
```json
{ "schemaVersion": 1, "id": "reset-sunday-gamer-desk", "version": 3, "title": "Gamer Desk",
  "tier": "plus", "min_app_version": "1.0.0", "released_at": "2026-11-01",
  "rooms": [{
    "id": "desk", "stageArt": {"25": ["blinds_open"], "50": ["warm_palette"], "75": ["steam_mug"], "100": ["sparkle"]},
    "layers": [{"id": "base", "kind": "draw", "ops": [["roundRect", 0, 0, 1080, 1440, 48, "#F6E7C8"]]},
               {"id": "shelf", "kind": "svg", "svg": "<svg …>…</svg>"}],
    "dirtMasks": [{"id": "grime1", "kind": "svg", "path": "M…", "layers": 2},
                  {"id": "dust1", "kind": "procedural", "seed": 42, "coverage": 0.6}],
    "tasks": [{"type": "scrub", "mask": "grime1", "tuning": "scrub"}, {"type": "fogWipe", "mask": "fog1", "tuning": "fogWipe"}],
    "decor": [{"itemId": "lamp_pastel", "slot": "desk_left", "price": 40}],
    "chores": [{"choreKey": "wipe_desk", "size": "quick", "label": "Wipe your desk for real"}],
    "puffLines": ["Ooh, we found the keyboard!"] }] }
```
Limits: ≤ 300 KB per pack, ≤ 6 rooms, ≤ 40 layers per room, draw ops only from the whitelist (rect, roundRect, circle, ellipse, poly, path, gradient, grain), and SVG sanitised (no script, no external refs, no foreignObject). Prices are Sparkles only and fixed. No random rewards.

**Authoring:** art is drawn in code or as hand-written SVG in `packs-src/{id}/`. Dirt masks are SVG paths over the art or seeded procedural noise. `npm run pack:preview {id}` opens the room in the dev build with a tuning overlay. Original art only, logged in LICENCES.md.

**Validation (`npm run pack:build {id}`):** Zod schema, size limits, SVG sanitiser, every `tuning` key exists in the tuning table below, every chore has a `size`, `tier` is free|plus, a render smoke test (headless Pixi renders every room and every stage with no exception), and an auto-scrub bot reaches 95% in each room within the target session time (3–5 min total).

**Versioning:** `version` is an integer that only goes up. Published files under `/packs/{id}/{version}/` are immutable, so a fix ships as version+1. `sha256` is computed at build. Bump `min_app_version` when a pack uses a new task type or draw op.

**Publishing (no store release):** upload the built folder to Pages `/packs/{id}/{version}/`, then insert the `packs` row (id, version, title, tier, released_at, manifest_url, sha256, min_app_version). `GET /api/packs` lists it on the next call, and clients download it, verify it, cache it and play offline. Rolling back means inserting a row pointing at the previous version. Publishing anything public needs Blake's yes.

**Weekly cadence:** Mon theme picked, Tue–Wed art and masks, Thu tuning and chores, Fri QA Group, Sat staged (`released_at` set to Sunday 6am Sydney), Sun it goes live. Monthly seasonal packs are free (`tier: free`), and weekly packs are Plus. Mess of the Day is a seeded daily mess in an existing free room.

**QA checklist per pack:** validation passes; plays on iPhone 12-class at 60 fps; reaches 95% with fingers on phone and with assist mode; reduced motion OK; contrast AA on any text; copy follows Puff's tone (no guilt, no body or appearance talk); works offline after one download; a free account sees it locked if Plus; a deliberately corrupted copy (bad hash) is rejected and the app keeps running. Content (IARC, all packs incl. seasonal): no gore, no jump scares, no alcohol (see IARC-ANSWERS.md).

## Mini-task tuning values (owner: SF Frontend & Mobile Dev)
Starting values to playtest (not measured yet). They live in `config/tuning.json` and are adjusted between playtest rounds only. Radius is in points (CSS px). A room is clean at **95%**, with stages at **25/50/75/100%**. Haptics: web uses `navigator.vibrate` (ms arrays, Android only) and apps use Capacitor Haptics. Stroke haptics are throttled to 1 per 60 ms.

| Task | Stroke radius (pt) | Clear rule | Combo window | Haptic (web vibrate / Capacitor) | Particles (per stroke tick / on clear) | Feedback latency |
|---|---|---|---|---|---|---|
| Scrub grime | 28 (boost: 40) | each cell needs 2 passes (mask layers 2); patch clears at 90% of its cells | next patch within 1.2 s | stroke `[8]` / `impact Light`; patch `[20]` / `impact Medium` | 3 suds / 25 | reveal same frame; sound+haptic ≤ 50 ms |
| Fog wipe (window, mirror) | 36 | 1 pass, strokes must be ≥ 60 pt long; fog regrows 0 (never undoes) | 1.5 s | stroke none; squeak `[6,30,6]` / `selectionChanged` | 2 droplets / 15 | same |
| Sweep to pile | 44 | dust moves along stroke; pile done when 85% of dust is within 60 pt of the pile | 2.0 s | pile `[15,40,15]` / `impact Light` | 4 motes / 20 + Puff hop | same |
| Pop dust bunnies | tap target 48 | tap each one (3–12 per room) | 0.8 s between pops | `[12]` / `impact Medium` | 0 / 12 puffs | ≤ 50 ms |
| Dust & polish | 32 | 1 pass dust, then a 2nd polish pass shows the sparkle sweep | 1.2 s | polish `[5]` / `selectionChanged` | 2 / 30 sparkles | same |
| Vacuum crumbs | 30 (suction pull 60) | crumbs within pull radius are pulled in; done at 95% collected | 1.0 s | hum `[4]` per 120 ms / `impact Light` | 1 / 10 | same |
| Power spray (patio) | 22, long trail | 1 pass; cells clear at 100% | 1.0 s | `[6]` / `impact Light` | 6 spray / 30 | same |
| Water plant | hold 1.2 s | hold over plant until it perks up | n/a | `[10,60,20]` / `notification Success` | 8 droplets / 20 leaves | same |
| Fold / sort / stack / untangle / peel / shoo / hand tool | drag-to-target snap 40 | item dropped within snap radius of the right slot | 1.5 s | snap `[10]` / `impact Light`; wrong slot no buzz, soft bounce back | 0 / 10 | snap ≤ 50 ms |
| Stage reached (25/50/75) | — | — | — | `[20,50,20]` / `impact Medium` | — / 40 | ≤ 100 ms |
| Room clean (95% → auto 100%) | — | last 5% auto-sweeps over 0.8 s | — | `[30,60,30,60,80]` / `notification Success` | — / 150 (slow-mo 0.6 s) | ≤ 100 ms |
| Real chore ticked | — | tick on trust, daily cap 5 claims | — | `[15,40,15]` / `notification Success` | — / 30 sparkles | toast ≤ 100 ms |

Global rules: combos only add bonus sparkles or a Puff dance and never time out the task. Reduced motion multiplies particles by 0.25 and removes slow-mo. Live particles are capped at 400. Sound pitch rises in steps of +1 semitone per 10% clean. Idle for 6 s and Puff points at the biggest patch. Help Puff auto-completes a task after 20 s. Scrubbing and mini-tasks never cost Energy: Energy comes only from real chores and is spent only on optional boosts (the "boost" radius above) and Puff's tools, and the server rejects any spend below 0.

### Lead-author notes for Builder's Open questions (SF Product Designer)
- IARC (closed 2026-10-27): answer truthfully; content rating likely Everyone/4+. The 16+ account/payment gate is a separate Ops rule, stated in store listing and /terms. Ops makes the final call on the answers.
- (Closed 2026-10-27: now "3 days in any week", nothing resets.) The Economy section's "2-Energy bonus for a 3-day streak of real chores" reads as a streak, which goes against the no-streak pillar (§4). Suggest replacing it with "3 real-chore days in any week" (Weekly Glow), which never resets.
- Should exported share clips include audio by default?

---

## 10. Codex build steps (game-design scope; tech details in the FRONTEND and BACKEND plans)
Each step is one Codex task. Both loops are version 1.

**Step 1: The scrub core.** One room with a dirt mask, drag-to-clean, a meter, and a reveal of the clean layer underneath.
- GIVEN a dirty room WHEN I drag across the dirt THEN a clean trail appears under my finger and the meter rises.
- GIVEN the meter is at 94% WHEN I clean past 95% THEN the rest auto-sparkles away and the room is marked clean.
- GIVEN mouse, touch or keyboard input WHEN I scrub THEN all three clean the room.

**Step 2: Stages and juice.** 4 dirt layers fade at 25/50/75/100, with particles, sound, pitch climb and haptics.
- GIVEN 24% clean WHEN I reach 25% THEN exactly one dirt layer fades and a sparkle burst plays.
- GIVEN reduced motion is on WHEN a stage triggers THEN a fade plays with no shake and minimal particles.
- GIVEN sound is off WHEN any cue fires THEN a visual cue still shows it.
- GIVEN a phone with haptics on WHEN I scrub glass vs wood THEN the patterns differ. On web, no error is thrown.

**Step 3: The mini-task set.** All §3 tasks are driven by pack data, with Help Puff.
- GIVEN any task WHEN I do nothing THEN nothing fails, and Help Puff appears after the delay.
- GIVEN a sort task WHEN I drop an item in the wrong bin THEN it bounces back with no penalty.
- GIVEN any tap target THEN its hit area is ≥ 44×44 pt.

**Step 4: Puff.** The state machine from §6, plus lines.
- GIVEN each event (task done, stage, reveal, chore tick, idle, return after time away, rest day) WHEN it fires THEN the mapped Puff state plays.
- GIVEN any state THEN Puff is never sad, sick or angry, and no line contains words from the banned list ("failed", "overdue", "lazy", "lost").

**Step 5: The real-chore loop.** A matching suggestion after rooms or tasks, honour ticks, Sparkles and Energy, the daily cap, Our Home.
- GIVEN I finish the kitchen sink task WHEN the suggestion shows THEN it's a kitchen chore with Do it for real and Not now.
- GIVEN I tap Not now THEN there's no penalty and Puff responds warmly.
- GIVEN I tick a chore THEN no photo is asked for, fixed Sparkles and Energy are added, and Puff does `proud_spin`.
- GIVEN I've hit the daily cap WHEN I tick another THEN it counts in Our Home, earns nothing, and Puff says rest counts too.
- GIVEN real chores ticked WHEN the early-unlock threshold is met THEN the next room opens early.
- GIVEN no Energy WHEN I scrub THEN scrubbing still works fully.

**Step 6: Rewards and the shop.** Fixed-price decor, outfits and tools. Finished rooms become decor.
- GIVEN any shop item THEN its price is fixed and visible, and no item is random.
- GIVEN I finish a room THEN it appears as decor in Puff's home.

**Step 7: Gentle retention.** Cosy Days, rest day, Weekly Glow, welcome back, Mess of the Day, daily fresh mess.
- GIVEN I skip 10 days WHEN I return THEN Cosy Days hasn't dropped, nothing is lost, and Puff throws a party.
- GIVEN two devices on the same date WHEN I open Mess of the Day THEN both show the same seeded room.

**Step 8: Rooms, packs and Plus gates.** 3 free rooms, seasonal events and Mess of the Day are free. Plus content sits behind the single entitlement, and the gate is checked by the backend.
- GIVEN a free player WHEN I tap a Plus room THEN a calm Plus info screen shows, with no dead end and no timer.
- GIVEN a new weekly pack is published WHEN I open the app THEN it appears without an app update, and once it's cached it plays offline.
- GIVEN I haven't finished a room yet THEN the Plus offer never appears on its own.

**Step 9: Share moments.** The before/after clip (5–6 s), a still card, the Mess of the Day card and Puff photo mode, all made on the device.
- GIVEN a room hits 95% WHEN I tap Share THEN a clip of only game art is made on the device with no upload, and the system share sheet opens (or the file downloads on web).
- GIVEN a share card THEN it contains no email, name or real-home photo.

**Step 10: Onboarding.** The §5 beats, then the 16+ check and the magic link (auth → BACKEND).
- GIVEN a first launch WHEN I follow the beats THEN I reach the first reveal by about 5 minutes without reading instructions.
- GIVEN I skip sign-in THEN I can keep playing locally, and progress merges after I sign in later.

**Step 11: Accessibility pass.** Everything in §8.
- GIVEN reduced motion, sound off, big brush and keyboard modes THEN each room can be completed in each mode.
- GIVEN the UI THEN automated contrast checks pass AA.

**Step 12: Store assets.** The §9 screenshot set and preview, captured from the build.
- GIVEN the set THEN it has 7 portrait shots plus a 15–30 s preview, shows only game art, and makes no stat or rating claims.

## Consistency decisions (BB Builder, 2026-10-27)
- **Bundle ID:** `com.pixelvortexgames.sweethomereset` on iOS and Android. The deep-link domain is `{APP_DOMAIN}` as a placeholder until Blake buys a domain; it lives in one config value (`config/app.json`), along with the AASA and assetlinks files.
- **Mess of the Day:** seeded from the local date + catalogue version (same for every player, works offline), picked from each pack's `dailyMesses` list; `GET /api/daily` only verifies the once-per-date claim (BACKEND-PLAN Step 4d).
- **Locked rules:** scrubbing and mini-tasks never cost Energy, there are no streaks that reset, prices live only in `config/pricing.json`, and players are 16+ with an IARC rating answered truthfully.
- **Art credit:** Settings > About and the store listing say "Some art created with Grok Imagine"; keep any AI label the tool adds (see LICENCES.md).
