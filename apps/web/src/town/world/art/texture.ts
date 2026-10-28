import type { PixelCanvas } from '../../../shared/art/pixel-canvas';
import { P } from '../../../shared/art/palette';

// Code-drawn placeholder art at the GDD v3 sizes: 16 px tiles, a 24 px Puff in the world.
// Painted areas and character sheets replace it as they land; these are the shared texture tools.
export const T = 16;

// Deterministic world-space noise so textures flow across tile seams instead of repeating.
export function hash(x: number, y: number, s = 0) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(s + 1, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function noise(x: number, y: number, size: number, s = 0) {
  const gx = x / size; const gy = y / size;
  const ix = Math.floor(gx); const iy = Math.floor(gy);
  const fx = gx - ix; const fy = gy - iy;
  const sx = fx * fx * (3 - 2 * fx); const sy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy, s); const b = hash(ix + 1, iy, s); const c = hash(ix, iy + 1, s); const d = hash(ix + 1, iy + 1, s);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

// 4×4 ordered dither: soft colour patches that stay crisp pixel art.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const dither = (x: number, y: number) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;

/** Fill a tile with a base colour, dithering a darker and lighter tone in by world noise. */
export function mottle(pc: PixelCanvas, px: number, py: number, base: string, dark: string, light: string, size: number, s: number, amount = 1) {
  for (let y = py; y < py + T; y += 1) {
    for (let x = px; x < px + T; x += 1) {
      const n = noise(x, y, size, s) * 0.75 + noise(x, y, size / 4, s + 7) * 0.25;
      const d = dither(x, y);
      pc.set(x, y, n < 0.4 && d < (0.4 - n) * 3 * amount ? dark : n > 0.6 && d < (n - 0.6) * 2.4 * amount ? light : base);
    }
  }
}

/** A four-petal flower on a stalk, for grass and flower beds. */
export function flower(pc: PixelCanvas, x: number, y: number, petal: string) {
  pc.set(x, y + 2, P.sageShade); pc.set(x, y + 3, P.sageShade); pc.set(x + 1, y + 3, P.sageShade);
  pc.set(x - 1, y, petal); pc.set(x + 1, y, petal); pc.set(x, y - 1, petal); pc.set(x, y + 1, petal);
  pc.set(x, y, P.butterShade); pc.mix(x - 1, y, P.white, 0.4);
}
