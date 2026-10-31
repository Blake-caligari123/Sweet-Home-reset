import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { crittersHere, placeCritters, type CritterDef } from './critters';

const defs: CritterDef[] = [
  { id: 'ladybird', name: 'Ladybird', kind: 'beetle', areas: ['yard'], seasons: ['Spring'], time: 'day', hint: '' },
  { id: 'firefly', name: 'Firefly', kind: 'firefly', areas: ['yard'], time: 'night', hint: '' },
  { id: 'snail', name: 'Snail', kind: 'snail', areas: ['yard'], rain: true, hint: '' }
];

describe('critters', () => {
  it('come out by place, season, time of day and weather', () => {
    expect(crittersHere(defs, 'yard', 'Spring', 12 * 60, false).map((c) => c.id)).toEqual(['ladybird']);
    expect(crittersHere(defs, 'yard', 'Spring', 22 * 60, true).map((c) => c.id)).toEqual(['firefly', 'snail']);
    expect(crittersHere(defs, 'yard', 'Winter', 12 * 60, false)).toEqual([]);
    expect(crittersHere(defs, 'lane', 'Spring', 12 * 60, false)).toEqual([]);
  });

  it('sit in the same open spots all day, a few at a time', () => {
    const spots = [{ x: 1, y: 1 }, { x: 5, y: 3 }, { x: 9, y: 7 }];
    const a = placeCritters(defs, 4, 'yard', spots, 2);
    expect(a).toHaveLength(2);
    expect(placeCritters(defs, 4, 'yard', spots, 2)).toEqual(a);
    for (const c of a) expect(spots).toContainEqual(c.at);
  });

  it('gives Hollowfern critters for every season, and a hint for each', () => {
    for (const season of ['Spring', 'Summer', 'Autumn', 'Winter']) {
      const any = pack.areas.some((a) => crittersHere(pack.critters!, a.id, season, 12 * 60, false).length > 0);
      expect(any, season).toBe(true);
    }
    for (const c of pack.critters!) expect(c.hint.length, c.id).toBeGreaterThan(5);
  });
});
