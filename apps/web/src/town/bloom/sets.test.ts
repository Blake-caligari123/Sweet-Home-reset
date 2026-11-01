import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { TownState } from '../state';
import { collectionSets, newlyComplete, setFlag } from './sets';

describe('collection sets', () => {
  it('counts each set toward whole, and cheers a finished one once', () => {
    const s = new TownState();
    const sets = collectionSets(s, pack);
    expect(sets.map((x) => x.id)).toEqual(['finds', 'critters', 'fish']);
    expect(sets.every((x) => x.have === 0 && x.total > 0)).toBe(true);
    s.fishLog = (pack.fish ?? []).map((f) => f.id);
    expect(newlyComplete(collectionSets(s, pack), (f) => s.has(f)).map((x) => x.id)).toEqual(['fish']);
    s.flag(setFlag('fish'));
    expect(newlyComplete(collectionSets(s, pack), (f) => s.has(f))).toEqual([]);
  });
});
