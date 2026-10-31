import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { Area } from '../data/area';
import { T } from '../world/art/texture';
import { FEET, navFor, REACH } from '../world/nav';
import { Bag } from '../play/bag';
import { TUNING } from '../data/tuning';
import { buildQuestion, builtProps, canBuild, canUpgrade, nearWater, resolveBuilds, startBuild, upgrade, withBuilds, type BuildingDef, type PlotDef, type PlotState } from './build';

const bench: BuildingDef = { id: 'bench', name: 'Bench', nights: 1, cost: { sparkles: 40 }, prop: { type: 'bench', w: 2 } };
const gazebo: BuildingDef = { id: 'gazebo', name: 'Gazebo', nights: 3, cost: { sparkles: 300 }, prop: { type: 'bench', w: 2 } };
const catalogue = [bench, gazebo];
const plot: PlotDef = { id: 'p1', name: 'By the fountain', area: 'square', x: 13, y: 13, w: 2, h: 1, allow: ['bench', 'gazebo'] };
const fresh = (sparkles = 100, bag = new Bag()) => ({ sparkles, plots: {} as Record<string, PlotState>, bag });

describe('building on plots', () => {
  it('lets the town fund pay first for a big project, and never for small things', () => {
    const big = { ...gazebo, project: true };
    const s = { ...fresh(100), fund: 250 };
    expect(canBuild(s, plot, big)).toBe('ok');
    startBuild(s, plot, big, 2);
    expect([s.fund, s.sparkles]).toEqual([0, 50]);
    const small = { ...fresh(10), fund: 250 };
    expect(canBuild(small, plot, bench)).toBe('short');
  });

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

  it('opens a way that was closed: the mended door replaces the closed one on its tile', () => {
    const steps: BuildingDef = { ...bridge, paves: undefined, doors: [{ x: 2, y: 0, to: 'beach', toX: 1, toY: 1 }] };
    const shut = { ...river, doors: [{ x: 2, y: 0, to: 'beach', toX: 1, toY: 1, closedText: 'Overgrown.' }] };
    const s = fresh(500); s.bag.add('twig', 4); s.bag.add('pebble', 2);
    startBuild(s, spot, steps, 40);
    resolveBuilds(s.plots, [steps], 41);
    expect(withBuilds(shut, [spot], s.plots, [steps]).doors).toEqual([{ x: 2, y: 0, to: 'beach', toX: 1, toY: 1 }]);
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

  it('digs a craft room and a cellar off the yard: each opens a door Puff can reach, and leads back', () => {
    const yard = pack.areas.find((a) => a.id === 'yard')!;
    const done = (id: string): PlotState => ({ buildingId: id, stage: 2, startedDay: 1, readyDay: 2 });
    const built = new Area(withBuilds(yard, plots, { plot_yard_craft: done('craft_room'), plot_yard_cellar: done('cellar') }, buildings));
    const nav = navFor(built);
    const spawn = nav.nearestOpen({ x: yard.spawn.x * T + T / 2, y: yard.spawn.y * T + FEET })!;
    for (const room of ['craft_room', 'cellar']) {
      const doors = built.pack.doors.filter((d) => d.to === room);
      expect(doors.length, room).toBeGreaterThan(0);
      expect(doors.some((d) => nav.findPathNear(spawn, { x0: d.x * T, y0: d.y * T, x1: (d.x + 1) * T, y1: (d.y + 1) * T }, 0)), room).toBe(true);
      const inside = pack.areas.find((a) => a.id === room)!;
      expect(inside.decorate, room).toBe(true);
      expect(inside.doors.map((d) => d.to), room).toEqual(['yard']);
    }
    for (const d of yard.doors) expect(nav.findPathNear(spawn, { x0: d.x * T, y0: d.y * T, x1: (d.x + 1) * T, y1: (d.y + 1) * T }, 0), d.to).toBeTruthy();
    expect(pack.areas.find((a) => a.id === 'craft_room')!.props.some((p) => p.action === 'craft')).toBe(true);
    expect((pack.areas.find((a) => a.id === 'cellar')!.pickups ?? []).every((p) => p.item === 'mushroom')).toBe(true);
  });

  it('has a well beside the yard garden that reaches some of its soil, leaving the garden gate open', () => {
    const p = plots.find((x) => x.id === 'plot_yard_well')!;
    expect(buildings.find((d) => d.id === 'well')?.effect).toBe('waters_nearby');
    const yard = pack.areas.find((a) => a.id === 'yard')!;
    const built = new Area(withBuilds(yard, plots, { [p.id]: { buildingId: 'well', stage: 2, startedDay: 1, readyDay: 2 } }, buildings));
    const soil: { x: number; y: number }[] = [];
    yard.map.forEach((row, y) => [...row].forEach((ch, x) => { if (yard.legend[ch] === 'soil') soil.push({ x, y }); }));
    const reached = soil.filter((t) => nearWater({ area: 'yard', ...t }, { [p.id]: { buildingId: 'well', stage: 2, startedDay: 1, readyDay: 2 } }, plots, buildings, TUNING.wellReach));
    expect(reached.length).toBeGreaterThan(0);
    expect(reached.length).toBeLessThan(soil.length); // nearby only: the greenhouse still does more
    const nav = navFor(built);
    const spawn = nav.nearestOpen({ x: yard.spawn.x * T + T / 2, y: yard.spawn.y * T + FEET })!;
    for (const t of soil) expect(nav.findPathNear(spawn, { x0: t.x * T, y0: t.y * T, x1: (t.x + 1) * T, y1: (t.y + 1) * T }, REACH), `${t.x},${t.y}`).toBeTruthy();
  });

  it('lets Fig move in like Sorrel: a letter invites, a riverside plot opens, the cottage is their home', () => {
    const letter = (pack.letters ?? []).find((l) => l.from === 'fig')!;
    expect(letter.gives).toContain('invite_fig');
    const plot = plots.find((p) => p.allow.includes('cottage_fig'))!;
    expect([plot.area, plot.unlock]).toEqual(['riverside', 'invite_fig']);
    const b = buildings.find((d) => d.id === 'cottage_fig')!;
    expect([b.effect, b.home]).toEqual(['home', 'fig']);
    expect((pack.heartEvents ?? []).filter((e) => e.neighbourId === 'fig').length).toBe(5);
    const river = pack.areas.find((a) => a.id === 'riverside')!;
    const built = new Area(withBuilds(river, plots, { [plot.id]: { buildingId: b.id, stage: 2, startedDay: 1, readyDay: 2 } }, buildings));
    const nav = navFor(built);
    const spawn = nav.nearestOpen({ x: river.spawn.x * T + T / 2, y: river.spawn.y * T + FEET })!;
    for (const d of river.doors.filter((x) => !x.closedText)) expect(nav.findPathNear(spawn, { x0: d.x * T, y0: d.y * T, x1: (d.x + 1) * T, y1: (d.y + 1) * T }, 0), d.to).toBeTruthy();
    const home = pack.neighbours!.find((n) => n.id === 'fig')!.schedule.at(-1)!;
    expect(nav.findPathNear(spawn, { x0: home.x * T, y0: home.y * T, x1: (home.x + 1) * T, y1: (home.y + 1) * T }, 0)).toBeTruthy();
  });

  it('lets Wren come home: a letter invites, a Far Bank plot opens, the cottage leaves the bank open', () => {
    expect((pack.letters ?? []).find((l) => l.from === 'wren')!.gives).toContain('invite_wren');
    const plot = plots.find((p) => p.allow.includes('cottage_wren'))!;
    expect([plot.area, plot.unlock]).toEqual(['far_bank', 'invite_wren']);
    const bank = pack.areas.find((a) => a.id === 'far_bank')!;
    const built = new Area(withBuilds(bank, plots, { [plot.id]: { buildingId: 'cottage_wren', stage: 2, startedDay: 1, readyDay: 2 } }, buildings));
    const nav = navFor(built);
    const spawn = nav.nearestOpen({ x: bank.spawn.x * T + T / 2, y: bank.spawn.y * T + FEET })!;
    const wren = pack.neighbours!.find((n) => n.id === 'wren')!;
    for (const st of wren.schedule.filter((x) => x.area === 'far_bank')) expect(nav.findPathNear(spawn, { x0: st.x * T, y0: st.y * T, x1: (st.x + 1) * T, y1: (st.y + 1) * T }, 0), `${st.x},${st.y}`).toBeTruthy();
    for (const pk of bank.pickups ?? []) expect(nav.findPathNear(spawn, { x0: pk.x * T, y0: pk.y * T, x1: (pk.x + 1) * T, y1: (pk.y + 1) * T }, REACH), pk.id).toBeTruthy();
  });

  it('lets Juniper move into the woods: a letter invites, a Woodland plot opens, the cottage leaves the way open', () => {
    expect((pack.letters ?? []).find((l) => l.from === 'juniper')!.gives).toContain('invite_juniper');
    const plot = plots.find((p) => p.allow.includes('cottage_juniper'))!;
    expect([plot.area, plot.unlock]).toEqual(['woodland', 'invite_juniper']);
    const wood = pack.areas.find((a) => a.id === 'woodland')!;
    const built = new Area(withBuilds(wood, plots, { [plot.id]: { buildingId: 'cottage_juniper', stage: 2, startedDay: 1, readyDay: 2 } }, buildings));
    const nav = navFor(built);
    const spawn = nav.nearestOpen({ x: wood.spawn.x * T + T / 2, y: wood.spawn.y * T + FEET })!;
    const juniper = pack.neighbours!.find((n) => n.id === 'juniper')!;
    for (const st of juniper.schedule.filter((x) => x.area === 'woodland')) expect(nav.findPathNear(spawn, { x0: st.x * T, y0: st.y * T, x1: (st.x + 1) * T, y1: (st.y + 1) * T }, 0), `${st.x},${st.y}`).toBeTruthy();
    for (const pk of wood.pickups ?? []) expect(nav.findPathNear(spawn, { x0: pk.x * T, y0: pk.y * T, x1: (pk.x + 1) * T, y1: (pk.y + 1) * T }, REACH), pk.id).toBeTruthy();
  });

  it('clears the overgrown path off the Far Bank in summer (day 26), opening the Woodland Edge and its orchard', () => {
    const p = plots.find((x) => x.id === 'plot_overgrown_path')!;
    expect([p.area, p.unlock]).toEqual(['far_bank', 'overgrown_path']);
    const b = buildings.find((d) => d.id === 'woodland_path')!;
    expect(b.doors?.every((d) => d.to === 'woodland')).toBe(true);
    const woods = pack.areas.find((a) => a.id === 'woodland')!;
    expect((woods.pickups ?? []).filter((k) => k.item === 'apple').length).toBeGreaterThanOrEqual(3);
  });

  it('mends the sea steps in winter (day 43), opening the Beach where Mabel lives', () => {
    const p = plots.find((x) => x.id === 'plot_sea_steps')!;
    expect(p.unlock).toBe('sea_steps');
    const b = buildings.find((d) => d.id === 'sea_steps')!;
    expect(b.doors?.every((d) => d.to === 'beach')).toBe(true);
    expect(pack.neighbours!.find((n) => n.id === 'mabel')!.schedule.some((s) => s.area === 'beach')).toBe(true);
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

describe('asking before building', () => {
  const bench = { id: 'bench', name: 'Bench', nights: 1, cost: { sparkles: 50 }, prop: { type: 'bench' } } as BuildingDef;
  const bridge = { id: 'bridge', name: 'Footbridge', nights: 2, cost: { sparkles: 150, items: { twig: 10 } }, prop: { type: 'footbridge' } } as BuildingDef;
  const names = (id: string) => ({ twig: 'Twig' })[id] ?? id;

  it('says what it is, where, what it costs and how long, before anything is spent', () => {
    expect(buildQuestion(bench, 'West lawn', false, names)).toBe('West lawn: build a bench for 50 ✨? Finishes overnight.');
    expect(buildQuestion(bridge, 'The footbridge', false, names)).toBe('The footbridge: build a footbridge for 150 ✨ and 10 twig? Takes 2 nights.');
    expect(buildQuestion(bench, 'West lawn', true, names)).toBe('West lawn: upgrade to a bench for 50 ✨? Finishes overnight.');
  });
});
