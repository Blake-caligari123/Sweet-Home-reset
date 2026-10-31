import { describe, expect, it } from 'vitest';
import { Area } from '../data/area';
import { hollowfern as pack } from '../data/test-pack';
import { canPlace, withDecor, type DecorItems, type Placed } from './decor';

const yard = pack.areas.find((a) => a.id === 'yard')!;
const items: DecorItems = { flower_pot: { decor: { prop: 'plant' } }, stone_path: { decor: { ground: 'path' } } };

describe('decor', () => {
  it('puts props and path tiles into an area', () => {
    const placed: Placed[] = [{ area: 'yard', x: 12, y: 8, item: 'flower_pot' }, { area: 'yard', x: 13, y: 8, item: 'stone_path' }, { area: 'square', x: 5, y: 5, item: 'flower_pot' }];
    const a = new Area(withDecor(yard, placed, items));
    expect(a.pack.props.some((p) => p.type === 'plant' && p.x === 12 && p.y === 8 && p.action === 'decor')).toBe(true);
    expect(a.walkable(12, 8)).toBe(false);
    expect(a.groundAt(13, 8)).toBe('path');
    expect(a.pack.props.filter((p) => p.action === 'decor')).toHaveLength(1);
  });

  it('only goes on open ground, never on a door, prop, plot or another piece', () => {
    const here: Placed[] = [{ area: 'yard', x: 12, y: 8, item: 'flower_pot' }];
    expect(canPlace(yard, here, items, { x: 11, y: 8, item: 'flower_pot' }, [])).toBe('ok');
    expect(canPlace(yard, here, items, { x: 12, y: 8, item: 'flower_pot' }, [])).toBe('taken');
    expect(canPlace(yard, here, items, { x: 0, y: 0, item: 'flower_pot' }, [])).toBe('blocked'); // hedge
    expect(canPlace(yard, here, items, { x: 12, y: 5, item: 'flower_pot' }, [])).toBe('blocked'); // the burrow door
    expect(canPlace(yard, here, items, { x: 11, y: 8, item: 'flower_pot' }, [{ x: 11, y: 8, w: 1, h: 1 }])).toBe('taken'); // a plot
  });

  it('goes in the burrow too, never in the way of the bed, the basket or the kitchen', () => {
    const burrow = pack.areas.find((a) => a.id === 'burrow')!;
    expect(burrow.decorate).toBe(true);
    expect(canPlace(burrow, [], items, { x: 4, y: 10, item: 'flower_pot' }, [])).toBe('ok');
    expect(canPlace(burrow, [], items, { x: 3, y: 5, item: 'flower_pot' }, [])).toBe('blocked'); // the bed
    expect(canPlace(burrow, [], items, { x: 13, y: 14, item: 'flower_pot' }, [])).toBe('blocked'); // the door out
    expect(canPlace(burrow, [], items, { x: 13, y: 13, item: 'flower_pot' }, [])).toBe('cuts_off'); // the way to it
    // The one gap between the bedroom and the living room can't be filled.
    const gap = [9, 10, 11, 12].find((y) => burrow.map[y][9] === '.');
    if (gap !== undefined) expect(canPlace(burrow, [], items, { x: 9, y: gap, item: 'flower_pot' }, [])).toBe('cuts_off');
  });

  it('never blocks the way to a door, a usable thing or a pickup', () => {
    // A wall of flower pots across the yard's path to the gate would cut it off: the last one is refused.
    const gate = yard.doors.find((d) => d.to !== 'burrow')!;
    const wall: Placed[] = [];
    let refused = false;
    for (let y = 1; y < 17 && !refused; y += 1) {
      const p = { area: 'yard', x: gate.x - 3, y, item: 'flower_pot' };
      const r = canPlace(yard, wall, items, p, []);
      if (r === 'ok') wall.push(p); else if (r === 'cuts_off') refused = true;
    }
    expect(refused).toBe(true);
    // Path tiles never block anything.
    expect(canPlace(yard, wall, items, { x: 11, y: 8, item: 'stone_path' }, [])).toBe('ok');
  });

  it('has decor to buy or make at Pip\'s bench, each a prop or a ground tile', () => {
    const decor = Object.entries(pack.items).filter(([, v]) => v.decor);
    expect(decor.length).toBeGreaterThanOrEqual(4);
    const sold = (pack.shops ?? []).flatMap((s) => s.stock.map((e) => e.item));
    const made = (pack.recipes ?? []).flatMap((r) => ('item' in r.makes ? [r.makes.item] : []));
    for (const [id] of decor) expect([...sold, ...made], id).toContain(id);
  });
});
