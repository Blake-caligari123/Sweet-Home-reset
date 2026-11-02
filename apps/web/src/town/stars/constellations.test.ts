import { describe, expect, it } from 'vitest';
import { CONSTELLATIONS, isNight, linesShown, tapStar, tonight } from './constellations';

describe('stargazing', () => {
  it('has a new constellation up each night until the season\'s are all seen', () => {
    const first = tonight(10, 'Spring', []);
    expect(first.seasons ?? ['Spring']).toContain('Spring');
    const seen = [first.id];
    const second = tonight(11, 'Spring', seen);
    expect(second.id).not.toBe(first.id);
    const all = CONSTELLATIONS.filter((c) => !c.seasons || c.seasons.includes('Spring')).map((c) => c.id);
    expect(all).toContain(tonight(12, 'Spring', all).id); // all seen: an old friend comes round again
  });

  it('joins the lines as both ends are found, and finishes on the last star', () => {
    const c = CONSTELLATIONS[0];
    let found: number[] = [];
    for (let i = 0; i < c.stars.length - 1; i += 1) found = tapStar(found, i, c).found;
    expect(linesShown(c, [0, 1]).length).toBe(1);
    expect(tapStar(found, found[0], c).done).toBe(false);
    expect(tapStar(found, c.stars.length - 1, c).done).toBe(true);
    for (const k of CONSTELLATIONS) for (const [a, b] of k.lines) { expect(k.stars[a], k.id).toBeDefined(); expect(k.stars[b], k.id).toBeDefined(); }
    expect(isNight(21 * 60)).toBe(true); expect(isNight(12 * 60)).toBe(false);
  });
});
