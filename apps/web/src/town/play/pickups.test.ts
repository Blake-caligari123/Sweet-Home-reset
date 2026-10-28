import { describe, expect, it } from 'vitest';
import { Area } from '../data/area';
import { hollowfern as pack } from '../data/test-pack';
import { FEET, navFor, REACH } from '../world/nav';
import { available, take, type Taken } from './pickups';

const T = 16;
const snack = { id: 'burrow_biscuit', x: 20, y: 5, item: 'biscuit' };

describe('pickups', () => {
  it('can be taken once a day and are back the next morning', () => {
    let taken: Taken = { day: 1, ids: [] };
    expect(available([snack], taken, 1)).toEqual([snack]);
    taken = take(taken, snack.id, 1);
    expect(available([snack], taken, 1)).toEqual([]);
    expect(available([snack], taken, 2)).toEqual([snack]);
    expect(take(taken, snack.id, 2)).toEqual({ day: 2, ids: [snack.id] });
  });
});

describe('Hollowfern pickups', () => {
  it('has a snack on the burrow kitchen counter, within Puff\'s reach from the bed', () => {
    const burrow = pack.areas.find((a) => a.id === 'burrow')!;
    const p = burrow.pickups?.find((x) => pack.items[x.item]?.snack);
    expect(p).toBeDefined();
    const area = new Area(burrow); const nav = navFor(area);
    expect(area.propAt(p!.x, p!.y)?.type).toBe('counter');
    const from = nav.nearestOpen({ x: burrow.spawn.x * T + T / 2, y: burrow.spawn.y * T + FEET })!;
    expect(nav.findPathNear(from, { x0: p!.x * T, y0: p!.y * T, x1: (p!.x + 1) * T, y1: (p!.y + 1) * T }, REACH)).not.toBeNull();
  });
});
