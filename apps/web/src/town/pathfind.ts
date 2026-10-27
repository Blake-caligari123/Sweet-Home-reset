// 4-direction A* over an area's walkable grid (FRONTEND-PLAN §4): binary heap, capped at 2,000
// nodes, and an unreachable goal falls back to the nearest reachable tile.
export interface Grid { w: number; h: number; walkable: (x: number, y: number) => boolean }
export interface Tile { x: number; y: number }

export const NODE_CAP = 2000;

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

/** Shortest path from start to goal, excluding start, including goal. [] if already there. */
export function findPath(grid: Grid, start: Tile, goal: Tile): Tile[] | null {
  const { w, h } = grid;
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h;
  if (!inside(goal.x, goal.y) || !inside(start.x, start.y)) return null;
  if (start.x === goal.x && start.y === goal.y) return [];
  const n = w * h;
  const g = new Float64Array(n).fill(Infinity);
  const f = new Float64Array(n).fill(Infinity);
  const from = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  const s = start.y * w + start.x; const t = goal.y * w + goal.x;
  const hScore = (i: number) => Math.abs((i % w) - goal.x) + Math.abs(Math.floor(i / w) - goal.y);
  g[s] = 0; f[s] = hScore(s);
  const open = new Heap(f); open.push(s);
  let expanded = 0;
  while (open.size && expanded < NODE_CAP) {
    const cur = open.pop();
    if (closed[cur]) continue;
    if (cur === t) {
      const path: Tile[] = [];
      for (let i = cur; i !== s; i = from[i]) path.push({ x: i % w, y: Math.floor(i / w) });
      return path.reverse();
    }
    closed[cur] = 1; expanded += 1;
    const cx = cur % w; const cy = Math.floor(cur / w);
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const nx = cx + dx; const ny = cy + dy;
      if (!inside(nx, ny) || !grid.walkable(nx, ny)) continue;
      const ni = ny * w + nx;
      if (closed[ni]) continue;
      const tentative = g[cur] + 1;
      if (tentative < g[ni]) { g[ni] = tentative; from[ni] = cur; f[ni] = tentative + hScore(ni); open.push(ni); }
    }
  }
  return null;
}

export interface Route { from: Tile; seg: number; path: Tile[] }

/**
 * A new path for a walker that may be part-way between `from` and `next` (`seg` of the way).
 * Mid-step it either carries on through `next` or turns back through `from`, whichever is
 * shorter, and keeps the drawn position the same, so a new tap never snaps Puff backwards.
 */
export function retarget(grid: Grid, from: Tile, next: Tile | null, seg: number, goal: Tile): Route | null {
  if (!next || seg <= 0) {
    const path = findPath(grid, from, goal);
    return path && { from, seg: 0, path };
  }
  const ahead = findPath(grid, next, goal);
  const back = findPath(grid, from, goal);
  if (ahead && (!back || 1 - seg + ahead.length <= seg + back.length)) return { from, seg, path: [next, ...ahead] };
  return back && { from: next, seg: 1 - seg, path: [from, ...back] };
}

/** Every tile reachable from start (flood fill), for picking the nearest reachable target. */
export function reachable(grid: Grid, start: Tile) {
  const seen = new Uint8Array(grid.w * grid.h);
  const queue = [start.y * grid.w + start.x];
  seen[queue[0]] = 1;
  for (let q = 0; q < queue.length; q += 1) {
    const i = queue[q]; const x = i % grid.w; const y = Math.floor(i / grid.w);
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const nx = x + dx; const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= grid.w || ny >= grid.h || !grid.walkable(nx, ny)) continue;
      const ni = ny * grid.w + nx;
      if (!seen[ni]) { seen[ni] = 1; queue.push(ni); }
    }
  }
  return seen;
}

/** Path to the goal, or to the reachable tile closest to it when the goal can't be reached. */
export function pathToward(grid: Grid, start: Tile, goal: Tile): Tile[] {
  if (grid.walkable(goal.x, goal.y)) {
    const direct = findPath(grid, start, goal);
    if (direct) return direct;
  }
  const seen = reachable(grid, start);
  let best = -1; let bestD = Infinity;
  for (let i = 0; i < seen.length; i += 1) {
    if (!seen[i]) continue;
    const d = Math.abs((i % grid.w) - goal.x) + Math.abs(Math.floor(i / grid.w) - goal.y);
    if (d < bestD) { bestD = d; best = i; }
  }
  if (best < 0) return [];
  return findPath(grid, start, { x: best % grid.w, y: Math.floor(best / grid.w) }) ?? [];
}

/** The free tiles next to a target, nearest-by-path first: where Puff stands to act on it. */
export function standTiles(grid: Grid, target: Tile): Tile[] {
  return [[0, 1], [0, -1], [-1, 0], [1, 0]]
    .map(([dx, dy]) => ({ x: target.x + dx, y: target.y + dy }))
    .filter((t) => t.x >= 0 && t.y >= 0 && t.x < grid.w && t.y < grid.h && grid.walkable(t.x, t.y));
}
