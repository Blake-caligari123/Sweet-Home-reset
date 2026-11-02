import { describe, expect, it } from 'vitest';
import { collectHoney, hiveKey, overnightHoney } from './hives';

describe('beehives', () => {
  const placed = [{ item: 'beehive', area: 'yard', x: 3, y: 4 }, { item: 'beehive', area: 'square', x: 1, y: 1 }, { item: 'garden_chair', area: 'yard', x: 5, y: 5 }];
  it('make honey overnight, more beside flowers, up to three, none in winter', () => {
    let h = overnightHoney({}, placed, new Set(['yard']), 'Spring', 3);
    expect(h).toEqual({ [hiveKey('yard', 3, 4)]: 2, [hiveKey('square', 1, 1)]: 1 });
    h = overnightHoney(h, placed, new Set(['yard']), 'Spring', 3);
    expect(h[hiveKey('yard', 3, 4)]).toBe(3);
    expect(overnightHoney(h, placed, new Set(), 'Winter', 3)).toEqual(h);
    // A hive picked up stops counting.
    expect(Object.keys(overnightHoney(h, placed.slice(1), new Set(), 'Summer', 3))).toEqual([hiveKey('square', 1, 1)]);
  });

  it('gives up its honey when collected', () => {
    const r = collectHoney({ a: 3 }, 'a');
    expect(r).toEqual({ honey: 3, hives: { a: 0 } });
    expect(collectHoney({}, 'b').honey).toBe(0);
  });
});
