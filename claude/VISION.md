# Sweet Home Reset: full vision and the road to release
*Blake and Claude Code, 28 Oct 2026. Draft for Blake's approval. Once approved this sits above the roadmap: GDD v4, NEW-FEATURES.md, STORY.md and the plans fill in the detail. Where they disagree with a "Decided" line here, this wins.*

## 1. The game in one breath
Puff, a dust bunny born from the fountain's last sparkle, becomes the Keeper of Hollowfern, a grey little town that has forgotten how to gather. Every room Puff tidies floods back with colour and comes alive. Neighbours become friends, newcomers move in, the town grows plot by plot, and the old waterways under the fountain give back the town's lost colour. **It never ends.** Seasons turn, festivals come round each year, and there's always a corner to brighten, a friend to visit or something new to build.

## 2. Pillars (every feature is checked against these)
1. **Colour comes back.** The core reward is the world visibly coming to life: rooms switch on, streets bloom, the fountain wakes. It isn't counters or levels.
2. **Feels good in your fingers.** Rub to scrub, wipe to reveal, drag things home, straighten the wonky frame. Cleaning is satisfying, never a chore list.
3. **You're the Keeper of a living town.** You build, invite and look after the town, but you're a helper, never a boss. There are no wages, taxes or hiring.
4. **Gentle by design.** Nothing is lost, failed or overdue. Fluff and dozing off are the only limits. No streaks, no guilt, no fail state.
5. **Always something to come back to.** Daily life, seasons, collections, new chapters. It plays as an ongoing life, not a level to beat.

## 3. What a player does
| Scale | Loop |
|---|---|
| **A moment** (seconds) | Tap, rub, wipe or drag mess away. Colour floods back with a sparkle and a sound. A Grumble brightens into a helper. A rock cracks and shows colour. |
| **A day** (10 minutes; day 1 is 12) | Morning letter (a tiny real chore, always optional) → check the Town Hall and the board → tidy, build, visit, mine, garden → Fluff runs low near evening → bed. Overnight: builds finish, crops grow, newcomers arrive. |
| **A season** (14 days) | A season's worth of new things: a home to restore, a newcomer, a cave floor, a Grumble family, crops, a festival to end it. |
| **A year** (56 days) | Spring, summer, autumn, winter. The year's story chapter. Winter Lights ends the year with the town together. |
| **Forever** | Every year the festivals return, rocks regrow, crops rotate, Grumbles turn up in quiet corners and neighbours have new lines. New chapters, newcomers and areas arrive in content updates (pack JSON, no app update needed). |

## 4. The world
**Built now:**
- Puff's burrow and yard
- the Town Square and Hazel's bakery
- the General Store
- Neighbour Lane, with Bea's flower shop, Pip's toy workshop and Moss's library
- Riverside and Otto's bathhouse

**To build:**
| Place | When | Notes |
|---|---|---|
| Town Hall (in the square) | Day 1 | The Keeper's board: plots, invites, jobs. Dusty at first; the first room Puff restores for the town. |
| Building plots | Day 2 | Fixed plots in the square, the Lane and Riverside; more open each season. |
| The Glimmerwell hatch and the caves | Day 10 (floor 1), one floor a season | Small handmade floors with ore, colour shards and mysteries. Floor 5 is in year 2. |
| Woodland edge | Autumn | Foraging, Moss's autumn story, leaf piles. |
| The Beach and the lighthouse | Winter (day 43) | Mabel's home and the lamp. |
| Newcomers' homes | As built | Sorrel's ramp cottage, Fig's pond porch, Wren's nest-loft. |

## 4a. Town building and expansion (Blake, 28 Oct 2026)
Hollowfern is restored, then built, then grown. Cosy throughout: no upkeep, no running costs, no unhappiness meters, nothing decays.
1. **Repair to expand.** New areas open because Puff fixes the way there. Each repair is a small project: gather materials, then the town fixes it overnight, and in the morning the camera pans to a new grey area waiting. That replaces "opens on day X".

   | Repair | Opens |
   |---|---|
   | The broken footbridge | The far bank of the river |
   | The overgrown path past the library | The Woodland edge |
   | The collapsed sea steps | The Beach |

   The season days in §4 become the earliest each repair can be done.
2. **Build on plots, then upgrade** (NEW-FEATURES F1).
   - **Plots:** homes, stalls and workshops.
   - **Upgrades:** a bench becomes a gazebo; a stall becomes a shop; a cottage becomes a two-storey home.
   - **Buildings do things:**
     - Hazel's snack stall sells food.
     - Bea's garden plots grow flowers.
     - A lantern post lights the street at night.
3. **Decorate freely.** Off the plots, place decor anywhere on a grid: paths, fences, lamps, flower beds, benches, signs. Move it or store it any time. This is where Hollowfern becomes the player's own, and it's a strong screenshot and sharing moment.
4. **The town grows in rings,** each opened by a repair and bringing new plots, newcomers and a Grumble family:

   | Ring | Places |
   |---|---|
   | Old Hollowfern | Where we are now |
   | The waterfront | Riverside, the far bank, Fig's ferry |
   | Woodland edge and Orchard Hill | New plots and foraging |
   | The Beach and the harbour | The lighthouse, and visiting boats in later years |
5. **Town Bloom.** A level that rises with restores, buildings and newcomers. It shows in the world rather than as a number: more birds and butterflies, lit windows, neighbours chatting in the street, market days, visitors by boat. Each level unlocks new building types and decor sets.

## 5. People
- **The six:** Hazel, Bea, Pip, Otto, Moss, Mabel. All playable from year 1 with no gates. Each has hearts 0–10, 5 heart scenes, gifts, routines and a town job at 6 hearts.
- **Newcomers:** Sorrel (spring, week 2), Fig (summer), Wren (autumn, after Pip 8). Three more to be written for year 2 and later.
- **Mabel:** met on day 43 at the Beach, but her bottle letters, signed "M.", start on day 10. Puff can write back and send small gifts, which earn hearts before they meet. The reveal: "M. was Mabel all along." *(Proposed. It fixes her heart crunch.)*
- **Grumbles:** shy grey fluff clouds, Puff's cousins. They're tidied, never harmed, and become helpers with small overnight jobs. Dust (day 3), cobweb (day 10), mud (first rain), soot (summer).

## 6. Story: chapters, not an ending
- **Year 1, "Bring the colour back":**
  - **Day 1:** Hazel names Puff the Keeper and gives the badge.
  - **Through the year:** the town comes alive, newcomers arrive and the caves give up their mysteries.
  - **The first Winter Lights (day 56):** the fountain and lighthouse relight, the town sings the old song, and the badge becomes the ribbon: Keeper of the Glimmerwell.
  - **After that,** spring simply comes again. No credits. *(If a friendship isn't ready yet, its moment waits for a later Winter Lights. Nothing else waits.)*
- **Year 2, "The Spring Heart":** floor 5 and the source of the warm water. Sorrel's map and earlier keepers like Thimble. Newcomers 4–6.
- **Year 3 and on:** new chapters ship as content updates, each a new area, a newcomer or two, a mystery and a festival twist. The daily life never stops while players wait.

## 7. Systems
| System | Status | What it is |
|---|---|---|
| Tidying (tap, rub, drag) | **Built** | 9 mess types; rub to scrub, drag clutter home |
| Homes come alive | **Burrow built** | Stages switch on as a room gets tidier: lamps, sunlight, a cat, music layers |
| Neighbours, talk, gifts, hearts, scenes | **Built** | M2 |
| Jobs board, shops, Sparkles | **Built** | M2 |
| Onboarding (first 30 min) | **Built** | Gains the Keeper beat |
| Saves | **Fixed (PR #35)** | Save v2 next (schemaVersion 3) |
| **Wipe to reveal, Spotless rooms, straighten things** | Next | The "oddly satisfying" layer |
| **Tool upgrades** | Next | Copper (3-spot swipe), broom (a row), Sparkle burst (3×3); ore tiers above Copper |
| **Keeper and building** | Next | Town Hall board, plots, overnight builds, morning reveal; upgrades (§4a) |
| **Repairs that expand the town** | Then | Bridge, paths and steps open new rings (§4a) |
| **Free decorating in town** | Then | Grid placement off the plots; move and store |
| **Town Bloom** | Then | The town visibly thrives; unlocks building types and decor sets |
| **Grumbles and helpers** | Next | Four families, pip ring, helpers |
| **Garden, foraging, crafting, cooking** | Next | Seeds by season, materials, bench, snack recipes |
| **Invites and town jobs** | Then | Who'd love this home? Prepare it, then they move in |
| **Caves and ore** | Then | Floors 1–5, fixed drops, mysteries |
| **Seasons, weather, festivals** | Then | Palette swaps, rain and snow, 4 festivals with a small mini-game each, yearly |
| **Decorating** | Then | Burrow and homes; finds and crafted decor |
| **Collections** | Then | Crops, finds, recipes, decor, a town scrapbook (the Our Home scrapbook from STORY) |
| **Sharing** | Built (clip) | The reveal clip for every restore; Mess of the Day card; photo mode later |
| **Gentle limits** | Built | Fluff, dozing off; the peach bar and pulse next |

## 8. Pacing (the first 14 days)
One new thing every couple of days, each arriving with a single tip or letter, so spring never feels like a firehose:

| Day | New | Day | New |
|---|---|---|---|
| 1 | Keeper badge, the burrow, Hazel | 8 | Sorrel's invite (once a home plot is built) |
| 2 | Town Hall and the first build (a bench, Sparkles only) | 10 | The fountain hatch: cave floor 1; Mabel's first bottle letter |
| 3 | First dust Grumble | 12 | Cobweb Grumbles (in the caves) |
| 5 | Copper sponge recipe at the store | 14 | Spring Clean Fair |

*(Cobweb Grumbles move from day 10 to day 12 so the caves get their own moment. Proposed.)*

## 9. Economy
- **Sparkles** come from restores, jobs, put-aways, selling crops and festivals. They're spent on buildings, recipes, seeds, decor and bag upgrades.
- **Materials** (twig, pebble, clay, thread…) come from foraging, helpers and crops, and go into building and crafting.
- **Ore and gems** come from fixed cave drops and go into tools above Copper, building upgrades and decor.
- **Never sold for money:** Sparkles, Fluff, time, random items. No loot boxes and no ads, whatever the monetisation model is.

## 10. Monetisation (decision needed before release; TBD per Blake)
| Model | How it'd work | Fit with an ongoing cosy game |
|---|---|---|
| **A. Free spring + one-time "Full Hollowfern" unlock** | The first 14 days are free, then one purchase unlocks everything, including future chapters | ★ Simple, trusted, suits "a life, not a service". Future chapters are free updates that build goodwill. |
| B. Subscription (the original Plus) | A$7.99 a month or A$44.99 a year | Strong revenue if updates are frequent; feels heavy for a cosy game; needs steady content |
| C. Paid upfront | One price, no free part | Lowest friction once bought, but hard to get people to try it |

**Claude's recommendation: A.** The full game unlocks once. Later chapters and cosmetics could be optional paid packs, decided once there's an audience. The code reads one `hasFullGame()` check, so whichever model is chosen is quick to wire.

## 11. Art and sound
**From Blake (Grok, processed by `tools/process_asset.py`):**
- the neighbours' sheets
- the newcomers' sheets
- the four Grumble families
- Puff mining
- area paintings as they come

**In code until then:**
- tiles, props, mess and effects
- the life effects (lamps, sun, the cat)
- placeholder neighbours

**Sound:**
- the synthesised music grows with each room (the bloom layers)
- one theme per season and area
- satisfying sounds for each mess type

Commissioned art or music only with Blake's yes.

## 12. Release-ready means
- **Platforms:** web (PWA), iOS (App Store) and Android (Google Play) together. Australia first.
- **Quality:**
  - 60 fps at 390×844 on a mid-range phone
  - first load ≤ 300 KB
  - no GPU readbacks
  - works offline
  - saves can't be lost (main, backup and a quick copy, plus optional cloud sync)
- **Accessibility:**
  - 44 pt targets
  - reduced motion
  - haptics off
  - tap-only play (gestures are always optional)
  - VoiceOver labels
  - colour never the only signal
- **Store:**
  - IARC rating, with "shares user content" = No
  - privacy policy
  - in-app account deletion (if sign-in ships)
  - screenshots and a preview video
  - the "Some art created with Grok Imagine" credit
- **Testing:**
  - unit tests for every rule
  - a scripted 30-minute run
  - a scripted 56-day run with no soft-locks
  - a 100-day save under 200 KB
  - the monkey test
  - TestFlight and Play testing rounds with a small group of players
  - Blake's phone test at every phase

## 13. Phases to release
Each phase ends playable on Blake's phone and passes its "done when" before the next starts. Each step inside a phase is one PR: plan, tests first, browser check, cleanup.

| Phase | Builds | Done when |
|---|---|---|
| **0. Foundations** | Save fix (#35); save v2 + `unlocks.ts`; remove the Plus stub; the peach Fluff bar; "no ending" docs; banned words in the copy test | Old saves migrate; nothing reads entitlement |
| **1. The Keeper's first week** | Keeper beat on day 1; Town Hall + first build (day 2); dust Grumbles (day 3); wipe to reveal, Spotless and straightening; every current home comes alive | A new player's first week has a new moment every day or two, and they feel it |
| **2. Grow, craft and get stronger** | Tool tiers and charged use; foraging and materials; crafting bench; garden and seasonal crops; cooking; full build mode with stages, the morning reveal and upgrades; free town decorating; Town Bloom; helpers | A Copper tool by day 7, a crop by day 7, three buildings by day 14 |
| **3. Newcomers, repairs and the caves** | Invites + Sorrel; town jobs; the footbridge repair (the far bank); cave map type, floors 1–2, ore; cobweb Grumbles; Mabel's bottle letters | Sorrel moves in during week 2; floor 1 opens on day 10 |
| **4. A full year** | Seasons, weather and palettes; the path and sea-steps repairs (Woodland edge, Orchard Hill, Beach and lighthouse); 4 festivals; Fig and Wren; floors 3–4; mud and soot Grumbles; decorating; collections; the first Winter Lights; year 2 begins (floor 5) | A scripted 56-day run plays with no soft-locks, and day 57 carries on |
| **5. Release** | Monetisation as decided; optional accounts and sync; store builds; accessibility pass; music; credits; IARC; privacy; store listing; playtest rounds | Blake approves the store submissions |
| **6. Live** | Content updates as packs: chapters, newcomers 4–6, new festivals, seasonal events | Ongoing |

## 14. Decisions for Blake
1. **Approve this vision** (pillars, no ending, chapters).
2. **Monetisation:** A, B or C (recommendation A). Can wait until Phase 5, but it shapes the free part.
3. **Mabel's bottle letters** before day 43 (recommended).
4. **Pacing:** the day-by-day spring table in §8.
5. **Release target:** a rough month to aim for, so the phases can be sized.

## 15. What changes in the existing docs
- **GDD and STORY:** "finale" becomes "the first Winter Lights", with no credits and nothing that waits except the one friendship moment. A2's "Plus" rows are replaced by §10 once decided. Combat stays none; the caves replace the puzzle cellar (already in NEW-FEATURES).
- **NEW-FEATURES.md** stays the detailed spec for F1–F6, with §8's pacing tweaks and the Mabel letters.
- **ROADMAP-PLAN.md** is replaced by §13.
