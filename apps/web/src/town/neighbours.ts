import { T, type Dir } from './art';
import type { AreaPack, Door } from './area';
import { FEET, type NavGrid, type Pt } from './nav';

// Neighbours (GDD v3 A7, M2): each keeps a daily routine of stops from the pack. The one or two
// Puff can see walk between stops and through doors; everyone else simply is where their routine
// says. An area that isn't built yet but has a door to it (Neighbour Lane, the General Store) is a
// place like any other: neighbours walk out through its door and are offstage until they return.
export type Species = 'hedgehog' | 'bee' | 'mouse' | 'otter' | 'mole' | 'owl';
/** From `at` (game minutes from midnight) until the next stop, stand at this tile. */
export interface Stop { at: number; area: string; x: number; y: number; dir?: Dir; sleep?: boolean }
export interface NeighbourDef {
  id: string; name: string; species: Species; plus?: boolean;
  colours: { fur: string; belly: string; accent: string };
  loves: string[]; likes: string[]; dislikes: string[];
  /** Until talking lands (M2 step 2): what they say when Puff says hello. */
  hello: string;
  schedule: Stop[];
}

export interface NeighbourState {
  id: string; area: string; fx: number; fy: number; dir: Dir; pose: 'idle' | 'walk' | 'sleep';
  path: Pt[];
  /** Walking out of the area: where they go once they reach the door. */
  exit: string | null;
  stop: number;
  held: boolean;
}

const OFFSTAGE = '';

/** The index of the stop in force at this time; before the first stop, last night's (the final one). */
export function stopAt(schedule: Stop[], minutes: number) {
  let i = schedule.length - 1;
  for (let k = 0; k < schedule.length; k += 1) if (schedule[k].at <= minutes) i = k;
  return i;
}

const nodeOf = (areas: AreaPack[], id: string) => (areas.some((a) => a.id === id || a.doors.some((d) => d.to === id)) ? id : OFFSTAGE);

/** The areas on the shortest trip between two places (doors work both ways), ends included. */
export function route(areas: AreaPack[], from: string, to: string): string[] | null {
  const start = nodeOf(areas, from); const goal = nodeOf(areas, to);
  const links = new Map<string, Set<string>>();
  const link = (a: string, b: string) => { if (!links.has(a)) links.set(a, new Set()); links.get(a)!.add(b); };
  for (const a of areas) for (const d of a.doors) { link(a.id, nodeOf(areas, d.to)); link(nodeOf(areas, d.to), a.id); }
  const prev = new Map<string, string>([[start, start]]);
  const queue = [start];
  while (queue.length) {
    const at = queue.shift()!;
    if (at === goal) break;
    for (const next of links.get(at) ?? []) if (!prev.has(next)) { prev.set(next, at); queue.push(next); }
  }
  if (!prev.has(goal)) return null;
  const out = [goal];
  while (out[0] !== start) out.unshift(prev.get(out[0])!);
  return out;
}

/** The door in `from` (a built area) to walk to, heading for `to`; null when already there. */
export function firstDoor(areas: AreaPack[], from: string, to: string): Door | null {
  const r = route(areas, from, to);
  if (!r || r.length < 2) return null;
  return areas.find((a) => a.id === from)?.doors.find((d) => nodeOf(areas, d.to) === r[1]) ?? null;
}

export class Neighbours {
  readonly states = new Map<string, NeighbourState>();

  constructor(
    readonly defs: NeighbourDef[],
    private areas: AreaPack[],
    private navOf: (area: string) => NavGrid | null,
    /** Walking speed in tiles per second. */
    private speed: number
  ) {}

  /** The feet point for a tile: its usual spot, nudged onto open floor. */
  private spot(area: string, x: number, y: number): Pt {
    const p = { x: x * T + T / 2, y: y * T + FEET };
    return this.navOf(area)?.nearestOpen(p) ?? p;
  }

  private settle(st: NeighbourState, s: Stop) {
    const p = this.spot(s.area, s.x, s.y);
    Object.assign(st, { area: s.area, fx: p.x, fy: p.y, path: [], exit: null, pose: s.sleep ? 'sleep' : 'idle', dir: s.dir ?? 'down' });
  }

  /** Everyone where their routine says, standing still: a new game, a new day, Puff entering an area. */
  place(minutes: number) {
    for (const d of this.defs) {
      const i = stopAt(d.schedule, minutes);
      const st: NeighbourState = this.states.get(d.id) ?? { id: d.id, area: '', fx: 0, fy: 0, dir: 'down', pose: 'idle', path: [], exit: null, stop: i, held: false };
      st.stop = i; st.held = false;
      this.settle(st, d.schedule[i]);
      this.states.set(d.id, st);
    }
  }

  visible(view: string) { return [...this.states.values()].filter((s) => s.area === view); }

  hold(id: string) { const st = this.states.get(id); if (st) { st.held = true; if (st.pose === 'walk') st.pose = 'idle'; } }
  releaseAll() { for (const st of this.states.values()) st.held = false; }

  update(minutes: number, view: string, dt: number) {
    for (const d of this.defs) {
      const st = this.states.get(d.id);
      if (!st || st.held) continue;
      const i = stopAt(d.schedule, minutes);
      if (i !== st.stop) { st.stop = i; this.head(st, d.schedule[i], view); }
      if (st.path.length) this.walk(st, d.schedule[st.stop], dt);
    }
  }

  /** A new stop: walk there if Puff can see any of the trip, else just be there. */
  private head(st: NeighbourState, s: Stop, view: string) {
    const nav = this.navOf(view);
    const trip = route(this.areas, st.area, s.area);
    const at = trip ? trip.indexOf(view) : -1;
    if (!nav || !trip || at < 0) { this.settle(st, s); return; }
    // Start where they stand (already here) or at the door they come in by; end at the stop or the way out.
    let start = { x: st.fx, y: st.fy };
    if (at > 0) {
      const door = firstDoor(this.areas, view, trip[at - 1]);
      if (!door) { this.settle(st, s); return; }
      start = this.spot(view, door.x, door.y);
    }
    let path: Pt[] | null;
    let exit: string | null = null;
    if (at === trip.length - 1) path = nav.findPathTo(start, this.spot(view, s.x, s.y));
    else {
      const door = firstDoor(this.areas, view, trip[at + 1]);
      path = door && nav.findPathNear(start, { x0: door.x * T, y0: door.y * T, x1: (door.x + 1) * T, y1: (door.y + 1) * T }, 0);
      exit = s.area;
    }
    if (!path) { this.settle(st, s); return; }
    Object.assign(st, { area: view, fx: start.x, fy: start.y, path, pose: 'walk', exit });
  }

  private walk(st: NeighbourState, s: Stop, dt: number) {
    let budget = dt * ((this.speed * T) / 1000);
    while (budget > 0 && st.path.length) {
      const n = st.path[0]; const dx = n.x - st.fx; const dy = n.y - st.fy; const dist = Math.hypot(dx, dy);
      if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) st.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
      if (dist <= budget) { st.fx = n.x; st.fy = n.y; st.path.shift(); budget -= dist; } else { st.fx += (dx / dist) * budget; st.fy += (dy / dist) * budget; budget = 0; }
    }
    if (st.path.length) return;
    if (st.exit) this.settle(st, s); // through the door and away
    else { st.pose = s.sleep ? 'sleep' : 'idle'; if (s.dir) st.dir = s.dir; }
  }
}
