import { describe, expect, it } from 'vitest';
import { ICONS, iconPixels } from './icons';

describe('pixel icons', () => {
  it('draws something for every emoji it knows, inside its 12 × 12', () => {
    for (const e of Object.keys(ICONS)) {
      const pc = iconPixels(e)!;
      let ink = 0;
      for (let y = 0; y < 12; y += 1) for (let x = 0; x < 12; x += 1) if (pc.alpha(x, y) > 0) ink += 1;
      expect(ink, e).toBeGreaterThan(8);
    }
    expect(iconPixels('🦄')).toBeNull();
  });
});
