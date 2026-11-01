import { describe, expect, it } from 'vitest';
import { bannerMs } from './view';

describe('banners', () => {
  it('pop briefly when short, and stay long enough to read when long', () => {
    expect(bannerMs('+5 ✨')).toBe(1900);
    const line = '📖 Otto lent me his old rod. I caught a fish!';
    expect(bannerMs(line)).toBeGreaterThanOrEqual((line.length / 15) * 1000 + 1000);
  });
});
