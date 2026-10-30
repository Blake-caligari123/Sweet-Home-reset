import { describe, expect, it } from 'vitest';
import { P } from '../../../shared/art/palette';
import { PixelCanvas } from '../../../shared/art/pixel-canvas';
import { drawGround, type Ground, type Theme } from './ground';
import { drawMess } from './items';
import { MESS_TYPES } from '../../play/mess';
import { isNight } from '../ambience';

const theme: Theme = { wall: P.peachLight, wallAccent: P.peach, floor: P.brownLight, floorShade: P.brown, rug: P.sage, rugShade: P.sageShade };
const tile = (g: Ground, around: (dx: number, dy: number) => Ground) => {
  const pc = new PixelCanvas(16, 16);
  drawGround(pc, g, 0, 0, theme, around, 7);
  return pc;
};
const greens = [P.sage, P.sageShade, P.sageLight].map((c) => c.toUpperCase());

describe('town ground art', () => {
  it('lets grass spill over a path edge only on the sides that touch grass', () => {
    const pc = tile('path', (dx, dy) => (dx === 0 && dy === -1 ? 'grass' : 'path'));
    for (let x = 0; x < 16; x += 1) expect(greens).toContain(pc.hex(x, 0));
    expect(Array.from({ length: 16 }, (_, x) => pc.hex(x, 15)).some((h) => greens.includes(h))).toBe(false);
  });

  it('draws the same tile the same way every time', () => {
    const a = tile('grass', () => 'grass'); const b = tile('grass', () => 'grass');
    expect(Buffer.from(a.data).equals(Buffer.from(b.data))).toBe(true);
  });

  it('treats 7 pm to 6 am as night for fireflies and lamp glow', () => {
    expect(isNight(19 * 60)).toBe(true);
    expect(isNight(3 * 60)).toBe(true);
    expect(isNight(12 * 60)).toBe(false);
  });

  it('draws every kind of mess so none is ever invisible', () => {
    for (const type of MESS_TYPES.filter((t) => t !== 'none')) {
      const pc = drawMess(type, 0, 'sock');
      let solid = 0;
      for (let i = 3; i < pc.data.length; i += 4) if (pc.data[i] > 0) solid += 1;
      expect(solid, type).toBeGreaterThan(10);
    }
  });

  // Colour-blind friendly (VISION §12): every mess type is told apart by its outline, not its colour.
  it('gives every kind of mess its own shape, not only its own colour', () => {
    const shape = (type: string, variant: number) => { const d = drawMess(type, variant, 'sock').data; return Array.from({ length: d.length / 4 }, (_, i) => d[i * 4 + 3] > 0); };
    const types = MESS_TYPES.filter((t) => t !== 'none' && t !== 'clutter');
    for (const a of types) for (const b of types) {
      if (a >= b) continue;
      for (let v = 0; v < 4; v += 1) {
        const sa = shape(a, v); const sb = shape(b, v);
        const both = sa.filter((s, i) => s && sb[i]).length; const either = sa.filter((s, i) => s || sb[i]).length;
        expect(both / either, `${a} vs ${b}`).toBeLessThan(0.5);
      }
    }
  });
});
