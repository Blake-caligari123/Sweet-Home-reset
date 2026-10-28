# NEW-FEATURES: core town features (F1–F6)
*Owner: BB Builder (doc, data, save, build order, checks). Written 28 Oct 2026 AEDT for Claude Code. Merged owner input: SHR Story Lead (`new-features/story.md`), SF Product Designer (`new-features/ui-assets.md`), SF Frontend & Mobile Dev (`new-features/mobile-input.md`), SF Backend & Payments Dev (`new-features/save-v2.md`).*

**Source of truth:** `cleaning-game/MAYOR-PITCH.md` (approved by Blake, 28 Oct 2026). Where this doc and the pitch differ, the pitch's intent wins and the rulings below record why. Folded into GDD v4 (`claude/GAME-DESIGN.md` A12) on 28 Oct 2026. **Direction change (Blake, 28 Oct 2026): F1–F6 are the core game from year 1, not year-2 locked and with no gates. Monetisation: TBD after build.** Unlock days are the Story Lead's ruling of 28 Oct. A12 is the summary; this file is the detailed spec. GDD v4 wins for everything not listed here. Story canon stays in `claude/STORY.md`.

## 0. Rules for every feature
- **Scope:** all six features are core from year 1 (Blake, 28 Oct 2026). Built in M2–M4 after the M1 save and service worker fixes. Nothing is cut. Monetisation: TBD after build. All 6 neighbours (Otto, Moss and Mabel included) are fully playable from year one with no gates (BB Manager, 28 Oct).
- **Unlocks (one module, `src/town/unlocks.ts`):** `isUnlocked(key, save)` reads only `save.day`, `storyFlags`/`flags` and the `tuning.unlocks` block. It never reads entitlement. Test builds: `?debug&day=N` jumps the day.
- **Year-one schedule (Story Lead, final 28 Oct 2026; Story's timings win):**

| When | Unlock | Feature |
|---|---|---|
| Day 1, ~9:00 | Hazel names Puff the town's new Keeper (Hollowfern has no mayor) and pins on the plain badge, then the first room (her counter). Sets `keeper_named` | F1 |
| Day 2 | Building starts; the first plot is a small bench by the fountain. Chore chip can attach to builds | F1, F6 |
| Day 3 | First dust Grumble (the sparkle that formed Puff stirs the fluff) | F3 |
| Week 2 (days 8–14) | First invite letter: Sorrel, once a home plot is built | F2 |
| Day 10 | Cave floor 1: Mabel's first shore-map leaf (`cave_leaf_1`) arrives in a bottle at the fountain, signed "M."; cobweb Grumbles join | F4, F3 |
| First rainy day after Day 10 | Mud Grumbles join | F3 |
| Day 15 (summer) | Cave floor 2; soot Grumbles join; Fig can be invited | F4, F3, F2 |
| Day 29 (autumn) | Cave floor 3; Wren can be invited once `he_pip_08_done` | F4, F2 |
| Day 43 (winter) | Cave floor 4; the Beach opens and Mabel is first met (her heart events, including the 8-heart reveal, come after this) | F4 |
| Day 56 | Milestone, not a gate: Winter Lights finale, fountain and lighthouse relight, the old song, the badge becomes the ribbon and the title "Keeper of the Glimmerwell" (`keeper_glimmerwell`) | F1, F2 |
| Day 57 (year-2 spring) | Cave floor 5 and the Spring Heart, the first gift of the new year | F4 |
| Day 1 (live) | Fluff and dozing off (existing); weather prep arrives with the M4 weather system | F5 |

- **Tuning (`config/tuning.json`, new object; starting values for playtests):**
```json
"unlocks": { "keeperDay": 1, "buildingDay": 2,
             "grumbleFamilies": { "dust": { "day": 3 }, "cobweb": { "day": 10 }, "mud": { "afterDay": 10, "weather": "rain" }, "soot": { "day": 15 } },
             "inviteOrder": [ { "id": "sorrel", "fromDay": 8 }, { "id": "fig", "fromDay": 15 }, { "id": "wren", "fromDay": 29, "flag": "he_pip_08_done" } ],
             "caveFloorDays": [10, 15, 29, 43, 57] }
```
- **Rulings (BB Manager, 28 Oct 2026):**
  1. Ore has a year-1 placement that follows the cave floors (F4 "Ore by floor"). No Copper recipe ever needs ore; the day-5 General Store Copper recipe stays as it is.
  2. Save v2 adds optional `storyFlags: string[]`, default `[]`, append-only.
- **Words:** player text says tidy, brighten, helper, invite, build. Never "combat", hire, pay, hit, kill, damage, fail, lost or overdue. CI check: `scripts/check-words.ts` greps the en-AU string tables for that list and fails the build.
- **No other game is named** anywhere in code, strings, prompts or store text.
- **Budgets (GDD v3 + Frontend):** each feature is its own lazy chunk ≤ 40 KB gzipped, **loaded only when it first unlocks**; first-load JS ≤ 300 KB gzipped; 60 fps p95 at 390×844; 44 pt targets; zoom enabled; reduced motion and haptics-off respected; no `readPixels`/GPU readbacks.
- **Content lives in pack JSON** (`catalogueVersion` bump), strings in string tables keyed by the ids below, en-AU, ≤ 60 characters per line, ready for localisation.
- **Story text:** merged from the Story Lead's final year-one story (`new-features/story.md` and STORY.md, 28 Oct 2026). Story owns all story text and timings.

### GDD v4 fixes (applied 28 Oct 2026; core-from-year-1 rework applied the same day)
- A2 "Combat: None. Optional later: a cosy puzzle cellar" → "No combat. Grumbles are tidied, never harmed (F3). Caves under the Glimmerwell (F4) replace the puzzle cellar."
- A2 monetisation rows replaced by "Monetisation: TBD after build"; A7 and A9 neighbour gating removed (all 6 playable from year one).
- A6 first 30 minutes: Hazel names Puff Keeper and gives the badge, then the first room; the first bench build is Day 2.
- A9 milestones follow §8.
- A11.2 save section points at §7 (Save v2, from year 1).

---

## F1. Keeper of the Glimmerwell + building on plots

### Player loop
Morning: open the Town Hall board → pick a free plot → pick a building → Confirm (Sparkles + materials taken) → play the day → bed → endDay resolves the build → next morning a toast, camera pans to the plot, and a 1.5 s dust-clear reveal plays. 5–10 min session: one tidy, one visit, one overnight payoff.

### Unlocks and timing
- **Keeper (Day 1, Story Lead):** Hazel names Puff the town's new Keeper, since Hollowfern has no mayor. The first 30 minutes run: Hazel gives Puff the title and badge, then the first room. Hazel pins on the plain badge. Sets `storyFlags += "keeper_named"` and mirrors it in `keeper.titled = true`, `keeper.titledDay = 1`.
- **Keeper of the Glimmerwell (Day 56 milestone, not a gate):** at the Winter Lights finale the fountain and lighthouse relight and the title becomes "Keeper of the Glimmerwell". The badge becomes the ribbon. Sets `storyFlags += "keeper_glimmerwell"` (only the finale sets it). If the finale waits for Mabel's 10 hearts, only the title upgrade waits; nothing else does.
- **Building (Day 2):** the first plot is a small bench by the fountain (Story); `tuning.building.plotsStart` plots open; more open from story beats and seasons (pack `plots[].unlock`).

<!-- STORY LEAD (merged from new-features/story.md §1, SHR Story Lead, final year-one story 28 Oct 2026) -->
- **Beat 1 (Day 1, at the bakery door, about 9:00):** Hollowfern has no mayor. The fountain always had a Keeper instead, and there hasn't been one since Thimble. Hazel, the first neighbour, sees the colour Puff has already brought back, names Puff the new Keeper and pins on the Keeper's badge. It's a hopeful welcome, not a crown. Then the first room job (her counter) follows. Sets `keeper_named`.
  - `keeper.day1.hazel.1`: "No mayor here, petal. The Well needs a Keeper."
  - `keeper.day1.hazel.2`: "You've brought colour back already. Will you be ours?"
  - `keeper.day1.puff.1`: "Me? I only just woke up... but yes. I'd love to."
  - `keeper.day1.hazel.3`: "Here's the badge. Now, my counter, petal..."
- **Unlock:** day 2, morning. Hazel's note points Puff to the Town Hall board. The first plot is a small bench by the fountain (Proposed). Plots are fixed, and each build finishes overnight (resolved in endDay). It's framed as "the town builds together": Pip and any neighbours with the right job help out overnight.
- **Beat 2 (Day 56, Winter Lights finale, after the lighthouse and fountain relight):** Mabel remembers the old map's "little keeper". Hazel, Bea, Pip, Otto, Moss and Mabel each step forward with one word about something Puff did (from save flags). Together they say "Keeper of the Glimmerwell". The town gives the title, earned through friendship; Puff never asks for it. The ribbon badge card follows (ui-assets §1). Sets `keeper_glimmerwell` (only this finale sets it).
- **Finale lines:**
  - `keeper.finale.mabel.1`: "Hoo. The maps spoke of a little keeper."
  - `keeper.finale.town.1`: "Keeper of the Glimmerwell! That's you, Puff."
  - `keeper.finale.puff.accept.1`: "Me? I only tidied a bit... with all of you."
  - `keeper.finale.puff.accept.2`: "I'll keep it sparkly. Many paws, light work."
  - `keeper.react.hazel.1`: "Keeper! I'm baking a cake. Sit, petal. Sit!"
  - `keeper.react.bea.1`: "Three things! One: Keeper. Two: badge. Three: wow!"
  - `keeper.react.pip.1`: "A Keeper! Can I make you a tiny hat? Right?"
  - `keeper.react.otto.1`: "Keeper? You've made a splash. Heh. Proud of you."
  - `keeper.react.moss.1`: "... Keeper. It suits you. Quietly."
  - `keeper.react.mabel.1`: "Hazel saw it first. The Well chose well. Hoo."
- **Migration (BB Manager ruling, 2026-10-28):** an old save past day 1 gets `keeper_named` plus one letter from Hazel, and building opens the next morning. A save already past day 56 without `keeper_glimmerwell` plays the finale once as a catch-up, which sets the flag.
  - `migrate.letter.hazel.1`: "Petal! The town needs a Keeper, and it's you. Fancy that!"
  - `migrate.letter.hazel.2`: "There's a Town Hall board waiting. Tea first, though."
- **Building lines:**
  - `build.morning.done.1`: "Morning! The new place is finished. Come see!"
  - `build.puff.place.1`: "Here, I think. It'll be cosy here."

### Data and save v2
- Save: `keeper`, `plots`, `choreBonus.buildBoostPlotId` (see §7).
- Pack JSON:
```json
{ "plots": [{ "id": "plot_square_n1", "area": "town_square", "x": 12, "y": 4, "w": 4, "h": 3,
              "allow": ["cottage", "stall", "workshop"], "unlock": { "flag": "keeper_named" } }],
  "buildings": [{ "id": "cottage", "kind": "home", "nights": 1, "stages": ["scaffold", "frame", "done"],
                  "cost": { "sparkles": 200, "materials": { "twig": 20, "pebble": 10 } },
                  "upgradeOf": null, "effect": { "home": true } }] }
```
- Tuning (`config/tuning.json`, new object; starting values for playtests, not data):
```json
"building": { "plotsStart": 4, "plotsMax": 12, "nightsDefault": 1, "nightsMax": 3, "maxActiveBuilds": 2 }
```
- Logic (pure, in `src/town/build/build.ts`): `startBuild(save, plotId, buildingId, day)` sets `{ stage: 0, startedDay: day, readyDay: day + nights }` and spends cost atomically (all or nothing). `resolveBuilds(save, endedDay)` runs inside `endDay` (both sleep and doze): every plot with `readyDay <= endedDay + 1` becomes `stage = stages.length - 1`; others advance one stage. No timers, no wall clock.

### Assets
<!-- DESIGNER (merged from new-features/ui-assets.md §1, SF Product Designer) -->
- UI: a Town Hall board, a full-screen sheet listing plots, each with an icon, its cost, a "Finishes overnight" tag and a Build button. Build mode shows the plot outline in sage, a ghost of the building, and Confirm/Cancel (44 pt) at the bottom. The HUD hides its tools while you build. On the morning after a build, a 1.5 s reveal shows dust clearing and colour flooding in.
- Keeper title: Puff is Keeper from the start. A one-off "Keeper of Hollowfern" card in the opening shows Puff (48 px) and a plain badge, and the badge then sits on the Town Hall icon. The Day 56 finale upgrades it to a ribbon badge with a short "Keeper of the Glimmerwell" card, following Story's beat.
- Assets (code): the plot outline, 3 build stages (scaffold, frame, done) per building type, a dust-clear effect and the badge. (Grok): none.

<!-- FRONTEND (merged from new-features/mobile-input.md §1, SF Frontend & Mobile Dev) -->
- Build mode is a separate HUD state: tap a plot, see the building card, then Confirm or Cancel (≥ 44 px each, at the bottom within thumb reach).
- Plots are fixed, so a placement is one tap with no drag. Pinch to zoom out is allowed in build mode only, clamped to whole-number scales.
- Overnight completion shows a morning toast and pans the camera to the plot.

### Build order
- **M2:** types + save fields + migration (§7); `unlocks.ts`; pack schema for `plots`/`buildings` validated in CI; Day-1 Keeper flag and card; Town Hall board list (Frontend M2).
- **M3:** build mode (Frontend M3), `startBuild`/`resolveBuilds`, 3 stages, morning reveal, overnight pan toast, chore chip hook (F6); playable from Day 2.
- **M4:** Day-56 finale upgrades the title; full building catalogue (homes for F2, stalls for jobs, upgrades using ore from F4); seasonal plot unlocks.

### Acceptance checks
1. F1-1 Unit: `startBuild` on day N with `nights: 1` then `resolveBuilds(save, N)` → plot `stage` = last stage (= AT-V2-3).
2. F1-2 Unit: `startBuild` with too few Sparkles or materials changes nothing (save deep-equal before/after).
3. F1-3 Unit: a build resolves identically after sleep and after doze; changing the device clock does not finish it early.
4. F1-4 Unit: `isUnlocked('building')` is false on Day 1 and true from Day 2 for a save with no entitlement; `unlocks.ts` has no entitlement import (lint).
5. F1-5 E2E (375 px): place a building in ≤ 3 taps; walking taps never place a building; Cancel leaves the save unchanged.
6. F1-6 E2E: a new game sets `keeper_named` (and `keeper.titled`) on Day 1 and the Keeper card with the plain badge shows once; at the Day-56 finale the title upgrades and `keeper_glimmerwell` persists across reload; a finale waiting for Mabel delays only the title upgrade.
7. F1-7 Perf: morning reveal holds 60 fps p95; reduced motion skips the colour flood.

---

## F2. Inviting villagers
### Player loop
A home building finishes (F1) → Town Hall shows "Who'd love this home?" → Puff prepares it (tidy it to 95% + place the 3 liked items) → Invite sends a letter → next morning the newcomer moves in with a welcome toast → befriend them (hearts, gifts, 5-beat arc). The six take town jobs at heart 6+; any job can be declined. No payroll, no wages, no upkeep.

### Unlocks and timing
- Arrival order (Story): **Sorrel** in spring (first invite letter in week 2, once a home plot is built), **Fig** in summer (from Day 15), **Wren** in autumn (from Day 29, only after `he_pip_08_done`, so Pip's arc stays intact). Read from `unlocks.inviteOrder`. One newcomer at a time; at most one move-in per `tuning.villagers.moveInEveryDays` (7).
- Jobs: neighbour hearts ≥ `tuning.villagers.jobHeart` (6), any day. A job takes one plot or stall.

<!-- STORY LEAD (merged from new-features/story.md §2, SHR Story Lead, final year-one story 28 Oct 2026) -->
- **Beat:** a ready home lists who'd love it (ui-assets §2). Puff prepares it, by tidying it and adding the 3 things they'd like, then sends an invite letter. They move in the next morning. Nobody is paid and nobody is hired. Each newcomer brings a 5-beat heart arc (2/4/6/8/10).
- **Unlock:** the first invite letter goes out in week 2 (days 8–14), once a home plot has been built. One newcomer at a time, and at most one move-in a week.
- **Newcomers (Decided 2026-10-28; arrival order Proposed; full sheets in §7):**
  - **Sorrel the tortoise**, a retired mapmaker. Arrives in spring (week 2, just as the caves open on day 10). Want: one last map, of the waterways. Needs a slow ramp, a big desk and tea. `villager.sorrel.movein.1`: "I took the long way. I always do. Hello!"
  - **Fig the frog**, a ferry-keeper. Arrives in summer (from day 15). Want: a river with friends on both banks. Needs a pond porch, a lantern and shells. `villager.fig.movein.1`: "Ribbit! I mean, hello. Lovely river you've got."
  - **Wren the wren**, Pip's old friend. Arrives in autumn (from day 29). Her invite opens only after Pip's 8-heart event, where Pip mails her the toy and asks her to come home, so Pip's arc stays intact. Want: to come home and see if she still fits. Needs a nest-loft with a window seat, Pip's toy and seeds. `villager.wren.movein.1`: "Pip wrote that Hollowfern sparkles again. Is it true?"
- **Town jobs for the six (heart 6+, any time once building has started; each takes one plot or stall):**
  - Hazel: town baker (snack stall).
  - Bea: plot planner (garden plots).
  - Pip: overnight builder helper.
  - Otto: waterworks keeper.
  - Moss: town records (the build journal).
  - Mabel: cave guide (maps, §4), from her 6 hearts, which play after she's first met on day 43.
  - Example: `job.offer.pip.1`: "Need help building? I've got a hammer. And string!" Any job can be declined, with a warm reply: `job.decline.any.1`: "No worries. Ask anytime."

<!-- STORY LEAD (merged from new-features/story.md §7, SHR Story Lead, final year-one story 28 Oct 2026) -->
#### Newcomer sheets (Sorrel, Fig, Wren)
*Fills NEW-FEATURES.md line 99 (F2, the STORY LEAD placeholder). Newcomers are Decided (STORY.md 8.3). Heart rules are the same as for the six: talk +1, liked +3, loved +8, request +10, 10 points a heart, hearts never drop. Every event needs `movedIn: true` (no year or tier condition), can be skipped, and saves `he_<id>_<nn>_done` to `storyFlags`. Triggers use the same shape as STORY.md §7: `enterArea`, `talk`, `morningLetter` and `festival`. Puff is "they". Each line is 60 characters or fewer.*

##### 7.1 Wren the wren (nest-loft) · arrives autumn, after Pip 8 (third newcomer)
- **Want or wound:** to come home and find out if she still fits. She left when her family moved for work, and she's worried Hollowfern grew up without her.
- **Secret:** before she left, she dropped Pip's first toy into the Glimmerwell as a wish to come back, and she has always felt bad about "throwing it away".
- **Routine:** sings on the roof from 6:00 to 8:00. Visits Pip's workshop from 10:00 to 13:00, Bea's flowers in the afternoon, and is back in the loft by 20:00.
- **Gifts:**
  - Loved: seeds, a Pip toy.
  - Liked: silk thread, berries, buttons.
  - Disliked: mud, soot ("Not on my feathers!").
- **Speech:** quick little trills, and she repeats a word when excited ("Home, home!"). She finishes Pip's sentences.
- **With the six:**
  - Pip: best friend, and they pick up where they left off.
  - Hazel: fed her as a chick.
  - Bea: swaps seeds with her.
  - Moss: shy around her chatter, but he lends her bird books.
  - Otto: they met after she left.
  - Mabel: Wren used to fly her letters.
- **Heart events:**
  - `he_wren_02`. **Trigger:** `talk` at the nest-loft in the morning. **Conditions:** heartsMin 2.
    - `he_wren_02.l01` "Home, home! But... it's all so sparkly now."
    - `he_wren_02.l02` (Puff) "Sparkly AND yours. Promise."
  - `he_wren_04`. **Trigger:** `enterArea` Pip's workshop in the day band. **Conditions:** heartsMin 4, and `he_pip_10_done` *or* not (branch).
    - `he_wren_04.l01` "Pip kept every toy. Even the wonky ones."
    - `he_wren_04.l02` (if `he_pip_10_done`) "He opened the shop to everyone! Oh, Pip."
    - `he_wren_04.l02b` (otherwise) "He makes things for other people now. Good."
  - `he_wren_06`. **Trigger:** `talk` at the nest-loft in the evening. **Conditions:** heartsMin 6. Wren tells the secret about the wish toy.
    - `he_wren_06.l01` "I threw Pip's first toy in the fountain. As a wish."
    - `he_wren_06.l02` "It worked. I came back. But the toy's gone."
    - `he_wren_06.l03` (Puff) "Things that fall in the Well go somewhere..."
    - Sets `wren_toy_hint`.
  - `he_wren_08`. **Trigger:** `enterArea` cave floor 3. **Conditions:** heartsMin 8, flag `wren_toy_hint`. Pays off mystery 3. Sets `cave_wren_toy`.
    - `he_wren_08.l01` (Puff) "Wren! Look! A little toy, all shiny with colour."
    - `he_wren_08.l02` "Pip's bunny-copter! It's been waiting for me."
    - `he_wren_08.l03` "Can we give it back to him? Together?"
  - `he_wren_10`. **Trigger:** `talk` at the workshop. **Conditions:** heartsMin 10, `cave_wren_toy`. Wren and Pip put the toy in the shop window, with the toy of Puff from Pip 10 beside it.
    - `he_wren_10.l01` "Home, home. For real this time."
    - `he_wren_10.l02` (Pip) "Two old toys and a Keeper. Best window. Right?"

##### 7.2 Sorrel the tortoise (ramp cottage) · arrives spring, week 2 (first newcomer)
- **Want or wound:** one last map, of the waterways. Her eyes and legs are slow now, and she's afraid her life's work will stop one bend short.
- **Secret:** as a hatchling she met the *last* keeper, Thimble (Decided 2026-10-28), and she has kept Thimble's ribbon for 80 years without knowing who to give it to.
- **Routine:** takes 6:00 to 9:00 to get up, which she calls "the long way". Draws at her big desk from 10:00 to 16:00. Has tea with Mabel at 18:00 and is asleep by 21:00.
- **Gifts:**
  - Loved: tea, old maps.
  - Liked: books, honey, colour shard.
  - Disliked: loud bubbles, anything hurried ("Rushing smudges the ink").
- **Speech:** slow and kind, with lots of commas, and she talks in map words ("north of noon", "let's take the scenic route").
- **With the six:**
  - Mabel: an old pen-pal, and together they're the town's memory.
  - Moss: her apprentice in archive work.
  - Otto: she mapped his uncle Brook's river.
  - Hazel: brings her soft buns.
  - Bea: plants her a slow, low garden.
  - Pip: makes her a wheeled map case.
- **Heart events:**
  - `he_sorrel_02`. **Trigger:** `talk` at the cottage in the day band. **Conditions:** heartsMin 2.
    - `he_sorrel_02.l01` "Every map I drew, I walked. Slowly, mind."
    - `he_sorrel_02.l02` (Puff) "Slow is how you notice things!"
  - `he_sorrel_04`. **Trigger:** `talk`. **Conditions:** heartsMin 4, `cave_leaf_2`. Sorrel copies leaves for the neighbours (pays off `villager.sorrel.map.1`).
    - `he_sorrel_04.l01` "The waterways. I never got down there. Too many steps."
    - `he_sorrel_04.l02` "Bring me what you see, and I'll draw it."
  - `he_sorrel_06`. **Trigger:** `talk` after Puff returns from the caves. **Conditions:** heartsMin 6, flag `cave_bend_heard`. Plants mystery 4.
    - `he_sorrel_06.l01` "A whistling bend? Hum it for me."
    - `he_sorrel_06.l02` "...I know that tune. Thimble used to hum it."
  - `he_sorrel_08`. **Trigger:** `morningLetter` (an invitation for tea). **Conditions:** heartsMin 8, `he_sorrel_06_done`. Pays off the earlier-keepers mystery: Sorrel gives Thimble's ribbon to Puff, and Puff gives it to Moss's records. Sets `keeper_ribbon_found`.
    - `he_sorrel_08.l01` "When I was small, there was a keeper. Thimble."
    - `he_sorrel_08.l02` "A dust bunny, like you. This was their ribbon."
    - `he_sorrel_08.l03` (Puff) "There were others? Oh... I'm part of a family."
    - `he_sorrel_08.l04` (Puff) "Let's give it to Moss, so the whole town remembers."
  - `he_sorrel_10`. **Trigger:** `talk` at the cottage. **Conditions:** heartsMin 10, `cave_spring_heart`. A year-2 beat, because floor 5 opens in year-2 spring. She finishes the map, with the Spring Heart drawn at its centre. It's hung in the Town Hall.
    - `he_sorrel_10.l01` "There. The last bend. Took the long way, as always."
    - `he_sorrel_10.l02` "And I drew a little keeper by the spring. Guess who."

##### 7.3 Fig the frog (pond porch) · arrives summer (second newcomer)
- **Want or wound:** a river with friends on both banks. His ferry went quiet when the town stopped visiting itself, and he worries that he's only useful when someone needs a ride.
- **Secret:** every night for years he rang the river bell, just in case someone was waiting on the far bank. Mabel saw the lamp-night candle answer it once.
- **Routine:** runs the ferry from 7:00 to 12:00. Swims from 12:00 to 14:00, then the ferry again from 14:00 to 18:00. Rings the bell at 22:00.
- **Gifts:**
  - Loved: shells, a lantern.
  - Liked: fresh bread, river stones, flowers.
  - Disliked: soap ("Makes the pond fizzy"), cobwebs.
- **Speech:** cheerful and a bit formal. He sometimes slips into "Ribbit!", which he covers with "I mean...", and he calls Puff "passenger".
- **With the six:**
  - Otto: river neighbours, and Fig teaches him to swim (which pays off Otto's secret).
  - Hazel: he ferries her buns across.
  - Bea: lily pads for her shop.
  - Pip: Pip builds him a toy boat.
  - Moss: Fig's bell keeps Moss awake, which leads to a quiet truce.
  - Mabel: the bell and her lamp answer each other.
- **Heart events:**
  - `he_fig_02`. **Trigger:** `enterArea` Riverside in the morning. **Conditions:** heartsMin 2.
    - `he_fig_02.l01` "All aboard! I mean... hello, passenger."
    - `he_fig_02.l02` "Not many riders lately. More now, thanks to you."
  - `he_fig_04`. **Trigger:** `talk` at the ferry. **Conditions:** heartsMin 4, `he_otto_08_done`. It waits for Otto's secret so it doesn't spoil Otto 8. Fig 6, 8 and 10 don't need it. Sets `otto_can_swim`.
    - `he_fig_04.l01` "Otto says you paddled with him. Want lessons, Otto?"
    - `he_fig_04.l02` (Otto) "Me? Swim? Water you suggesting? ...Yes please."
  - `he_fig_06`. **Trigger:** `enterArea` Riverside at night (22:00 or later). **Conditions:** heartsMin 6. Fig tells the secret about the bell. Sets `fig_bell_told`.
    - `he_fig_06.l01` "I ring it every night. In case someone's waiting."
    - `he_fig_06.l02` (Puff) "Someone was. The whole town, I think."
  - `he_fig_08`. **Trigger:** `talk` after the bend is heard. **Conditions:** heartsMin 8, `cave_bend_heard`, `fig_bell_told`. Pays off mystery 4: the bell's note matches the whistling bend, because the river flows from the old waterways. Sets `old_song_known`.
    - `he_fig_08.l01` "The bend whistles... the same note as my bell!"
    - `he_fig_08.l02` "The river remembers the song. Ribbit! I mean, wow."
    - `he_fig_08.l03` (Puff) "Moss hums it at night too. Let's all learn it."
  - `he_fig_10`. **Trigger:** `festival` at Winter Lights (Day 56 finale). **Conditions:** heartsMin 10, `old_song_known`. Fig's bell starts the old song, Moss leads, and the town sings, inside the year-1 finale. If Fig isn't at 10, Moss leads without Fig's lines (Decided), and Fig 10 plays at the next Winter Lights.
    - `he_fig_10.l01` "One ring for every friend on every bank."
    - `he_fig_10.l02` "No passengers tonight. Just neighbours."

##### 7.4 New flags and the mystery map
- **New `storyFlags`:**
  - `wren_toy_hint`
  - `cave_bend_heard` (set the first time Puff passes the floor-2 third bend, summer)
  - `keeper_named` (day 1, Hazel)
  - `fig_bell_told`
  - `old_song_known`
  - `keeper_ribbon_found`
- **Mysteries:**
  1. Spring Heart: floor 5 (year-2 spring) and Sorrel 10 (map).
  2. Earlier keepers: floor-4 drawings (winter), Sorrel 6 and 8 (Thimble's ribbon).
  3. Wren's toy: Wren 6 and 8 (`cave_wren_toy`, floor 3).
  4. Whistling bend: Sorrel 6, then Fig 8 and Fig 10 (the old song at the Day 56 Winter Lights).
- Newcomers 4–6 (up to `villagers.maxNew`) are not written yet. See the clash list.

##### Story Lead decisions (28 Oct 2026)
- **Decided:** the earlier keeper is **Thimble**, a dust bunny Sorrel met as a hatchling. Thimble's ribbon goes to Moss's records at `he_sorrel_08`.
- **Decided:** `villagers.maxNew` stays at 6. Wren, Sorrel and Fig are written; newcomers 4–6 are an **open thread** for the Story Lead. Code supports 6 from M3; only the 3 written ones ship in pack JSON until the rest are written.
- **Decided:** at the Day-56 Winter Lights, if Fig is below 10 hearts, **Moss leads the old song** without Fig's bell lines (`he_fig_10` is skipped). The finale never waits on Fig.

##### Builder rules for the newcomer events
- Conditions read the union of the existing `flags` list (where M2 heart-event code already writes `he_<id>_<nn>_done`, e.g. `he_pip_10_done`, `he_otto_08_done`) and `storyFlags`. New F1–F6 flags are written to `storyFlags`; existing heart-event code keeps writing done-flags where it does today. Both lists are append-only, so a condition never sees a flag disappear.
- `cave_leaf_<n>` = the map leaf that opens floor n (found on floor n−1; `cave_leaf_1` is Mabel's first shore-map leaf, arriving in a bottle at the fountain on Day 10).
- `cave_spring_heart` is set when Puff finds the Spring Heart on the deepest floor (floor 5, opens Day 57). So `he_sorrel_10` lands after the Day-56 finale; floor 5 on Day 57 is intended (Story Lead, 28 Oct).
- `he_wren_10` shows the Puff toy only if `he_pip_10_done`; otherwise it plays branch line `he_wren_10.l02b` "Pip told me about the fountain. I'm glad you were here for them."
- Sorrel's loved "old maps" gift is `old_map`, the faded town map, bought at the General Store. Mabel's map leaves are key items and can never be gifted.

##### Designer ruling: Fig 4 staging (SF Product Designer, 28 Oct 2026; settled by BB Manager 28 Oct)
*Resolves clash 4 (Fig's swimming lessons vs Otto's look sheet "never draw him in the water"), 28 Oct 2026. Story Lead may still adjust the `he_fig_04` lines.*
- Fig 4 keeps this staging and sets `otto_can_swim` (BB Manager).
- No swim art in Fig 4 itself. Otto is never shown in the water before `otto_can_swim` is set.
- Otto sits on the jetty and practises strokes in the air using his existing frames, while Fig swims below.
- The lesson itself happens in a short fade to black, with a splash effect drawn in code.
- It fades back to Otto dripping and proud on the jetty, with a 2-frame water-drip effect drawn in code.
- Assets (code only): the splash effect and the 2-frame drip. (Grok): one new asset, "Otto paddling beside Fig (wobbly, proud)", used only once `otto_can_swim` is set (BB Manager, 28 Oct).
- Check F2-11: `he_fig_04` sets `otto_can_swim`; before it, no Otto frame outside his existing sheet and Otto's sprite never overlaps a water tile; and with reduced motion the fade is a cut and the splash and drip are static.

### Data and save v2
- Save: `villagers` map (§7). On move-in, the newcomer also gets a normal `friends[id]` record (existing `Friend` type), so hearts, gifts and heart events reuse M2 code. The six keep their existing records; jobs are derived from hearts plus `storyFlags` (`job_<id>_accepted` / `job_<id>_declined`), so no new structure.
- Pack JSON: `villagers[]` = `{ id, species, homeKinds: ["nest_loft"], loves: ["window_seat","pip_toy","seeds"], arc: ["he_wren_02", …] }`; `jobs[]` = `{ neighbourId, id, heartsMin: 6, plotKind, effect }`.
- Tuning:
```json
"villagers": { "maxNew": 6, "lovesNeeded": 3, "homeTidyMin": 0.95, "moveInDelayDays": 1, "moveInEveryDays": 7, "jobHeart": 6 }
```
- Logic (`src/town/villagers/invite.ts`): `canInvite(save, villagerId, plotId)` true when the plot holds a finished home of an allowed kind, its tidy ≥ `homeTidyMin`, all `loves` are placed, no other invite is pending, and the last move-in was ≥ `moveInEveryDays` ago. `invite()` sets `invitedDay`; `endDay` sets `movedInDay = invitedDay + moveInDelayDays` and creates `friends[id]`.

### Assets
<!-- DESIGNER (merged from new-features/ui-assets.md §2, SF Product Designer) -->
- UI: when a home is ready, the Town Hall gets a "Who'd love this home?" list. Each card has a portrait (48 px), 1 line about who they are, and what they'd like in the home as 3 icons. An Invite button sends a letter, and they move in the next morning to a short welcome toast.
- Assets (Grok): each new villager needs idle plus walking down, up and right sheets (16×24), and a 48 px portrait. (Code): the letter, the toast, a moving box prop.
- Asset (Grok, BB Manager 28 Oct): "Otto paddling beside Fig (wobbly, proud)", shown only once `otto_can_swim` is set. Code: the Fig-4 splash and 2-frame drip.

<!-- FRONTEND (merged from new-features/mobile-input.md §2, SF Frontend & Mobile Dev) -->
- Menu-only: the Town Hall board is a scrollable list with 44 px rows. It adds no per-frame cost.

### Build order
- **M2:** `villagers` save field; pack schema; Town Hall list with invite cards using the 6 existing neighbours as test data; jobs derived from hearts (stubbed effects).
- **M3:** `canInvite`/`invite`/move-in in `endDay`; invite order from `unlocks.inviteOrder`; job offers and declines; Wren end to end as the build's test villager (in game she arrives third, in autumn after Pip 8) (sheet, routine, gifts, `he_wren_02`–`he_wren_10`; `he_wren_08` needs cave floor 3, so it is tested with a debug floor until M4).
- **M4:** Sorrel and Fig with full arcs (`he_sorrel_*`, `he_fig_*`, Moss fallback at the Day-56 Winter Lights; `otto_can_swim` + paddling asset), newcomers 4–6 when the Story Lead writes them; job effects live (snack stall, garden plots, overnight build helper, waterworks, build journal, cave guide).

### Acceptance checks
1. F2-1 Unit: `canInvite` false until tidy ≥ 0.95 and all 3 loves are placed; true after.
2. F2-2 Unit: invite on day N → after `endDay(N)` `movedInDay = N + 1` and `friends[id]` exists with 0 points.
3. F2-3 Unit: a second move-in within 7 days is refused; a second pending invite is refused.
4. F2-4 Unit: job offer appears at hearts ≥ 6 on any day; declining sets `job_<id>_declined`, changes no hearts, and the offer can be re-asked.
5. F2-5 Save: no field named wage, salary, pay or upkeep exists in save or pack schema (schema test).
6. F2-6 E2E: Town Hall list scrolls at 60 fps; VoiceOver reads each row's name and requirement.
7. F2-7 Unit: each of the 15 newcomer events (`he_wren_02`…`he_fig_10`) fires only with `movedIn` + its hearts and flags (no year or entitlement condition), is skippable, and appends `he_<id>_<nn>_done`; flag conditions see both `flags` and `storyFlags`.
8. F2-8 Unit: the mystery chains complete in order: `wren_toy_hint` → `cave_wren_toy`; `cave_bend_heard` → `he_sorrel_06_done` → `keeper_ribbon_found`; `cave_bend_heard` + `fig_bell_told` → `old_song_known`.
9. F2-9 Unit: the Day-56 Winter Lights with Fig below 10 hearts plays the Moss-led song and skips `he_fig_10`; with Fig at 10 and `old_song_known`, `he_fig_10` plays inside the finale.
10. F2-10 Data: pack JSON holds exactly the written newcomers (3 today); `villagers.maxNew` stays 6 and the invite list never shows an unwritten slot.
11. F2-11 E2E: Fig 4 staging per the Designer ruling sets `otto_can_swim`; before that flag no Otto frame outside his existing sheet is used and Otto never overlaps a water tile; after it, only the paddling asset puts Otto in water; splash + 2-frame drip are code-drawn, reduced motion turns the fade into a cut.
12. F2-12 E2E: a save with a finished home plot gets Sorrel's invite letter in week 2 and not before; Fig is not invitable before Day 15; Wren is not invitable before Day 29 or without `he_pip_08_done`.

---

## F3. Grumbles (tidied into helpers)
### Player loop
Enter an area → grey Grumbles drift slowly → tap one → Puff walks over and uses the matching tool (auto-select) → each use fills the pip ring and costs normal tool Fluff → ring full → it brightens, "Friend made!" → it becomes a helper with a small overnight job. Holding still never fails anything; Grumbles drift away, never chase.

### Unlocks and timing
- Families join per `unlocks.grumbleFamilies` (Story): dust on Day 3 (the sparkle that formed Puff stirs the fluff), cobweb on Day 10, mud on the first rainy day after Day 10, soot on Day 15.
- Spawn: in areas not visited for `spawnNeglectDays`, plus fixed spots on cave floors (F4). Max `spawnPerAreaMax` per area per day; max 6 active per screen.

<!-- STORY LEAD (merged from new-features/story.md §3, SHR Story Lead, final year-one story 28 Oct 2026) -->
- **Lore:** Grumbles are little clouds of sleepy fluff that gathered in places nobody visited for a long time. They're Puff's distant cousins: the same forgotten bits, minus the sparkle. The sparkle that formed Puff on day 1 rippled out through the town and stirred them awake, so they start to appear soon after Puff does. They aren't bad, just grumbly from being left alone. Tidying them gives them back their colour, and then they want to help. Nothing dies or gets hurt.
- **Unlock:** a stub in M2 and the full system in M3. The first dust Grumble appears on day 3, and the other families join through spring and summer, each where it belongs (Proposed days below). At most 6 are active per screen.
- **Families (ids fixed):**

| id | Joins | Where | Look | Before (grey) | After (bright) | Helper job |
|---|---|---|---|---|---|---|
| `grumble.dust` | Day 3 | Neighbour Lane attics and Pip's workshop loft; later Moss's library stacks | Round puff, droopy | "Hrmph." / "Mmf... dusty." | "Pff! Ooh!" | Dusts shelves overnight |
| `grumble.cobweb` | Day 10 | Cave corners on floor 1; later the lighthouse stairs | Wispy, curly strands | "Tsk." / "Tangly..." | "Swish! Pretty!" | Spins silk thread (crafting) |
| `grumble.mud` | First rainy day after day 10 | Riverside paths after rain | Blobby, wobbly | "Blorp." / "Squelch." | "Bloop! Hehe." | Packs paths and plots (build prep) |
| `grumble.soot` | Day 15 (summer) | Hazel's bakery chimney; later cave vents | Little puffs that sneeze | "Kff." / "Achoo..." | "Fwoosh! Warm!" | Keeps ovens and lanterns glowing |

- **Lines (two per family before, one after):** `grumble.dust.before.1` "Hrmph." · `grumble.dust.before.2` "Mmf... dusty." · `grumble.dust.after.1` "Pff! Ooh!" Same pattern for `cobweb`, `mud` and `soot`, using the table text.
- **Puff:** `grumble.puff.first.1` (day 3): "Oh! A little grey puff. You look like me!" · `grumble.puff.tidy.1`: "Hello, grumbly. Let's brighten you up." · `grumble.puff.helper.1`: "Friend made! Want to help?"
- **Tone check:** no slime, no teeth, no glowing eyes. Mud is "puddle-cute", and soot sneezes but doesn't choke. Grumbles drift away instead of chasing, and holding still never fails anything.

### Data and save v2
- Save: `grumbles` map (§7), extended with the position and progress needed for a mid-day reload. Ids are deterministic: `${area}:${day}:${n}`.
- End of day: `grumpy` entries not tidied drift away (deleted, no penalty, they may respawn); `helper` entries persist up to `helpersMax`. This keeps the save bounded (AT-V2-6).
- Pack JSON: `grumbleFamilies[]` = `{ id: "dust"|"cobweb"|"mud"|"soot", tool: "duster"|"sponge"|"rake", hits, helperJob }`. The tool per family comes from the matching mess type in the existing mess table.
- Tuning:
```json
"grumbles": { "enabled": true, "maxActivePerScreen": 6, "pathRefreshMs": 500, "driftTilesPerSec": 0.75,
              "hits": { "dust": 3, "cobweb": 4, "mud": 5, "soot": 6 }, "spawnNeglectDays": 3,
              "spawnPerAreaMax": 3, "helpersMax": 12, "helperTickSec": 10 }
```
- Fluff per use = existing `fluffToolUse` (no new key). Charged use counts as its tier's hits.
- Logic (`src/town/grumbles/`): pure state machine `grumpy → tidied → helper` (`tidied` lasts the brighten animation, then `helper` on accept). Pathfinding reuses the A* walker, refreshed every 500 ms and staggered across Grumbles, never per frame. Helpers reuse the neighbour schedule AI on a 10 s tick.

### Assets
<!-- DESIGNER (merged from new-features/ui-assets.md §3, SF Product Designer) -->
- UI: tap a Grumble and Puff uses the current tool on it. Above it is a cleanliness pip ring that fills up (not a health bar). Once full, it turns from a grey puff into a cheerful colour, and a "Friend made!" toast shows. Helpers are listed in the Bag under a "Helpers" tab. Words used: tidy, brighten, helper. Never hit, kill or damage.
- Assets (Grok): 4 Grumble families (dust, cobweb, mud, soot), each with grey idle (4 frames), wobble when tidied (3), turning bright (4) and bright idle (4), on a 16×16 cell. (Code): the pip ring, sparkle bursts, the toast.

<!-- FRONTEND (merged from new-features/mobile-input.md §3, SF Frontend & Mobile Dev) -->
- Tap a Grumble to walk and scrub, holding to keep going. Each use shows a white flash, a haptic tick, and the progress ring (no health bar).
- Grumbles drift slowly, at most 6 active per screen. Pathfinding refreshes every 0.5 s, staggered, not every frame. Helpers reuse the neighbour AI with a 10 s schedule tick.

### Build order
- **M2 (Frontend M2: Grumble controls + Fluff bar):** `grumbles` save field + types; state machine; dust family from Day 3 with tap/hold, pip ring, haptics, cap 6, staggered 0.5 s paths, Fluff cost per use; untidied drift-away at endDay.
- **M3:** cobweb and mud families on their days, helpers list, helper AI on a 10 s tick, helper jobs.
- **M4:** soot family, cave-floor Grumbles (cobweb, soot) and helper jobs that feed F1/F4 (silk thread, path prep).

### Acceptance checks
1. F3-1 Unit: no Grumble spawns before Day 3; cobweb not before Day 10; mud only from the first rainy day after Day 10 (and not on a dry Day 11); soot not before Day 15; with `enabled: false` (kill switch) none spawn; entitlement has no effect.
2. F3-2 Unit: a `dust` Grumble needs exactly `hits.dust` tier-1 uses; state goes grumpy → tidied → helper; no state ever decreases.
3. F3-3 Unit: spawning a 7th Grumble on one screen is refused.
4. F3-4 Unit: pathfinding recomputes at most once per 500 ms per Grumble, and no two Grumbles recompute on the same frame.
5. F3-5 Unit: untidied Grumbles are removed at endDay with no Fluff, Sparkles or item change; helpers persist; helpers never exceed 12.
6. F3-6 Save: mid-day reload keeps every Grumble's area, position, hits and state (part of AT-V2-2).
7. F3-7 Perf: 6 Grumbles + 3 helpers on an iPhone SE-class device → p95 frame ≤ 16.7 ms, no GPU readbacks.
8. F3-8 Words: string tables pass `check-words.ts` (no "combat", hit, kill, damage).

---

## F4. Caves under the Glimmerwell (mining + ore crafting)
### Player loop
Enter through the hatch in the Glimmerwell rim → one small handmade floor loads → tap a rock (Fluff cost floats above it first) → swings repeat until it breaks → ore pops out and auto-collects within 1 tile → find the map leaf to open the next floor → "Up" exit any time → craft upgrades above Copper with ore at the bench. Short trips; no endless depth.

### Unlocks and timing
- Day 10: floor 1 opens with Mabel's first map leaf (`cave_leaf_1`), which washes up at the fountain as a letter in a bottle (Story Lead; Mabel is first met at the Beach on Day 43 and her 8-heart reveal stays after that). After that one more floor opens each season: floor n needs `day >= unlocks.caveFloorDays[n-1]` (15, 29, 43, 57) **and** `cave_leaf_<n>` found on floor n−1. Floors 2–4 open one per season (Days 15, 29, 43). Floor 5 opens in year-2 spring (Day 57), the first gift of the new year (Story); no gate.
- Mined nodes regrow every `nodeResetDays`.
- **Ore by floor (year-1 placement, ruling 1; Builder proposal, Designer/Story can retune drops in pack JSON):**

| Floor (opens) | Main drop | Used for |
|---|---|---|
| 1 (Day 10, spring) | colour shards, a little copper ore | decor and the first building upgrades (bench to stall) |
| 2 (Day 15, summer) | copper ore | building upgrades (homes, stalls for jobs) |
| 3 (Day 29, autumn) | silver ore | Silver tool upgrades (an ore route next to existing Silver rewards) and stage-2 homes |
| 4 (Day 43, winter) | glimmer gems | Sparkle tool tier and finale decor |
| 5 (Day 57) | the Spring Heart (story item, not crafted) | Sorrel 10 |

  No Copper recipe needs ore (the day-5 General Store Copper recipe is unchanged). Existing heart-reward recipes (e.g. Otto's Silver squeegee) keep their current costs.

<!-- STORY LEAD (merged from new-features/story.md §4, SHR Story Lead, final year-one story 28 Oct 2026) -->
- **Lore:** below the fountain run the first settlers' old waterways. For centuries, every clean thing dropped in at the "Many paws" gathering washed down into them, and the colour soaked into the stone. The ore and gems (copper, silver, glimmer gem and colour shard, from ui-assets §4) are the town's lost colour, and mining them carries it back up. Floors are small and handmade, one per trip, and the Fluff cost is shown up front.
- **Unlock:** on day 10, a letter in a bottle washes up at the fountain, signed "M.", with the first shore-map leaf (a story gift, separate from her 3-heart old shore map). The entrance is a hatch in the Glimmerwell's rim. After that, one more floor opens each season. Each floor needs its season *and* the leaf found on the floor above.

| Floor | Opens | What's there (mystery) |
|---|---|---|
| 1 | Day 10 (spring) | Warm water and the first colour shards (mystery 1 planted) |
| 2 | Day 15 (summer) | The whistling third bend (mystery 4, sets `cave_bend_heard`) |
| 3 | Day 29 (autumn) | Wren's lost toy (mystery 3, found at Wren 8) |
| 4 | Day 43 (winter) | Wall drawings of earlier keepers (mystery 2) |
| 5 | Year 2 spring (day 57), the next season after the finale | The Spring Heart (mystery 1 payoff). This keeps "one floor each season" and the 5 floors in NEW-FEATURES. |

- **Mabel's maps:** one leaf per floor, drawn in the first settlers' hand with Mabel's notes in the margin. `cave.map.mabel.1`: "Hoo. Mind the third bend. It whistles." Sorrel can copy leaves for the neighbours (`villager.sorrel.map.1`).
- **Mysteries, planted then paid off:**
  1. **The source:** the water is warm and nobody knows where it comes from. The trail of colour shards grows thicker on each floor. Payoff: floor 5 holds the Spring Heart, a big glimmer gem the first settlers left as the town's first gift. It's the first goal after the Day 56 finale.
  2. **The keeper drawings:** the floor-4 walls show more little keepers, so Puff wasn't the first. Payoff: Sorrel 8 gives Puff Thimble's ribbon, and Puff gives it to Moss's records.
  3. **Wren's lost toy:** Pip's first toy for Wren was dropped in the fountain years ago. Payoff: found on floor 3, at Wren's 8-heart event.
  4. **The whistle:** the floor-2 third bend whistles a tune. Payoff: it's the same tune as Moss's night humming (STORY.md 6.4), the town's old song, sung at the Day 56 Winter Lights.
- **Lines:** `cave.enter.puff.1` "Ooh. It's cool down here. And sparkly." · `cave.ore.colour.1` "A bit of Hollowfern's colour! Let's bring it home." · `cave.exit.puff.1` "That's enough for today. Up we go!"

### Data and save v2
- Save: `caves` (§7). Only mined node ids are stored, never the map. Ore/gems go in the existing `bag` as normal item ids (`ore_copper`, `ore_silver`, `gem_glimmer`, `shard_colour`). Mystery progress → `storyFlags` (`cave_leaf_2`, `cave_wren_toy`, `cave_spring_heart`, …).
- Pack JSON: `caveFloors[]` = `{ floor: 1, chunks: [[…16×16 tile ids…]], walkable, nodes: [{ id: "f1_r03", x, y, size: "small"|"medium"|"large", drop: { item: "ore_copper", count: 1 } }], leaf: { x, y, opens: 2 }, grumbleSpots: [] }`. Drops are fixed per node (no random rewards). Recipes: `recipes[]` entries with `tier: "ore"` (above Copper) list ore costs.
- Tuning:
```json
"caves": { "floors": 5, "chunkTiles": 16, "nodeResetDays": 7, "rockHits": { "small": 1, "medium": 3, "large": 5 },
           "fluffPerSwing": 2, "autoCollectTiles": 1, "floorEnterMsMax": 500 }
```
- Logic (`src/town/caves/`): `mine(save, floor, nodeId)` appends the node id to `floorState[floor].minedNodes` when its hits are done and adds the drop to the bag (if the bag is full, the drop waits on the tile and auto-collects later; nothing is lost). `endDay` clears `minedNodes` where `day >= resetDay` and sets `resetDay = day + nodeResetDays`. Fluff cost shown = `rockHits[size] × fluffPerSwing × relaxed multiplier`.

### Assets
<!-- DESIGNER (merged from new-features/ui-assets.md §4, SF Product Designer) -->
- UI: the HUD adds a small floor badge ("Floor 2") next to the day box and an "Up" exit marker. Holding on a rock repeats the swing, and the Fluff cost floats above the rock before the first swing. The Bag gets an Ore tab.
- Assets (code): a cave tileset (floor, wall, waterway, lit crystal), rocks in 3 sizes with a crack effect, 4 ore/gem icons (copper, silver, glimmer gem, colour shard), ladder and exit tiles, and a soft light circle around Puff. (Grok): Puff mining, 4 frames each for down, up and right.

<!-- FRONTEND (merged from new-features/mobile-input.md §4, SF Frontend & Mobile Dev) -->
- Caves are a new map type using 16×16 chunks with one floor loaded at a time. The previous floor's textures are freed on exit.
- Mining: tap a rock and the swings repeat until it breaks, with the Fluff cost shown before the first swing. Ore auto-collects within 1 tile.
- Lighting is a baked vignette sprite, not a per-frame shader.

### Build order
- **M2:** `caves` save field; pack schema for `caveFloors`.
- **M3 (late, Frontend M3–M4):** cave map type, chunked floor loader + texture freeing; `mine()` and node reset; floors 1–2 (Day 10 / Day 15) with colour shards and copper ore; Fluff cost display; baked vignette.
- **M4:** floors 3–5 (Days 29 / 43 / 57), leaves, silver ore and glimmer gem recipes, mysteries wired to `storyFlags`, cave Grumbles, Mabel cave-guide job.

### Acceptance checks
1. F4-1 Unit: mining a medium rock takes exactly 3 tier-1 swings and costs 3 × `fluffPerSwing` Fluff; the shown cost matches what is spent.
2. F4-2 Unit: a mined node stays mined across mid-day reload (AT-V2-2) and returns after `nodeResetDays` (AT-V2-6).
3. F4-3 Unit: a full bag never deletes a drop.
4. F4-4 Unit: floor 1 is locked on Day 9 and open on Day 10 with `cave_leaf_1`; floor 5 stays locked on Day 56 and opens on Day 57; floor n+1 needs both its season day and floor n's leaf; no floor beyond `caves.floors`; entitlement has no effect.
5. F4-5 Data: no Copper-tier recipe (including the day-5 Copper recipe) lists an ore id (pack schema test).
6. F4-6 Perf: entering a floor ≤ 500 ms on a mid-range phone; memory after 5 floors within ±10% of floor 1.
7. F4-7 E2E: the light circle never covers the HUD; ore/gem icons are distinct in a greyscale screenshot test.

---

## F5. Gentle limits (Fluff + dozing off)
### Player loop
Unchanged from GDD v3 and live from Day 1: tools and mining cost Fluff → below 20 Puff yawns, the bar turns peach and pulses gently → at 0 tools rest → snacks and sleep refill → past 2:00 Puff dozes off and wakes at home with half Fluff, nothing lost. F4 adds the same rule underground (from Day 10), and M4 adds optional weather prep. No hunger, no health, no death, no fail state.

### Unlocks and timing
- Fluff and dozing: Day 1 (existing). Cave doze: Day 10 with F4. Weather prep: from Day 1 once the M4 weather system lands.

<!-- STORY LEAD (merged from new-features/story.md §5, SHR Story Lead, final year-one story 28 Oct 2026) -->
- **Live from Day 1** (already in the GDD), with the same rules: below 20 Fluff Puff yawns, at 0 Puff can't use tools, and dozing off at 2:00 means Puff wakes at home with half Fluff and loses nothing. Caves follow the same rule. If Puff runs out of Fluff underground, they curl up and wake at home with everything kept. There's no hunger, no health and no fail state.
- **Weather prep (optional):** the morning card has a soft forecast. Preparing helps a little, and not preparing costs nothing.
  - Rain: tidying the gutters means no mud on the paths.
  - Wind: tying the plot covers keeps leaves off.
  - Snow: a cosy lantern brightens the path.
- **Lines:**
  - `limits.fluff.low.1` "Getting fluffy-sleepy... one more?"
  - `limits.doze.card.1` "Puff curled up for a nap."
  - `limits.doze.wake.1` "Morning! Everything's right where we left it."
  - `limits.cave.doze.1` "Sleepy... Mabel's map knows the way home."
  - `weather.prep.rain.1` "Rain tomorrow! Gutters, maybe? Or puddles. Both fun."
  - `weather.prep.none.1` "We'll splash through it. No worries."

### Data and save v2
- No new limit fields. Reuses `fluff`, `fluffLowThreshold`, `dozeWakeFluffFraction`, `relaxedMode`. Weather prep done today → optional field `weatherPrep: { day: number; done: string[] }` (default `{ day: 0, done: [] }`). Reset rule: it resets to `{ day: save.day, done: [] }` only when `weatherPrep.day !== save.day`; same-day reloads keep it. It moved out of `storyFlags` (28 Oct) because `storyFlags` is append-only. **Backend confirmed 28 Oct.**
- Tuning (new keys only): `"weatherPrep": { "enabled": true, "effects": { "rain": "noPathMud", "wind": "noPlotLeaves", "snow": "pathLantern" } }`.
- Save schema test forbids `hunger`, `health`, `hp`, `death`, `lives` keys.

### Assets
<!-- DESIGNER (merged from new-features/ui-assets.md §5, SF Product Designer) -->
- UI: the Fluff bar turns peach under 20% with a calm "Feeling sleepy" hint. Never red, flashing or alarm sounds. Dozing off fades to cream, with a "Puff curled up for a nap" card and Puff waking at home with all items kept. Weather prep gets a soft forecast line on the morning card.
- Assets (code): the doze fade and the forecast icons (sun, rain, wind, snow). Puff's doze frames already exist (04).

<!-- FRONTEND (merged from new-features/mobile-input.md §5, SF Frontend & Mobile Dev) -->
- The Fluff bar pulses gently below 20%, no red flash, no alarm sound. Dozing off fades to the morning with nothing lost. Reduced motion turns off the pulse.

### Build order
- **M2 (Frontend M2):** Fluff stamina bar with the peach colour and gentle pulse; Fluff costs for Grumble tidying; schema test forbidding hunger/health fields; doze path shared by sleep and doze.
- **M3:** Fluff costs for new M3 actions; cave doze when floors 1–2 land.
- **M4:** weather prep with forecasts; cave doze across all floors.

### Acceptance checks
1. F5-1 Unit: doze in town or on a cave floor → wake at home with `fluff = max × 0.5`; bag, Sparkles, plots, Grumble helpers and mined nodes deep-equal before/after.
2. F5-2 Unit: at 0 Fluff, tool/mine actions are refused with a hint, and no other state changes.
3. F5-3 Unit: skipping weather prep changes no Sparkles, items or hearts.
4. F5-4 Save: schema has no hunger/health/death/lives keys.
5. F5-5 E2E: reduced motion stops the pulse; no red colour token is used on the Fluff bar.
6. F5-6 Relaxed mode halves Fluff costs for Grumble tidying and mining too.

---

## F6. Chore bonus for building
### Player loop
Morning letter suggests one tiny real chore (existing) → "I did it!" or "Not today" → same warm reply either way → on "I did it!" (from Day 2), a quiet "Helping paws +1" chip attaches to the next build → that build finishes one night sooner (min 1 night), or, if it's already 1 night, saves 1 of its largest material. Never required. No streak, no missed-day message.

### Unlocks and timing
- Day 2, with F1 building. At most one chip per local day; the existing 5-a-day chore cap is unchanged.

<!-- STORY LEAD (merged from new-features/story.md §6, SHR Story Lead, final year-one story 28 Oct 2026) -->
- **Beat:** Puff's morning letter (STORY.md 2.4) works as before. From day 2 (once building starts), a tick adds a small "Helping paws +1" chip to the next build (ui-assets §6), framed as "your home helping ours". It's never required. There's no streak and no message about missed days.
- **Same reply either way:** both "I did it!" and "Not today" show `chore.reply.any.1`: "Thanks for telling me. Let's have a cosy day." The chip only appears on "I did it!", quietly, and nothing appears on "Not today".
- **Lines:** `chore.letter.build.1` "We're building today! Maybe tidy one shelf of yours? Or rest. ♥ Puff" · `chore.chip.1` "Helping paws +1"

### Data and save v2
- Save: `choreBonus: { lastClaimDay: string|null (localDate), pending: boolean, buildBoostPlotId: string|null }` (Builder adds `pending`; confirmed by Backend). Uses `localDate` to match the existing chores log and 5-a-day cap.
- Tuning: `"choreBonus": { "perDay": 1, "nightsReduce": 1, "minNights": 1, "materialSave": 1 }`.
- Logic: ticking "I did it!" when `lastClaimDay !== localDate` sets `pending = true`, `lastClaimDay = localDate`. `startBuild` consumes `pending` and sets `buildBoostPlotId`. Server check (M5, synced players only) goes through the existing `claims` table.

### Assets
<!-- DESIGNER (merged from new-features/ui-assets.md §6, SF Product Designer) -->
- UI: the chip is butter-coloured with a paw icon, on the next build's card. No streak counter, no message when missed.
- Assets (code): the chip and the paw icon.

<!-- FRONTEND (merged from new-features/mobile-input.md §6, SF Frontend & Mobile Dev) -->
- The chore checklist is a bottom sheet with 44 px rows. Ticking a chore shows a small sparkle and nothing more.

### Build order
- **M2:** `choreBonus` save field; chore bottom sheet (Frontend M2); reply text identical for both answers.
- **M3:** chip claim + consumption in `startBuild`; chip UI.
- **M4:** M5-ready claim record for server check (no server change before M5).

### Acceptance checks
1. F6-1 Unit: two "I did it!" ticks on one local day give one chip.
2. F6-2 Unit: a 2-night build with the chip → ready after 1 night; a 1-night build with the chip → still 1 night, cost −1 of its largest material.
3. F6-3 Unit: with zero chores ever ticked, every building, villager, cave floor and Grumble is still reachable (scripted 100-day fixture).
4. F6-4 Words: no string mentions streaks, missed days, "should" or "forgot" (`check-words.ts`).
5. F6-5 E2E: "Not today" shows the same reply as "I did it!" and no chip.

---

## 7. Save v2
*Basis: SF Backend & Payments Dev, `new-features/save-v2.md`. Builder additions are marked (B).*

### Hard dependency (blocks save v2)
Fix the v1 slot bug first (`apps/web/src/town/data/save.ts:137`, and `pickSave` at `:77-78`): every save writes backup then main, and load picks the slot with the newer `savedAt` (falling back to the other if one is corrupt). Today autosave writes only the backup and `pickSave` always prefers main, so mid-day saves are lost on reload (QA R3). Migrating on top of a broken loader loses data. No save v2 code merges until this fix passes QA.

*Phase 0 (28 Oct 2026, VISION.md): schema 3 shipped with `names` only. Each field below arrives with the feature that uses it, filled with its default on load, so no further schema bump is needed for an added field. Story flags use the save's existing append-only `flags` list (`TownState.flag()` only ever adds), and `unlocks.ts` reads `day` and `flags`.*

### Version numbering (B)
The code is already at `SCHEMA_VERSION = 2` (M2's `MIGRATIONS[1]` adds `friends`). So "save v2" in this doc = **`schemaVersion: 3`** in code, added as `MIGRATIONS[2]`. A v1 save runs 1 → 2 → 3. "Future version" means `schemaVersion ≥ 4`.

### Fields (all optional with defaults, so the migration is additive)
```ts
interface TownSaveV2Fields {
  keeper:     { titled: boolean; titledDay: number | null };   // mirrors keeper_named (Day 1)
  plots:      Record<string, { buildingId: string; stage: number; startedDay: number; readyDay: number }>;
  villagers:  Record<string, { invitedDay: number; movedInDay: number | null; homePlotId: string }>;
  grumbles:   Record<string, { family: 'dust' | 'cobweb' | 'mud' | 'soot'; area: string; x: number; y: number; // (B) position + family
                               hits: number; state: 'grumpy' | 'tidied' | 'helper'; tidiedDay: number | null; helperJob: string | null }>;
  caves:      { unlockedFloors: number[]; floorState: Record<string, { minedNodes: string[]; resetDay: number }> };
  choreBonus: { lastClaimDay: string | null; pending: boolean; buildBoostPlotId: string | null }; // (B) pending
  storyFlags: string[];   // default [], append-only, deduped on write; unknown flags kept
  weatherPrep: { day: number; done: string[] };   // (B, 28 Oct) resets only when weatherPrep.day !== save.day; default { day: 0, done: [] }
}
```
- Ore/gem ids go in the existing `bag` (no new structure).
- No hunger, health or death fields; gentle limits reuse Fluff + doze.
- `grumpy` is an internal state name, never shown to players.

### storyFlags registry (append-only)
Flags are only ever added, never removed or renamed. New flags are appended to the end of this list with a date; nothing here is reused for a different meaning.
| Flag | Set by | Read by |
|---|---|---|
| `keeper_titled` | never written (retired before ship, 28 Oct; replaced by `keeper_named`, row kept because the registry is append-only) | none |
| `job_<id>_accepted` / `job_<id>_declined` | F2 job offers | job effects, re-offer |
| `cave_leaf_<n>` | F4 leaf on floor n−1 (`cave_leaf_1` from Mabel) | floor n unlock, `he_sorrel_04` (`cave_leaf_2`) |
| `cave_wren_toy` | `he_wren_08` (floor 3) | `he_wren_10` |
| `cave_spring_heart` | F4 deepest floor (floor 5) | `he_sorrel_10` |
| `he_<newcomer>_<nn>_done` | each newcomer event | later events |
| `wren_toy_hint` (added 28 Oct) | `he_wren_06` | `he_wren_08` |
| `cave_bend_heard` (added 28 Oct) | first pass of the floor-2 third bend | `he_sorrel_06`, `he_fig_08` |
| `fig_bell_told` (added 28 Oct) | `he_fig_06` | `he_fig_08` |
| `old_song_known` (added 28 Oct) | `he_fig_08` | `he_fig_10`, Day-56 Winter Lights |
| `keeper_ribbon_found` (added 28 Oct) | `he_sorrel_08` | Moss's records, cave keeper drawings |
| `otto_can_swim` (added 28 Oct) | `he_fig_04` | Otto paddling asset, Otto water placement |
| `keeper_glimmerwell` (added 28 Oct) | Day-56 Winter Lights finale only (never set by migration) | title text "Keeper of the Glimmerwell", Town Hall ribbon |
| `letter_hazel_keeper` (added 28 Oct) | migration of a v1 save past Day 1 (one Hazel letter, sent once) | letter queue dedupe |
| `keeper_named` (added 28 Oct, Story) | F1 Day 1, Hazel names Puff and gives the plain badge; migration of a v1 save past Day 1 | plot unlocks, Keeper UI, badge |

### Defaults and migration
```ts
export const SCHEMA_VERSION = 3;
export function v2Defaults(): TownSaveV2Fields {
  return { keeper: { titled: false, titledDay: null }, plots: {}, villagers: {}, grumbles: {},
           caves: { unlockedFloors: [], floorState: {} },
           choreBonus: { lastClaimDay: null, pending: false, buildBoostPlotId: null }, storyFlags: [],
           weatherPrep: { day: 0, done: [] } };
}
// Pure, no I/O. Only fills missing keys; never overwrites or drops a field.
MIGRATIONS[2] = (s) => Object.fromEntries(Object.entries(v2Defaults()).filter(([k]) => !(k in s)));
```
- `migrate()` already merges `{ ...save, ...step(save), schemaVersion: v + 1 }`, so unknown fields survive.
- **Pre-migration copy (B):** on the first load that migrates, write the raw old save once to a third key `pre-v2` (IndexedDB and localStorage fallback). Delete it after the first successful v2 bedtime save. This meets "keep a v1 copy until the first v2 bedtime save" without fighting the autosave, which writes `backup` every 60 s.
- **Future version (B):** if either slot has `schemaVersion > SCHEMA_VERSION`, `loadTown()` returns `{ save: null, locked: true }`, the title shows "This save is from a newer version. Please update." and `writeTown` becomes a no-op for the session. Both slots stay untouched.
- **No entitlement checks:** save v2 applies from year 1 for every player. Unlocks read only `day` and flags (Backend, 28 Oct). Nothing in saves or checks reads an entitlement. Monetisation: TBD after build.
- **Server (M5, no change before):** `saves.blob` is opaque JSON, so no D1 migration; `schema_version` column as planned; conflict prompt compares `savedAt` + day. Chore chip claims use the existing `claims` table (one per local day).

### Fixtures and tests (`apps/web/src/town/data/save.test.ts`)
- `apps/web/test/fixtures/save-v1.json` (schemaVersion 1, no `friends`), `save-v2-m2.json` (schemaVersion 2, current M2 shape), `save-v3-100day.json` (generated by a scripted 100-day run from Day 1 with no entitlement: builds from Day 2, 3 villagers, 12 helpers, floors 1–5 mined).
- AT-V2-1: `save-v1.json` and `save-v2-m2.json` migrate to schemaVersion 3 with every old field deep-equal and all new defaults present; migrating twice gives the same result (idempotent).
- AT-V2-2: mid-day reload (autosave, no bedtime) keeps plots, grumbles and mined nodes. Depends on the slot fix.
- AT-V2-3: a building started on day N shows done after `endDay` on day N (`nights: 1`).
- AT-V2-4: a schemaVersion 4 save is not loaded and not overwritten (both slots byte-identical after a session with autosaves).
- ~~AT-V2-5~~ removed 28 Oct (no gates, so no lapse check).
- AT-V2-6: mined nodes reset on `resetDay`; save stays < 200 KB for `save-v3-100day.json`.
- AT-V2-7: `storyFlags` defaults to `[]` on migrate, survives mid-day reload, never holds duplicates, and unknown flags are kept.
- AT-V2-8 (B): `pre-v2` is written exactly once on the migrating load and is gone after the first v2 bedtime save.
- AT-V2-9 (B): schema test: no hunger/health/death/lives/wage/salary keys anywhere in the save.
- AT-V2-10 (B, 28 Oct): no code path removes an entry from `storyFlags` (unit test over endDay, doze and migrate); every flag set in pack JSON appears in the registry above (CI lint).
- AT-V2-11 (B, 28 Oct): `weatherPrep` defaults on migrate; it resets only when `weatherPrep.day !== save.day`, so a same-day reload keeps it.
- AT-V2-12 (Backend, 28 Oct): a save on year-1 Day 7 has `keeper`, `plots`, `grumbles` and `caves` fields populated and usable (a build placed, a Grumble tidied, cave fields present for the Day-10 unlock).
- AT-V2-13 (Backend, 28 Oct, Manager ruling): a v1 save at day 20 migrates with `keeper.titled=true`, `titledDay=1`, `keeper_named`, no `keeper_glimmerwell`, and exactly one Hazel letter (not resent on reload); a v1 save at day 60 plays the finale once as a catch-up, then has `keeper_glimmerwell`.

- **Migration past Day 1 (Manager ruling, 28 Oct; CLOSED):** a v1 save past Day 1 gets `keeper: { titled: true, titledDay: 1 }`, `keeper_named`, and one queued Hazel letter (`letter_hazel_keeper`, sent once). It never gets `keeper_glimmerwell`; only the Day-56 finale sets that, and a save already past Day 56 plays the finale once as a catch-up. Checked by AT-V2-13.

*Backend confirmed 28 Oct: `weatherPrep` (additive with a default; resets only when `day` changes) and the year-1 change (no gates, AT-V2-5 removed, AT-V2-12 and AT-V2-13 added).*
*Backend review: SF Backend & Payments Dev confirmed all six Builder changes (schemaVersion 3 / MIGRATIONS[2], `pre-v2` key, `locked` load result, extended `grumbles` + endDay prune, `choreBonus.pending` + localDate `lastClaimDay`, 200 KB budget), 28 Oct 2026.*

---

## 8. Cross-feature build order
Step 0 (before any of this): M1 stabilisation, i.e. the save slot fix (`save.ts:137`, `:77-78`), the service worker crash, and removing GPU readback stalls. Milestones follow Frontend's sequence (28 Oct): M2 Grumble controls + Fluff bar, M3 build mode, M3–M4 caves.

| Milestone | Save / data | F1 Keeper + building | F2 Villagers | F3 Grumbles | F4 Caves | F5 Gentle limits | F6 Chore bonus |
|---|---|---|---|---|---|---|---|
| **M2** (with the 6 neighbours) | Slot fix merged → save v2 (schemaVersion 3), defaults, migration, fixtures, AT-V2-1/4/7/8/9/12; `unlocks.ts`; pack schemas in CI | Day-1 Keeper flag + card; Town Hall list | Invite cards with the 6 as test data; jobs derived from hearts | Dust family from Day 3: tap/hold, pip ring, cap 6, 0.5 s staggered paths | Save field; pack schema | Fluff bar (peach, pulse), Fluff cost per tidy | Chore sheet; save field; identical replies |
| **M3** (with grow and craft; may split M3a/M3b) | AT-V2-2/3/11; `endDay` resolvers | Build mode from Day 2, stages, overnight resolve, reveal, pan toast | Invite + move-in with `inviteOrder` (Sorrel week 2, Fig Day 15, Wren Day 29 after Pip 8); Wren as test villager; job offers | Cobweb (Day 10), mud (first rain after Day 10), soot (Day 15); helpers, helper AI 10 s tick | **M3b:** cave map type, loader, `mine()`, floors 1–2 (Day 10/15), reset | Fluff costs for new actions; cave doze | Chip claim + use |
| **M4** (with seasons and sharing) | AT-V2-6/10; 100-day fixture | Day-56 title upgrade; full catalogue; ore upgrades above Copper | Sorrel and Fig full arcs, old song at Day-56 Winter Lights, newcomers 4–6 when written; job effects; `otto_can_swim` | Cave Grumbles; helper jobs feed F1/F4 | Floors 3–5 (Day 29/43/57), leaves, silver/glimmer recipes, mysteries | Weather prep | Claim record ready for M5 |

Each milestone passes its features' acceptance checks plus the performance gates: Lighthouse mobile ≥ 90 on the title screen, INP ≤ 200 ms for tap-to-walk, no `readPixels`, pixelated canvas, no horizontal overflow at 375 px, **each feature chunk loads only when it first unlocks**, and first-load JS stays ≤ 300 KB gzipped. Frontend gates: M2 6 Grumbles + 3 helpers at p95 ≤ 16.7 ms on an SE-class phone; M3 a build in ≤ 3 taps with no accidental placement; M3–M4 floor entry ≤ 500 ms and memory after 5 floors within ±10% of floor 1. Everything goes through QA before it's called done.


### UI and asset build order (merged from new-features/ui-assets.md, SF Product Designer, re-timed 28 Oct)
- **UI ramp (first week, in UI order):** Day 1 the opening Keeper card, gentle-limit UI and the chore chip; Day 2 the Town Hall board and build mode; Day 3 the Grumble pip ring with the dust family; Day 8 the invite cards; Day 10 the cave floor badge and the Ore tab. Day 56 upgrades the badge to a ribbon and the title to "Keeper of the Glimmerwell".
- **M2 assets:** Keeper card and badge, gentle-limit UI, chore chip, Town Hall board, build mode with Confirm/Cancel and the 3 build stages, invite cards (6 existing neighbours as test data), Grumble pip ring with a placeholder sprite. Check: each sheet opens and closes, every tap target ≥ 44 pt, no clipping at 375 or 430 px, placing a building needs Confirm and never happens by accident while Puff walks, no guilt words.
- **M3 assets:** the 4 Grumble families as final art, the dust-clear reveal and colour flood (skipped under reduced motion), the Helpers tab, the newcomer sheets and portraits. Check: Grumbles read as friendly in the greyscale and small-size tests; the reveal never blocks input for more than 1.5 s.
- **M4 assets:** cave tileset, ore icons, Puff mining frames, floor badge and Ore tab, plus Otto paddling (shown only after `otto_can_swim`; Otto is never drawn in water before it). Check: ore/gem icons differ in a greyscale test, the cave light circle never covers the HUD, 60 fps on a mid-range phone with 6 Grumbles on screen.
- **Grok art order (year-1 assets, front-loaded):** the 4 Grumble families first, then Puff mining, then the newcomers, then Otto paddling. (Art is paused; this is the order once it resumes.)
- **Builder notes on the split:** build mode, the 3 build stages and invite cards land in M2 as UI shells; the logic follows the table above (build mode M3, invites M3). Grumble controls are M2 with the placeholder sprite; final family art is M3. Cave UI is M4 art on the M3b loader.

---

## 9. Monetisation
Monetisation: TBD after build. No gates, paywall, offer, prices or trial in this spec; nothing reads an entitlement. All 6 neighbours are playable from year one, so Mabel's beats and Fig 4 (needs `he_otto_08_done`) work as written.

### Open items for BB Manager
- **Spring is now busy:** building, the caves, three Grumble families and Sorrel's invite all arrive in the first 14 days on top of the existing spring goal (3 homes restored). Needs a pacing playtest before tuning is locked.
- **Mabel first met on Day 43:** all her heart events fall in the last 14 days of year one, so the Day-56 finale will often wait for her 10 hearts (only the title upgrade waits).
- **Still open (Story):** `villagers.maxNew` is 6 with 3 newcomers to write; "combat" stays internal-only wording.
