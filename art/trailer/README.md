# Trailers and shorts

Every video here is drawn in code on a canvas from the game's own sprites and area paintings (`apps/web/public/`), with a score synthesised in Python. Re-render any of them after the art changes.

| Video | Folder | Length | What it is |
|---|---|---|---|
| `sweet_home_reset_trailer.mp4` | `.` | 33 s | The first upbeat trailer |
| `sweet_home_reset_cinematic.mp4` | `cinematic/` | 55 s | Cinematic story trailer (store page, press) |
| `shr_loop_a/b/c.mp4` | `viral/` | 16 s | Seamless tidy loop in three hook captions (A/B test) |
| `shr_timelapse.mp4` | `shorts/` | 20 s | "I spent 56 days restoring this town": a year-long timelapse |
| `shr_skit.mp4` | `shorts/` | 17 s | "me at 2am": a comedy skit ending in a free doze |
| `shr_asmr.mp4` | `shorts/` | 20 s | Slow-clean ASMR: macro close-ups, foley only |

## Layout
- `lib/kit.js`: the shared drawing kit (maths, colour grading, sprites, text, the Hollowfern panorama, painted interiors, grain, loading). Pages set `DURATION` and `window.draw(t)`.
- `lib/synth.py`: the shared sound kit (instruments, effects, reverb, `Mix`).
- `lib/render.js`: renders any page with Playwright and encodes it with ffmpeg. The audio is loudness-normalised to -14 LUFS.
- `fonts/`: Fredoka, Pixelify Sans and Cormorant Garamond (SIL Open Font License, from Google Fonts).
- `viral/PLAN.md`: the research and the posting/testing plan.

## Commands (from `art/trailer/`)
```
python3 shorts/timelapse.py                                   # writes shorts/timelapse.wav
node lib/render.js shorts/timelapse.html video shorts/shr_timelapse.mp4 shorts/timelapse.wav
node lib/render.js shorts/timelapse.html stills 2,9.5,18      # review frames into shorts/stills/
node lib/render.js viral/short.html?v=b video viral/shr_loop_b.mp4 viral/audio.wav
```
Open any `.html` page in a browser to watch it play live.

Neighbour icons, the town, the fountain and the lighthouse are code-drawn placeholders until their paintings arrive.
Some art created with Grok Imagine.
