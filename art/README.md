# art/

Source images and processed previews for the game. The engine copies live in `apps/web/public/`.

- `sprites/raw/`: Blake's original character sheets (Grok Imagine), named `<sheet_name>.png|jpg`. Kept unedited as provenance; never overwritten.
- `sprites/<sheet_name>_x4.png`: 4x previews written by `tools/process_asset.py --sheet` for review.
- `_drafts/`: default output for the older `process_asset.py` modes.

What to make and how to process it: `claude/SPRITE-SHEETS.md`. Every asset is logged in `claude/LICENCES.md`.
