# Sweet Home Reset: Asset Prompts for Grok Imagine
*PixelVortex Games · v1 · 27 Oct 2026 · author: SF Product Designer · bundle `com.pixelvortexgames.sweethomereset` · sources: GAME-DESIGN.md §6, §3, §7, §9 and FRONTEND-PLAN.md*

> **Before generating anything (Ops rule):** Ops has to confirm that Grok Imagine's terms allow commercial use **before any image is generated**. Every generated image then needs a line in `LICENCES.md` with its file name, the exact prompt used and the date it was generated.

> **Art source:** these Grok Imagine images are the real game art. Code-drawn art is the fallback when an image is missing. File names and sizes are confirmed by Frontend in FRONTEND-PLAN.md §15 (lowercase snake_case; pack room id `kitchen-nook` maps to `kitchen_nook_*.png`).

## Shared style block (paste-ready; a short form is repeated in every prompt)
- **Look:** cosy 2D, soft flat diorama, rounded shapes, gentle paper grain, no text.
- **Palette (hex):** butter `#F6E3A1` · sage `#B7CDB0` · peach `#F4C2A8` · dusty blue `#A9BFD6` · cream `#FFF8EC` · warm grey (Puff) `#CFC6BD` · soft brown `#B9937A` · outline brown `#8A6E5E`.
- **Line weight:** soft 2px warm-brown outlines (scale proportionally on large images); never hard black.
- **Lighting:** soft warm light from top-left, gentle shadows; cleaning reveals colour, dirty versions are desaturated and dim.
- **Camera:** three-quarter front view at slight elevation, one room per image; characters and props front-facing three-quarter.
- **Room framing:** Each room's dirty and clean images use identical framing and camera, matching pixel for pixel, so the scrub reveal lines up.
- **Content:** cosy and body-safe; mess is soft haze, crumbs and smudges only; no real brands, real people or text in images; Puff is never sad, sick, crying or angry.
- **Originality (Ops):** every prompt ends with "original character, not resembling Finch or any existing mascot". Nothing may resemble Finch's bird, its style or its name.
- **No style copying (Ops):** never write "in the style of" followed by a named artist or game.
- **Negative line:** every prompt has a "Negative:" line; paste it into the negative-prompt field if offered, otherwise append it.

## Keeping Puff consistent
1. Generate **#1 Puff model sheet** first and approve it.
2. For every later Puff image, attach the approved model sheet as the **reference image** and keep the Puff description in the prompt word-for-word.
3. Keep the same aspect ratio per group (1:1 for poses) and reject any output where ear shape, eye shape, fur colour `#CFC6BD` or proportions drift.
4. For outfits, use the approved `puff_idle.png` as the reference and change only the clothing.
5. For dirty/clean room pairs, generate the clean room first, then use it as the reference for the dirty version so layout and camera match.

## A. Puff
### 1. Puff model sheet
- **File:** `puff/puff_model_sheet.png`
- **Size:** 2048×1024 px
- **Transparent background:** No

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Puff: a small round soft dust bunny, fluffy warm-grey #CFC6BD fur with cream #FFF8EC tummy, two short rounded floppy ears, big dark-brown oval eyes with a white shine, tiny peach #F4C2A8 cheeks, small smile, stubby nub feet, no arms except tiny fluffy nubs. Character turnaround model sheet of Puff on a plain cream #FFF8EC background: front, three-quarter, side and back views in a row at equal size, plus a small row of three expressions (happy, delighted, sleepy), same proportions in every view. full-bleed scene, no transparency. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 2. Puff state: idle
- **File:** `puff/puff_idle.png`
- **Size:** 1024×1024 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Puff: a small round soft dust bunny, fluffy warm-grey #CFC6BD fur with cream #FFF8EC tummy, two short rounded floppy ears, big dark-brown oval eyes with a white shine, tiny peach #F4C2A8 cheeks, small smile, stubby nub feet, no arms except tiny fluffy nubs. Single pose of Puff, standing calmly mid breathing bob, gentle smile, same design as the model sheet. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 3. Puff state: sleepy
- **File:** `puff/puff_sleepy.png`
- **Size:** 1024×1024 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Puff: a small round soft dust bunny, fluffy warm-grey #CFC6BD fur with cream #FFF8EC tummy, two short rounded floppy ears, big dark-brown oval eyes with a white shine, tiny peach #F4C2A8 cheeks, small smile, stubby nub feet, no arms except tiny fluffy nubs. Single pose of Puff, drowsy half-closed eyes, small yawn, ears drooping softly, same design as the model sheet. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 4. Puff state: nap
- **File:** `puff/puff_nap.png`
- **Size:** 1024×1024 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Puff: a small round soft dust bunny, fluffy warm-grey #CFC6BD fur with cream #FFF8EC tummy, two short rounded floppy ears, big dark-brown oval eyes with a white shine, tiny peach #F4C2A8 cheeks, small smile, stubby nub feet, no arms except tiny fluffy nubs. Single pose of Puff, curled up asleep in a round ball, eyes closed, tiny contented smile, same design as the model sheet. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 5. Puff state: peek
- **File:** `puff/puff_peek.png`
- **Size:** 1024×1024 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Puff: a small round soft dust bunny, fluffy warm-grey #CFC6BD fur with cream #FFF8EC tummy, two short rounded floppy ears, big dark-brown oval eyes with a white shine, tiny peach #F4C2A8 cheeks, small smile, stubby nub feet, no arms except tiny fluffy nubs. Single pose of Puff, peeking out shyly from behind a soft edge, only top half visible, curious eyes, same design as the model sheet. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 6. Puff state: bounce
- **File:** `puff/puff_bounce.png`
- **Size:** 1024×1024 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Puff: a small round soft dust bunny, fluffy warm-grey #CFC6BD fur with cream #FFF8EC tummy, two short rounded floppy ears, big dark-brown oval eyes with a white shine, tiny peach #F4C2A8 cheeks, small smile, stubby nub feet, no arms except tiny fluffy nubs. Single pose of Puff, mid-air happy jump, squashed-and-stretched tall, delighted face, same design as the model sheet. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 7. Puff state: wiggle
- **File:** `puff/puff_wiggle.png`
- **Size:** 1024×1024 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Puff: a small round soft dust bunny, fluffy warm-grey #CFC6BD fur with cream #FFF8EC tummy, two short rounded floppy ears, big dark-brown oval eyes with a white shine, tiny peach #F4C2A8 cheeks, small smile, stubby nub feet, no arms except tiny fluffy nubs. Single pose of Puff, wiggling side to side with motion-free happy pose, ears tilted, cheeky grin, same design as the model sheet. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 8. Puff state: dance
- **File:** `puff/puff_dance.png`
- **Size:** 1024×1024 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Puff: a small round soft dust bunny, fluffy warm-grey #CFC6BD fur with cream #FFF8EC tummy, two short rounded floppy ears, big dark-brown oval eyes with a white shine, tiny peach #F4C2A8 cheeks, small smile, stubby nub feet, no arms except tiny fluffy nubs. Single pose of Puff, joyful little dance, one foot up, ears flying, eyes closed in happiness, same design as the model sheet. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 9. Puff state: proud_spin
- **File:** `puff/puff_proud_spin.png`
- **Size:** 1024×1024 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Puff: a small round soft dust bunny, fluffy warm-grey #CFC6BD fur with cream #FFF8EC tummy, two short rounded floppy ears, big dark-brown oval eyes with a white shine, tiny peach #F4C2A8 cheeks, small smile, stubby nub feet, no arms except tiny fluffy nubs. Single pose of Puff, mid twirl, proud beaming face, chest puffed, small sparkle swirl around, same design as the model sheet. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 10. Puff state: hop_in_pile
- **File:** `puff/puff_hop_in_pile.png`
- **Size:** 1024×1024 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Puff: a small round soft dust bunny, fluffy warm-grey #CFC6BD fur with cream #FFF8EC tummy, two short rounded floppy ears, big dark-brown oval eyes with a white shine, tiny peach #F4C2A8 cheeks, small smile, stubby nub feet, no arms except tiny fluffy nubs. Single pose of Puff, landing happily in a soft pile of grey dust motes, puff of dust around, same design as the model sheet. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 11. Puff state: sneeze
- **File:** `puff/puff_sneeze.png`
- **Size:** 1024×1024 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Puff: a small round soft dust bunny, fluffy warm-grey #CFC6BD fur with cream #FFF8EC tummy, two short rounded floppy ears, big dark-brown oval eyes with a white shine, tiny peach #F4C2A8 cheeks, small smile, stubby nub feet, no arms except tiny fluffy nubs. Single pose of Puff, small cute sneeze, eyes squeezed, tiny cloud of soft dust, not gross, same design as the model sheet. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 12. Puff state: tidy_helper
- **File:** `puff/puff_tidy_helper.png`
- **Size:** 1024×1024 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Puff: a small round soft dust bunny, fluffy warm-grey #CFC6BD fur with cream #FFF8EC tummy, two short rounded floppy ears, big dark-brown oval eyes with a white shine, tiny peach #F4C2A8 cheeks, small smile, stubby nub feet, no arms except tiny fluffy nubs. Single pose of Puff, holding a tiny speck of dust helpfully, friendly helpful look, same design as the model sheet. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 13. Puff state: party
- **File:** `puff/puff_party.png`
- **Size:** 1024×1024 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Puff: a small round soft dust bunny, fluffy warm-grey #CFC6BD fur with cream #FFF8EC tummy, two short rounded floppy ears, big dark-brown oval eyes with a white shine, tiny peach #F4C2A8 cheeks, small smile, stubby nub feet, no arms except tiny fluffy nubs. Single pose of Puff, celebrating with a tiny pastel party hat and pastel confetti, big smile, same design as the model sheet. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 14. Puff state: cosy
- **File:** `puff/puff_cosy.png`
- **Size:** 1024×1024 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Puff: a small round soft dust bunny, fluffy warm-grey #CFC6BD fur with cream #FFF8EC tummy, two short rounded floppy ears, big dark-brown oval eyes with a white shine, tiny peach #F4C2A8 cheeks, small smile, stubby nub feet, no arms except tiny fluffy nubs. Single pose of Puff, relaxed under a small sage blanket holding a warm mug, content smile, same design as the model sheet. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```

## B. Starter rooms (dirty and clean) and dirt overlays
### 15. kitchen_nook – clean
- **File:** `rooms/kitchen_nook_clean.png`
- **Size:** 2048×2048 (square, max texture 2048) px
- **Transparent background:** No

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. One-room diorama of a small kitchen nook with counter, sink, window with curtains, mug, shelf with jars, sparkling clean, bright warm colour, curtains open, sunlight pouring in, generate first and use as the reference for the dirty version, identical framing pixel for pixel, cosy and tidy, empty floor space for a character. full-bleed scene, no transparency. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 16. kitchen_nook – dirty
- **File:** `rooms/kitchen_nook_dirty.png`
- **Size:** 2048×2048 px
- **Transparent background:** No

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Identical framing and camera to the clean version, matching pixel for pixel (use the clean image as the reference image); the exact same room layout of a small kitchen nook with counter, sink, window with curtains, mug, shelf with jars, but dusty and muted: desaturated greyish haze, soft smudges, scattered crumbs, a few cobwebs in corners, curtains closed, dim light; mess is soft and never gross. full-bleed scene, no transparency. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 17. living_room – clean
- **File:** `rooms/living_room_clean.png`
- **Size:** 2048×2048 (square, max texture 2048) px
- **Transparent background:** No

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. One-room diorama of a small living room with sofa, rug, coffee table, bookshelf, window, potted plant, sparkling clean, bright warm colour, curtains open, sunlight pouring in, generate first and use as the reference for the dirty version, identical framing pixel for pixel, cosy and tidy, empty floor space for a character. full-bleed scene, no transparency. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 18. living_room – dirty
- **File:** `rooms/living_room_dirty.png`
- **Size:** 2048×2048 px
- **Transparent background:** No

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Identical framing and camera to the clean version, matching pixel for pixel (use the clean image as the reference image); the exact same room layout of a small living room with sofa, rug, coffee table, bookshelf, window, potted plant, but dusty and muted: desaturated greyish haze, soft smudges, scattered crumbs, a few cobwebs in corners, curtains closed, dim light; mess is soft and never gross. full-bleed scene, no transparency. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 19. bedroom – clean
- **File:** `rooms/bedroom_clean.png`
- **Size:** 2048×2048 (square, max texture 2048) px
- **Transparent background:** No

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. One-room diorama of a small bedroom with bed, bedside table, lamp, wardrobe, mirror, laundry basket, sparkling clean, bright warm colour, curtains open, sunlight pouring in, generate first and use as the reference for the dirty version, identical framing pixel for pixel, cosy and tidy, empty floor space for a character. full-bleed scene, no transparency. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 20. bedroom – dirty
- **File:** `rooms/bedroom_dirty.png`
- **Size:** 2048×2048 px
- **Transparent background:** No

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Identical framing and camera to the clean version, matching pixel for pixel (use the clean image as the reference image); the exact same room layout of a small bedroom with bed, bedside table, lamp, wardrobe, mirror, laundry basket, but dusty and muted: desaturated greyish haze, soft smudges, scattered crumbs, a few cobwebs in corners, curtains closed, dim light; mess is soft and never gross. full-bleed scene, no transparency. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 21. Dirt overlay: dust
- **File:** `overlays/dirt_dust.png`
- **Size:** 2048×2048 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Tileable-feeling overlay of soft grey dust haze patches only, no room or furniture, semi-transparent soft edges, mess never gross. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 22. Dirt overlay: grime
- **File:** `overlays/dirt_grime.png`
- **Size:** 2048×2048 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Tileable-feeling overlay of soft brownish smudge and grime patches only, no room or furniture, semi-transparent soft edges, mess never gross. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 23. Dirt overlay: clutter
- **File:** `overlays/dirt_clutter.png`
- **Size:** 2048×2048 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Tileable-feeling overlay of scattered cosy clutter items: socks, books, cups, papers without writing only, no room or furniture, semi-transparent soft edges, mess never gross. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 24. Dirt overlay: cobwebs
- **File:** `overlays/dirt_cobwebs.png`
- **Size:** 2048×2048 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Tileable-feeling overlay of light wispy cobwebs for corners only, no room or furniture, semi-transparent soft edges, mess never gross. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 25. Dirt overlay: fog
- **File:** `overlays/dirt_fog.png`
- **Size:** 2048×2048 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Tileable-feeling overlay of misty fog layer for a mirror or window only, no room or furniture, semi-transparent soft edges, mess never gross. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 26. Dirt overlay: crumbs
- **File:** `overlays/dirt_crumbs.png`
- **Size:** 2048×2048 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Tileable-feeling overlay of scattered small crumbs only, no room or furniture, semi-transparent soft edges, mess never gross. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```

## C. Mini-task props and tools
### 27. Task prop: sponge
- **File:** `props/sponge.png`
- **Size:** 512×512 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Single object: a soft peach sponge with foam bubbles. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 28. Task prop: foam_bubbles
- **File:** `props/foam_bubbles.png`
- **Size:** 512×512 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Single object: a cluster of soft white foam bubbles. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 29. Task prop: squeegee
- **File:** `props/squeegee.png`
- **Size:** 512×512 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Single object: a pastel dusty-blue window squeegee and cloth. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 30. Task prop: broom
- **File:** `props/broom.png`
- **Size:** 512×512 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Single object: a small pastel broom and dustpan. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 31. Task prop: dust_pile_marker
- **File:** `props/dust_pile_marker.png`
- **Size:** 512×512 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Single object: a soft circular dotted pile target marker on the floor. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 32. Task prop: dust_bunny_cousin
- **File:** `props/dust_bunny_cousin.png`
- **Size:** 512×512 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Single object: a tiny shy grey fluffball dust bunny cousin, simpler than Puff, no ears. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 33. Task prop: polish_cloth
- **File:** `props/polish_cloth.png`
- **Size:** 512×512 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Single object: a butter-yellow polishing cloth with a sparkle. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 34. Task prop: laundry_basket
- **File:** `props/laundry_basket.png`
- **Size:** 512×512 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Single object: a woven laundry basket. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 35. Task prop: sort_bin
- **File:** `props/sort_bin.png`
- **Size:** 512×512 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Single object: a pastel sorting bin. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 36. Task prop: folded_shirt
- **File:** `props/folded_shirt.png`
- **Size:** 512×512 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Single object: a neatly folded plain pastel shirt, no print. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 37. Task prop: watering_can
- **File:** `props/watering_can.png`
- **Size:** 512×512 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Single object: a sage watering can with droplets. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 38. Task prop: plant_droopy
- **File:** `props/plant_droopy.png`
- **Size:** 512×512 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Single object: a droopy potted plant. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 39. Task prop: plant_perky
- **File:** `props/plant_perky.png`
- **Size:** 512×512 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Single object: the same potted plant perked up with unfurled leaves. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 40. Task prop: vacuum_nozzle
- **File:** `props/vacuum_nozzle.png`
- **Size:** 512×512 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Single object: a small rounded pastel handheld vacuum nozzle. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 41. Task prop: spray_bottle
- **File:** `props/spray_bottle.png`
- **Size:** 512×512 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Single object: a pastel spray bottle with soft mist. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 42. Task prop: tangled_cord
- **File:** `props/tangled_cord.png`
- **Size:** 512×512 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Single object: a tangled soft cable with a rounded plug handle. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 43. Task prop: sticker
- **File:** `props/sticker.png`
- **Size:** 512×512 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Single object: a peelable plain star sticker with a curled corner. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 44. Task prop: friendly_bug
- **File:** `props/friendly_bug.png`
- **Size:** 512×512 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Single object: a cute round ladybird-like friendly bug, not creepy. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 45. Task prop: tool_tray
- **File:** `props/tool_tray.png`
- **Size:** 512×512 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Single object: an empty rounded pastel tray for tools. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```

## D. Decor, outfits and tools (shop)
### 46. Decor: decor_lamp_pastel
- **File:** `decor/decor_lamp_pastel.png`
- **Size:** 512×512 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Single decor object: a pastel table lamp. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 47. Decor: decor_plant
- **File:** `decor/decor_plant.png`
- **Size:** 512×512 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Single decor object: a small potted plant (first decor item). isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 48. Decor: decor_rug
- **File:** `decor/decor_rug.png`
- **Size:** 512×512 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Single decor object: a round cosy rug. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 49. Decor: decor_cushion
- **File:** `decor/decor_cushion.png`
- **Size:** 512×512 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Single decor object: a plump cushion. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 50. Decor: decor_wall_art
- **File:** `decor/decor_wall_art.png`
- **Size:** 512×512 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Single decor object: framed abstract pastel shapes, no text. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 51. Decor: decor_fairy_lights
- **File:** `decor/decor_fairy_lights.png`
- **Size:** 512×512 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Single decor object: a string of warm fairy lights. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 52. Decor: decor_bookshelf_mini
- **File:** `decor/decor_bookshelf_mini.png`
- **Size:** 512×512 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Single decor object: a mini bookshelf with blank-spined books. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 53. Decor: decor_mug_steam
- **File:** `decor/decor_mug_steam.png`
- **Size:** 512×512 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Single decor object: a mug with soft steam curl. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 54. Outfit: apron (worn)
- **File:** `outfits/outfit_apron_worn.png`
- **Size:** 1024×1024 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Puff: a small round soft dust bunny, fluffy warm-grey #CFC6BD fur with cream #FFF8EC tummy, two short rounded floppy ears, big dark-brown oval eyes with a white shine, tiny peach #F4C2A8 cheeks, small smile, stubby nub feet, no arms except tiny fluffy nubs. Puff in idle pose wearing a tiny apron. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 55. Outfit: apron (shop icon)
- **File:** `outfits/outfit_apron_icon.png`
- **Size:** 256×256 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Just a tiny apron on its own, no character. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 56. Outfit: scarf (worn)
- **File:** `outfits/outfit_scarf_worn.png`
- **Size:** 1024×1024 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Puff: a small round soft dust bunny, fluffy warm-grey #CFC6BD fur with cream #FFF8EC tummy, two short rounded floppy ears, big dark-brown oval eyes with a white shine, tiny peach #F4C2A8 cheeks, small smile, stubby nub feet, no arms except tiny fluffy nubs. Puff in idle pose wearing a cosy knitted scarf. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 57. Outfit: scarf (shop icon)
- **File:** `outfits/outfit_scarf_icon.png`
- **Size:** 256×256 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Just a cosy knitted scarf on its own, no character. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 58. Outfit: bandana (worn)
- **File:** `outfits/outfit_bandana_worn.png`
- **Size:** 1024×1024 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Puff: a small round soft dust bunny, fluffy warm-grey #CFC6BD fur with cream #FFF8EC tummy, two short rounded floppy ears, big dark-brown oval eyes with a white shine, tiny peach #F4C2A8 cheeks, small smile, stubby nub feet, no arms except tiny fluffy nubs. Puff in idle pose wearing a little head bandana. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 59. Outfit: bandana (shop icon)
- **File:** `outfits/outfit_bandana_icon.png`
- **Size:** 256×256 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Just a little head bandana on its own, no character. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 60. Outfit: beanie (worn)
- **File:** `outfits/outfit_beanie_worn.png`
- **Size:** 1024×1024 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Puff: a small round soft dust bunny, fluffy warm-grey #CFC6BD fur with cream #FFF8EC tummy, two short rounded floppy ears, big dark-brown oval eyes with a white shine, tiny peach #F4C2A8 cheeks, small smile, stubby nub feet, no arms except tiny fluffy nubs. Puff in idle pose wearing a tiny beanie between the ears. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 61. Outfit: beanie (shop icon)
- **File:** `outfits/outfit_beanie_icon.png`
- **Size:** 256×256 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Just a tiny beanie between the ears on its own, no character. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 62. Outfit: party_hat (worn)
- **File:** `outfits/outfit_party_hat_worn.png`
- **Size:** 1024×1024 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Puff: a small round soft dust bunny, fluffy warm-grey #CFC6BD fur with cream #FFF8EC tummy, two short rounded floppy ears, big dark-brown oval eyes with a white shine, tiny peach #F4C2A8 cheeks, small smile, stubby nub feet, no arms except tiny fluffy nubs. Puff in idle pose wearing a tiny pastel party hat. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 63. Outfit: party_hat (shop icon)
- **File:** `outfits/outfit_party_hat_icon.png`
- **Size:** 256×256 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Just a tiny pastel party hat on its own, no character. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 64. Puff tool: spray_gun_pastel
- **File:** `tools/tool_spray_gun_pastel.png`
- **Size:** 512×512 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Single tool object: a pastel spray gun. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 65. Puff tool: big_sponge
- **File:** `tools/tool_big_sponge.png`
- **Size:** 512×512 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Single tool object: an oversized wide sponge (boost). isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 66. Puff tool: sparkle_duster
- **File:** `tools/tool_sparkle_duster.png`
- **Size:** 512×512 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Single tool object: a feather-free fluffy duster made of soft yarn pompoms. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```

## E. UI icons, Sparkles and Energy
### 67. Sparkles currency icon
- **File:** `ui/icon_sparkles.png`
- **Size:** 256×256 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. A cluster of three soft butter-yellow four-point sparkles with a gentle glow. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 68. Energy currency icon
- **File:** `ui/icon_energy.png`
- **Size:** 256×256 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. A small soft peach heart-shaped leaf glowing gently, symbol of real-life energy. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 69. UI icon: home
- **File:** `ui/icon_home.png`
- **Size:** 256×256 (shown at ≥44 pt) px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Simple bold readable app icon glyph of a tiny cosy house, thick rounded shapes, high contrast on light and dark. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 70. UI icon: shop
- **File:** `ui/icon_shop.png`
- **Size:** 256×256 (shown at ≥44 pt) px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Simple bold readable app icon glyph of a small shopping basket, thick rounded shapes, high contrast on light and dark. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 71. UI icon: wardrobe
- **File:** `ui/icon_wardrobe.png`
- **Size:** 256×256 (shown at ≥44 pt) px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Simple bold readable app icon glyph of a tiny wardrobe, thick rounded shapes, high contrast on light and dark. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 72. UI icon: decor
- **File:** `ui/icon_decor.png`
- **Size:** 256×256 (shown at ≥44 pt) px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Simple bold readable app icon glyph of a small lamp, thick rounded shapes, high contrast on light and dark. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 73. UI icon: share
- **File:** `ui/icon_share.png`
- **Size:** 256×256 (shown at ≥44 pt) px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Simple bold readable app icon glyph of a rounded arrow coming out of a soft square, thick rounded shapes, high contrast on light and dark. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 74. UI icon: settings
- **File:** `ui/icon_settings.png`
- **Size:** 256×256 (shown at ≥44 pt) px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Simple bold readable app icon glyph of a soft rounded gear, thick rounded shapes, high contrast on light and dark. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 75. UI icon: help_puff
- **File:** `ui/icon_help_puff.png`
- **Size:** 256×256 (shown at ≥44 pt) px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Simple bold readable app icon glyph of a small fluffy paw-like helping nub with a sparkle, thick rounded shapes, high contrast on light and dark. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 76. UI icon: chore_tick
- **File:** `ui/icon_chore_tick.png`
- **Size:** 256×256 (shown at ≥44 pt) px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Simple bold readable app icon glyph of a soft rounded tick in a circle, thick rounded shapes, high contrast on light and dark. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 77. UI icon: plus_badge
- **File:** `ui/icon_plus_badge.png`
- **Size:** 256×256 (shown at ≥44 pt) px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Simple bold readable app icon glyph of a rounded star badge, thick rounded shapes, high contrast on light and dark. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 78. UI icon: mess_of_day
- **File:** `ui/icon_mess_of_day.png`
- **Size:** 256×256 (shown at ≥44 pt) px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Simple bold readable app icon glyph of a small calendar page with a sparkle, no numbers, thick rounded shapes, high contrast on light and dark. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 79. UI icon: restore
- **File:** `ui/icon_restore.png`
- **Size:** 256×256 (shown at ≥44 pt) px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Simple bold readable app icon glyph of a circular gentle arrow, thick rounded shapes, high contrast on light and dark. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 80. UI icon: rest_day
- **File:** `ui/icon_rest_day.png`
- **Size:** 256×256 (shown at ≥44 pt) px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Simple bold readable app icon glyph of a little moon and cloud, thick rounded shapes, high contrast on light and dark. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 81. UI icon: meter
- **File:** `ui/icon_meter.png`
- **Size:** 256×256 (shown at ≥44 pt) px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Simple bold readable app icon glyph of a rounded progress jar half full of sparkles, thick rounded shapes, high contrast on light and dark. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 82. Particle sprite: sparkle
- **File:** `ui/particle_sparkle.png`
- **Size:** 64×64 px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. A single tiny four-point sparkle. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```

## F. App icon, splash, store screenshot and share-card backgrounds
### 83. App icon (iOS/master)
- **File:** `brand/app_icon_1024.png`
- **Size:** 1024×1024 px
- **Transparent background:** No

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Puff: a small round soft dust bunny, fluffy warm-grey #CFC6BD fur with cream #FFF8EC tummy, two short rounded floppy ears, big dark-brown oval eyes with a white shine, tiny peach #F4C2A8 cheeks, small smile, stubby nub feet, no arms except tiny fluffy nubs. Puff's face and ears, centred, smiling, on a butter #F6E3A1 to peach soft gradient, a few sparkles, simple and readable at small size, square, no rounded corners. full-bleed scene, no transparency. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 84. Android adaptive icon foreground
- **File:** `brand/app_icon_fg_432.png`
- **Size:** 432×432 (keep Puff in centre 288 px) px
- **Transparent background:** Yes

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Puff: a small round soft dust bunny, fluffy warm-grey #CFC6BD fur with cream #FFF8EC tummy, two short rounded floppy ears, big dark-brown oval eyes with a white shine, tiny peach #F4C2A8 cheeks, small smile, stubby nub feet, no arms except tiny fluffy nubs. Puff's face and ears centred, smiling. isolated on a fully transparent background, centred, no ground shadow. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 85. Android adaptive icon background
- **File:** `brand/app_icon_bg_432.png`
- **Size:** 432×432 px
- **Transparent background:** No

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Plain soft butter-to-peach gradient with faint grain. full-bleed scene, no transparency. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 86. Splash screen
- **File:** `brand/splash_2732.png`
- **Size:** 2732×2732 (centre-safe 1200) px
- **Transparent background:** No

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Puff: a small round soft dust bunny, fluffy warm-grey #CFC6BD fur with cream #FFF8EC tummy, two short rounded floppy ears, big dark-brown oval eyes with a white shine, tiny peach #F4C2A8 cheeks, small smile, stubby nub feet, no arms except tiny fluffy nubs. Puff waving happily in the centre on a cream background with soft pastel sparkles around, lots of empty margin. full-bleed scene, no transparency. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 87. Store screenshot background 1
- **File:** `store/screenshot_bg_1.png`
- **Size:** 1320×2868 (iPhone 6.9"); crop to 1284×2778 and 1080×1920 px
- **Transparent background:** No

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Puff: a small round soft dust bunny, fluffy warm-grey #CFC6BD fur with cream #FFF8EC tummy, two short rounded floppy ears, big dark-brown oval eyes with a white shine, tiny peach #F4C2A8 cheeks, small smile, stubby nub feet, no arms except tiny fluffy nubs. Portrait background: a half-scrubbed kitchen nook, one clean colourful strip across dusty surfaces; leave the top 25% as calm empty space for a caption added later. full-bleed scene, no transparency. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 88. Store screenshot background 2
- **File:** `store/screenshot_bg_2.png`
- **Size:** 1320×2868 (iPhone 6.9"); crop to 1284×2778 and 1080×1920 px
- **Transparent background:** No

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Portrait background: a room split before and after down the middle, dusty left, sparkling right; leave the top 25% as calm empty space for a caption added later. full-bleed scene, no transparency. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 89. Store screenshot background 3
- **File:** `store/screenshot_bg_3.png`
- **Size:** 1320×2868 (iPhone 6.9"); crop to 1284×2778 and 1080×1920 px
- **Transparent background:** No

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Puff: a small round soft dust bunny, fluffy warm-grey #CFC6BD fur with cream #FFF8EC tummy, two short rounded floppy ears, big dark-brown oval eyes with a white shine, tiny peach #F4C2A8 cheeks, small smile, stubby nub feet, no arms except tiny fluffy nubs. Portrait background: Puff dancing in a sparkling living room; leave the top 25% as calm empty space for a caption added later. full-bleed scene, no transparency. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 90. Store screenshot background 4
- **File:** `store/screenshot_bg_4.png`
- **Size:** 1320×2868 (iPhone 6.9"); crop to 1284×2778 and 1080×1920 px
- **Transparent background:** No

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Portrait background: a cosy home map with small tidy rooms glowing; leave the top 25% as calm empty space for a caption added later. full-bleed scene, no transparency. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 91. Store screenshot background 5
- **File:** `store/screenshot_bg_5.png`
- **Size:** 1320×2868 (iPhone 6.9"); crop to 1284×2778 and 1080×1920 px
- **Transparent background:** No

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Portrait background: a row of small themed room dioramas: tent, desk, beach shack; leave the top 25% as calm empty space for a caption added later. full-bleed scene, no transparency. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 92. Store screenshot background 6
- **File:** `store/screenshot_bg_6.png`
- **Size:** 1320×2868 (iPhone 6.9"); crop to 1284×2778 and 1080×1920 px
- **Transparent background:** No

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Puff: a small round soft dust bunny, fluffy warm-grey #CFC6BD fur with cream #FFF8EC tummy, two short rounded floppy ears, big dark-brown oval eyes with a white shine, tiny peach #F4C2A8 cheeks, small smile, stubby nub feet, no arms except tiny fluffy nubs. Portrait background: a decorated cosy bedroom with plants and lights, Puff in a scarf; leave the top 25% as calm empty space for a caption added later. full-bleed scene, no transparency. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 93. Store screenshot background 7
- **File:** `store/screenshot_bg_7.png`
- **Size:** 1320×2868 (iPhone 6.9"); crop to 1284×2778 and 1080×1920 px
- **Transparent background:** No

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Puff: a small round soft dust bunny, fluffy warm-grey #CFC6BD fur with cream #FFF8EC tummy, two short rounded floppy ears, big dark-brown oval eyes with a white shine, tiny peach #F4C2A8 cheeks, small smile, stubby nub feet, no arms except tiny fluffy nubs. Portrait background: Puff napping peacefully on a rug in a sunny room; leave the top 25% as calm empty space for a caption added later. full-bleed scene, no transparency. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 94. Share-card background: before_after
- **File:** `share/share_bg_before_after.png`
- **Size:** 1080×1920 px
- **Transparent background:** No

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Portrait a soft pastel frame for a before/after room clip, empty centre; no text, no numbers. full-bleed scene, no transparency. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 95. Share-card background: mess_of_day
- **File:** `share/share_bg_mess_of_day.png`
- **Size:** 1080×1920 px
- **Transparent background:** No

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Portrait a cosy pastel card background with an empty grid area and room-thumbnail space; no text, no numbers. full-bleed scene, no transparency. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
### 96. Share-card background: photo_mode
- **File:** `share/share_bg_photo_mode.png`
- **Size:** 1080×1920 px
- **Transparent background:** No

```
Cosy 2D flat diorama illustration, rounded soft shapes, warm pastel palette (butter #F6E3A1, sage #B7CDB0, peach #F4C2A8, dusty blue #A9BFD6, cream #FFF8EC, warm grey #CFC6BD, soft brown #B9937A), soft 2px warm-brown #8A6E5E outlines (no hard black), gentle paper grain, soft warm top-left light, three-quarter front view at slight elevation, cosy 2D, no text. Portrait a soft pastel photo frame with sparkles and empty centre; no text, no numbers. full-bleed scene, no transparency. original character, not resembling Finch or any existing mascot.
Negative: text, letters, words, numbers, logos, watermark, signature, brand names, real people, photorealism, 3D render, hard black outlines, harsh shadows, mould, gross or bodily mess, disgusting bugs, gore, scary, sad or crying character, alcohol, weapons, body or weight focus, Finch, bird, owl, chick, feathers
```
