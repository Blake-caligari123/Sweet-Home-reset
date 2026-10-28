import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { Area } from '../data/area';
import { T } from '../world/art/texture';
import { FEET, navFor, REACH } from '../world/nav';
import { Bag } from '../play/bag';
import { builtProps, canBuild, canUpgrade, resolveBuilds, startBuild, upgrade, withBuilds, type BuildingDef, type PlotDef, type PlotState } from './build';

const bench: BuildingDef = { id: 'bench', name: 'Bench', nights: 1, cost: { sparkles: 40 }, prop: { type: 'bench', w: 2 } };
const gazebo: BuildingDef = { id: 'gazebo', name: 'Gazebo', nights: 3, cost: { sparkles: 300 }, prop: { type: 'bench', w: 2 } };
const catalogue = [bench, gazebo];
const plot: PlotDef = { id: 'p1', name: 'By the fountain', area: 'square', x: 13, y: 13, w: 2, h: 1, allow: ['bench', 'gazebo'] };
const fresh = (sparkles = 100, bag = new Bag()) => ({ sparkles, plots: {} as Record<string, PlotState>, bag });

describe('building on plots', () => {
  it('starts a build, spending its cost all at once', () => {
    const s = fresh();
    expect(startBuild(s, plot, bench, 2)).toBe(true);
    expect(s.sparkles).toBe(60);
    expect(s.plots.p1).toEqual({ buildingId: 'bench', stage: 0, startedDay: 2, readyDay: 3 });
  });

  it('changes nothing when Puff is short, the plot is taken, or the building does not fit there', () => {
    const short = fresh(10);
    expect(canBuild(short, plot, bench)).toBe('short');
    expect(startBuild(short, plot, bench, 2)).toBe(false);
    expect(short).toEqual(fresh(10));
    const s = fresh(500);
    startBuild(s, plot, bench, 2);
    expect(canBuild(s, plot, bench)).toBe('taken');
    expect(canBuild(fresh(), { ...plot, allow: ['gazebo'] }, bench)).toBe('not_here');
  });

  it('finishes overnight, the same however the day ended, and never early', () => {
    const s = fresh(1000);
    startBuild(s, plot, bench, 2);
    startBuild(s, { ...plot, id: 'p2' }, gazebo, 2);
    expect(resolveBuilds(s.plots, catalogue, 2)).toEqual(['p1']);
    expect(s.plots.p1.stage).toBe(2);
    expect(s.plots.p2.stage).toBe(1); // a three-night build shows its frame
    expect(resolveBuilds(s.plots, catalogue, 3)).toEqual([]);
    expect(resolveBuilds(s.plots, catalogue, 4)).toEqual(['p2']);
    expect(resolveBuilds(s.plots, catalogue, 5)).toEqual([]); // done stays done
  });

  it('turns plots into props: scaffolding while building, then the building', () => {
    const s = fresh();
    startBuild(s, plot, bench, 2);
    expect(builtProps('square', [plot], s.plots, catalogue)).toEqual([{ type: 'scaffold', x: 13, y: 13, w: 2, h: 1 }]);
    resolveBuilds(s.plots, catalogue, 2);
    expect(builtProps('square', [plot], s.plots, catalogue)).toEqual([{ type: 'bench', x: 13, y: 13, w: 2, h: 1 }]);
    expect(builtProps('yard', [plot], s.plots, catalogue)).toEqual([]);
  });
});

describe('repairs', () => {
  const bridge: BuildingDef = { id: 'footbridge', name: 'Footbridge', nights: 2, cost: { sparkles: 100, items: { twig: 4, pebble: 2 } }, prop: { type: 'footbridge', walkable: true },
    paves: 'j', doors: [{ x: 1, y: 3, to: 'far_bank', toX: 1, toY: 1 }] };
  const spot: PlotDef = { id: 'fb', name: 'The footbridge', area: 'river', x: 1, y: 1, w: 1, h: 3, allow: ['footbridge'] };
  const river = { ...pack.areas[1], id: 'river', name: 'River', map: ['ggg', 'gwg', 'gwg', 'ghg'], legend: { g: 'grass', w: 'water', h: 'hedge', j: 'wood' } as const, spawn: { x: 0, y: 0 }, doors: [], mess: [],
    props: [{ type: 'bridge_broken', x: 1, y: 1, action: 'repair' }, { type: 'tree', x: 0, y: 3 }] };

  it('needs its materials as well as Sparkles, and takes them all at once', () => {
    const bag = new Bag(); bag.add('twig', 4); bag.add('pebble', 1);
    const s = fresh(500, bag);
    expect(canBuild(s, spot, bridge)).toBe('short');
    bag.add('pebble', 1);
    expect(startBuild(s, spot, bridge, 12)).toBe(true);
    expect([s.sparkles, bag.count('twig'), bag.count('pebble')]).toEqual([400, 0, 0]);
  });

  it('once mended, paves its plot, opens its way on, and clears what stood there broken', () => {
    const s = fresh(500); s.bag.add('twig', 4); s.bag.add('pebble', 2);
    startBuild(s, spot, bridge, 12);
    expect(withBuilds(river, [spot], s.plots, [bridge]).props.map((p) => p.type)).toEqual(['tree', 'scaffold']);
    resolveBuilds(s.plots, [bridge], 13);
    const fixed = withBuilds(river, [spot], s.plots, [bridge]);
    expect(fixed.map).toEqual(['ggg', 'gjg', 'gjg', 'gjg']);
    expect(fixed.doors.map((d) => d.to)).toEqual(['far_bank']);
    expect(fixed.props).toEqual([{ type: 'tree', x: 0, y: 3 }, { type: 'footbridge', x: 1, y: 1, w: 1, h: 3, walkable: true }]);
    expect(river.map[1]).toBe('gwg'); // the pack itself is untouched
  });
});

describe('upgrades', () => {
  const cosy: BuildingDef = { id: 'bench_cosy', name: 'Cosy bench', nights: 1, cost: { sparkles: 80 }, prop: { type: 'bench_cosy', w: 2 }, upgradeOf: 'bench' };
  it('turns a finished building into its upgrade overnight, paid up front, all or nothing', () => {
    const s = fresh(200);
    startBuild(s, plot, bench, 2);
    expect(canUpgrade(s, plot, cosy)).toBe('not_yet'); // still being built
    resolveBuilds(s.plots, [bench, cosy], 2);
    expect(canUpgrade(s, plot, cosy)).toBe('ok');
    expect(upgrade(s, plot, cosy, 3)).toBe(true);
    expect(s.sparkles).toBe(80);
    expect(s.plots.p1).toEqual({ buildingId: 'bench_cosy', stage: 0, startedDay: 3, readyDay: 4 });
    resolveBuilds(s.plots, [bench, cosy], 3);
    expect(builtProps('square', [plot], s.plots, [bench, cosy])[0].type).toBe('bench_cosy');
    expect(canUpgrade(fresh(5), plot, cosy)).toBe('not_yet');
  });
});

describe('Hollowfern plots', () => {
  const plots = pack.plots ?? [];
  const buildings = pack.buildings ?? [];

  it('mends the footbridge on day 12 with twigs, pebbles and copper, opening the far bank', () => {
    const fb = plots.find((p) => p.id === 'plot_footbridge')!;
    const b = buildings.find((d) => d.id === 'footbridge')!;
    expect(fb.unlock).toBe('footbridge');
    expect(Object.keys(b.cost.items ?? {}).sort()).toEqual(['ore_copper', 'pebble', 'twig']);
    expect(b.doors?.every((d) => d.to === 'far_bank')).toBe(true);
    expect(pack.areas.some((a) => a.id === 'far_bank')).toBe(true);
  });

  it('has a bench plot by the fountain to start, and fitting buildings for every plot', () => {
    expect(plots.find((p) => p.id === 'plot_square_fountain')?.allow).toContain('bench');
    for (const p of plots) for (const b of p.allow) expect(buildings.some((d) => d.id === b), `${p.id}: ${b}`).toBe(true);
  });

  it('keeps every door, mess spot and usable prop reachable with everything built', () => {
    const plotState = Object.fromEntries(plots.map((p) => [p.id, { buildingId: p.allow[0], stage: 2, startedDay: 1, readyDay: 2 }]));
    for (const a of pack.areas.filter((x) => plots.some((p) => p.area === x.id))) {
      const area = new Area(withBuilds(a, plots, plotState, buildings)); const nav = navFor(area);
      const spawn = nav.nearestOpen({ x: a.spawn.x * T + T / 2, y: a.spawn.y * T + FEET })!;
      const tile = (x: number, y: number, w = 1, h = 1) => ({ x0: x * T, y0: y * T, x1: (x + w) * T, y1: (y + h) * T });
      for (const d of area.pack.doors.filter((d) => !d.closedText)) expect(nav.findPathNear(spawn, tile(d.x, d.y), 0), `${a.id} → ${d.to}`).not.toBeNull();
      for (const m of area.spots) expect(nav.findPathNear(spawn, tile(m.x, m.y), REACH), `${a.id} ${m.type} at ${m.x},${m.y}`).not.toBeNull();
      for (const p of area.pack.props.filter((p) => p.action)) expect(nav.findPathNear(spawn, tile(p.x, p.y, p.w, p.h), REACH), `${a.id} ${p.type}`).not.toBeNull();
    }
  });
});
