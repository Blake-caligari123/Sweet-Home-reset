import { Area, type AreaPack } from '../data/area';
import type { Ground } from '../world/art/ground';
import { T } from '../world/art/texture';
import { FEET, navFor, REACH } from '../world/nav';

// Free decor (VISION §5): flower pots, lanterns, fences and stone paths, placed anywhere open on
// a grid outdoors, picked up and moved any time. A piece never blocks the way to a door, something
// Puff can use, or a pickup.

/** What a decor item becomes when placed: a prop, or a ground tile (a stone path). */
export type DecorKind = { prop: string } | { ground: Ground };

/** A placed piece: where, and which item (it goes back to the bag when picked up). */
export interface Placed { area: string; x: number; y: number; item: string }

export type DecorItems = Record<string, { decor?: DecorKind }>;

/** An area with its placed decor: props added (tappable to pick up), path tiles laid. */
export function withDecor(pack: AreaPack, placed: Placed[], items: DecorItems): AreaPack {
  const here = placed.filter((p) => p.area === pack.id);
  if (!here.length) return pack;
  const props = [...pack.props];
  const rows = pack.map.map((r) => r.split(''));
  let legend = pack.legend;
  for (const p of here) {
    const d = items[p.item]?.decor;
    if (!d) continue;
    if ('prop' in d) { props.push({ type: d.prop, x: p.x, y: p.y, action: 'decor' }); continue; }
    let ch = Object.keys(legend).find((k) => legend[k] === d.ground);
    if (!ch) { ch = '·'; legend = { ...legend, [ch]: d.ground }; }
    if (rows[p.y]?.[p.x] !== undefined) rows[p.y][p.x] = ch;
  }
  return { ...pack, props, legend, map: rows.map((r) => r.join('')) };
}

/** A rectangle that can't take decor (a building plot). */
export interface Rect { x: number; y: number; w: number; h: number }

/**
 * Whether a piece can go on this tile: `ok`, `blocked` (not open ground, or a door or garden soil),
 * `taken` (decor or a plot already there), or `cuts_off` (it would block a way Puff needs).
 */
export function canPlace(pack: AreaPack, placed: Placed[], items: DecorItems, at: Omit<Placed, 'area'>, plots: Rect[]): 'ok' | 'blocked' | 'taken' | 'cuts_off' {
  const now = new Area(withDecor(pack, placed, items));
  const { x, y } = at;
  if (placed.some((p) => p.area === pack.id && p.x === x && p.y === y) || plots.some((r) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h)) return 'taken';
  if (!now.walkable(x, y) || now.doorAt(x, y) || now.groundAt(x, y) === 'soil') return 'blocked';
  const d = items[at.item]?.decor;
  if (!d || !('prop' in d)) return 'ok';
  return waysOpen(new Area(withDecor(pack, [...placed, { ...at, area: pack.id }], items))) ? 'ok' : 'cuts_off';
}

/** From the spawn, every open door, usable prop and pickup can still be reached. */
function waysOpen(area: Area) {
  const nav = navFor(area); const a = area.pack;
  const spawn = nav.nearestOpen({ x: a.spawn.x * T + T / 2, y: a.spawn.y * T + FEET });
  if (!spawn) return false;
  const tile = (x: number, y: number, w = 1, h = 1) => ({ x0: x * T, y0: y * T, x1: (x + w) * T, y1: (y + h) * T });
  return a.doors.filter((d) => !d.closedText).every((d) => nav.findPathNear(spawn, tile(d.x, d.y), 0))
    && a.props.filter((p) => p.action && p.action !== 'decor').every((p) => nav.findPathNear(spawn, tile(p.x, p.y, p.w, p.h), REACH))
    && (a.pickups ?? []).every((p) => nav.findPathNear(spawn, tile(p.x, p.y), REACH));
}
