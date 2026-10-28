# Roadmap: making it feel more like a game (28 Oct 2026, for Blake's OK)

Merges Blake's `NEW-FEATURES.md` (F1–F6, year 2), Claude's suggestions (getting stronger, lively mess, a visible main goal) and the "oddly satisfying" ideas. Built in the order the game is played, so early players feel it too. Nothing here is paid, random-paid, a streak or a fail state.

## Done
- **Save fix** (NEW-FEATURES "Step 0"): reloading after a night's sleep no longer loses the day's progress (PR #35).
- **Homes come alive** (burrow), **rub to scrub**, **drag clutter home** (PR #33).

## Next: M3 "grow, craft and get stronger"
| # | What | Why |
|---|---|---|
| 1 | **Tool upgrades.** The Copper sponge (recipe from the General Store, day 5) scrubs a 3-spot swipe; a broom sweeps a row; a charged "Sparkle burst" cleans 3×3. | Getting visibly stronger: the core "game" feel. M3's planned tool tiers. |
| 2 | **Wipe to reveal** windows, mirrors and grime: drag your finger and it comes clean exactly where you wipe. | Oddly satisfying; builds on rub-to-scrub. |
| 3 | **Spotless rooms.** The last specks after a restore stay findable; clearing them gives a shine sweep, "Spotless ✨" and a tick on the map. Plus straightening crooked frames and books (tap, snap level, click). | For completionists. Never required. |
| 4 | **Every home comes alive** like the burrow: the bakery oven glows, Bea's bell jingles, Pip's wind-up toy marches, the library lamp, bathhouse steam. | Mostly pack data now the burrow shows the pattern. |
| 5 | **Dust Grumbles in spring.** A few shy, grey fluff clouds in corners nobody tidied. Tap to brighten them (pip ring, Fluff like any clean), "Friend made!", and they become little helpers. | NEW-FEATURES F3 in a small year-1 form; mess with a bit of life. The other three families and the helper jobs stay year 2. |
| 6 | **Garden, crafting bench, materials, cooking snacks.** | The rest of M3 as planned (GDD A9). Also what F1 building and F4 ore need later. |
| 7 | **Decorate the burrow** with things found and earned. | Progress you can see in your own home; a small year-1 taste of F1 building. |

## Then: M4 "seasons and the story"
- Summer, autumn and winter areas (Plus); the town map and **the fountain as the main goal**: each restored home adds water and light to the Glimmerwell, and the map shows what's still grey.
- **A sealed hatch in the fountain rim** from day 1 ("the water's too still"), a mystery that opens as F4's caves in year 2.
- The Winter Lights finale; the Keeper title (F1's finale beat).

## Then: year 2 (NEW-FEATURES F1–F6, as written)
F1 building on plots, F2 inviting villagers (Wren, Sorrel, Fig), F3 all four Grumble families and helper jobs, F4 the caves and ore (the tool tier above Copper), F5 weather prep and cave dozing, F6 the chore bonus for building. Built when the finale they hang from exists.

## Changes from NEW-FEATURES.md, and why
- **A year-1 taste of Grumbles, the caves and building** (items 5 and 7, and the hatch). Everything else stays year 2. Otherwise no player sees any of it for 56 days, and the reviews were about the first hour.
- **No empty "M2 stubs"** (save fields, schemas and a Town Hall shell nobody can open). Each piece is added with the feature that uses it, so the code doesn't carry unused parts (the post-feature cleanup checker would flag them).
- **The banned-words check** extends the existing copy test instead of adding `scripts/check-words.ts`.
- **Save v2** (schemaVersion 3) arrives with the first year-2 feature, using the migration pattern that's already there.

## How each piece is built
A file plan first (factorisation skill), tests first, a browser check at 390×844, the post-feature cleanup, then a PR. Blake tries each on his phone before the next. Big items (1, 6) are split into steps.
