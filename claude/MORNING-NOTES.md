# Morning notes for Blake (overnight 28–29 Oct 2026)

You said to carry on without asking. I've merged each slice to the test link once its tests, browser checks and Android build were green. Nothing went to production, and there was no spending and no accounts. Reload the test link once to pick up the latest.

## What's new on the test link
| PR | What | Test steps |
|---|---|---|
| #40 | **Phase 1 finished:** hold, circle and sweep gestures; light mess drifting back into restored rooms overnight | checklist §11f |
| #41 | **Phase 2a:** twigs and pebbles to forage; Pip's workbench; Copper duster, sponge and rake; charged hold clean | checklist §11g |
| #44 | **Phase 2d:** Town Bloom levels (pause menu, banners, the lamppost needs Bloom 2); surprise finds every 8 cleans; Moss's collection on his library table | checklist §11j |
| #43 | **Phase 2c:** cooking in the burrow kitchen: veggie soup, pea fritters, and a Berry tart after Hazel's 2-heart scene | checklist §11i |
| #42 | **Phase 2b:** carrots, peas and strawberries (strawberries grow back); pick your seeds; sell them all | checklist §11h |

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
- **Kitchen:** it's the burrow counter to the right of the sink. The painting doesn't show a stove there, so a stove in the next burrow painting would be nice.

## Art to ask Grok for (prompts in `claude/SPRITE-SHEETS.md`)
- **Pets:** cat, pup, hedgehoglet (walk and idle sheets each).
- **Small items** (optional; the code-drawn ones work fine):
  - twig
  - pebble
  - Copper duster
  - Copper rake

## Questions for you
- None that blocked me. Anything you'd like changed, just say.
