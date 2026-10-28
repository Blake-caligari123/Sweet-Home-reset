import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { Area } from '../data/area';
import { T } from '../world/art/texture';
import { FEET, navFor, REACH } from '../world/nav';
import { builtProps, canBuild, resolveBuilds, startBuild, withBuilds, type BuildingDef, type PlotDef, type PlotState } from './build';

const bench: BuildingDef = { id: 'bench', name: 'Bench', nights: 1, cost: { sparkles: 40 }, prop: { type: 'bench', w: 2 } };
const gazebo: BuildingDef = { id: 'gazebo', name: 'Gazebo', nights: 3, cost: { sparkles: 300 }, prop: { type: 'bench', w: 2 } };
const catalogue = [bench, gazebo];
const plot: PlotDef = { id: 'p1', name: 'By the fountain', area: 'square', x: 13, y: 13, w: 2, h: 1, allow: ['bench', 'gazebo'] };
const fresh = (sparkles = 100) => ({ sparkles, plots: {} as Record<string, PlotState> });

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

describe('Hollowfern plots', () => {
  const plots = pack.plots ?? [];
  const buildings = pack.buildings ?? [];

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
      for (const d of a.doors.filter((d) => !d.closedText)) expect(nav.findPathNear(spawn, tile(d.x, d.y), 0), `${a.id} → ${d.to}`).not.toBeNull();
      for (const m of area.spots) expect(nav.findPathNear(spawn, tile(m.x, m.y), REACH), `${a.id} ${m.type} at ${m.x},${m.y}`).not.toBeNull();
      for (const p of area.pack.props.filter((p) => p.action)) expect(nav.findPathNear(spawn, tile(p.x, p.y, p.w, p.h), REACH), `${a.id} ${p.type}`).not.toBeNull();
    }
  });
});
