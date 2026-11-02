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

describe('light the lamps', () => {
  it('deals a board that its taps can solve, flips neighbours, and grows', async () => {
    const { allLit, dealLamps, lampStars, press } = await import('./lamps');
    expect(press([true, true, true, true, true, true, true, true, true], 3, 4)).toEqual([true, false, true, false, false, false, true, false, true]);
    expect(press(press(new Array(9).fill(true), 3, 0), 3, 0).every(Boolean)).toBe(true);
    for (let d = 1; d < 90; d += 3) {
      const b = dealLamps(d);
      expect(allLit(b.lit)).toBe(false);
      expect(b.size).toBe(d < 25 ? 3 : 4);
      // Brute force on 3×3: a solution in par taps or fewer exists.
      if (b.size === 3) {
        let found = false;
        for (let m = 0; m < 512 && !found; m += 1) {
          const taps = [...Array(9).keys()].filter((i) => m & (1 << i));
          if (taps.length > b.par) continue;
          found = allLit(taps.reduce((lit, i) => press(lit, 3, i), b.lit));
        }
        expect(found, `day ${d}`).toBe(true);
      }
    }
    expect(lampStars(3, 3)).toBe(3); expect(lampStars(6, 3)).toBe(2); expect(lampStars(9, 3)).toBe(1);
  });
});

describe('pour the tea', () => {
  it('fills over time, judges the line, spills past full', async () => {
    const { judge, levelAfter, lineFor, teaStars } = await import('./tea');
    expect(levelAfter(1700, 0)).toBeCloseTo(1); expect(levelAfter(600, 2)).toBeCloseTo(0.5);
    const line = lineFor(9, 1);
    expect(line).toBeGreaterThanOrEqual(0.55); expect(line).toBeLessThanOrEqual(0.9);
    expect(judge(line + 0.02, line)).toBe('perfect'); expect(judge(line - 0.08, line)).toBe('close'); expect(judge(1.05, 0.98)).toBe('off');
    expect(teaStars(['perfect', 'perfect', 'close'])).toBe(3); expect(teaStars(['close', 'close', 'close'])).toBe(2); expect(teaStars(['off', 'close', 'off'])).toBe(1);
  });
});

describe('echo the tune', () => {
  it('plays a tune with no note twice running, and hears it back', async () => {
    const { echo, echoStars, tune, LAST } = await import('./echo');
    const t = tune(9);
    expect(t).toHaveLength(LAST);
    for (let i = 1; i < t.length; i += 1) expect(t[i]).not.toBe(t[i - 1]);
    expect(echo(t, [t[0]], 3)).toBe('more');
    expect(echo(t, [t[0], t[1], t[2]], 3)).toBe('right');
    expect(echo(t, [(t[0] + 1) % 4], 3)).toBe('slip');
    expect(echoStars(0)).toBe(3); expect(echoStars(4)).toBe(1);
  });

  it('themes the shared games for the newcomers with real items', async () => {
    const { hollowfern: pack } = await import('../data/test-pack');
    const { STASH_ITEMS } = await import('./pairs');
    const { SEED_SET } = await import('./pantry');
    for (const id of [...STASH_ITEMS, ...SEED_SET.shelves.flatMap((s) => s.items)]) expect(pack.items[id]?.name, id).toBeTruthy();
    // Each seed is in the tin for a season it really grows in.
    for (const s of SEED_SET.shelves) for (const seed of s.items) {
      const crop = pack.crops!.find((c) => c.seed === seed)!;
      expect((crop.seasons ?? ['Spring']).map((x) => x.toLowerCase()), seed).toContain(s.id);
    }
  });
});
