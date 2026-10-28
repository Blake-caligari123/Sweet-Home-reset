import { describe, expect, it } from 'vitest';
import { Area } from '../data/area';
import { hollowfern as pack } from '../data/test-pack';
import type { NeighbourState } from '../neighbours/neighbours';
import { Bag } from './bag';
import { AreaMess } from './mess';
import { distTo, FEET_TO_BASE, neighbourAt, rectOf, targetAt, type Here } from './targets';

const burrow = new Area(pack.areas.find((a) => a.id === 'burrow')!);
const here = (spots: ConstructorParameters<typeof AreaMess>[2] = [], bag = new Bag()): Here => ({
  area: burrow, mess: new AreaMess(burrow.w, burrow.h, spots, false), pickups: burrow.pack.pickups ?? [], bag
});

describe('what a tap lands on', () => {
  it('finds mess, doors, furniture and the snack on the counter', () => {
    expect(targetAt(here([{ type: 'dust', x: 10, y: 8 }]), 10, 8).kind).toBe('mess');
    expect(targetAt(here(), 13, 14).kind).toBe('door');
    expect(targetAt(here(), 3, 5)).toMatchObject({ kind: 'prop', action: 'sleep' });
    // The biscuit is drawn a tile above the counter it sits on.
    expect(targetAt(here(), 20, 4)).toMatchObject({ kind: 'pickup', id: 'burrow_biscuit', y: 5 });
    expect(targetAt(here(), 10, 9).kind).toBe('walk');
  });

  it('puts a carried item away before dusting the furniture it belongs on', () => {
    const dusty = [{ type: 'dust' as const, x: 7, y: 5 }];
    expect(targetAt(here(dusty), 7, 5).kind).toBe('mess');
    const bag = new Bag(); bag.add('sock');
    expect(targetAt(here(dusty, bag), 7, 5)).toMatchObject({ kind: 'prop', action: 'putaway' });
  });

  it('measures reach to the whole prop, not just the tapped tile', () => {
    const bed = rectOf({ kind: 'prop', x: 3, y: 5, action: 'sleep' }, burrow);
    expect(distTo(bed, { x: bed.x0 + 1, y: bed.y0 + 1 })).toBe(0);
    expect(distTo(bed, { x: bed.x1 + 3, y: bed.y0 })).toBe(3);
  });

  it('picks a neighbour by where their sprite is drawn', () => {
    const n = { id: 'hazel', fx: 100, fy: 100 } as NeighbourState;
    expect(neighbourAt([n], 100, 100 + FEET_TO_BASE - 10)).toMatchObject({ kind: 'neighbour', id: 'hazel' });
    expect(neighbourAt([n], 130, 100)).toBeNull();
  });
});
