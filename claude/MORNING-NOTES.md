# Morning notes for Blake (overnight 28–29 Oct 2026)

You said to carry on without asking. I've merged each slice to the test link once its tests, browser checks and Android build were green. Nothing went to production, and there was no spending and no accounts. Reload the test link once to pick up the latest.

## Highlights (if you only try a few things)
- **Day 8:** Sorrel's letter by the Lane sign. Build her cottage, and she moves in two nights later.
- **Day 10:** Mabel's first bottle by the fountain. It opens the caves under the Glimmerwell, so go mining.
- **Day 12:** mend the footbridge at Riverside and cross to the Far Bank.
- **Day 14:** the Spring Clean Fair and its tidy dash in the square. There's a picnic on day 28, a leaf fest on day 42 and Winter Lights on day 56.
- **Day 43:** mend the sea steps at Riverside to reach the Beach and Mabel's lighthouse.
- **Day 15 onward:** summer, then golden autumn (day 29) and snowy winter (day 43). Rain on some days, first on day 6.

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
- **Grumbles** (optional): cobweb, mud and soot sheets, same layout as the dust one (SPRITE-SHEETS → Grumbles).
- **Sorrel** (optional): a red squirrel with a big curled tail and a sage scarf, same sheets as the other neighbours (SPRITE-SHEETS → Neighbours).
- **Outfits** (optional): six small accessories in one image (prompt in SPRITE-SHEETS → Outfits).
- **Small items** (optional; the code-drawn ones work fine):
  - twig
  - pebble
  - Copper duster
  - Copper rake

## Phase 3 (done)
- **3a (#50):** Mabel's letters. The text is my proposal (see DIALOGUE-REVIEW), so please tweak anything that isn't her voice.
- **3b (#51):** the caves, floor 1. Mabel's first letter opens the fountain hatch; mine rocks for copper ore and colour shards; they grow back weekly. Code-drawn for now (a Grok cave painting would be lovely later). Checklist §11p.
- **3c (#52):** Sorrel moves in. Her letter comes on day 8, you build her cottage on the Lane (two nights), and she's there on day 10. She's a code-drawn red squirrel, and all her lines are my proposal (DIALOGUE-REVIEW). Checklist §11q.
- **3d (#53):** the footbridge. From day 12, mend it at Riverside with Sparkles, twigs, pebbles and copper ore from the caves. Two nights later you can cross to the Far Bank, a new grey orchard to restore. Checklist §11r.
- **3e (#54):** cobweb (day 9), mud (day 13) and soot (day 16) Grumbles, each tinted on your dust art for now. Checklist §11s.
- **3f (#55):** cave floor 2, the Warm Deep. Mabel's second letter brings the map leaf; there are blue gems and an old carving about Thimble. Checklist §11t.
- **3g (#56):** neighbours visit once a week. Hazel, Bea and Sorrel pop round to your yard, and the others visit each other, each with a hello. Checklist §11u.
- **3h (#57):** town jobs. Some days the notice board has a job from the whole town; they count toward Town Bloom. Checklist §11v. **That completes Phase 3.**

## Phase 4 so far
- **4a (#58):** rain. Fixed rainy days (first on day 6) water the outdoor crops, bring a little mud, and look cooler, with rain falling. Checklist §12a.
- **4b (#59):** the seasons turn every 14 days. Golden autumn, snowy winter, new summer and autumn crops, seeds by season, and season lines for everyone. Checklist §12b.
- **4c (#60):** the Spring Clean Fair on day 14. Everyone's in the square; the fair stall starts a 60-second tidy dash, with Sparkles and a fair ribbon. Checklist §12c.
- **4d (#61):** the Summer Picnic (day 28, crumbs, a sun hat) and the Autumn Leaf Fest (day 42, leaf piles, an acorn cap). Checklist §12d.
- **4e (#62):** Winter Lights on day 56. Light eight lanterns round the square, and the Glimmerwell shines to close year one's chapter. Spring carries on after. Checklist §12e.
- **4f (#63):** the sea steps (day 43) open the Beach, with Mabel's lighthouse. Checklist §12f.
- **4g (#64):** the overgrown path (day 26) opens the Woodland Edge and its orchard, with apples every morning. Checklist §12g.

## Questions for you
1. **Burrow growing:** would you like a Grok painting for a second burrow room? A bedroom or a cosy den, attached through a door from the main room. That unlocks the burrow growing, indoor decor and a pet bed.
2. **Sorrel:** I made her a chatty, slightly shy red squirrel who loves acorns. Is that the newcomer you pictured? Her lines are in DIALOGUE-REVIEW.
3. **Festival mini-games:** spring is a 60-second tidy dash. My plans for the rest:
   - summer: a picnic set-up, placing things on the blanket
   - autumn: a leaf-pile sweep
   - winter: lantern lighting

   Happy with those?
4. Anything you'd like changed from tonight, just say.

## Next, unless you say otherwise
Phase 4 (seasons and sharing):
- the timed tidy mini-game any day (a fun score)
- caves floors 3 and 4
- Sorrel's heart scenes
