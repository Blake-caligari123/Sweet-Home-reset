import { describe, expect, it } from 'vitest';
import { allMatched, dealPairs, flipBack, newPairs, pairStars, turn } from './pairs';
import { basket, pantryStars, shelfOf, SHELVES } from './pantry';
import { markerAt, skipsFor, skipStars, sweetSpot } from './skip';

describe('garden pairs', () => {
  it('deals pairs, keeps matches up, flips misses back, and finishes', () => {
    const cards = dealPairs(5);
    expect(cards).toHaveLength(12); expect(dealPairs(40)).toHaveLength(16);
    let s = newPairs(cards);
    const a = 0; const b = cards.indexOf(cards[0], 1); const other = cards.findIndex((c) => c !== cards[0]);
    s = turn(s, a).state;
    const miss = turn(s, other); expect(miss.result).toBe('miss'); expect(turn(miss.state, b).result).toBe('none'); // two up: wait
    s = flipBack(miss.state);
    s = turn(s, a).state; const hit = turn(s, b); expect(hit.result).toBe('match'); s = hit.state;
    for (let i = 0; i < cards.length; i += 1) {
      if (s.matched[i]) continue;
      const j = cards.findIndex((c, k) => k !== i && c === cards[i]);
      s = turn(turn(s, i).state, j).state;
    }
    expect(allMatched(s)).toBe(true); expect(s.misses).toBe(1);
    expect(pairStars(1, 6)).toBe(3); expect(pairStars(8, 6)).toBe(2); expect(pairStars(20, 6)).toBe(1);
  });
});

describe('sort the pantry', () => {
  it('fills a basket from all three shelves, never the same thing twice running', () => {
    const b = basket(7);
    expect(b).toHaveLength(12); expect(basket(31)).toHaveLength(16);
    for (let i = 1; i < b.length; i += 1) expect(b[i]).not.toBe(b[i - 1]);
    for (const it of b) expect(SHELVES).toContain(shelfOf(it));
    expect(pantryStars(0)).toBe(3); expect(pantryStars(2)).toBe(2); expect(pantryStars(5)).toBe(1);
  });
});

describe('skip stones', () => {
  it('swings the marker, scores the sweet spot best, and always skips once', () => {
    expect(markerAt(0, 0)).toBeCloseTo(0); expect(markerAt(700, 0)).toBeCloseTo(1);
    const sweet = sweetSpot(4, 0);
    expect(sweet).toBeGreaterThanOrEqual(0.25); expect(sweet).toBeLessThanOrEqual(0.75);
    expect(skipsFor(sweet, sweet)).toBe(9); expect(skipsFor(sweet + 0.1, sweet)).toBe(6); expect(skipsFor(0, 0.9)).toBe(1);
    expect(skipStars(9)).toBe(3); expect(skipStars(5)).toBe(2); expect(skipStars(2)).toBe(1);
  });
});

describe('who plays what', () => {
  it('gives each game to a real neighbour, using items with names in the pack', async () => {
    const { hollowfern: pack } = await import('../data/test-pack');
    const { GAMES } = await import('./minigame-buttons');
    const { PAIR_ITEMS } = await import('./pairs');
    const { PANTRY } = await import('./pantry');
    for (const g of GAMES) expect(pack.neighbours!.some((n) => n.id === g.who), g.id).toBe(true);
    for (const id of [...PAIR_ITEMS, ...Object.values(PANTRY).flat()]) expect(pack.items[id]?.name, id).toBeTruthy();
  });
});
