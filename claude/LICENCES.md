
## Grok Imagine art (Ops check, 27 Oct 2026)
Source: SpaceXSI Consumer Terms of Service, https://x.ai/legal/terms-of-service, last updated 12 Oct 2026, read 27 Oct 2026.
Verdict: YES, commercial use is allowed, with conditions.
- s4 says the user owns their Output, as between them and SpaceXSI, and the terms contain no ban on commercial use.
- Condition 1: s4 says that when you use Output you must attribute its generation to the Service, per SpaceXSI's Brand Guidelines. Add a credits line: "Some art created with Grok Imagine". Don't use SpaceXSI or Grok logos without permission.
- Condition 2: SpaceXSI may require or apply a label saying the content was AI-generated. Superseded for game cutouts by Blake's override below (mark removed, .jpg originals kept); say the art is AI-assisted in the store listing if asked.
- Risk: outputs may not be unique, and SpaceXSI gets a broad licence over Inputs. Australian copyright needs a human author, so pure AI art may not be protectable. To protect the art, Blake should hand-edit Puff's key art and the logo, and file the trade mark on the name rather than relying on art copyright.
- Never prompt for other games' characters or styles, such as Finch, Sweepy, Tody, PowerWash or Unpacking.
- Log every asset's prompt and date here.

### Ruling, 27 Oct 2026 12:52: Grok Imagine watermark
Yes, the watermark counts as the AI-generated label. Under s4 of the terms, SpaceXSI may apply an AI disclosure to Outputs and the user agrees to it. Removing, cropping or painting out the watermark breaks that. VETO on removing it. (Overridden by Blake, see below.)
Allowed instead:
- Use an official watermark-free export if Grok offers one on Blake's plan. Ops checks that option before anyone relies on it.
- Keep the watermark in a part of the asset that's off-screen or covered by the UI, without cropping it out of the source file.
- Use the Grok output only as a reference and have the final asset redrawn or substantially hand-made. This also helps with copyright.

- 2026-10-27: Blake (owner) decided to remove the Grok mark from game cutouts after being told of the Ops ruling; originals (.jpg) kept unedited as provenance; in-app and store credit "Some art created with Grok Imagine" stays.

## Asset log
| Asset | File | Prompt file | Date | Source |
|---|---|---|---|---|
| puff_model_sheet | `puff/puff_model_sheet.png` | `claude/asset-prompts/01-puff-model-sheet.md` | 2026-10-27 | Grok Imagine (mark removed per Blake overrule; jpg kept) |

| puff_idle (asset 2, #2 "Puff state: idle") | `puff/puff_idle.png` (box: art/puff/puff_state_idle.png) | ASSET-PROMPTS.md #2 | 2026-10-27 | Grok Imagine (mark removed per Blake 2026-10-27; jpg kept) |
| puff pose cutouts ×7 (from #1 "Puff model sheet") | art/puff/puff_{front,three_quarter,side,back,talk,happy,sleepy}.png | ASSET-PROMPTS.md #1 | 2026-10-27 | Grok Imagine (mark not in cutouts; sheet jpg kept) |
| puff_side (re-cut by tools/process_asset.py) | `puff/puff_side.png` | `claude/asset-prompts/01-puff-model-sheet.md` | 2026-10-27 | Grok Imagine (mark removed per Blake overrule; ground patch cleaned; jpg kept) |
