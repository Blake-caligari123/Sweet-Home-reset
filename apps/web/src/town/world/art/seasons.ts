import { P, rgb } from '../../../shared/art/palette';
import type { PixelCanvas } from '../../../shared/art/pixel-canvas';

// Seasons on the ground (VISION §7): the code-drawn outdoors keep their spring greens through
// summer, turn golden in autumn and lie under snow in winter. Only green pixels change (grass,
// hedges, leaves), so paths, roofs and props keep their colours.
const SHIFT: Record<string, [string, number]> = { Autumn: [P.butterShade, 0.45], Winter: [P.white, 0.8] };

const made = new WeakMap<PixelCanvas, Map<string, PixelCanvas>>();

/** The ground as it looks this season (made once per baked area and season). */
export function seasonal(src: PixelCanvas, season: string) {
  const shift = SHIFT[season];
  if (!shift) return src;
  const mine = made.get(src) ?? new Map<string, PixelCanvas>(); made.set(src, mine);
  const done = mine.get(season); if (done) return done;
  const [tr, tg, tb] = rgb(shift[0]); const a = shift[1];
  const out = src.clone(); const d = out.data;
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3] || d[i + 1] <= d[i] + 8 || d[i + 1] <= d[i + 2] + 8) continue;
    d[i] = Math.round(d[i] * (1 - a) + tr * a); d[i + 1] = Math.round(d[i + 1] * (1 - a) + tg * a); d[i + 2] = Math.round(d[i + 2] * (1 - a) + tb * a);
  }
  mine.set(season, out);
  return out;
}
