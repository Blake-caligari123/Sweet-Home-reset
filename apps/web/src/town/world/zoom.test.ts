import { describe, expect, it } from 'vitest';
import { TUNING } from '../data/tuning';
import { pinchTiles, wheelTiles } from './zoom';

describe('zoom', () => {
  it('spreading two fingers shows fewer tiles (closer); pinching shows more, within limits', () => {
    expect(pinchTiles(11, 100, 200)).toBe(Math.max(TUNING.zoomTiles[0], 5.5));
    expect(pinchTiles(11, 200, 100)).toBe(Math.min(TUNING.zoomTiles[1], 22));
    expect(pinchTiles(11, 100, 100)).toBe(11);
  });

  it('a wheel notch zooms one tile in or out, within limits', () => {
    expect(wheelTiles(11, -100)).toBe(10);
    expect(wheelTiles(11, 100)).toBe(12);
    expect(wheelTiles(TUNING.zoomTiles[0], -100)).toBe(TUNING.zoomTiles[0]);
  });
});
