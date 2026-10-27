import { PixelCanvas } from '../art/pixel-canvas';
import { dullen } from '../art/dull';
import { drawGround, drawProp, T } from './art';
import type { Area } from './area';

/** Bake an area's ground and props into one image (FRONTEND-PLAN §3 ChunkLayer), plus its drained twin. */
export function bakeArea(area: Area) {
  const pc = new PixelCanvas(area.w * T, area.h * T);
  for (let y = 0; y < area.h; y += 1) {
    for (let x = 0; x < area.w; x += 1) {
      drawGround(pc, area.groundAt(x, y), x * T, y * T, area.pack.theme, area.groundAt(x, y + 1), x * 131 + y * 71 + area.w);
    }
  }
  // Props in foot order so nearer things overlap farther ones.
  [...area.pack.props].sort((a, b) => (a.y + (a.h ?? 1)) - (b.y + (b.h ?? 1))).forEach((p) => drawProp(pc, p));
  return { colour: pc, drained: dullen(pc) };
}
