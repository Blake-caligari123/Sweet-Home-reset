import { describe, expect, it } from 'vitest';
import { TUNING } from '../data/tuning';
import { fitTiles, pinchTiles, VIEW_TILES, wheelTiles } from './zoom';

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

  it('fits a phone as before and shows more of the town on a big screen, so tiles stay about 64 px', () => {
    expect(fitTiles(390)).toBe(VIEW_TILES); // a phone's width
    expect(fitTiles(900)).toBe(14); // a laptop's height
    expect(fitTiles(2160)).toBe(TUNING.zoomTiles[1]); // never further out than pinching allows
  });
});
