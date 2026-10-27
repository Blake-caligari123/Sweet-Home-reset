import { PixelCanvas } from '../art/pixel-canvas';
import { dullen } from '../art/dull';
import { drawGround, drawProp, occlude, propShadow, T } from './art';
import type { Area } from './area';

/** Bake an area's ground and props into one image (FRONTEND-PLAN §3 ChunkLayer), plus its drained twin. */
export function bakeArea(area: Area) {
  const pc = new PixelCanvas(area.w * T, area.h * T);
  const around = (x: number, y: number) => (dx: number, dy: number) => area.groundAt(x + dx, y + dy);
  for (let y = 0; y < area.h; y += 1) {
    for (let x = 0; x < area.w; x += 1) {
      drawGround(pc, area.groundAt(x, y), x * T, y * T, area.pack.theme, around(x, y), x * 131 + y * 71 + area.w);
    }
  }
  for (let y = 0; y < area.h; y += 1) for (let x = 0; x < area.w; x += 1) occlude(pc, x * T, y * T, area.groundAt(x, y), around(x, y));
  // Props in foot order so nearer things overlap farther ones; all shadows go down first.
  const props = [...area.pack.props].sort((a, b) => (a.y + (a.h ?? 1)) - (b.y + (b.h ?? 1)));
  props.forEach((p) => propShadow(pc, p));
  props.forEach((p) => drawProp(pc, p));
  return { colour: pc, drained: dullen(pc) };
}
