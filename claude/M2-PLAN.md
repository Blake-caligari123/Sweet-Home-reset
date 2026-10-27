# M2 Neighbours: build plan (27 Oct 2026)

Milestone 2 of GDD v3 A9 (FRONTEND-PLAN F8). Progress is ticked in the Steps table as each step lands.

**Step 1 notes:** Hazel, Bea and Pip are in the pack with routines. Until Neighbour Lane is built (step 7), Bea and Pip live on `lane` (offstage behind the gate) and only visit the bakery: Bea 7:20–7:50, Pip 15:00–16:00. Fixed on the way: a memory leak on every area change (about 70 KB each, from M1), which may have fed the freezing reports in long sessions.

**Pass test (A9):** onboarding to 30:00 completes; playtesters befriend neighbours and restore 3 homes within 14 days; a home restores at 95% and triggers the reveal; hearts never drop. FRONTEND-PLAN adds: onboarding to 30:00 by script, and 30 area changes without a memory leak.

**Before M2 starts:** M1 passes on Blake's iPhone (a full day from waking to bed, Hazel's bakery restored, `?fps` holding 60, save survives a reload). The yard and square paintings can land during M2.

## How it's built
- **Nothing waits on art.** Every neighbour starts as a code-drawn placeholder (like Puff did) and every new area as a tile map; sprite sheets and paintings swap in as they arrive, exactly like the burrow and bakery.
- **Content is pack data.** Neighbours, schedules, dialogue, gifts, heart events, requests and shop stock go in the Hollowfern pack JSON, with text in an `en-AU` string table (ids in logic, never names). Numbers stay in `tuning.json`.
- **Tests first,** `npm test` green at the end of every step, a browser playthrough at 390×844, then a PR. Blake says when to deploy.
- **Copy rules are tested:** a test scans every string for the banned words ("failed", "lost", "overdue", "lazy"), body or appearance talk, and lines over 60 characters.

## Steps
| # | Step | What it does | Done when (tests) |
|---|---|---|---|
| 1 ✅ | **Neighbours walk the town** | Neighbour pack schema (id, home, species, loves/likes/dislikes, daily schedule of places by time). Neighbours appear as placeholder sprites, walk their routes with the free-movement nav, and are depth-sorted with Puff. Tap one: Puff walks over and faces them. Save schema bump with migration. | Schedule tests (Hazel bakes 6–11, shop 11–17, asleep by 21); old saves migrate; neighbours never stand in a wall; 30 area changes don't grow memory. |
| 2 | **Talking** | Dialogue box with a name and portrait slot. Line pools picked by GDD §6.1 (flag > hearts > weather > season > time > generic, no repeats in the last 5). Talk once a day = +1, then short "busy" lines. | Pool selection tests; copy-rule test over every line. |
| 3 | **Gifts and hearts** | Give the held bag item: loved +8, liked +3, others +1 thanks; disliked gets a kind "not for me" with no loss. 10 points a heart. A Friends page in the menu shows each neighbour's hearts. | Points from tuning; **hearts never drop** across gifts, days and save/load. |
| 4 | **Heart events** | A scene runner for the pack format in GDD §7: lines, choices, flags, rewards, triggers (area, time band) and conditions. Events at 2, 4, 6, 8 and 10 for all six (30 scenes), drafted from STORY.md for Blake to review. Skippable. | Each event fires once, at the right hearts, and remembers flags (e.g. Hazel 2 remembers the counter request). |
| 5 | **Notice board and requests** | 1–3 requests a day (clean a spot, find an item, deliver a snack), soft deadline 2–3 days, an expired one just goes ("no worries"). The one-line request tracker at the top of the HUD. Request done = +10 points and Sparkles. | Request generation is deterministic per day; expiry never costs anything; tracker updates. |
| 6 | **Shops and Sparkles** | Shop screen with fixed prices from the pack and opening hours. General Store (tools, snacks, bag upgrades; the Copper recipe listed from day 5 for M3), Bea's flower shop (seeds, plants), Pip's workshop (decor). Closed shops say when they open. | Can't buy when closed or short of Sparkles; nothing random for sale; prices only from pack data. |
| 7 | **New areas** | Neighbour Lane (open from day 1) with Bea's flower shop and Pip's workshop; Riverside (opens day 3) with Otto's bathhouse; the General Store off the square; Moss's library and Mabel's home per the decision below. Each home has mess, a 95% restore and the reveal. | Pack reachability tests for every area (walk to every door, mess spot and usable prop); a restored home stays restored after reload. |
| 8 | **Onboarding 6:30–30:00** | GDD A6 / story §5: meet Hazel at the bakery door, Berry tart, eat it, first notice-board request (dust Hazel's counter), meet Bea and Pip on the Lane, evening hint, bed, Day 2 letter, General Store opens. | A scripted run reaches the 30:00 target state: burrow restored, 3 neighbours met, 1 request done, 1 crop growing, 1 day completed. |
| 9 | **Plus gate stub** | Otto, Moss and Mabel check one `hasPlus()` stub; test builds unlock everything. Real Plus arrives in M5. | Stub on: all six playable. Stub off: the three are silhouettes with a kind "later" line, no paywall. |
| 10 | **M2 check** | Full playthrough at 390×844 and the QA Group pass, then Blake's phone test. | A9 M2 pass test. |

## Decisions (all three recommendations accepted by Blake, 27 Oct 2026)
1. **Where Moss and Mabel live during M2.** The library is tied to the Woodland edge and Mabel's lighthouse to the Beach, and both areas arrive in M4. **Recommended:** Moss's library sits at the woodland end of Neighbour Lane (the Woodland edge joins onto it in M4); Mabel takes visitors in the square in the evenings (18:00–1:00, her routine) until the lighthouse opens in M4.
2. **Rooms per home.** Part B says 2–4 rooms per home. **Recommended:** one painted room per home in M2, like the bakery, with extra rooms added later as pack data (no code change). It keeps your painting count sensible.
3. **Dialogue.** I draft all lines (about 40 per neighbour plus 30 heart-event scenes) from STORY.md; you review them in one doc before they ship.

## Art needed from Blake (in order)
Nothing blocks the code; each piece is wired in when it lands.
1. **Hazel:** `hazel_idle_down` (4 frames), `hazel_walk_down`, `hazel_walk_up`, `hazel_walk_right` (6 each). Prompt below.
2. **Bea, then Pip:** the same four sheets each (free neighbours first).
3. **Paintings:** yard and square (M1), then Neighbour Lane, General Store, Bea's flower shop, Pip's workshop, Riverside, Otto's bathhouse, Moss's library.
4. **Otto, Moss, Mabel:** the same four sheets each.
5. **Later:** 48 px portraits with 3 expressions (happy, thinking, tired) for the dialogue box; code-drawn faces stand in until then.

### Hazel prompt (Grok Imagine; attach Puff's walk sheet as the style reference)
> Pixel art sprite sheet of Hazel, a small round hedgehog baker: soft brown spines with lighter tips, cream face and tummy, small pink nose, dark shiny eyes with a white shine, peach blush, a white apron with a little flour dusting, tiny tan paws. Same art style, outline and scale as the reference image. **6-frame walk cycle seen from the front, walking toward the camera, feet alternating.** Frames in one horizontal row, evenly spaced, identical size and scale, not touching, all on the same ground line. Plain flat bright magenta background (#FF00FF), no floor, no shadow, no text. Cosy top-down game sprite, chunky readable shapes, crisp hard-edged square pixels, flat colour with one shade step, soft top-left light, 1-pixel warm-brown outline (#8A6E5E), limited warm pastel palette. No anti-aliasing, no blur, no gradients, no dithering, no painterly texture. Original character, not resembling any existing mascot. Negative: photorealism, watercolour, 3D render, text, watermark, background scenery.

Swap the bold line for the other sheets:
- **Walk up:** "6-frame walk cycle seen from behind, walking away from the camera, feet alternating, spines and apron bow visible".
- **Walk right:** "6-frame walk cycle seen from the side, facing right, feet alternating".
- **Idle:** "4-frame gentle breathing idle, front view, eyes open, standing still".

They go in with `process_asset.py hazel_walk --sheet 6 --rows hazel_walk_down,hazel_walk_up,hazel_walk_right --hires 6 --frame 24x28 --log` (see SPRITE-SHEETS.md).
