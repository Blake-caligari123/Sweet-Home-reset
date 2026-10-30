import { describe, expect, it } from 'vitest';
import { brightness, mix, skyAt } from './lighting';

const out = { kind: 'outdoor', rainy: false, season: 'Spring' };

describe('light across the day', () => {
  it('is untouched at noon, darkest at night, and eases in between', () => {
    expect(skyAt(12 * 60, out)).toBe(0xffffff);
    const night = brightness(skyAt(23 * 60, out));
    expect(night).toBeLessThan(0.45);
    // Dusk is between the two, and minutes apart barely differ (no steps).
    const dusk = brightness(skyAt(20 * 60, out));
    expect(dusk).toBeGreaterThan(night); expect(dusk).toBeLessThan(1);
    expect(Math.abs(brightness(skyAt(20 * 60, out)) - brightness(skyAt(20 * 60 + 1, out)))).toBeLessThan(0.01);
  });

  it('is lighter indoors at night, always dim in caves, and greyer in the rain', () => {
    expect(brightness(skyAt(23 * 60, { ...out, kind: 'home' }))).toBeGreaterThan(brightness(skyAt(23 * 60, out)));
    expect(skyAt(12 * 60, { ...out, kind: 'cave' })).toBe(skyAt(0, { ...out, kind: 'cave' }));
    expect(brightness(skyAt(12 * 60, { ...out, rainy: true }))).toBeLessThan(1);
  });

  it('gives each season its own daylight outdoors', () => {
    expect(skyAt(12 * 60, { ...out, season: 'Winter' })).not.toBe(skyAt(12 * 60, out));
  });

  it('mixes colours channel by channel', () => {
    expect(mix(0x000000, 0xffffff, 0.5)).toBe(0x808080);
    expect(mix(0x102030, 0x102030, 0.3)).toBe(0x102030);
  });
});
