import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { isLocked, plusFromUrl } from './plus';

describe('the Plus stub (M2)', () => {
  it('unlocks everything in test builds, and shows the free game with ?plus=0', () => {
    expect(plusFromUrl('')).toBe(true);
    expect(plusFromUrl('?debug')).toBe(true);
    expect(plusFromUrl('?debug&plus=0')).toBe(false);
  });

  it('locks only Otto, Moss and Mabel without Plus', () => {
    const locked = (plus: boolean) => pack.neighbours!.filter((n) => isLocked(n, plus)).map((n) => n.id);
    expect(locked(true)).toEqual([]);
    expect(locked(false).sort()).toEqual(['mabel', 'moss', 'otto']);
  });
});
