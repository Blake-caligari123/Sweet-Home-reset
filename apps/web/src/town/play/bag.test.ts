import { describe, expect, it } from 'vitest';
import { Bag } from './bag';
import { TUNING } from '../data/tuning';

describe('bag', () => {
  it('starts with the tuning slot count and stacks items', () => {
    const b = new Bag();
    expect(b.slots).toHaveLength(TUNING.bagSlotsStart);
    b.add('sock'); b.add('sock'); b.add('radish_seeds', 3);
    expect(b.count('sock')).toBe(2);
    expect(b.slots.filter(Boolean)).toHaveLength(2);
  });

  it('refuses when full and removes cleanly', () => {
    const b = new Bag([null]);
    expect(b.add('a', 99)).toBe(true);
    expect(b.add('b')).toBe(false);
    expect(b.remove('a', 99)).toBe(true);
    expect(b.slots[0]).toBeNull();
    expect(b.remove('a')).toBe(false);
  });
});

describe('tidying the bag', () => {
  it('merges stacks, groups like with like, and gathers the gaps at the end', () => {
    const b = new Bag([{ id: 'pebble', count: 3 }, null, { id: 'apple', count: 2 }, { id: 'pebble', count: 4 }, null, { id: 'radish_seeds', count: 5 }]);
    const rank = (id: string) => ({ radish_seeds: 1, apple: 2, pebble: 5 } as Record<string, number>)[id] ?? 9;
    b.tidy(rank);
    expect(b.slots).toEqual([{ id: 'radish_seeds', count: 5 }, { id: 'apple', count: 2 }, { id: 'pebble', count: 7 }, null, null, null]);
    expect(b.count('pebble')).toBe(7);
  });
});
