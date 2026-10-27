# Trailer rig

Renders the alpha trailer from the real game (the `/test/` town build), frame by frame at 60 fps.
Nothing here ships with the game: `render.cjs` injects a hook into `game.ts` at load time, and the game code stays unchanged.

- `vclock.js`: virtual clock (rAF, timers, `performance.now`) so every frame is exact.
- `director.js`: in-page camera, Puff squash/stretch, colour/mess control, DOM overlay (captions, meter, logo).
- `shots.js`: every shot (140 bpm, lengths in beats).
- `audio.py`: original chiptune + SFX (numpy). `MAP` holds the shot order for each cut.

Run from this folder with the dev server up (`npm run dev` → port 5173):

    node render.cjs h <shot>                          # 1920×1080 shot → out/h_<shot>.mp4
    node render.cjs v sneeze out/v_sneezeA.mp4 --variant A   # 1080×1920, hook A/B/C
    node render.cjs h <shot> --still 0.5,1.2          # stills for checking
    python3 assemble.py h        # → final/…_16x9.mp4
    python3 assemble.py v A      # → final/…_vertical_A.mp4
