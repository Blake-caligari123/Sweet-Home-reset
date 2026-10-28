import { T } from '../world/art/texture';
import type { Pt } from '../world/nav';
import type { Tile } from '../world/pathfind';
import type { AreaMess } from './mess';
import type { Puff } from './puff';

/** The messy tiles a swipe passes over, in the order the finger went, each once. World px in, tiles out. */
export function tilesAlong(from: Pt, to: Pt, messy: (x: number, y: number) => boolean): Tile[] {
  const out: Tile[] = [];
  const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 4));
  for (let i = 0; i <= steps; i += 1) {
    const x = Math.floor((from.x + ((to.x - from.x) * i) / steps) / T); const y = Math.floor((from.y + ((to.y - from.y) * i) / steps) / T);
    if (messy(x, y) && !out.some((t) => t.x === x && t.y === y)) out.push({ x, y });
  }
  return out;
}

/** A sweep needs at least this many messy tiles; fewer is just a walk. */
const MIN_TILES = 2;

export interface SweepHost {
  puff: Puff; mess(): AreaMess;
  /** Walk to a mess tile and tidy it until it's gone. */
  scrub(px: number, py: number): void;
}

/** Swiping along a row of mess: Puff tidies each in turn, finishing one before the next. */
export class Sweep {
  private queue: Tile[] = [];

  constructor(private host: SweepHost) {}

  /** A drag that wasn't carrying clutter: sweep it if it crossed enough mess. */
  drag(from: Pt, to: Pt) {
    const m = this.host.mess();
    const tiles = tilesAlong(from, to, (x, y) => { const t = m.typeAt(x, y); return t !== 'none' && t !== 'clutter'; });
    if (tiles.length < MIN_TILES) return false;
    this.queue = tiles;
    this.next();
    return true;
  }

  /** A new area or a different tap: the sweep is over. */
  stop() { this.queue = []; }

  /** Each frame: when Puff's free, on to the next tile that still has mess. */
  tick() {
    const p = this.host.puff;
    if (this.queue.length && !p.path.length && p.swingMs <= 0 && !p.action && !p.swing) this.next();
  }

  private next() {
    const m = this.host.mess();
    while (this.queue.length) {
      const t = this.queue.shift()!;
      if (m.typeAt(t.x, t.y) !== 'none') { this.host.scrub((t.x + 0.5) * T, (t.y + 0.5) * T); return; }
    }
  }
}
