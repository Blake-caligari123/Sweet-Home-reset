import { describe, expect, it } from 'vitest';
import type { AreaPack } from '../data/area';
import { freshDay, gatherYield, natureKey, NEW_NATURE, regrow, regrowth, withNature } from './nature';

const O = { stumpDays: 3, regrowDays: 6 };
const pack = { id: 'woodland', kind: 'outdoor', props: [{ type: 'tree', x: 2, y: 1, w: 2, h: 2 }, { type: 'bush', x: 6, y: 6 }, { type: 'bench', x: 9, y: 9, w: 2 }, { type: 'sign', x: 1, y: 1, action: 'sign' }] } as unknown as AreaPack;

describe('the cosy outdoors', () => {
  it('gives trees, bushes and benches something to do, outdoors only', () => {
    const p = withNature(pack, NEW_NATURE, 5, O).props;
    expect(p.map((x) => x.action)).toEqual(['tree', 'bush', 'sit', 'sign']);
    const home = { ...pack, kind: 'home' } as AreaPack;
    expect(withNature(home, NEW_NATURE, 5, O)).toBe(home);
  });

  it('follows the seasons, and always gives something', () => {
    expect(Object.keys(gatherYield('fruit_tree', 'Autumn', 3, 'a'))).toEqual(['apple']);
    expect(Object.keys(gatherYield('bush', 'Summer', 3, 'a'))).toEqual(['berries']);
    expect(Object.keys(gatherYield('bush', 'Autumn', 3, 'a'))).toEqual(['mushroom']);
    for (let d = 1; d < 30; d += 1) expect(gatherYield('tree', 'Spring', d, 'k').twig).toBeGreaterThanOrEqual(1);
    expect(gatherYield('tree', 'Autumn', 4, 'k').acorn).toBe(1);
    expect(freshDay({ ...NEW_NATURE, day: 3, gathered: ['x'] }, 4).gathered).toEqual([]);
  });

  it('a felled tree is a stump, then a sapling, then a tree again', () => {
    const key = natureKey('woodland', 2, 1);
    const s = { ...NEW_NATURE, felled: { [key]: 10 } };
    expect([10, 12, 13, 15, 16].map((d) => regrowth(s.felled[key], d, O))).toEqual(['stump', 'stump', 'sapling', 'sapling', 'tree']);
    expect(withNature(pack, s, 11, O).props[0]).toMatchObject({ type: 'stump', action: 'stump' });
    expect(withNature(pack, s, 14, O).props[0]).toMatchObject({ type: 'sapling' });
    expect(regrow(s, 16, O).felled).toEqual({});
    expect(regrow(s, 12, O).felled).toEqual(s.felled);
  });
});
