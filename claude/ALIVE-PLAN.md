# Homes come alive: build plan (28 Oct 2026)

**Why:** the rewards overhaul (counters, levels, goals) was reverted; it wasn't what Blake wanted. The game's own reward is the grey world coming back to life, so make that the payoff. **First slice: Puff's burrow.** Blake tests it on his phone before it goes to the other homes.

## 1. The room comes alive in stages
As the burrow gets tidier, things switch on: each with a soft chime, a sparkle where it happens and a line from Puff. Once on, they stay on (progress only rises; a reload shows them without the fanfare).

| Tidy | What happens | Puff says |
|---|---|---|
| 25% | The reading lamp flickers on and stays glowing, day and night. | "Ooh! The lamp works!" |
| 50% | Sunlight streams through the round window, dust motes dancing in it; a music-box melody joins the music. | "Sunshine! It's getting cosy." |
| 75% | A little cat curls up asleep on the armchair, its tail flicking. | "A visitor! Hello, puss." |
| Restored | The second lamp glows, a cushion appears on the bed and soft bells join the music (the existing reveal stays). | "It's... a home. Is it mine?", then "It's mine." (STORY.md §5) |

The stages are pack data (`alive` on an area: `at`, `say`, `effects`), so every home can have its own.

## 2. Cleaning that feels physical
Tapping still works exactly as before (and stays the accessible way to play).
- **Rub to scrub:** rub a finger back and forth over a stain and Puff scrubs it once per pass, with suds and a squeak, instead of tap, tap, tap.
- **Drag clutter home:** drag a sock (book, cup…) to where it lives. The item follows your finger; Puff picks it up and carries it straight there. That's one move instead of two taps.

## File plan
```
play/alive.ts (+test)       rules: which stages a progress has reached, which were just passed
play/gestures.ts (+test)    rules: a pointer path is a tap, a rub (with passes) or a drag
world/alive.ts              AliveLayer: draws the effects (lamp glow, sunbeam and motes, cat, decor), fading in
ui/pointer-input.ts         pointer handling: reads the gesture, shows the dragged item; tap/rub/drag go to the game
shared/audio/sound.ts       `bloom` 0–2: extra music layers (0 = today's music; the room game never sets it)
```
**`game.ts`:**
- swap its pointer code for `PointerInput`
- `rub` → a tap with extra passes
- `drag` → pick up, then put away
- tell the alive layer the area's progress, with a callback for a new stage: say, chime, sparkle and music

No save changes.

## Built (28 Oct 2026)
The burrow slice is in, as planned.
- **Checked in the browser:**
  - 25%: the lamp, "Ooh! The lamp works!"
  - 50%: the sunbeam, "Sunshine! It's getting cosy."
  - 75%: the cat, "A visitor! Hello, puss."
  - Restored: the cushion, the second lamp, bells, then "It's... a home. Is it mine?" and "It's mine."
  - One rub scrubs a 3-hit stain away.
  - Dragging the sock to the basket puts it away.
- **Fixed on the way:** a drag ends over a different sprite, so Pixi sends "pointerupoutside" as well. Both now count as the release.
- **Also:** the `?debug` hooks are in `debug.ts` again, and `skipTips` was added for tests.
- **Next, once Blake has felt it on his phone:** stages for the other homes (pack data only), and gestures for cobwebs (hold) and weeds.

## Every place (Phase 1a, 28 Oct 2026)
Each home and outdoor area now has its own stages, all pack data:
- the bakery, General Store, Bea's shop, Pip's workshop, Moss's library and Otto's bathhouse
- the yard, square, Neighbour Lane and Riverside

New effect: `bird`, a robin that bobs now and then (still with Reduce motion on). Outdoors, lamps glow, flowers come up and birds visit. Indoors, there are lamps, sunbeams, decor (tarts, towels, a toy boat), the library cat and robins. Every stage has its own Puff line (DIALOGUE-REVIEW). `?debug`'s `__town.showAlive()` shows every stage at once, for screenshots.
