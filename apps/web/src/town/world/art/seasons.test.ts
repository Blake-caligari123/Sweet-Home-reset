import { describe, expect, it } from 'vitest';
import { P } from '../../../shared/art/palette';
import { PixelCanvas } from '../../../shared/art/pixel-canvas';
import { seasonal } from './seasons';

describe('seasonal ground', () => {
  const pc = new PixelCanvas(2, 1); pc.set(0, 0, P.sage); pc.set(1, 0, P.brown);

  it('leaves spring and summer as they are', () => {
    expect(seasonal(pc, 'Spring')).toBe(pc);
    expect(seasonal(pc, 'Summer')).toBe(pc);
  });

  it('turns the greens golden in autumn and snowy in winter, and nothing else', () => {
    for (const s of ['Autumn', 'Winter']) {
      const out = seasonal(pc, s);
      expect(out.hex(0, 0), s).not.toBe(pc.hex(0, 0));
      expect(out.hex(1, 0), s).toBe(pc.hex(1, 0));
    }
    const winter = seasonal(pc, 'Winter'); const [r, g, b] = [1, 2, 3].map((k) => winter.data[k - 1]);
    expect(Math.min(r, g, b)).toBeGreaterThan(200);
  });
});
