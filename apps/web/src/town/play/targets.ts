import type { Area } from '../data/area';
import type { NeighbourState } from '../neighbours/neighbours';
import { T } from '../world/art/texture';
import type { Pt } from '../world/nav';
import type { Bag } from './bag';
import type { AreaMess } from './mess';
import type { PickupDef } from './pickups';

// What a tap lands on, and where Puff has to stand to reach it.

export type Target =
  | { kind: 'walk'; x: number; y: number }
  | { kind: 'mess'; x: number; y: number }
  | { kind: 'soil'; x: number; y: number }
  | { kind: 'door'; x: number; y: number }
  | { kind: 'prop'; x: number; y: number; action: string; accepts?: string[]; text?: string; shop?: string }
  | { kind: 'neighbour'; x: number; y: number; id: string }
  | { kind: 'pickup'; x: number; y: number; id: string }
  | { kind: 'grumble'; x: number; y: number; id: string };

export interface Rect { x0: number; y0: number; x1: number; y1: number }

/** The sprite's bottom edge is drawn this far below the feet point. */
export const FEET_TO_BASE = 5;

/** What's on a tile in the current area. */
export interface Here { area: Area; mess: AreaMess; pickups: PickupDef[]; bag: Bag }

export function targetAt(here: Here, x: number, y: number): Target {
  const { area, mess, bag } = here;
  // A snack on the counter: its tile, or where it's drawn just above.
  const pick = here.pickups.find((p) => p.x === x && (p.y === y || p.y + Math.round(p.drawDy ?? 0) === y));
  if (pick) return { kind: 'pickup', x: pick.x, y: pick.y, id: pick.id };
  // Carrying something that lives here? Put it away before dusting the furniture.
  const home = area.tapPropAt(x, y);
  if (home?.action === 'putaway' && home.accepts?.some((id) => bag.count(id) > 0)) return { kind: 'prop', x, y, action: home.action, accepts: home.accepts };
  if (mess.typeAt(x, y) !== 'none') return { kind: 'mess', x, y };
  if (area.groundAt(x, y) === 'soil') return { kind: 'soil', x, y };
  if (area.doorAt(x, y)) return { kind: 'door', x, y };
  const prop = area.tapPropAt(x, y);
  if (prop?.action) return { kind: 'prop', x, y, action: prop.action, accepts: prop.accepts, text: area.signAt(prop.x, prop.y)?.text, shop: prop.shop };
  return { kind: 'walk', x, y };
}

/** A neighbour drawn under this world point (their sprite stands on the feet point). */
export function neighbourAt(visible: NeighbourState[], px: number, py: number): Target | null {
  for (const n of visible) {
    const base = n.fy + FEET_TO_BASE;
    if (Math.abs(px - n.fx) <= 9 && py >= base - 22 && py <= base + 2) return { kind: 'neighbour', id: n.id, x: Math.floor(n.fx / T), y: Math.floor(n.fy / T) };
  }
  return null;
}

/** The world-px rect of a target: its tile, the whole prop, or the space a neighbour or Grumble stands in. */
export function rectOf(t: Target, area: Area, standing?: { fx: number; fy: number }): Rect {
  if ((t.kind === 'neighbour' || t.kind === 'grumble') && standing) {
    // A Grumble is round and low: Puff tidies from beside it, not on top of it.
    const n = standing; const w = t.kind === 'grumble' ? 13 : 6;
    return { x0: n.fx - w, y0: n.fy - 4, x1: n.fx + w, y1: n.fy + 2 };
  }
  const prop = t.kind === 'prop' ? area.tapPropAt(t.x, t.y) : null;
  const x = prop ? prop.x : t.x; const y = prop ? prop.y : t.y;
  return { x0: x * T, y0: y * T, x1: (x + (prop?.w ?? 1)) * T, y1: (y + (prop?.h ?? 1)) * T };
}

/** How far the feet are from a rect (0 inside it). */
export function distTo(r: Rect, feet: Pt) {
  return Math.hypot(Math.max(r.x0 - feet.x, 0, feet.x - r.x1), Math.max(r.y0 - feet.y, 0, feet.y - r.y1));
}
