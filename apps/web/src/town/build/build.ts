import type { AreaPack, Door } from '../data/area';
import type { Bag } from '../play/bag';
import type { PropDef } from '../world/art/props';

// Building on plots (VISION §5, NEW-FEATURES F1): the Keeper picks a plot on the Town Hall board
// and a building that fits it; the cost is paid up front and the town builds it overnight. Builds
// only move on at the end of a day (sleep or dozing off alike), never by the wall clock.
// Repairs (VISION §5: repair to expand) are buildings too: they take materials as well as
// Sparkles, and once mended they pave their plot and open a way on (the footbridge, the far bank).

/** A fixed place in town where something can be built. `unlock`: a key in the year-one schedule. */
export interface PlotDef { id: string; name: string; area: string; x: number; y: number; w: number; h: number; allow: string[]; unlock?: string }

/** Something the town can build. `prop`: how it stands on its plot once finished. */
export interface BuildingDef { id: string; name: string; nights: number; cost: { sparkles: number; items?: Record<string, number> }; prop: { type: string; w?: number; h?: number; walkable?: boolean };
  /** The Town Bloom level it needs (VISION §5: Bloom unlocks building types). */
  bloom?: number;
  /** What finished building this upgrades (a bench into a cosy bench). */
  upgradeOf?: string;
  /** What it does once finished: a greenhouse waters the garden overnight; a cottage is a newcomer's home. */
  effect?: 'waters_garden' | 'home';
  /** For a home: the newcomer who moves in once it's finished. */
  home?: string;
  /** For a repair: the ground its plot becomes once mended (a map char), and the doors it opens. */
  paves?: string; doors?: Door[];
  /** A big project: the town fund pays first (NEXT-PHASE §5.8: townsfolk chip in). */
  project?: boolean }

/** A plot with something on it. Stages: 0 scaffold, 1 frame, 2 done. */
export interface PlotState { buildingId: string; stage: number; startedDay: number; readyDay: number }

export const DONE = 2;
const IN_PROGRESS = ['scaffold', 'frame'];

/** What building needs from Puff's progress (and the town fund, for big projects). */
export interface Builder { sparkles: number; fund?: number; plots: Record<string, PlotState>; bag: Pick<Bag, 'count' | 'remove'> }

/** How much of a building's Sparkles the town fund covers. */
export const fundShare = (s: Builder, b: BuildingDef) => (b.project ? Math.min(s.fund ?? 0, b.cost.sparkles) : 0);
const affords = (s: Builder, b: BuildingDef) => s.sparkles + fundShare(s, b) >= b.cost.sparkles && Object.entries(b.cost.items ?? {}).every(([id, n]) => s.bag.count(id) >= n);
function pay(s: Builder, b: BuildingDef) {
  const fund = fundShare(s, b);
  if (fund) s.fund = (s.fund ?? 0) - fund;
  s.sparkles -= b.cost.sparkles - fund;
  for (const [id, n] of Object.entries(b.cost.items ?? {})) s.bag.remove(id, n);
}

export function canBuild(s: Builder, plot: PlotDef, b: BuildingDef): 'ok' | 'taken' | 'not_here' | 'short' {
  if (s.plots[plot.id]) return 'taken';
  if (!plot.allow.includes(b.id)) return 'not_here';
  return affords(s, b) ? 'ok' : 'short';
}

/** Start a build on `day`, paying for it; all or nothing. */
export function startBuild(s: Builder, plot: PlotDef, b: BuildingDef, day: number) {
  if (canBuild(s, plot, b) !== 'ok') return false;
  pay(s, b);
  s.plots[plot.id] = { buildingId: b.id, stage: 0, startedDay: day, readyDay: day + b.nights };
  return true;
}

/** Whether a finished building on this plot can be upgraded: `not_yet` (nothing finished to upgrade), `short`. */
export function canUpgrade(s: Builder, plot: PlotDef, b: BuildingDef): 'ok' | 'not_yet' | 'short' {
  const now = s.plots[plot.id];
  if (!now || now.stage < DONE || now.buildingId !== b.upgradeOf) return 'not_yet';
  return affords(s, b) ? 'ok' : 'short';
}

/** Start the upgrade on `day`, paying for it; the town builds it overnight like anything else. */
export function upgrade(s: Builder, plot: PlotDef, b: BuildingDef, day: number) {
  if (canUpgrade(s, plot, b) !== 'ok') return false;
  pay(s, b);
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
    return [{ type: b.prop.type, x: d.x, y: d.y, w: b.prop.w ?? d.w, h: b.prop.h ?? d.h, ...(b.prop.walkable ? { walkable: true } : {}) }];
  });
}

/**
 * An area as it stands today, with what's been built in it. Whatever stood on a plot before (the
 * broken bridge) gives way to what's built there; a mended repair paves its plot and opens its doors
 * (replacing a closed door on the same tile, like the overgrown way to the beach).
 */
export function withBuilds(pack: AreaPack, defs: PlotDef[], plots: Record<string, PlotState>, catalogue: BuildingDef[]): AreaPack {
  const extra = builtProps(pack.id, defs, plots, catalogue);
  if (!extra.length) return pack;
  const used = defs.filter((d) => d.area === pack.id && plots[d.id]);
  const on = (x: number, y: number, d: PlotDef) => x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h;
  const mended = used.flatMap((d) => {
    const b = plots[d.id].stage >= DONE && catalogue.find((c) => c.id === plots[d.id].buildingId);
    return b && (b.paves || b.doors) ? [{ d, b }] : [];
  });
  const map = pack.map.map((row, y) => [...row].map((ch, x) => mended.find(({ d, b }) => b.paves && on(x, y, d))?.b.paves ?? ch).join(''));
  const opened = mended.flatMap(({ b }) => b.doors ?? []);
  const doors = pack.doors.filter((d) => !(d.closedText && opened.some((o) => o.x === d.x && o.y === d.y))); // a way that was shut is open now
  return { ...pack, map, props: [...pack.props.filter((p) => !used.some((d) => on(p.x, p.y, d))), ...extra], doors: [...doors, ...opened] };
}

/** The areas with a finished building that has this effect (a greenhouse's garden). */
export function areasWith(effect: BuildingDef['effect'], plots: Record<string, PlotState>, defs: PlotDef[], catalogue: BuildingDef[]) {
  return new Set(Object.entries(plots)
    .filter(([, p]) => p.stage >= DONE && catalogue.find((b) => b.id === p.buildingId)?.effect === effect)
    .map(([id]) => defs.find((d) => d.id === id)?.area));
}

/** The question before anything is spent: where, what, the full cost and how long it takes. */
export function buildQuestion(def: BuildingDef, plotName: string, isUpgrade: boolean, itemName: (id: string) => string) {
  const items = Object.entries(def.cost.items ?? {}).map(([id, n]) => ` and ${n} ${itemName(id).toLowerCase()}`).join('');
  return `${plotName}: ${isUpgrade ? 'upgrade to' : 'build'} a ${def.name.toLowerCase()} for ${def.cost.sparkles} ✨${items}? ${nightsText(def)}.`;
}

export const nightsText = (b: BuildingDef) => (b.nights > 1 ? `Takes ${b.nights} nights` : 'Finishes overnight');
