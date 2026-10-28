import type { AreaPack } from '../data/area';
import type { PropDef } from '../world/art/props';

// Building on plots (VISION §5, NEW-FEATURES F1): the Keeper picks a plot on the Town Hall board
// and a building that fits it; the cost is paid up front and the town builds it overnight. Builds
// only move on at the end of a day (sleep or dozing off alike), never by the wall clock.

/** A fixed place in town where something can be built. `unlock`: a key in the year-one schedule. */
export interface PlotDef { id: string; name: string; area: string; x: number; y: number; w: number; h: number; allow: string[]; unlock?: string }

/** Something the town can build. `prop`: how it stands on its plot once finished. */
export interface BuildingDef { id: string; name: string; nights: number; cost: { sparkles: number }; prop: { type: string; w?: number; h?: number } }

/** A plot with something on it. Stages: 0 scaffold, 1 frame, 2 done. */
export interface PlotState { buildingId: string; stage: number; startedDay: number; readyDay: number }

export const DONE = 2;
const IN_PROGRESS = ['scaffold', 'frame'];

/** What building needs from Puff's progress. */
export interface Builder { sparkles: number; plots: Record<string, PlotState> }

export function canBuild(s: Builder, plot: PlotDef, b: BuildingDef): 'ok' | 'taken' | 'not_here' | 'short' {
  if (s.plots[plot.id]) return 'taken';
  if (!plot.allow.includes(b.id)) return 'not_here';
  if (s.sparkles < b.cost.sparkles) return 'short';
  return 'ok';
}

/** Start a build on `day`, paying for it; all or nothing. */
export function startBuild(s: Builder, plot: PlotDef, b: BuildingDef, day: number) {
  if (canBuild(s, plot, b) !== 'ok') return false;
  s.sparkles -= b.cost.sparkles;
  s.plots[plot.id] = { buildingId: b.id, stage: 0, startedDay: day, readyDay: day + b.nights };
  return true;
}

/** The end of `endedDay`: builds due by morning finish, the rest move on a stage. Returns the plots just finished. */
export function resolveBuilds(plots: Record<string, PlotState>, catalogue: BuildingDef[], endedDay: number) {
  const finished: string[] = [];
  for (const [id, p] of Object.entries(plots)) {
    if (p.stage >= DONE || !catalogue.some((b) => b.id === p.buildingId)) continue;
    if (p.readyDay <= endedDay + 1) { p.stage = DONE; finished.push(id); } else p.stage = Math.min(DONE - 1, p.stage + 1);
  }
  return finished;
}

/** The props standing on an area's plots: scaffolding while building, then the building. */
export function builtProps(area: string, defs: PlotDef[], plots: Record<string, PlotState>, catalogue: BuildingDef[]): PropDef[] {
  return defs.flatMap((d) => {
    const p = plots[d.id];
    const b = p && catalogue.find((c) => c.id === p.buildingId);
    if (d.area !== area || !p || !b) return [];
    if (p.stage < DONE) return [{ type: IN_PROGRESS[p.stage], x: d.x, y: d.y, w: d.w, h: d.h }];
    return [{ type: b.prop.type, x: d.x, y: d.y, w: b.prop.w ?? d.w, h: b.prop.h ?? d.h }];
  });
}

/** An area as it stands today, with what's been built in it. */
export function withBuilds(pack: AreaPack, defs: PlotDef[], plots: Record<string, PlotState>, catalogue: BuildingDef[]): AreaPack {
  const extra = builtProps(pack.id, defs, plots, catalogue);
  return extra.length ? { ...pack, props: [...pack.props, ...extra] } : pack;
}
