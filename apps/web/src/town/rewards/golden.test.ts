import { describe, expect, it } from 'vitest';
import { Area } from '../data/area';
import { hollowfern as pack } from '../data/test-pack';
import { TUNING } from '../data/tuning';
import { goldenSpot, openOn } from './golden';

const areas = new Map(pack.areas.map((a) => [a.id, new Area(a)]));

describe('golden dust', () => {
  it('knows which places Puff can reach on a day', () => {
    expect(openOn(pack.areas, 1).has('riverside')).toBe(false);
    expect(openOn(pack.areas, 3).has('bathhouse')).toBe(true);
    expect(openOn(pack.areas, 1).has('store')).toBe(false);
  });

  it('waits each day from goldenFromDay on a free, reachable spot, the same on every device', () => {
    expect(goldenSpot(TUNING.rewards.goldenFromDay - 1, pack.areas, areas)).toBeNull();
    const seen = new Set<string>();
    for (let day = TUNING.rewards.goldenFromDay; day < 40; day += 1) {
      const g = goldenSpot(day, pack.areas, areas)!;
      expect(g).toEqual(goldenSpot(day, pack.areas, areas));
      const a = areas.get(g.area)!;
      expect(openOn(pack.areas, day).has(g.area)).toBe(true);
      expect(a.walkable(g.x, g.y), `${day} ${g.area} ${g.x},${g.y}`).toBe(true);
      expect(a.doorAt(g.x, g.y)).toBeFalsy();
      expect(a.groundAt(g.x, g.y)).not.toBe('soil');
      seen.add(g.area);
    }
    expect(seen.size).toBeGreaterThan(4);
  });
});
