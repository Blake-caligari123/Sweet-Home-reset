# process_asset.py — Sweet Home Reset asset processor

Free tools only: Pillow, NumPy, SciPy, rembg (u2net model, CPU) in a local venv.

Setup (once): `python3 -m venv --system-site-packages tools/.venv && tools/.venv/bin/pip install numpy pillow scipy opencv-python-headless` (`tools/.venv/` is gitignored).
Optional: `tools/.venv/bin/pip install "rembg[cpu]"` for AI cutouts (downloads a ~170 MB model on first use); without it the edge flood fill is used.
Tests: `tools/.venv/bin/python -m unittest discover tools`.

Usage (from the repo root):
```
tools/.venv/bin/python tools/process_asset.py <asset> [--out DIR] [--cutout auto|rembg|floodfill|off]
    [--force-cutout] [--slice auto|COLSxROWS] [--slice-cutout] [--names a,b,c] [--log] [--raw PATH]
```
`<asset>` = file stem (`puff_model_sheet`), number (`1`/`01`) or prompt file stem.

Example (model sheet → 7 transparent frames, logged):
```
tools/.venv/bin/python tools/process_asset.py 1 --slice auto --slice-cutout \
  --names puff_front,puff_three_quarter,puff_side,puff_back,puff_talk,puff_happy,puff_sleepy --log
```

Steps: read spec (`claude/asset-prompts/NN-*.md`: File, Size, Transparent) → find raw `art/<group>/<name>.jpg|png`
→ cutout if spec says transparent (rembg, falls back to edge flood fill with a soft 2px alpha ramp)
→ fit to exact spec size (scale to fit, pad with transparent or edge background colour; never crops)
→ optional slicing (even grid or auto-detect separate subjects, sorted rows then left→right)
→ style report (size, alpha vs spec, top 6 colours vs `tools/palette24.json`)
→ `--log` appends a row to the "Asset log" table in `claude/LICENCES.md` (skips if already there).

Watermark and outputs:
- **Mark removed per Blake overrule** (logged in `claude/LICENCES.md`, 27 Oct 2026, over the Ops veto): the bottom-right Grok mark is inpainted by default; `--keep-watermark` keeps it. Original `.jpg` files are never modified, and the script refuses to write any `.jpg`.
- Finals may be written to `art/<group>/` with `--out art/<group>`; default output is still `art/_drafts/`.
- Cutouts run a ground clean that removes the cream shadow patch under the feet and re-feathers the edge (`--no-ground-clean` to skip).
- `--canvas WxH` pads sliced frames to a fixed size; `--only a,b` writes just those frames.
- Credit "Some art created with Grok Imagine" stays in-app and in the store listing.

Example (replace one pose at its existing canvas size):
```
tools/.venv/bin/python tools/process_asset.py 1 --out art/puff --slice auto --slice-cutout --cutout floodfill \
  --names puff_front,puff_three_quarter,puff_side,puff_back,puff_talk,puff_happy,puff_sleepy --canvas 305x384 --only puff_side
```
Note: with `--out art/<group>` the full processed sheet `<stem>.png` is also written there.

## Pixel-art pass (`--pixel {room,puff,prop}`)
Runs after watermark removal and cutout. It writes `<stem>_pixel.png` (4x nearest) and `<stem>_pixel_1x.png` (engine copy). A .jpg is never written.
- room: 180x390 portrait, source fitted inside and padded with the floor colour, never cropped.
- puff: 48x48, transparent padding.
- prop: own size in multiples of 16 at room pixel density (rooms 1080 px wide -> 180 px, so x1/6). Target comes from the asset's spec **Size** (claude/ASSET-PROMPTS.md / asset-prompts) if there is one, else from the source size; aspect kept, long side capped at 128, each side 16..128. E.g. 512x512 -> 80x80, 256x256 -> 48x48, 2048x1024 -> 128x64.
- Example prop: python3 tools/process_asset.py 27 --raw <png> --pixel prop
- Steps: BOX downscale, 3x3 median, nearest colour in tools/palette24.json (Lab, hue x2), flatten large flat areas (rooms), remove stray pixels, 1px #8A6E5E outlines on strong and cutout edges (--no-outline to skip), binary alpha, 4x upscale.
- --pixel-contrast 1.15 recommended for rooms.
- Example: python3 tools/process_asset.py topdown_test_1 --raw art/rooms/topdown_test_1.jpg --pixel room --pixel-contrast 1.15 --out art/rooms
- Needs numpy, Pillow, scipy, opencv-python-headless.
- Palette: `tools/palette24.json` is the only palette (8 base colours × base/shade/light = 24; `tools/palette.json` was deleted). The style report also reads it.
- Sources: generate pixel sources in flat colour with clean outlines, rooms at 9:19.5 portrait (other assets at their own sizes). The pipeline alone won't fully convert painted art; expect light hand cleanup per asset. Spec: `claude/PIXEL-ART-SPEC.md`.

## Sprite sheets (`--sheet N`)
Character animation for the town game; what to make is in `claude/SPRITE-SHEETS.md`.
```
tools/.venv/bin/python tools/process_asset.py puff_walk_down --sheet 6 --log
tools/.venv/bin/python tools/process_asset.py hazel_walk_right --sheet 6 --frame 16x24 --log
```
- Raw input: `art/sprites/raw/<name>.png|jpg` (or `--raw path`, or `--raw a.png,b.png,...` for one frame per file).
- Steps: Grok mark removed (unless `--keep-watermark`), background cut out, frames found (or `--grid COLSxROWS` for even cells),
  ground patch cleaned, then every frame shrunk by **one shared scale** (premultiplied area average), mapped to palette24
  (Lab, chroma x2, no dithering), stray pixels removed (eyes, white and outline pixels are kept), the source's outline peeled
  and a crisp 1 px `#8A6E5E` outline added, each body centred and its feet put on the cell's bottom row.
- Output: `apps/web/public/sprites/<name>.png` (one row, 1x, the engine copy), `art/sprites/<name>_x4.png` (preview),
  `apps/web/public/sprites/manifest.json` updated, and with `--log` a row in `claude/LICENCES.md`.
- The game loads every sheet in the manifest and falls back to the code-drawn character for anything missing.

## Year soak (`year-soak.cjs`)
- Sleeps through 57 days in the browser (`?debug`), visiting the main places each morning, and stops at the first page or console error. Day 57 checks that year two carries on.
- With the dev server up (`npx vite --port 5199` in `apps/web`): `NODE_PATH=$(npm root -g) node tools/year-soak.cjs` (or set `URL`).
