import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { Area } from '../data/area';
import { FEET, navFor, type NavGrid } from '../world/nav';
import { firstDoor, Neighbours, stopAt, type NeighbourDef } from './neighbours';

const T = 16;
const navs = new Map<string, NavGrid>();
const navOf = (id: string) => {
  const a = pack.areas.find((x) => x.id === id);
  if (!a) return null;
  if (!navs.has(id)) navs.set(id, navFor(new Area(a)));
  return navs.get(id)!;
};

/** A visitor who lives offstage, pops into the bakery 15:00–16:00, and walks round inside it. */
const pip: NeighbourDef = {
  id: 'pip', name: 'Pip', species: 'mouse', colours: { fur: '#C9C2BD', belly: '#F6E8DA', accent: '#F4C2A8' },
  loves: ['button'], likes: [], dislikes: [],
  schedule: [
    { at: 360, area: 'lane', x: 0, y: 0 },
    { at: 900, area: 'bakery', x: 14, y: 11 },
    { at: 930, area: 'bakery', x: 4, y: 12 },
    { at: 960, area: 'lane', x: 0, y: 0 }
  ]
};
const sim = () => new Neighbours([pip], pack.areas, navOf, 2.5);
const run = (n: Neighbours, minutes: number, view: string, ms: number) => { for (let t = 0; t < ms; t += 50) n.update(minutes, view, 50); };

describe('neighbour schedules', () => {
  it('picks the latest stop that has started, and last night’s stop before the first', () => {
    expect(stopAt(pip.schedule, 360)).toBe(0);
    expect(stopAt(pip.schedule, 915)).toBe(1);
    expect(stopAt(pip.schedule, 1500)).toBe(3);
    expect(stopAt(pip.schedule, 100)).toBe(3);
  });

  it('finds the door toward another area, including unbuilt areas behind a door', () => {
    expect(firstDoor(pack.areas, 'bakery', 'square')).toMatchObject({ to: 'square' });
    expect(firstDoor(pack.areas, 'burrow', 'bakery')).toMatchObject({ to: 'yard' });
    expect(firstDoor(pack.areas, 'square', 'lane')).toMatchObject({ to: 'lane' });
    expect(firstDoor(pack.areas, 'bakery', 'lane')).toMatchObject({ to: 'square' });
    expect(firstDoor(pack.areas, 'bakery', 'nowhere')).toBeNull();
    expect(firstDoor(pack.areas, 'bakery', 'bakery')).toBeNull();
  });
});

describe('neighbours in the world', () => {
  it('stand at their stop when Puff arrives, and are only seen in their own area', () => {
    const n = sim();
    n.place(910);
    expect(n.visible('bakery').map((s) => s.id)).toEqual(['pip']);
    expect(n.visible('square')).toEqual([]);
    const s = n.visible('bakery')[0];
    expect(Math.floor(s.fx / T)).toBe(14);
    expect(navOf('bakery')!.openAt(s.fx, s.fy)).toBe(true);
  });

  it('walk to their next stop in the same area instead of jumping', () => {
    const n = sim();
    n.place(910);
    n.update(930, 'bakery', 16);
    const s = n.visible('bakery')[0];
    expect(s.pose).toBe('walk');
    expect(Math.floor(s.fx / T)).toBeGreaterThan(4);
    run(n, 930, 'bakery', 20000);
    expect(Math.floor(s.fx / T)).toBe(4);
    expect(s.pose).toBe('idle');
  });

  it('walk out through the door when their next stop is elsewhere, then leave the area', () => {
    const n = sim();
    n.place(940);
    n.update(960, 'bakery', 16);
    expect(n.visible('bakery')).toHaveLength(1);
    run(n, 960, 'bakery', 20000);
    expect(n.visible('bakery')).toEqual([]);
    expect(n.states.get('pip')!.area).toBe('lane');
  });

  it('come in through the right door when their next stop is where Puff is', () => {
    const n = sim();
    n.place(800);
    n.update(900, 'bakery', 16);
    const s = n.visible('bakery')[0];
    expect(s).toBeDefined();
    expect(Math.floor(s.fy / T)).toBeGreaterThanOrEqual(12); // at the doormat end, walking in
    run(n, 900, 'bakery', 20000);
    expect(Math.floor(s.fx / T)).toBe(14);
  });

  it('walk across an area they pass through', () => {
    const route: NeighbourDef = { ...pip, id: 'bea', schedule: [{ at: 360, area: 'lane', x: 0, y: 0 }, { at: 900, area: 'bakery', x: 14, y: 11 }] };
    const m = new Neighbours([route], pack.areas, navOf, 2.5);
    m.place(800);
    m.update(900, 'square', 16);
    const s = m.visible('square')[0];
    expect(s?.pose).toBe('walk'); // in at the lane gate, heading for the bakery door
    run(m, 900, 'square', 30000);
    expect(m.visible('square')).toEqual([]);
    expect(m.states.get('bea')!.area).toBe('bakery');
  });

  it('stop and wait while Puff talks to them', () => {
    const n = sim();
    n.place(910);
    n.hold('pip');
    run(n, 930, 'bakery', 3000);
    const s = n.visible('bakery')[0];
    expect(Math.floor(s.fx / T)).toBe(14);
    n.releaseAll();
    n.update(930, 'bakery', 16);
    expect(s.pose).toBe('walk');
  });
});

describe('Hollowfern neighbours', () => {
  it('every stop in a built area is open floor reachable from the area spawn', () => {
    expect(pack.neighbours?.length).toBeGreaterThanOrEqual(3);
    for (const d of pack.neighbours ?? []) {
      for (const s of d.schedule) {
        const nav = navOf(s.area);
        if (!nav) continue;
        const a = pack.areas.find((x) => x.id === s.area)!;
        const spot = nav.nearestOpen({ x: s.x * T + T / 2, y: s.y * T + FEET })!;
        expect(Math.hypot(spot.x - (s.x * T + T / 2), spot.y - (s.y * T + FEET)), `${d.id} at ${s.area} ${s.x},${s.y}`).toBeLessThan(T);
        const from = nav.nearestOpen({ x: a.spawn.x * T + T / 2, y: a.spawn.y * T + FEET })!;
        expect(nav.findPathTo(from, spot), `${d.id} reach ${s.area} ${s.x},${s.y}`).not.toBeNull();
      }
      expect(d.schedule.map((s) => s.at)).toEqual([...d.schedule.map((s) => s.at)].sort((x, y) => x - y));
    }
  });

  it('Hazel keeps her routine: bakes from 6, shop from 11, asleep in a chair by 21', () => {
    const hazel = pack.neighbours!.find((d) => d.id === 'hazel')!;
    const at = (m: number) => hazel.schedule[stopAt(hazel.schedule, m)];
    expect(at(6 * 60)).toMatchObject({ area: 'bakery' });
    expect(at(12 * 60).area).toBe('bakery');
    expect(at(21 * 60)).toMatchObject({ area: 'bakery', sleep: true });
  });
});
