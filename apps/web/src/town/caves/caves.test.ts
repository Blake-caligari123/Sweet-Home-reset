import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { Area } from '../data/area';
import { navFor, FEET, REACH } from '../world/nav';
import { T } from '../world/art/texture';
import { mineRock, regrow, rocksStanding, withRocks, type CaveState, type RockDef } from './caves';

const rocks: RockDef[] = [{ id: 'r1', x: 3, y: 3, size: 'small', drop: { shard_colour: 1 } }, { id: 'r2', x: 5, y: 3, size: 'large', drop: { ore_copper: 2 } }];
const fresh = (): CaveState => ({ mined: [], resetDay: 0 });

describe('caves', () => {
  it('a broken rock is gone until its week is up, then every rock is back', () => {
    const c = fresh();
    expect(rocksStanding(rocks, c).map((r) => r.id)).toEqual(['r1', 'r2']);
    expect(mineRock(c, rocks[0], 10)).toEqual({ shard_colour: 1 });
    expect(rocksStanding(rocks, c).map((r) => r.id)).toEqual(['r2']);
    expect(c.resetDay).toBe(17);
    mineRock(c, rocks[1], 12);
    expect(c.resetDay).toBe(17); // the week started with the first rock
    regrow(c, 16); expect(rocksStanding(rocks, c)).toHaveLength(0);
    regrow(c, 17); expect(rocksStanding(rocks, c)).toHaveLength(2);
    expect(mineRock(c, rocks[0], 17)).toEqual({ shard_colour: 1 });
    expect(mineRock(c, rocks[0], 17)).toBeNull(); // already broken
  });

  it('rocks stand as props Puff can mine', () => {
    const p = withRocks(pack.areas.find((a) => a.id === 'cave_1')!, rocks, { mined: ['r2'], resetDay: 20 });
    expect(p.props.filter((q) => q.action === 'mine').map((q) => [q.x, q.y])).toEqual([[3, 3]]);
  });

  it('floor 1 is open to walk, every rock and the way up reachable, with fixed drops', () => {
    const cave = pack.areas.find((a) => a.id === 'cave_1')!;
    const defs = cave.rocks ?? [];
    expect(defs.length).toBeGreaterThanOrEqual(6);
    const area = new Area(withRocks(cave, defs, fresh()));
    const nav = navFor(area);
    const spawn = nav.nearestOpen({ x: cave.spawn.x * T + T / 2, y: cave.spawn.y * T + FEET })!;
    const tile = (x: number, y: number) => ({ x0: x * T, y0: y * T, x1: (x + 1) * T, y1: (y + 1) * T });
    for (const r of defs) {
      expect(nav.findPathNear(spawn, tile(r.x, r.y), REACH), r.id).not.toBeNull();
      for (const id of Object.keys(r.drop)) expect(pack.items[id], id).toBeTruthy();
    }
    for (const d of cave.doors) expect(nav.findPathNear(spawn, tile(d.x, d.y), 0)).not.toBeNull();
  });
});
