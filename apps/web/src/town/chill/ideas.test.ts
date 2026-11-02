import { describe, expect, it } from 'vitest';
import { ideas, type IdeaFacts } from './ideas';

const quiet: IdeaFacts = { night: false, telescope: false, cartToday: false, rod: false, bait: false, thirsty: 0, ready: 0, honey: 0, gathered: 0, axe: false, games: [], goalsLeft: 0, happening: null, tired: false };

describe('things to do', () => {
  it('always has something cosy, even with nothing on', () => {
    expect(ideas(quiet).length).toBeGreaterThanOrEqual(2);
    expect(ideas(quiet).at(-1)).toMatch(/bench/);
  });

  it('puts what\'s ready now first, and fits the time of day', () => {
    const busy = ideas({ ...quiet, ready: 2, honey: 1, rod: true, bait: true, games: [{ name: 'Bea', game: 'Garden pairs', where: 'Bea\'s flower shop' }], cartToday: true });
    expect(busy[0]).toMatch(/Wandering Cart/);
    expect(busy[1]).toMatch(/2 crops are ready/);
    expect(busy.some((l) => l.includes('Garden pairs with Bea (at Bea\'s flower shop)'))).toBe(true);
    const night = ideas({ ...quiet, night: true, telescope: true, axe: true });
    expect(night[0]).toMatch(/stars are up/);
    expect(night.some((l) => l.includes('Chop'))).toBe(false);
  });
});
