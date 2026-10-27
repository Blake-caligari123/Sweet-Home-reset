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
