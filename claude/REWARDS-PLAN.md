# Rewards overhaul: build plan (28 Oct 2026)

**Why:** reviews were mostly good, but a few said the game isn't interesting enough. Cleaning gave no reward until a whole home was restored (a single cleaned spot gave 0 Sparkles), and nothing showed progress in between. Blake approved all seven upgrades.

**Rules kept:** everything is free and earned in play. No loot boxes, no paid or random paid rewards, no streak that resets or scolds. Puff is never sad. Copy stays a kind friend. Every number lives in `tuning.json`.

## The seven upgrades
1. **Sparkle chain.** Each cleaned spot gives Sparkles. Cleaning spots in quick succession builds a chain (×2, ×3…) with a rising chime and bonus Sparkles. Stopping just lets it fade.
2. **Juice.**
   - "+N ✨" floats up from the spot.
   - Sparkles fly into the counter, which pulses.
   - Puff hops at chain milestones.
3. **Home progress bar.** While an area isn't restored, a bar shows how tidy it is, with pips at 25, 50 and 75%. Each pip gives a chime, a banner and Sparkles, once per area.
4. **Puff's Sparkle level.**
   - Cleaning, jobs and restores earn XP.
   - Each level gives Sparkles and a new title, and every 2nd level +10 max Fluff.
   - The level chip and bar sit under the clock.
5. **Hidden finds and the Finds book.**
   - Clearing a spot sometimes uncovers a find: about 1 in 12, and never more than 12 cleans apart.
   - 12 finds, some only in certain places. A Glimmer drop is very rare.
   - Finds go in the bag (many are gifts neighbours love) and the Finds book (pause menu), which fills in silhouettes.
6. **Golden dust.**
   - From day 2, one golden dust bunny waits somewhere in town each day.
   - The morning letter hints where.
   - Catching it costs no Fluff and gives a Sparkle burst plus a find.
7. **Today's three goals.**
   - Three small goals a day, chosen per day: clean spots, chat, give a gift, put things away, find something, finish a job.
   - Each gives Sparkles, and all three give a bonus.
   - Any goal done adds to the **Cosy Days** count, which only goes up.
   - A star chip under the clock opens the Today sheet.

## File plan
```
rewards/                     new feature folder
  chain.ts (+test)           rules: chain count, bonus, fade
  milestones.ts (+test)      rules: which progress pips were crossed
  finds.ts (+test)           rules: when a find turns up and which (seeded, with pity)
  level.ts (+test)           rules: XP to level, level rewards, titles
  golden.ts (+test)          rules: where today's golden dust waits
  goals.ts (+test)           rules: today's three goals, progress, rewards
  rewards.ts                 Rewards: applies the rules to TownState on play events; host for effects
  reward-hud.ts              the HUD pieces: progress bar, level chip, goals chip, chain badge, popups, fly-to-counter
  finds-sheet.ts             the Finds book and the Today sheet
play/events.ts               PlayEvent: one event type for the tips and rewards (was OnboardEvent)
```
- **Saved progress:** `TownState.rewards` holds xp, level, finds, sinceFind, goals and cosyDays. Pips need nothing saved, since progress only rises. It's optional in the save, so no migration is needed.
- **Content:** the find items, their icons and the titles go in the pack. Numbers go in `tuning.json` under `rewards`.
- **`game.ts`:**
  - construct `Rewards`
  - send play events to it as well as the guide (`notify`)
  - give the golden dust to the area's pickups
  - tick it in the loop

## Built (28 Oct 2026)
All seven are in.
- **Batch 1:** Sparkles per clean, the chain, juice, the progress bar.
- **Batch 2:** finds, the Finds book, golden dust.
- **Batch 3:** levels, goals, Cosy Days.

**Tuned in play:**
- **The chain holds while Puff walks or cleans,** and only fades while Puff stands about. Walking between spots kept breaking it.
- **The first level-up comes at 30 XP.** At 40 it arrived a little too late for an early win.
- **Golden dust twinkles** so it can be spotted across a room.

**On the way:**
- Banners now queue, so a find, a goal and a level-up read one after another, and long ones wrap.
- The `?debug` hooks moved out of `game.ts` into `debug.ts`.

**Tastes:** finds are gifts too. Hazel likes acorns, Bea ribbons, Moss tiny brass keys, Mabel old coins. Pip already loves buttons, and Otto shells and river stones.

## Build order
1. Events, the chain, Sparkles per clean, juice and the progress bar.
2. Finds and golden dust.
3. Levels, goals and Cosy Days.

Each batch has tests first and ends with the post-feature cleanup.
