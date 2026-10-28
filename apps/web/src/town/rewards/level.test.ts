import { describe, expect, it } from 'vitest';
import { TUNING } from '../data/tuning';
import { addXp, levelReward, xpToNext } from './level';

const R = TUNING.rewards;

describe("Puff's sparkle level", () => {
  it('needs a little more XP for each level', () => {
    expect(xpToNext(1)).toBe(R.levelXpBase);
    for (let l = 1; l < 20; l += 1) expect(xpToNext(l + 1)).toBeGreaterThanOrEqual(xpToNext(l));
  });

  it('carries spare XP over, and can pass several levels at once', () => {
    const r = addXp({ xp: 0, level: 1 }, xpToNext(1) + xpToNext(2) + 3);
    expect(r).toEqual({ xp: 3, level: 3, ups: [2, 3] });
    expect(addXp({ xp: 5, level: 2 }, 1)).toEqual({ xp: 6, level: 2, ups: [] });
  });

  it('gives Sparkles every level and more Fluff every few levels', () => {
    expect(levelReward(2).sparkles).toBeGreaterThan(0);
    const fluffLevels = [2, 3, 4, 5, 6].filter((l) => levelReward(l).fluffMax > 0);
    expect(fluffLevels).toEqual([2, 3, 4, 5, 6].filter((l) => l % R.levelFluffEvery === 0));
  });
});
