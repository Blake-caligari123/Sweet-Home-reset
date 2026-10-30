# Trailer

`sweet_home_reset_trailer.mp4`: 33 s vertical (1080×1920, 30 fps) social trailer.

- `trailer.html`: every scene, drawn on a canvas by `draw(t)`. It loads the game's sprites and area paintings from `apps/web/public/`. Open it in a browser to preview it live.
- `music.py`: synthesises `audio.wav` (music and sound effects timed to the scenes). Needs numpy.
- `render.js`: renders the frames with Playwright and encodes them with ffmpeg.

```
cd art/trailer
python3 music.py
node render.js video sweet_home_reset_trailer.mp4 audio.wav
node render.js stills 4,9.2,27.3   # writes stills/t*.jpg for review (create stills/ first)
```

Fonts: Fredoka and Pixelify Sans (SIL Open Font License), from Google Fonts.
Neighbour icons, the fountain and the town square are code-drawn placeholders.
Some art created with Grok Imagine.
