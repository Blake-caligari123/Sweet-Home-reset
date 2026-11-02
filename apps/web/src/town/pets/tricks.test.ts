import { describe, expect, it } from 'vitest';
import type { Pet } from './pets';
import { knownTricks, newTrick, pat, startWalk, walkTo } from './tricks';

const pet = (): Pet => ({ kind: 'cat', name: 'Mochi', day: 4 });

describe('pet tricks and walks', () => {
  it('learns tricks as the bond grows, a few pats a day counting', () => {
    const p = pet();
    expect(knownTricks(0).map((t) => t.id)).toEqual(['sit']);
    for (let i = 0; i < 5; i += 1) pat(p, 6, 3);
    expect(p.bond).toBe(3);
    expect(pat(p, 7, 3)).toBe(1);
    expect(newTrick(4, 5)?.id).toBe('spin'); expect(newTrick(5, 6)).toBeNull();
    expect(knownTricks(40)).toHaveLength(5);
  });

  it('walks three places together in a day, once a day', () => {
    const p = pet();
    expect(walkTo(p, 6, 'yard')).toBeNull(); // no walk yet
    expect(startWalk(p, 6)).toBe(true);
    expect(walkTo(p, 6, 'yard')).toEqual({ count: 1, finished: false });
    expect(walkTo(p, 6, 'yard')).toEqual({ count: 1, finished: false });
    walkTo(p, 6, 'square');
    expect(walkTo(p, 6, 'lane')).toEqual({ count: 3, finished: true });
    expect(startWalk(p, 6)).toBe(false);
    expect(startWalk(p, 7)).toBe(true);
  });
});
