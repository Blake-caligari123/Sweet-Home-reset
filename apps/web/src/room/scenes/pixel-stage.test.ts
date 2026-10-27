import { describe, expect, it } from 'vitest';
import { CROP_BOTTOM, CROP_TOP, fitStage } from './pixel-stage';

describe('pixel stage', () => {
  it.each([[375, 667, 2], [390, 844, 3], [430, 932, 3], [390, 664, 3], [1440, 800, 2], [320, 480, 1]])(
    'scales %ix%i @%ix by a whole number of device pixels and keeps the play area on screen',
    (w, h, dpr) => {
      const fit = fitStage(w, h, dpr);
      expect(Number.isInteger(fit.k)).toBe(true);
      expect(fit.scale * dpr).toBe(fit.k);
      expect(180 * fit.scale).toBeLessThanOrEqual(w);
      expect(Number.isInteger(fit.x * dpr)).toBe(true);
      expect(Number.isInteger(fit.y * dpr)).toBe(true);
      if (fit.k > 1) {
        // Never crop more than the allowed wall strip at the top or floor strip at the bottom.
        expect(fit.y).toBeGreaterThanOrEqual(-CROP_TOP * fit.scale - 1e-9);
        expect(fit.y + (390 - CROP_BOTTOM) * fit.scale).toBeLessThanOrEqual(h + 1e-9);
      }
    }
  );

  it('shows the whole room on an iPhone, in Safari and from the Home Screen', () => {
    expect(fitStage(390, 664, 3).k).toBe(5);
    expect(fitStage(390, 844, 3).k).toBe(6);
  });
});
