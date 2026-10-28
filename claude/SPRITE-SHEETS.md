# Character sprite sheets (town game, GDD v3)

Decided 27 Oct 2026 (Blake): art is unparked. Blake makes the **character sprite sheets** (Grok Imagine). They go in at **high resolution**: the art's own colours and outline, cut out cleanly, stored at 6 texture px per world px and drawn at world size (Puff's cell is 24×28 world px, about 1¾ tiles tall). Strict palette24 pixel art was tried first and lost too much of the character at 24 px. Soft shadows and lamp glow stay as code overlays. `PUFF-ANIMATION-TASKS.md` (48 px room game) is retired for this.

**Puff's design (locked by the first walk sheets):** tall **upright ears** with peach insides, grey fur, cream face and belly, big dark eyes with a white shine, peach blush, small smile, tan feet, round white tail. Use `art/sprites/raw/puff_walk.jpg` as the reference image for every new Puff sheet.

Each sheet is wired in as it arrives. Until a sheet lands, the game keeps the code-drawn placeholder for it, so sheets can arrive in any order.

## How a sheet goes in
1. Save the Grok output as `art/sprites/raw/<name>.png` (or `.jpg`; originals are kept as provenance and never overwritten).
2. Run, from the repo root:
   `tools/.venv/bin/python tools/process_asset.py <name> --sheet <frames> --hires 6 --frame 24x28 --log`
   - Several sheets in one image, one per row (e.g. walk down, up, right): name the file after the set and list the rows, top to bottom:
     `... process_asset.py puff_walk --sheet 6 --rows puff_walk_down,puff_walk_up,puff_walk_right --hires 6 --frame 24x28 --log`. All rows share one scale, so Puff never changes size when turning.
   - It removes the Grok mark (per Blake's overrule in `LICENCES.md`) without touching art next to it, cuts the frames off the background, removes the magenta bleeding into the edges, shrinks every frame by **one shared scale**, centres each body and puts the feet on the bottom row of the cell.
   - It writes the engine strip to `apps/web/public/sprites/<name>.png` (open it to review), adds the sheet to `apps/web/public/sprites/manifest.json`, and logs it in `claude/LICENCES.md`.
   - (Without `--hires` it makes strict palette24 pixel art at the cell size instead.)
   - If it finds the wrong number of frames (frames touching, a busy background), add `--grid COLSxROWS` to cut even cells instead. One frame per file also works: `--raw a.png,b.png,...`.
3. Check the strip (and the game), fix anything odd in the source or by hand, then `npm test` and commit.

## Rules for every sheet
- One row of frames per sheet, left to right in play order, **evenly spaced, same size, not touching** (several sheets can share one image, one per row, with a clear gap between rows).
- **Plain flat bright magenta background (#FF00FF)**: it's far from every palette colour, so the cutout is clean. No floor, shadow, text, border or watermark-like marks under the feet.
- Same character size and camera in every frame; feet on the same line (the tool aligns them, but big drift costs detail).
- Flat colour, one shade step, soft top-left light, 1 px dark outline. No gradients, blur or texture.
- Generate big (e.g. 1536 px wide for 6 frames); the tool shrinks it to the exact grid.
- Credit stays "Some art created with Grok Imagine" (Settings > About and the store listing). Never name other games or mascots in a prompt.

## Puff (24×28 world-px cells at 6x)
Left is always the right sheet mirrored, so there are no `_left` sheets. In order:

| # | Sheet name | Frames | Notes |
|---|---|---|---|
| 1 ✅ in | `puff_walk_down` | 6 | Walking toward the camera. Feet alternate; a small body bob is welcome. |
| 1 ✅ in | `puff_walk_up` | 6 | Walking away (back view, round white tail). |
| 1 ✅ in | `puff_walk_right` | 6 | Side view facing right. |
| 2 ✅ in | `puff_idle_down` | 4 | Gentle breathing loop, front view, eyes open. (Optional `puff_idle_up`, `puff_idle_right`; otherwise walk frame 1 is held.) |
| 2 ✅ in | `puff_blink_down` | 2 | Frame 1 eyes half-closed, frame 2 closed; same pose as idle frame 1. Played over idle every 2.5–6 s. (Optional `_up` is unnecessary; `_right` if wanted.) |
| 3 | `puff_swing_down`, `puff_swing_up`, `puff_swing_right` | 4 each | Cleaning swing, **paws empty**: the game draws the current tool. Later, per-tool sheets (`puff_swing_<duster|sponge|rake|can>_<dir>`, tool in paw) override these one by one. |
| 4 | `puff_hop` | 6 | Happy hop, front view, **drawn on the ground** (crouch, stretch, tuck, land): the game lifts Puff in the air itself. |
| 4 | `puff_doze` | 2 | Asleep, eyes closed, slow breathing; front view. |

Later (not wired yet): `puff_yawn`, `puff_pickup_<dir>`, and the 48 px menu Puff.

## Neighbours (after the Puff set; cell size set per neighbour, e.g. `--frame 16x28`)
Ids: `hazel` (hedgehog), `bea` (bee), `pip` (mouse), `otto` (otter), `moss` (mole), `mabel` (owl). For each: `<id>_idle_down` (4), `<id>_walk_down`, `<id>_walk_up`, `<id>_walk_right` (6 each). The 48 px portraits with 3 expressions (happy, thinking, tired) are a separate later set.

## Grumbles (Phase 1c; cell 16×15 world px, `--frame 16x15`)
The dust family first (cobweb, mud and soot follow with their days). Two sheets, one per row in one image:
- `grumble_dust_grumpy`: 4 frames, idle, grey and droopy
- `grumble_dust_bright`: 4 frames, idle, bright and happy

Prompt (no reference image needed; attach the code placeholder screenshot if Grok drifts):

> Pixel art sprite sheet, two rows of four frames. A Grumble: a tiny round puff of soft fluffy dust, the size of a dumpling, with a few wispy tufts on top and no arms or legs. **Row 1:** grey and sleepy, droopy half-closed eyes, a tiny pout, gently bobbing up and down across the 4 frames. **Row 2:** the same creature brightened to soft butter yellow with rosy peach cheeks, happy closed-arc eyes and a small smile, bobbing cheerfully across the 4 frames. Cute and harmless: no teeth, no glowing eyes, no slime. Frames evenly spaced, identical size and scale, not touching, all on the same ground line, a clear gap between the rows. Plain flat bright magenta background (#FF00FF), no floor, no shadow, no text. Cosy top-down game sprite, chunky readable shapes, crisp hard-edged square pixels, flat colour with one shade step, soft top-left light, 1-pixel warm-brown outline (#8A6E5E), limited warm pastel palette. No anti-aliasing, no blur, no gradients, no dithering. Original character. Negative: photorealism, watercolour, 3D render, text, watermark, background scenery.

Process: `... process_asset.py grumble_dust --sheet 4 --rows grumble_dust_grumpy,grumble_dust_bright --hires 6 --frame 16x15 --log`

## Prompt template (Grok Imagine)
Swap in the sheet line from the table above. Attach Puff's model sheet as the reference image so Puff stays on-model.

> Pixel art sprite sheet of Puff, a small round fluffy dust bunny: soft grey fur, cream face and belly, two tall upright ears with peach inner ears, big dark eyes with a white shine, peach blush, small smile, little tan feet, round white tail. Same character as the reference image. **[SHEET: e.g. "6-frame walk cycle seen from the front, walking toward the camera, feet alternating"]**. Frames in one horizontal row, evenly spaced, identical size and scale, not touching, all on the same ground line. Plain flat bright magenta background (#FF00FF), no floor, no shadow, no text. Cosy top-down game sprite, chunky readable shapes, crisp hard-edged square pixels, flat colour with one shade step, soft top-left light, 1-pixel warm-brown outline (#8A6E5E), limited warm pastel palette. No anti-aliasing, no blur, no gradients, no dithering, no painterly texture. Original character, not resembling any existing mascot. Negative: photorealism, watercolour, 3D render, text, watermark, background scenery.

For neighbours, replace the first sentence with their description from `claude/STORY.md` §3 and keep the rest.

## Painted areas (backgrounds)
Decided 27 Oct 2026 (Blake): areas are Grok paintings too, so the whole game looks consistent. The burrow and bakery are done; the yard and square prompts are in the chat log of that day (same style block, burrow attached as the reference).
1. Save the painting as `art/areas/raw/<area>.jpg`.
2. `tools/.venv/bin/python tools/process_asset.py <area> --background COLSxROWS --log` (64 painting px per tile, so a 1792×1008 painting is 28×16 tiles). It removes the Grok mark (even where it touches the painting's outline), makes the ground outside the building transparent (the game fills it with the area's `edge` colour and never greys it), pads to the exact grid and writes `apps/web/public/areas/<area>.webp`.
3. In the pack, give the area `"background": { "src": "areas/<area>.webp", "scale": 4 }`, set `edge` to the colour the tool prints, and trace the map over the painting (walls `#`, floor, rugs `,` for the onboarding, doors). Props stay in the pack as invisible blockers and for their actions (bed, basket, shelf, sink); lamps also place the night glow.
   Then trace free movement as `"nav": { "floor": [...], "blockers": [...] }` (world-px polygons = painting px ÷ 4; see the burrow): the floor where Puff's feet may go, and one blocker per object covering its **whole painted shape**, so Puff never overlaps it from behind. Check it with an overlay of the open cells on the painting.
4. The grey "messy" version is made in code from the painting, per tile; mess is drawn by the game on top.
Puff moves freely (no grid) on a fine 4 px walking grid built from those outlines (`apps/web/src/town/world/nav.ts`). Still to build, with the yard and square: a front layer for tree canopies and shop roofs, so Puff can walk behind them (see `claude/FREE-MOVEMENT-PROGRESS.md`).

