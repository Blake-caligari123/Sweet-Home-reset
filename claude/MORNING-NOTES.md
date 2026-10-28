# Morning notes for Blake (overnight 28–29 Oct 2026)

You said to carry on without asking. I've merged each slice to the test link once its tests, browser checks and Android build were green. Nothing went to production, and there was no spending and no accounts. Reload the test link once to pick up the latest.

## What's new on the test link
| PR | What | Test steps |
|---|---|---|
| #40 | **Phase 1 finished:** hold, circle and sweep gestures; light mess drifting back into restored rooms overnight | checklist §11f |
| #41 | **2a:** twigs and pebbles to forage; Pip's workbench; Copper duster, sponge and rake; charged hold clean | §11g |
| #42 | **2b:** carrots, peas and strawberries (strawberries grow back); pick your seeds; sell them all | §11h |
| #43 | **2c:** cooking in the burrow kitchen: veggie soup, pea fritters, and a Berry tart after Hazel's 2-heart scene | §11i |
| #44 | **2d:** Town Bloom levels (pause menu, banners; the lamppost needs Bloom 2); surprise finds every 8 cleans; Moss's collection on his library table | §11j |
| #45 | **2e:** six earned outfits (bow, Keeper's badge, scarf, berry hat, flower crown, star clip), worn on Puff; Pause → 👒 Outfits | §11k |
| #46 | **2f:** free decor outdoors (flower pots, lanterns, little fences, stone paths); place from the bag, pick up any time; never blocks the way | §11l |
| #47 | **2g:** building upgrades (cosy bench, big flower bed, twin lamp) | §11m |
| #50 | **3a:** Mabel's bottle letters: from day 10 a bottle washes up by the fountain every few days; write back for friendship before you meet her; the first brings the cave map leaf | §11o |
| #49 | **2h:** a greenhouse by the yard garden (Town Bloom 2, 300 ✨) that waters the garden every night (you said make it straight away) | §11n |

## Phase 2: what's left
- **The burrow growing (new rooms)** looks best as a Grok painting, like the burrow and bakery, so it waits for your art (question 1). The greenhouse is in (#49).
- Everything else in the Phase 2 plan is in.

## Decisions I made (easy to change)
- **Copper tools:** crafted at Pip's table in his workshop. Pip's the tinkerer, and the workshop is code-drawn, so it was easy to add.
- **Costs:**
  - recipes are 100 ✨ each at the General Store (the sponge was 150)
  - making a tool takes 40–50 ✨ plus 4–6 twigs and pebbles
- **Fixed gap:** the Copper sponge recipe used to do nothing when bought.
- **Crop numbers:**
  - growing time: radish 3 days, carrot 4, peas 5, strawberry 6 (grows back every 3)
  - seeds: 30–60 ✨ for 3
  - sell prices: 15–30 ✨
  - These are all in `tuning.json` and the pack, so they're easy to tune after you play.
- **Town Bloom points:** restore 3, build 2, each heart 1, each helper 1. Levels at 0/6/15/30/50 (`tuning.bloomLevels`).
- **Decor goes outdoors only for now.** The burrow and bakery are paintings, so placed things wouldn't match the art. Indoor decor can come with the burrow growing.
- **Kitchen:** it's the burrow counter to the right of the sink. The painting doesn't show a stove there, so a stove in the next burrow painting would be nice.

## Art to ask Grok for (prompts in `claude/SPRITE-SHEETS.md`)
- **Pets:** cat, pup, hedgehoglet (walk and idle sheets each).
- **Outfits** (optional): six small accessories in one image (prompt in SPRITE-SHEETS → Outfits).
- **Small items** (optional; the code-drawn ones work fine):
  - twig
  - pebble
  - Copper duster
  - Copper rake

## Phase 3 so far
- **3a (#50):** Mabel's letters. The text is my proposal (see DIALOGUE-REVIEW), so please tweak anything that isn't her voice.

## Questions for you
1. **Burrow growing:** would you like a Grok painting for a second burrow room? A bedroom or a cosy den, attached through a door from the main room. That unlocks the burrow growing, indoor decor and a pet bed.
2. Anything you'd like changed from tonight, just say.

## Next, unless you say otherwise
Phase 3:
- Mabel's bottle letters from day 10
- the caves under the fountain
- Sorrel's invite
- the footbridge repair
