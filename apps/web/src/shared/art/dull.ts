import { P, rgb } from './palette';
import { PixelCanvas, seeded } from './pixel-canvas';
import { ROOM_H, ROOM_W } from '../../room/game/pack';

// The dirty room is the clean room with its colour drained: every pixel is pulled toward a warm
// grey of the same brightness, and dimmed a touch. Cleaning reveals the colour again.
const DRAIN = 0.72;
const DIM = 0.9;
const [gr, gg, gb] = rgb(P.grey);

export function dullen(src: PixelCanvas) {
  const out = src.clone();
  const d = out.data;
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    const lum = (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) / 255;
    const tone = [gr * (0.55 + lum * 0.5), gg * (0.55 + lum * 0.5), gb * (0.55 + lum * 0.5)];
    for (let c = 0; c < 3; c += 1) d[i + c] = Math.round((d[i + c] * (1 - DRAIN) + tone[c] * DRAIN) * DIM);
  }
  return out;
}

/**
 * The room-wide dinge that lifts in steps at each stage: the drained room everywhere a task
 * doesn't own the pixel (task pixels are revealed by scrubbing instead), plus cobwebs.
 */
export function dingeLayer(dull: PixelCanvas, owner: Int8Array, wallHeight: number, seed: number) {
  const pc = dull.clone();
  for (let i = 0; i < owner.length; i += 1) if (owner[i] >= 0) pc.data[i * 4 + 3] = 0;
  const rand = seeded(seed);
  // Cobwebs in the top corners and a couple along the skirting.
  const web = (cx: number, cy: number, sx: number, sy: number, size: number) => {
    for (let a = 0; a < 5; a += 1) {
      const t = (a / 4) * (Math.PI / 2);
      pc.line(cx, cy, cx + Math.round(Math.cos(t) * size) * sx, cy + Math.round(Math.sin(t) * size) * sy, P.greyLight);
    }
    for (let r = 4; r < size; r += 4) {
      for (let a = 0; a <= 8; a += 1) {
        const t = (a / 8) * (Math.PI / 2);
        pc.set(cx + Math.round(Math.cos(t) * r) * sx, cy + Math.round(Math.sin(t) * r) * sy, P.greyLight);
      }
    }
  };
  web(0, 0, 1, 1, 16); web(ROOM_W - 1, 0, -1, 1, 16);
  web(0, wallHeight - 8, 1, -1, 9 + Math.round(rand() * 4)); web(ROOM_W - 1, wallHeight - 8, -1, -1, 9 + Math.round(rand() * 4));
  // Loose dust specks across the floor.
  for (let n = 0; n < 140; n += 1) {
    const x = Math.floor(rand() * ROOM_W); const y = wallHeight + Math.floor(rand() * (ROOM_H - wallHeight));
    if (owner[y * ROOM_W + x] < 0) pc.set(x, y, rand() < 0.5 ? P.greyShade : P.outlineLight);
  }
  return pc;
}

/** Room-wide dinge strength after each stage: it lifts in visible steps, gone when restored. */
export function dingeAlpha(stage: number) {
  return stage >= 100 ? 0 : stage >= 75 ? 0.18 : stage >= 50 ? 0.38 : stage >= 25 ? 0.6 : 0.85;
}
