import { T } from './art/texture';
import type { Area } from '../data/area';

// Free movement: a fine walkability grid of 4 world-px cells under every area. Code-drawn areas
// build it from their tiles; painted areas from floor and blocker polygons traced over the
// painting, so Puff can walk right up to walls and around furniture by its real shape. Paths are
// A* over the cells (8 directions, no corner cutting), then pulled straight wherever Puff can see
// ahead, so Puff walks in lines and diagonals rather than tile by tile.
export const CELL = 4;
/** How close (world px) Puff's feet must get to a mess tile or prop to act on it. */
export const REACH = 10;
/** Puff's feet sit this far into their tile (world px), clear of a wall along the tile's bottom edge. */
export const FEET = 10;
export interface Pt { x: number; y: number }
/** A polygon as a flat list of x, y pairs in world px. */
export type Poly = number[];
export interface Rect { x0: number; y0: number; x1: number; y1: number }

export function pointInPoly(x: number, y: number, poly: Poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 2; i < poly.length; j = i, i += 2) {
    const xi = poly[i]; const yi = poly[i + 1]; const xj = poly[j]; const yj = poly[j + 1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

class Heap {
  private items: number[] = [];
  constructor(private score: Float64Array) {}
  get size() { return this.items.length; }
  push(i: number) {
    const a = this.items; a.push(i);
    let c = a.length - 1;
    while (c > 0) { const p = (c - 1) >> 1; if (this.score[a[p]] <= this.score[a[c]]) break; [a[p], a[c]] = [a[c], a[p]]; c = p; }
  }
  pop() {
    const a = this.items; const top = a[0]; const last = a.pop()!;
    if (a.length) {
      a[0] = last; let p = 0;
      for (;;) {
        const l = p * 2 + 1; const r = l + 1; let m = p;
        if (l < a.length && this.score[a[l]] < this.score[a[m]]) m = l;
        if (r < a.length && this.score[a[r]] < this.score[a[m]]) m = r;
        if (m === p) break;
        [a[p], a[m]] = [a[m], a[p]]; p = m;
      }
    }
    return top;
  }
}

const DIRS: [number, number, number][] = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]];

export class NavGrid {
  constructor(readonly w: number, readonly h: number, readonly open: Uint8Array) {}

  /** Code-drawn areas: a tile's cells are open when the tile is walkable. */
  static fromTiles(tw: number, th: number, walkable: (x: number, y: number) => boolean, clearance = 0) {
    const per = T / CELL; const w = tw * per; const h = th * per;
    const open = new Uint8Array(w * h);
    for (let cy = 0; cy < h; cy += 1) for (let cx = 0; cx < w; cx += 1) open[cy * w + cx] = walkable(Math.floor(cx / per), Math.floor(cy / per)) ? 1 : 0;
    return new NavGrid(w, h, erode(open, w, h, clearance));
  }

  /** Painted areas: a cell is open when its centre is on the floor and not under a blocker. */
  static fromPolygons(widthPx: number, heightPx: number, floor: Poly[], blockers: Poly[], clearance = 1) {
    const w = Math.ceil(widthPx / CELL); const h = Math.ceil(heightPx / CELL);
    const open = new Uint8Array(w * h);
    for (let cy = 0; cy < h; cy += 1) {
      for (let cx = 0; cx < w; cx += 1) {
        const x = cx * CELL + CELL / 2; const y = cy * CELL + CELL / 2;
        open[cy * w + cx] = floor.some((p) => pointInPoly(x, y, p)) && !blockers.some((p) => pointInPoly(x, y, p)) ? 1 : 0;
      }
    }
    return new NavGrid(w, h, erode(open, w, h, clearance));
  }

  private cellOpen(cx: number, cy: number) { return cx >= 0 && cy >= 0 && cx < this.w && cy < this.h && this.open[cy * this.w + cx] === 1; }
  /** Can Puff's feet stand at this world point? */
  openAt(x: number, y: number) { return this.cellOpen(Math.floor(x / CELL), Math.floor(y / CELL)); }
  private centre(i: number): Pt { return { x: (i % this.w) * CELL + CELL / 2, y: Math.floor(i / this.w) * CELL + CELL / 2 }; }

  /** Nothing in the way on the straight line from a to b. */
  clear(a: Pt, b: Pt) {
    const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y));
    for (let k = 1; k <= n; k += 1) if (!this.openAt(a.x + ((b.x - a.x) * k) / n, a.y + ((b.y - a.y) * k) / n)) return false;
    return true;
  }

  /** The open point nearest to p (p itself if open). */
  nearestOpen(p: Pt, maxCells = 40): Pt | null {
    if (this.openAt(p.x, p.y)) return { x: p.x, y: p.y };
    const cx = Math.floor(p.x / CELL); const cy = Math.floor(p.y / CELL);
    let best: Pt | null = null; let bestD = Infinity;
    for (let r = 1; r <= maxCells; r += 1) {
      for (let dy = -r; dy <= r; dy += 1) {
        for (let dx = -r; dx <= r; dx += 1) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || !this.cellOpen(cx + dx, cy + dy)) continue;
          const c = this.centre((cy + dy) * this.w + cx + dx);
          const d = Math.hypot(c.x - p.x, c.y - p.y);
          if (d < bestD) { bestD = d; best = c; }
        }
      }
      if (best && bestD <= r * CELL) return best;
    }
    return best;
  }

  /** Waypoints (excluding the start) to the target, or to the open point nearest it. */
  findPathTo(from: Pt, to: Pt): Pt[] | null {
    const goal = this.nearestOpen(to);
    if (!goal) return null;
    const gi = Math.floor(goal.y / CELL) * this.w + Math.floor(goal.x / CELL);
    const path = this.search(from, (i) => i === gi, (x, y) => Math.hypot(x - goal.x, y - goal.y));
    if (!path) return null;
    path[path.length - 1] = goal;
    return this.smooth(from, path);
  }

  /** Waypoints to the nearest spot within `reach` px of a rect (a mess tile, a prop). */
  findPathNear(from: Pt, r: Rect, reach: number): Pt[] | null {
    const dist = (x: number, y: number) => Math.hypot(Math.max(r.x0 - x, 0, x - r.x1), Math.max(r.y0 - y, 0, y - r.y1));
    const path = this.search(from, (i) => { const c = this.centre(i); return dist(c.x, c.y) <= reach; }, (x, y) => Math.max(0, dist(x, y) - reach));
    return path && this.smooth(from, path);
  }

  private search(from: Pt, isGoal: (i: number) => boolean, h: (x: number, y: number) => number): Pt[] | null {
    const start = this.nearestOpen(from);
    if (!start) return null;
    const n = this.w * this.h;
    const g = new Float64Array(n).fill(Infinity); const f = new Float64Array(n).fill(Infinity);
    const prev = new Int32Array(n).fill(-1); const closed = new Uint8Array(n);
    const s = Math.floor(start.y / CELL) * this.w + Math.floor(start.x / CELL);
    g[s] = 0; f[s] = h(start.x, start.y) / CELL;
    const heap = new Heap(f); heap.push(s);
    while (heap.size) {
      const cur = heap.pop();
      if (closed[cur]) continue;
      if (isGoal(cur)) {
        const cells: Pt[] = [];
        for (let i = cur; i !== s; i = prev[i]) cells.push(this.centre(i));
        cells.reverse();
        if (start.x !== from.x || start.y !== from.y) cells.unshift(start);
        return cells.length ? cells : [start];
      }
      closed[cur] = 1;
      const cx = cur % this.w; const cy = Math.floor(cur / this.w);
      for (const [dx, dy, cost] of DIRS) {
        const nx = cx + dx; const ny = cy + dy;
        if (!this.cellOpen(nx, ny)) continue;
        if (dx && dy && (!this.cellOpen(cx + dx, cy) || !this.cellOpen(cx, cy + dy))) continue; // no corner cutting
        const ni = ny * this.w + nx;
        if (closed[ni]) continue;
        const t = g[cur] + cost;
        if (t < g[ni]) { g[ni] = t; prev[ni] = cur; f[ni] = t + h(nx * CELL + CELL / 2, ny * CELL + CELL / 2) / CELL; heap.push(ni); }
      }
    }
    return null;
  }

  /** Pull the cell path straight: from each point, jump to the furthest point in clear view. */
  private smooth(from: Pt, cells: Pt[]): Pt[] {
    const out: Pt[] = [];
    let anchor = from; let i = 0;
    while (i < cells.length) {
      let j = i;
      while (j + 1 < cells.length && this.clear(anchor, cells[j + 1])) j += 1;
      out.push(cells[j]); anchor = cells[j]; i = j + 1;
    }
    return out;
  }
}

/** Close every open cell within `r` cells of a closed one (or the edge): room for Puff's feet. */
function erode(open: Uint8Array, w: number, h: number, r: number) {
  if (r <= 0) return open;
  const out = open.slice();
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (!open[y * w + x]) continue;
      search: for (let dy = -r; dy <= r; dy += 1) {
        for (let dx = -r; dx <= r; dx += 1) {
          const nx = x + dx; const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h || !open[ny * w + nx]) { out[y * w + x] = 0; break search; }
        }
      }
    }
  }
  return out;
}

/** The walking grid for an area: traced outlines for painted areas, else its tiles. */
export function navFor(area: Area) {
  const n = area.pack.nav;
  return n ? NavGrid.fromPolygons(area.w * T, area.h * T, n.floor, n.blockers, 1) : NavGrid.fromTiles(area.w, area.h, area.walkable, 1);
}
