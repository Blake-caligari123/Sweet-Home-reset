import { describe, expect, it } from 'vitest';
import { TUNING } from '../data/tuning';
import { cleared, fade, NO_CHAIN } from './chain';

const R = TUNING.rewards;

describe('the sparkle chain', () => {
  it('gives Sparkles for every spot, and more as a quick chain grows', () => {
    let c = NO_CHAIN; const got: number[] = [];
    for (let i = 0; i < 30; i += 1) { const r = cleared(c); c = r.chain; got.push(r.sparkles); }
    expect(got[0]).toBe(R.sparklesPerClean);
    expect(c.count).toBe(30);
    expect(got[R.chainBonusEvery]).toBeGreaterThan(got[0]);
    expect(Math.max(...got)).toBe(R.sparklesPerClean + R.chainBonusMax);
    // Never fewer Sparkles as the chain grows.
    expect(got).toEqual([...got].sort((a, b) => a - b));
  });

  it('holds while Puff is busy walking or cleaning, and only fades while Puff stands about', () => {
    const c = cleared(NO_CHAIN).chain;
    expect(fade(c, R.chainWindowMs * 3, true).count).toBe(1);
    expect(fade(c, R.chainWindowMs, false).count).toBe(0);
  });

  it('fades gently when Puff stops, starting again from one', () => {
    let c = cleared(cleared(NO_CHAIN).chain).chain;
    c = fade(c, R.chainWindowMs - 1, false);
    expect(c.count).toBe(2);
    c = fade(c, 1, false);
    expect(c.count).toBe(0);
    expect(cleared(c).chain.count).toBe(1);
  });
});
